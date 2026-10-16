import os
import shutil
import json
from PIL import Image, ImageDraw

def transparent_corners(im, tol=25):
    im = im.convert('RGBA')
    width, height = im.size
    corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    for cx, cy in corners:
        r, g, b, a = im.getpixel((cx, cy))
        if r >= 235 and g >= 235 and b >= 235 and a > 0:
            ImageDraw.floodfill(im, (cx, cy), (0, 0, 0, 0), thresh=tol)
    return im

NEW_LOGOS_DIR = "scratch/new_logos"
TARGET_DIRS = ["legacy/static/logos", "public/logos"]

for fn in os.listdir(NEW_LOGOS_DIR):
    if not fn.endswith('.png') or fn.startswith('new_sheet'):
        continue
    src_path = os.path.join(NEW_LOGOS_DIR, fn)
    im = Image.open(src_path)
    im_clean = transparent_corners(im)
    
    for tdir in TARGET_DIRS:
        dst_path = os.path.join(tdir, fn)
        im_clean.save(dst_path, format="PNG")
        print(f"Updated {dst_path}")

# Handle Kolejarz Elbląg (it had Zagłębie Sosnowiec logo before, now defunct/no logo)
for tdir in TARGET_DIRS:
    old_kolejarz = os.path.join(tdir, "kolejarz_elblag.png")
    if os.path.exists(old_kolejarz):
        os.remove(old_kolejarz)
        print(f"Removed {old_kolejarz}")
    
    mapping_path = os.path.join(tdir, "mapping.json")
    if os.path.exists(mapping_path):
        with open(mapping_path, "r", encoding="utf-8") as f:
            mapping = json.load(f)
        mapping["Kolejarz Elbląg"] = None
        with open(mapping_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, ensure_ascii=False, indent=2)
        print(f"Updated mapping in {mapping_path}")

print("All logos successfully replaced and mappings updated!")
