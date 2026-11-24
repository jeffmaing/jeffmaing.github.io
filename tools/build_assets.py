"""Prepare the site's raster assets from the original photos.

usage: build_assets.py <portrait> <person_mask> <office_photo> <signature_img> <resume.pdf> <ddin_dir> <noto_vf.otf> <preview_dir>
Everything is passed in as arguments; nothing is read from the working directory.
"""
import argparse
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "src" / "assets" / "img"
FILES = ROOT / "src" / "assets"

PETROL = (6, 24, 33)
IVORY = (239, 234, 224)
AMBER = (245, 174, 61)

ap = argparse.ArgumentParser()
ap.add_argument("portrait")
ap.add_argument("cutout")
ap.add_argument("office")
ap.add_argument("signature")
ap.add_argument("resume")
ap.add_argument("ddin_dir")
ap.add_argument("noto_vf")
ap.add_argument("preview_dir")
a = ap.parse_args()

IMG.mkdir(parents=True, exist_ok=True)
FILES.mkdir(parents=True, exist_ok=True)
preview = Path(a.preview_dir)
preview.mkdir(parents=True, exist_ok=True)


def save(img, name, quality, **kw):
    path = IMG / name
    img.save(path, "WEBP", quality=quality, method=6, **kw)
    print(f"{name:34s} {img.size[0]}x{img.size[1]}  {path.stat().st_size / 1024:7.1f} KB")


# 1. Studio portrait: combine the photo with the Vision person matte, pull the edge in by a
#    hair so no light fringe survives on a dark instrument face, then export the cut-out
#    used by the WebGL field.
photo = Image.open(a.portrait).convert("RGB")
mask = Image.open(a.cutout).convert("L").resize(photo.size, Image.LANCZOS)
# firm up the soft matte: below 60 is background, above 215 is person, feathered between
mask = mask.point(lambda v: 0 if v < 60 else (255 if v > 215 else round((v - 60) * 255 / 155)))
mask = mask.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.9))
cut = photo.convert("RGBA")
cut.putalpha(mask)
alpha = np.asarray(cut.getchannel("A"))
ys, xs = np.where(alpha > 24)
pad = int(cut.height * 0.012)
box = (max(0, xs.min() - pad), max(0, ys.min() - pad), min(cut.width, xs.max() + pad), min(cut.height, ys.max() + pad))
cut = cut.crop(box)
target_h = 1600
cut = cut.resize((round(cut.width * target_h / cut.height), target_h), Image.LANCZOS)
save(cut, "portrait-cutout.webp", 84)

# small sampling copy for the shader (keeps the texture read cheap)
sample = cut.resize((round(cut.width * 560 / cut.height), 560), Image.LANCZOS)
save(sample, "portrait-sample.webp", 80)

# preview of the cut-out on the instrument face
bg = Image.new("RGB", (cut.width + 160, cut.height + 80), PETROL)
bg.paste(cut, (80, 40), cut)
bg.resize((bg.width // 2, bg.height // 2), Image.LANCZOS).save(preview / "cutout-preview.jpg", quality=88)

# 2. Office portrait for the about section
office = Image.open(a.office).convert("RGB")
for width, name in ((1800, "portrait-office.webp"), (960, "portrait-office-960.webp")):
    resized = office.resize((width, round(office.height * width / office.width)), Image.LANCZOS)
    save(resized, name, 80)

# 3. Handwritten signature -> ink on transparent, so CSS can recolour it per theme
sig = Image.open(a.signature).convert("L")
arr = np.asarray(sig).astype(np.float32)
ink = np.clip((196 - arr) * 255.0 / 104.0, 0, 255).astype(np.uint8)
sa = Image.fromarray(ink, "L")
bbox = sa.point(lambda v: 255 if v > 12 else 0).getbbox()
sa = sa.crop((max(0, bbox[0] - 24), max(0, bbox[1] - 24), min(sa.width, bbox[2] + 24), min(sa.height, bbox[3] + 24)))
sa = sa.resize((900, round(sa.height * 900 / sa.width)), Image.LANCZOS)
rgba = Image.merge("RGBA", (Image.new("L", sa.size, 0), Image.new("L", sa.size, 0), Image.new("L", sa.size, 0), sa))
path = IMG / "signature.png"
rgba.save(path, "PNG", optimize=True)
print(f"{'signature.png':34s} {rgba.size[0]}x{rgba.size[1]}  {path.stat().st_size / 1024:7.1f} KB")

# 4. Resume download
shutil.copyfile(a.resume, FILES / "Ming-Ma-Resume.pdf")
print("resume copied", (FILES / "Ming-Ma-Resume.pdf").stat().st_size // 1024, "KB")

# 5. Social share card (1200x630)
W, H = 1200, 630
og = Image.new("RGB", (W, H), PETROL)
figure = cut.copy()
fh = 760
figure = figure.resize((round(figure.width * fh / figure.height), fh), Image.LANCZOS)
og.paste(figure, (W - figure.width + 30, H - fh + 46), figure)
d = ImageDraw.Draw(og)
ddin = Path(a.ddin_dir)


def tracked(draw, xy, text, font, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def vf(weight, size):
    f = ImageFont.truetype(a.noto_vf, size)
    f.set_variation_by_axes([weight])
    return f


name_font = vf(300, 168)
d.text((76, 150), "麻明", font=name_font, fill=IVORY)
tracked(d, (82, 346), "MING MA", ImageFont.truetype(str(ddin / "D-DINExp.otf"), 30), AMBER, 7)
d.rectangle([82, 412, 172, 415], fill=AMBER)
d.text((80, 448), "汽车咨询 × AI 落地", font=vf(400, 38), fill=IVORY)
d.text((80, 510), "辅导 → 标准 → 工具 → AI", font=vf(300, 30), fill=(169, 184, 193))
path = IMG / "og.jpg"
og.save(path, "JPEG", quality=88, optimize=True)
print(f"{'og.jpg':34s} {W}x{H}  {path.stat().st_size / 1024:7.1f} KB")
og.resize((W // 2, H // 2), Image.LANCZOS).save(preview / "og-preview.jpg", quality=88)
