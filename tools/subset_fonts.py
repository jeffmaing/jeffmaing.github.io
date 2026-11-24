"""Subset the site's fonts to the glyphs the page actually uses.

usage: subset_fonts.py <project_root> <fonts_src_dir>
Both paths are passed in; nothing is resolved from the working directory.
"""
import pathlib
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

root = pathlib.Path(sys.argv[1]).resolve()
source = pathlib.Path(sys.argv[2]).resolve()
src = root / "src"
out = src / "assets" / "fonts"
out.mkdir(parents=True, exist_ok=True)

chars = set()
for pattern in ("*.html", "*.js", "*.css"):
    for path in src.rglob(pattern):
        chars.update(path.read_text(encoding="utf-8"))
chars.update(chr(code) for code in range(0x20, 0x7F))
chars.update("，。、；：？！\u201c\u201d\u2018\u2019（）《》「」『』【】…·×÷±→←↑↓－％＋＝～©")
text = "".join(sorted(c for c in chars if ord(c) >= 0x20))
glyphs = root / "tools" / ".glyphs.txt"
glyphs.write_text(text, encoding="utf-8")
print(f"glyphs requested: {len(text)}")

# name IDs 13 and 14 carry the licence notice, which travels with the subset
common = [
    f"--text-file={glyphs}",
    "--layout-features=*",
    "--no-hinting",
    "--name-IDs=0,1,2,3,4,5,6,13,14",
    "--drop-tables+=DSIG",
]


def run(src_path, name, extra=()):
    args = [str(src_path), f"--output-file={out / name}", "--flavor=woff2", *common, *extra]
    subset.main(args)
    print(f"{name:28s} {(out / name).stat().st_size / 1024:7.1f} KB")


run(source / "ddin" / "D-DIN.otf", "din-regular.woff2", ["--desubroutinize"])
run(source / "ddin" / "D-DIN-Bold.otf", "din-bold.woff2", ["--desubroutinize"])
run(source / "ddin" / "D-DINCondensed-Bold.otf", "din-condensed-bold.woff2", ["--desubroutinize"])
run(source / "ddin" / "D-DINExp.otf", "din-exp.woff2", ["--desubroutinize"])

# Chinese variable font: subset first (fast), then pin the weight axis to the range the site uses.
tmp = root / "tools" / ".noto-subset.otf"
subset.main([str(source / "NotoSansSC-VF.otf"), f"--output-file={tmp}", *common])
font = TTFont(tmp)
axes = {axis.axisTag: axis for axis in font["fvar"].axes}
if "wght" in axes:
    lo = max(300, axes["wght"].minValue)
    hi = min(700, axes["wght"].maxValue)
    location = {"wght": (lo, hi)}
    try:
        from fontTools.varLib import instancer

        instancer.instantiateVariableFont(font, location, inplace=True, updateFontNames=False)
        print(f"wght axis pinned to {lo}-{hi}")
    except Exception as error:  # a full-range axis is larger, but still correct
        print(f"axis pinning skipped ({error.__class__.__name__}), keeping the full range")
font.flavor = "woff2"
font.save(out / "noto-sc-vf.woff2")
tmp.unlink()
print(f"{'noto-sc-vf.woff2':28s} {(out / 'noto-sc-vf.woff2').stat().st_size / 1024:7.1f} KB")
