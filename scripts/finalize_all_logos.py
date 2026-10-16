import urllib.request
import io
import os
import json
import sqlite3
from PIL import Image, ImageDraw

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def transparent_corners(im, tol=25):
    im = im.convert('RGBA')
    width, height = im.size
    corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    for cx, cy in corners:
        r, g, b, a = im.getpixel((cx, cy))
        if r >= 235 and g >= 235 and b >= 235 and a > 0:
            ImageDraw.floodfill(im, (cx, cy), (0, 0, 0, 0), thresh=tol)
    return im

SPECIFIC_DOWNLOADS = {
    "baltyk_gdynia.png": "https://upload.wikimedia.org/wikipedia/en/7/74/Baltyk_Gdynia.png",
    "wawel_krakow.png": "http://www.wikipasy.pl/images/e/e8/Wawel_Krak%C3%B3w_herb.png",
    "igloopol_debica.png": "http://www.wikipasy.pl/images/3/3b/Igloopol_D%C4%99bica_herb.png",
    "urania_ruda_slaska.png": "http://www.wikipasy.pl/images/b/b7/Urania_Ruda_%C5%9Al%C4%85ska_herb.png",
}

for fn, url in SPECIFIC_DOWNLOADS.items():
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
        im = Image.open(io.BytesIO(data))
        im_clean = transparent_corners(im)
        for tdir in ["legacy/static/logos", "public/logos"]:
            im_clean.save(os.path.join(tdir, fn), format="PNG")
        print(f"Successfully saved {fn} from {url}")
    except Exception as e:
        print(f"Error downloading {fn}: {e}")

# Load mapping
with open('public/logos/mapping.json', encoding='utf-8') as f:
    mapping = json.load(f)

# Update explicit mappings
mapping["Bałtyk Gdynia"] = "baltyk_gdynia.png"
mapping["Bałtyk II Gdynia"] = "baltyk_gdynia.png"
mapping["Górnik Polkowice"] = "ks_polkowice.png"
mapping["Krisbut Myszków"] = "ks_myszkow.png"
mapping["Wawel Kraków"] = "wawel_krakow.png"
mapping["Igloopol Dębica"] = "igloopol_debica.png"
mapping["Urania Ruda Śląska"] = "urania_ruda_slaska.png"
mapping["Urania Kochłowice"] = "urania_ruda_slaska.png"

# Remove invalid test files and map to None
files_to_remove = [
    ("Dozamet Nowa Sól", "dozamet_nowa_sol.png"),
    ("Start Gdańsk", "start_gdansk.png"),
    ("Stal Stocznia Szczecin", "stal_stocznia_szczecin.png"),
    ("FC Piaseczno", "fc_piaseczno.png"),
    ("KP Wałbrzych", "kp_walbrzych.png"),
    ("Pogoń Tczew", "pogon_tczew.png"),
    (None, "baltyk_ii_gdynia.png"),
    (None, "gornik_polkowice.png"),
    (None, "krisbut_myszkow.png"),
    (None, "urania_kochlowice.png"),
]

for club, fn in files_to_remove:
    if club:
        mapping[club] = None
    for tdir in ["legacy/static/logos", "public/logos"]:
        p = os.path.join(tdir, fn)
        if os.path.exists(p):
            os.remove(p)
            print(f"Removed invalid file {p}")

for tdir in ["legacy/static/logos", "public/logos"]:
    with open(os.path.join(tdir, "mapping.json"), "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)

print("Saved updated mapping.json")
