"""Render a type specimen so weight / pairing choices are made by looking, not guessing."""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "fonts-src"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "out" / "specimen.png"

PETROL = (6, 24, 33)
IVORY = (239, 234, 224)
MUTED = (169, 184, 193)
AMBER = (245, 174, 61)
PAPER = (236, 238, 239)
INK = (10, 26, 34)

ddin = SRC / "ddin"
noto = SRC / "NotoSansSC-VF.otf"
gothic = SRC / "chill" / "ChillDINGothic_Std.otf"


def vf(path, weight, size):
    f = ImageFont.truetype(str(path), size)
    f.set_variation_by_axes([weight])
    return f


W, H = 1700, 2600
img = Image.new("RGB", (W, H), PETROL)
d = ImageDraw.Draw(img)
x = 60
y = 40


def label(text, col=MUTED):
    global y
    d.text((x, y), text, font=ImageFont.truetype(str(ddin / "D-DIN.otf"), 20), fill=col)
    y += 30


def line(text, font, col=IVORY, pad=18):
    global y
    d.text((x, y), text, font=font, fill=col)
    y += font.size + pad


latin = "0123456789  2011 2026  D4 N P  km/h  GEAR ODOMETER  Ming Ma"
label("D-DIN Regular")
line(latin, ImageFont.truetype(str(ddin / "D-DIN.otf"), 54))
label("D-DIN Bold")
line(latin, ImageFont.truetype(str(ddin / "D-DIN-Bold.otf"), 54))
label("D-DIN Condensed Bold  /  big numerals")
line("2011  2026  28  45%  94  80%", ImageFont.truetype(str(ddin / "D-DINCondensed-Bold.otf"), 110), AMBER)
label("D-DIN Exp  /  tracked labels")
line("GEAR    ODOMETER    KM/H    SINCE 2011", ImageFont.truetype(str(ddin / "D-DINExp.otf"), 30))

y += 10
zh = "麻明  把复杂的业务问题，做成能落地的系统  辅导 标准 工具 AI"
for w in (200, 300, 400, 500, 700):
    label(f"Noto Sans SC VF  wght {w}")
    line(zh, vf(noto, w, 46))

label("Noto Sans SC VF 300 at display size")
line("麻明  四次换挡", vf(noto, 300, 120))
label("Noto Sans SC VF 500 at display size")
line("麻明  四次换挡", vf(noto, 500, 120))

label("ChillDINGothic Std (DIN-paired)")
line(zh, ImageFont.truetype(str(gothic), 46))

y += 6
label("mixed: Noto 400 + D-DIN numerals in one line")
a = vf(noto, 400, 34)
d.text((x, y), "10 年主机厂辅导    7 年四大汽车咨询    2 年 AI 数字化落地", font=a, fill=IVORY)
y += 60
label("mixed: Noto 700 emphasis inside 400 (same family)")
d.text((x, y), "把复杂的业务问题，", font=a, fill=IVORY)
w1 = d.textlength("把复杂的业务问题，", font=a)
d.text((x + w1, y), "做成能落地的系统", font=vf(noto, 700, 34), fill=AMBER)
y += 70

# light "cabin" strip to judge day-mode text
d.rectangle([0, y, W, H], fill=PAPER)
y += 24
label("DAY MODE  Noto 300 / 400 / 700 on cool paper", col=(92, 112, 123))
line("麻明  四次换挡", vf(noto, 300, 64), INK, pad=10)
line("把复杂的业务问题，做成能落地的系统。10 年主机厂辅导，7 年四大咨询。", vf(noto, 400, 34), (61, 80, 91), pad=10)
d.text((x, y), "2011  2026  D4  28  94  80%", font=ImageFont.truetype(str(ddin / "D-DINCondensed-Bold.otf"), 80), fill=INK)
y += 110
d.text((x, y), "GEAR  ODOMETER  KM/H", font=ImageFont.truetype(str(ddin / "D-DINExp.otf"), 26), fill=(92, 112, 123))

img = img.crop((0, 0, W, min(H, y + 40)))
OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT)
print("saved", OUT, img.size)
