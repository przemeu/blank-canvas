import sqlite3
import json
import urllib.request
import urllib.parse
import re
import io
import os
import time
from PIL import Image, ImageDraw

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

CURATED = {
    "Bruk-Bet Termalica Nieciecza": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/a0/Bruk-Bet_Termalica_Nieciecza_crest.svg/330px-Bruk-Bet_Termalica_Nieciecza_crest.svg.png",
    "Termalica Bruk-Bet Nieciecza": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/a0/Bruk-Bet_Termalica_Nieciecza_crest.svg/330px-Bruk-Bet_Termalica_Nieciecza_crest.svg.png",
    "Górnik Zabrze": "https://thumb.wikimedia.org/wikipedia/en/thumb/5/58/G%C3%B3rnik_Zabrze_crest.svg/330px-G%C3%B3rnik_Zabrze_crest.svg.png",
    "Jagiellonia Białystok": "https://thumb.wikimedia.org/wikipedia/en/thumb/9/90/Jagiellonia_Bia%C5%82ystok_logo.svg/330px-Jagiellonia_Bia%C5%82ystok_logo.svg.png",
    "Cracovia": "https://thumb.wikimedia.org/wikipedia/en/thumb/5/53/Cracovia.svg/330px-Cracovia.svg.png",
    "Korona Kielce": "https://upload.wikimedia.org/wikipedia/en/f/fc/Korona_Kielce_crest.png",
    "Widzew Łódź": "https://thumb.wikimedia.org/wikipedia/en/thumb/f/f0/Widzew_%C5%81%C3%B3d%C5%BA_logo.svg/330px-Widzew_%C5%81%C3%B3d%C5%BA_logo.svg.png",
    "Wisła Płock": "https://thumb.wikimedia.org/wikipedia/en/thumb/6/6d/Wis%C5%82a_P%C5%82ock_logo.svg/330px-Wis%C5%82a_P%C5%82ock_logo.svg.png",
    "Radomiak Radom": "https://thumb.wikimedia.org/wikipedia/en/thumb/2/2f/Radomiak_Radom_crest.svg/330px-Radomiak_Radom_crest.svg.png",
    "Lechia Gdańsk": "https://thumb.wikimedia.org/wikipedia/en/thumb/8/87/Lechia_Gda%C5%84sk_crest.svg/330px-Lechia_Gda%C5%84sk_crest.svg.png",
    "GKS Katowice": "https://thumb.wikimedia.org/wikipedia/en/thumb/a/a9/GKS_Katowice_crest.svg/330px-GKS_Katowice_crest.svg.png",
    "Pogoń Szczecin": "https://thumb.wikimedia.org/wikipedia/en/thumb/5/5d/Pogo%C5%84_Szczecin_logo.svg/330px-Pogo%C5%84_Szczecin_logo.svg.png",
    "Odra Opole": "https://thumb.wikimedia.org/wikipedia/en/thumb/1/13/Odra_Opole_crest.svg/330px-Odra_Opole_crest.svg.png",
    "Chrobry Głogów": "https://thumb.wikimedia.org/wikipedia/en/thumb/3/3f/Chrobry_G%C5%82og%C3%B3w_crest.svg/330px-Chrobry_G%C5%82og%C3%B3w_crest.svg.png",
    "Warta Poznań": "https://thumb.wikimedia.org/wikipedia/en/thumb/5/56/Warta_Pozna%C5%84_crest.svg/330px-Warta_Pozna%C5%84_crest.svg.png",
    "Kotwica Kołobrzeg": "https://upload.wikimedia.org/wikipedia/en/1/1e/Kotwica_Ko%C5%82obrzeg_crest.png",
    "Miedź Legnica": "https://upload.wikimedia.org/wikipedia/en/e/ec/Mied%C5%BA_Legnica_crest.png",
    "Górnik Łęczna": "https://thumb.wikimedia.org/wikipedia/en/thumb/6/69/G%C3%B3rnik_%C5%81%C4%99czna_logo.svg/330px-G%C3%B3rnik_%C5%81%C4%99czna_logo.svg.png",
    "Wisła Kraków": "https://thumb.wikimedia.org/wikipedia/en/thumb/7/7b/Wis%C5%82a_Krak%C3%B3w_crest.svg/330px-Wis%C5%82a_Krak%C3%B3w_crest.svg.png",
    "Łódzki KS": "https://thumb.wikimedia.org/wikipedia/en/thumb/9/9e/%C5%81KS_%C5%81%C3%B3d%C5%BA_logo.svg/330px-%C5%81KS_%C5%81%C3%B3d%C5%BA_logo.svg.png",
    "Stal Stalowa Wola": "https://thumb.wikimedia.org/wikipedia/en/thumb/5/56/Stal_Stalowa_Wola_crest.svg/330px-Stal_Stalowa_Wola_crest.svg.png",
    "Polonia Bytom": "https://thumb.wikimedia.org/wikipedia/en/thumb/2/23/Polonia_Bytom_crest.svg/330px-Polonia_Bytom_crest.svg.png",
    "Puszcza Niepołomice": "https://thumb.wikimedia.org/wikipedia/en/thumb/4/41/MKS_Puszcza_Niepo%C5%82omice_crest.svg/330px-MKS_Puszcza_Niepo%C5%82omice_crest.svg.png",
    "GKS Bełchatów": "https://upload.wikimedia.org/wikipedia/en/8/8f/GKS_Be%C5%82chat%C3%B3w.png",
    "Wigry Suwałki": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Wigry_Suwa%C5%82ki.png/330px-Wigry_Suwa%C5%82ki.png",
    "Bytovia Bytów": "https://thumb.wikimedia.org/wikipedia/en/thumb/c/ce/Bytovia_Byt%C3%B3w_crest.svg/330px-Bytovia_Byt%C3%B3w_crest.svg.png",
    "Olimpia Grudziądz": "http://img.90minut.pl/logo/dobazy/olimpia_grudziadz.gif",
    "Flota Świnoujście": "http://img.90minut.pl/logo/dobazy/flota.gif",
    "Gryf Wejherowo": "http://img.90minut.pl/logo/dobazy/gryf_wejherowo.gif",
    "Kolejarz Stróże": "http://img.90minut.pl/logo/dobazy/kolejarz_stroze.gif",
    "Energetyk ROW Rybnik": "http://img.90minut.pl/logo/dobazy/energetyk_row.gif",
    "ROW Rybnik": "http://img.90minut.pl/logo/dobazy/energetyk_row.gif",
    "Pelikan Łowicz": "http://img.90minut.pl/logo/dobazy/pelikan_lowicz.gif",
    "Ruch Radzionków": "http://img.90minut.pl/logo/dobazy/ruch_radzionkow.gif",
    "Tur Turek": "http://img.90minut.pl/logo/dobazy/tur_turek.gif",
    "Kmita Zabierzów": "http://img.90minut.pl/logo/dobazy/kmita_zabierzow.gif",
    "Dyskobolia Grodzisk Wielkopolski": "https://upload.wikimedia.org/wikipedia/en/1/1c/Dyskobolia_Grodzisk_Logo.png",
    "Amica Wronki": "https://upload.wikimedia.org/wikipedia/en/8/86/Amica_Wronki_2007_Logo.png",
    "Amica II Wronki": "https://upload.wikimedia.org/wikipedia/en/8/86/Amica_Wronki_2007_Logo.png",
    "Szczakowianka Jaworzno": "https://upload.wikimedia.org/wikipedia/en/5/53/Szczakowianka_Jaworzno.png",
    "MKS Mława": "http://img.90minut.pl/logo/dobazy/mlawa.gif",
    "Tłoki Gorzyce": "http://img.90minut.pl/logo/dobazy/tloki.gif",
    "Hetman Zamość": "http://img.90minut.pl/logo/dobazy/hetman_zamosc_amspn.gif",
    "Piotrcovia Piotrków Trybunalski": "http://img.90minut.pl/logo/dobazy/piotrcovia.gif",
    "Włókniarz Kietrz": "http://img.90minut.pl/logo/dobazy/wlokniarz_kietrz.gif",
    "Hutnik Kraków": "http://img.90minut.pl/logo/dobazy/hutnik_krakow.gif",
    "Hutnik Nowa Huta": "http://img.90minut.pl/logo/dobazy/hutnik_krakow.gif",
    "Hutnik Krakow": "http://img.90minut.pl/logo/dobazy/hutnik_krakow.gif",
    "Kaszubia Kościerzyna": "http://img.90minut.pl/logo/dobazy/kaszubia_koscierzyna.gif",
    "Chemik Bydgoszcz": "http://img.90minut.pl/logo/dobazy/chemik_bydgoszcz.gif",
    "Goplania Inowrocław": "http://img.90minut.pl/logo/dobazy/goplania_inowroclaw.gif",
    "Sparta Brodnica": "http://img.90minut.pl/logo/dobazy/sparta_brodnica.gif",
    "Kaliski KS Kalisz": "http://img.90minut.pl/logo/dobazy/kks_kalisz.gif",
    "Calisia Kalisz": "http://img.90minut.pl/logo/dobazy/calisia.gif",
    "Bałtyk Gdynia": "http://img.90minut.pl/logo/dobazy/baltyk_gdynia.gif",
    "Bałtyk II Gdynia": "http://img.90minut.pl/logo/dobazy/baltyk_gdynia.gif",
    "Granica Kętrzyn": "http://img.90minut.pl/logo/dobazy/granica_ketrzyn.gif",
    "Zatoka Braniewo": "http://img.90minut.pl/logo/dobazy/zatoka_braniewo.gif",
    "Cartusia Kartuzy": "http://img.90minut.pl/logo/dobazy/cartusia.gif",
    "Okęcie Warszawa": "http://img.90minut.pl/logo/dobazy/okecie.gif",
    "Pomezania Malbork": "http://img.90minut.pl/logo/dobazy/pomezania_malbork.gif",
    "Gwardia Warszawa": "http://img.90minut.pl/logo/dobazy/gwardia_warszawa.gif",
    "Elana Toruń": "http://img.90minut.pl/logo/dobazy/elana_torun.gif",
    "Ursus Warszawa": "http://img.90minut.pl/logo/dobazy/ursus.gif",
    "Gryf Słupsk": "http://img.90minut.pl/logo/dobazy/gryf_slupsk.gif",
    "Gryf 95 Słupsk": "http://img.90minut.pl/logo/dobazy/gryf_slupsk.gif",
    "Wisła Tczew": "http://img.90minut.pl/logo/dobazy/wisla_tczew.gif",
    "Polonia Gdańsk": "http://img.90minut.pl/logo/dobazy/polonia_gdansk.gif",
    "Gedania Gdańsk": "http://img.90minut.pl/logo/dobazy/gedania.gif",
    "Wda Świecie": "http://img.90minut.pl/logo/dobazy/wda_swiecie.gif",
    "Stilon Gorzów Wlkp.": "http://img.90minut.pl/logo/dobazy/stilon_gorzow.gif",
    "Gwardia Koszalin": "http://img.90minut.pl/logo/dobazy/gwardia_koszalin.gif",
    "Zagłębie Wałbrzych": "http://img.90minut.pl/logo/dobazy/zaglebie_walbrzych.gif",
    "Zagłebie Wałbrzych": "http://img.90minut.pl/logo/dobazy/zaglebie_walbrzych.gif",
    "Górnik Wałbrzych": "http://img.90minut.pl/logo/dobazy/gornik_walbrzych.gif",
    "Chemik Police": "http://img.90minut.pl/logo/dobazy/chemik_police.gif",
    "Igloopol Dębica": "http://img.90minut.pl/logo/dobazy/igloopol_debica.gif",
    "Sokół Pniewy": "http://img.90minut.pl/logo/dobazy/sokol_pniewy.gif",
    "Polonia Bydgoszcz": "http://img.90minut.pl/logo/dobazy/polonia_bydgoszcz.gif",
    "Cuiavia Inowrocław": "http://img.90minut.pl/logo/dobazy/cuiavia_inowroclaw.gif",
    "Celuloza Kostrzyn": "http://img.90minut.pl/logo/dobazy/celuloza_kostrzyn.gif",
    "Moto Jelcz Oława": "http://img.90minut.pl/logo/dobazy/moto_jelcz_olawa.gif",
    "Stal Stocznia Szczecin": "http://img.90minut.pl/logo/dobazy/stal_stocznia.gif",
    "Czarni Słupsk": "http://img.90minut.pl/logo/dobazy/czarni_slupsk.gif",
    "Urania Ruda Śląska": "http://img.90minut.pl/logo/dobazy/urania.gif",
    "Urania Kochłowice": "http://img.90minut.pl/logo/dobazy/urania.gif",
    "Pomorzanin Toruń": "http://img.90minut.pl/logo/dobazy/pomorzanin_torun.gif",
    "Garbarnia Kraków": "http://img.90minut.pl/logo/dobazy/garbarnia.gif",
    "Unia Tarnów": "http://img.90minut.pl/logo/dobazy/unia_tarnow.gif",
    "Flota Gdynia": "http://img.90minut.pl/logo/dobazy/flota_gdynia.gif",
    "Warmia Olsztyn": "http://img.90minut.pl/logo/dobazy/warmia_olsztyn.gif",
    "Lublinianka Lublin": "http://img.90minut.pl/logo/dobazy/lublinianka.gif",
    "Unia Tczew": "http://img.90minut.pl/logo/dobazy/unia_tczew.gif",
    "Wawel Kraków": "http://img.90minut.pl/logo/dobazy/wawel_krakow.gif",
    "Karpaty Krosno": "http://img.90minut.pl/logo/dobazy/karpaty_krosno.gif",
    "Naprzód Lipiny": "http://img.90minut.pl/logo/dobazy/naprzod_lipiny.gif",
    "AKS Chorzów": "http://img.90minut.pl/logo/dobazy/aks_chorzow.gif",
    "Start Gdańsk": "http://img.90minut.pl/logo/dobazy/start_gdansk.gif",
    "Darzbór Szczecinek": "http://img.90minut.pl/logo/dobazy/darzbor_szczecinek.gif",
    "Arkonia Szczecin": "http://img.90minut.pl/logo/dobazy/arkonia_szczecin.gif",
    "Olimpia Poznań": "http://img.90minut.pl/logo/dobazy/olimpia_poznan.gif",
    "Ślęza Wrocław": "http://img.90minut.pl/logo/dobazy/sleza_wroclaw.gif",
    "Pogoń Oleśnica": "http://img.90minut.pl/logo/dobazy/pogon_olesnica.gif",
    "Naprzód Rydułtowy": "http://img.90minut.pl/logo/dobazy/naprzod_rydultowy.gif",
    "Dozamet Nowa Sól": "http://img.90minut.pl/logo/dobazy/dozamet_nowasol.gif",
    "Piast Nowa Ruda": "http://img.90minut.pl/logo/dobazy/piast_nowaruda.gif",
    "Lechia Dzierżoniów": "http://img.90minut.pl/logo/dobazy/lechia_dzierzoniow.gif",
    "Kaszubia Kościerzyna": "http://img.90minut.pl/logo/dobazy/kaszubia_koscierzyna.gif",
    "Huragan Pobiedziska": "http://img.90minut.pl/logo/dobazy/huragan_pobiedziska.gif",
    "Orlęta Reda": "http://img.90minut.pl/logo/dobazy/orleta_reda.gif",
    "Mień Lipno": "http://img.90minut.pl/logo/dobazy/mien_lipno.gif",
    "Astra Krotoszyn": "http://img.90minut.pl/logo/dobazy/astra_krotoszyn.gif",
    "Obra Kościan": "http://img.90minut.pl/logo/dobazy/obra_koscian.gif",
    "Pomerania Police": "http://img.90minut.pl/logo/dobazy/pomerania_police.gif",
    "Stolem Gniewino": "http://img.90minut.pl/logo/dobazy/stolem_gniewino.gif",
    "Rodło Kwidzyn": "http://img.90minut.pl/logo/dobazy/rodlo_kwidzyn.gif",
    "Jantar Ustka": "http://img.90minut.pl/logo/dobazy/jantar_ustka.gif",
    "Wierzyca Starogard Gdański": "http://img.90minut.pl/logo/dobazy/wierzyca_starogard.gif",
    "Brda Bydgoszcz": "http://img.90minut.pl/logo/dobazy/brda_bydgoszcz.gif",
    "Orkan Gdynia": "http://img.90minut.pl/logo/dobazy/orkan_rumia.gif",
    "Wielim Szczecinek": "http://img.90minut.pl/logo/dobazy/wielim_szczecinek.gif",
    "Powiśle Czernin": "http://img.90minut.pl/logo/dobazy/powisle_czernin.gif",
    "Victoria Jaworzno": "http://img.90minut.pl/logo/dobazy/victoria_jaworzno.gif",
    "Victoria": "http://img.90minut.pl/logo/dobazy/victoria_jaworzno.gif",
    "SKS Starogard": "http://img.90minut.pl/logo/dobazy/sks_starogard.gif",
    "Pogoń Tczew": "http://img.90minut.pl/logo/dobazy/pogon_tczew.gif",
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

def sanitize_filename(name):
    ascii_map = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n', 'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
    }
    s = "".join(ascii_map.get(c, c) for c in name)
    s = re.sub(r'[^a-zA-Z0-9]+', '_', s).strip('_').lower()
    return f"{s}.png"

def search_90minut(club_name):
    search_term = club_name
    for prefix in ['MKS ', 'KS ', 'GKS ', 'ZKS ', 'OKS ', 'MLKS ', 'KP ', 'CWKS ']:
        if search_term.startswith(prefix):
            search_term = search_term[len(prefix):]
            break
            
    try:
        q = urllib.parse.quote(search_term.encode('iso-8859-2', errors='replace'))
    except Exception:
        q = urllib.parse.quote(search_term)
        
    url = f"http://www.90minut.pl/szukaj.php?tekst={q}&x=0&y=0"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            html = resp.read().decode('iso-8859-2', errors='replace')
        matches = re.findall(r'href=["\']/?skarb\.php\?id_klub=(\d+)["\'][^>]*>([^<]+)</a>', html)
        if not matches:
            return None
            
        best_id = matches[0][0]
        clean_target = club_name.lower().replace('-', ' ')
        for cid, cname in matches:
            cn = cname.strip().lower().replace('-', ' ')
            if cn == clean_target or search_term.lower() in cn:
                best_id = cid
                break
                
        skarb_url = f"http://www.90minut.pl/skarb.php?id_klub={best_id}"
        req2 = urllib.request.Request(skarb_url, headers=HEADERS)
        with urllib.request.urlopen(req2, timeout=5) as resp2:
            s_html = resp2.read().decode('iso-8859-2', errors='replace')
        logo_m = re.search(r'src=["\'](http://img\.90minut\.pl/logo/dobazy/[^"\']+|/logo/dobazy/[^"\']+)["\']', s_html)
        if logo_m:
            l = logo_m.group(1)
            if l.startswith('/'):
                l = 'http://img.90minut.pl' + l
            return l
    except Exception:
        return None
    return None

def main():
    with open('public/logos/mapping.json', encoding='utf-8') as f:
        mapping = json.load(f)

    conn = sqlite3.connect('Kalendarium.db')
    c = conn.cursor()
    rows = c.execute('''
        SELECT Przeciwnik, MAX(COALESCE(NULLIF([Full date], ''), Rok || '-01-01')) as latest_date, COUNT(*) as match_count, MAX(ID) as max_id
        FROM Mecze
        WHERE Przeciwnik IS NOT NULL AND TRIM(Przeciwnik) != '' AND Przeciwnik != 'Arka Gdynia'
        GROUP BY Przeciwnik
        ORDER BY latest_date DESC, max_id DESC
    ''').fetchall()

    without_logo = [r for r in rows if not mapping.get(r[0])]
    print(f"Total opponents without logo to process: {len(without_logo)}")

    found_list = []
    unfound_list = []

    for idx, (opp, latest_date, match_count, max_id) in enumerate(without_logo, 1):
        # 1. Check curated
        logo_url = CURATED.get(opp)
        source = "Curated"
        if not logo_url:
            # 2. Check 90minut
            logo_url = search_90minut(opp)
            source = "90minut"
            
        if logo_url:
            fn = sanitize_filename(opp)
            try:
                req = urllib.request.Request(logo_url, headers=HEADERS)
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = resp.read()
                im = Image.open(io.BytesIO(data))
                im_clean = transparent_corners(im)
                
                # Save to both legacy and public
                for target_dir in ["legacy/static/logos", "public/logos"]:
                    target_path = os.path.join(target_dir, fn)
                    im_clean.save(target_path, format="PNG")
                    
                mapping[opp] = fn
                found_list.append((opp, fn, source, latest_date, match_count))
                print(f"[{idx}/{len(without_logo)}] ADDED: {opp:30} -> {fn} ({source})")
            except Exception as e:
                print(f"[{idx}/{len(without_logo)}] FAILED download for {opp} ({logo_url}): {e}")
                unfound_list.append((opp, latest_date, match_count, f"Download error: {e}"))
        else:
            unfound_list.append((opp, latest_date, match_count, "Brak herbu w bazach"))
            print(f"[{idx}/{len(without_logo)}] UNFOUND: {opp:30} ({latest_date}, {match_count} meczów)")
        time.sleep(0.3)

    # Save mapping to both legacy and public
    for target_dir in ["legacy/static/logos", "public/logos"]:
        m_path = os.path.join(target_dir, "mapping.json")
        with open(m_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, ensure_ascii=False, indent=2)

    # Save summary report to JSON
    report = {
        "found": found_list,
        "unfound": unfound_list
    }
    with open("scratch_logo_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n==========================================")
    print(f"FINISHED! Successfully added logos for {len(found_list)} clubs.")
    print(f"Unfound (defunct/amateur/no badge): {len(unfound_list)} clubs.")
    print(f"==========================================")

if __name__ == "__main__":
    main()
