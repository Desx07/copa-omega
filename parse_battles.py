#!/usr/bin/env python3
"""Parse Beyblade X battle test results from tmp_excel.txt"""
import re
import json
from collections import defaultdict

filepath = "C:/Users/ariel/Desktop/go/copa-omega/tmp_excel.txt"

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# State tracking
current_source = None
current_sheet = None
current_blade = None
current_weight = None
current_style = None
current_ratchet = None
in_match_section = False
match_results = []

# All parsed combo data
all_combos = []

def flush_combo():
    global match_results, current_blade, current_style, current_ratchet
    if not match_results or not current_blade or not current_ratchet:
        match_results = []
        return

    wins = sum(1 for r in match_results if r.startswith('v'))
    losses = sum(1 for r in match_results if r.startswith('x'))

    win_sf = sum(1 for r in match_results if r == 'vSF')
    win_ko = sum(1 for r in match_results if r == 'vKO')
    win_bf = sum(1 for r in match_results if r == 'vBF')
    win_xf = sum(1 for r in match_results if r == 'vXF')
    loss_sf = sum(1 for r in match_results if r == 'xSF')
    loss_ko = sum(1 for r in match_results if r == 'xKO')
    loss_bf = sum(1 for r in match_results if r == 'xBF')
    loss_xf = sum(1 for r in match_results if r == 'xXF')

    # Points: SF=1, KO=2, BF=2, XF=3
    win_pts = win_sf*1 + win_ko*2 + win_bf*2 + win_xf*3
    loss_pts = loss_sf*1 + loss_ko*2 + loss_bf*2 + loss_xf*3

    combo = {
        "source": current_source,
        "sheet": current_sheet,
        "blade": current_blade,
        "weight": current_weight,
        "style": current_style,
        "ratchet": current_ratchet,
        "wins": wins,
        "losses": losses,
        "win_sf": win_sf, "win_ko": win_ko, "win_bf": win_bf, "win_xf": win_xf,
        "loss_sf": loss_sf, "loss_ko": loss_ko, "loss_bf": loss_bf, "loss_xf": loss_xf,
        "win_pts": win_pts,
        "loss_pts": loss_pts,
        "total_matches": wins + losses,
        "combo_label": f"{current_blade} {current_ratchet}",
        "full_label": f"{current_blade} {current_ratchet} [{current_style}]"
    }
    all_combos.append(combo)
    match_results = []

for line in lines:
    line = line.rstrip('\n')
    parts = [p.strip() for p in line.split('|')]

    # Source file
    m = re.match(r'^===== (.+\.xlsx) =====', line)
    if m:
        flush_combo()
        current_source = m.group(1).replace('Resultados_', '').replace('.xlsx', '')
        continue

    # Sheet
    m = re.match(r'^--- Sheet: (.+) ---', line)
    if m:
        flush_combo()
        current_sheet = m.group(1).strip()
        # Skip template/plantilla sheets
        if 'Plantilla' in current_sheet or 'BASECOMBOS' in current_sheet:
            current_blade = None
            continue
        # For "Combos" sheets, keep same blade but reset style
        if not any(kw in current_sheet.lower() for kw in ['combo', 'prueba', 'base']):
            current_blade = None
            current_weight = None
        current_style = None
        current_ratchet = None
        match_results = []
        continue

    # Skip if no sheet or blade context
    if current_sheet and ('Plantilla' in current_sheet or 'BASECOMBOS' in current_sheet):
        continue

    # Weight
    for p in parts:
        m2 = re.search(r'PESO:\s*([\d.]+)g?', p)
        if m2:
            current_weight = m2.group(1)
            # Also try to find blade name from this line or surrounding context
            break

    # Blade name detection - on the line with just the blade name
    if current_blade is None and len(parts) > 3:
        non_empty = [p for p in parts if p and p not in ['', ' ']]
        if len(non_empty) == 1 and len(non_empty[0]) > 3:
            candidate = non_empty[0]
            if not any(kw in candidate.upper() for kw in ['PESO', 'AGRESIVA', 'ESTACIONAR', 'SEMIAGRESIVA',
                'VICTORIAS', 'DERROTAS', 'PUNTOS', 'PUNTAJE', 'COMBO', 'TOTAL', 'SF', 'KO', 'BF', 'XF',
                'RESULTADO', 'PRUEBA', 'PLANTILLA']):
                if not re.match(r'^[\d.\-]+$', candidate):
                    current_blade = candidate
                    continue

    # Style detection - AGRESIVA, Estacionaria, Semiagresiva
    for p in parts:
        p_upper = p.strip().upper()
        if 'AGRESIVA' in p_upper and 'SEMI' not in p_upper and 'PRUEBA' not in p_upper:
            flush_combo()
            current_style = 'Agresiva'
            current_ratchet = None
            # Check if ratchet is embedded: "AGRESIVA 7-60R" or on next line
            m3 = re.search(r'(?:AGRESIVA)\s+(\d+-\d+\w+)', p, re.IGNORECASE)
            if m3:
                current_ratchet = m3.group(1)
            match_results = []
            break
        elif 'ESTACIONARIA' in p_upper and 'PRUEBA' not in p_upper:
            flush_combo()
            current_style = 'Estacionaria'
            current_ratchet = None
            m3 = re.search(r'(?:Estacionaria)\s+(\d+-\d+\w+)', p, re.IGNORECASE)
            if m3:
                current_ratchet = m3.group(1)
            match_results = []
            break
        elif 'SEMIAGRESIVA' in p_upper and 'PRUEBA' not in p_upper:
            flush_combo()
            current_style = 'Semiagresiva'
            current_ratchet = None
            m3 = re.search(r'(?:Semiagresiva)\s+(\d+-\d+\w+)', p, re.IGNORECASE)
            if m3:
                current_ratchet = m3.group(1)
            match_results = []
            break
        elif re.match(r'COMBO\s+\d+', p_upper):
            flush_combo()
            combo_num = re.search(r'COMBO\s+(\d+)', p_upper).group(1)
            current_style = f'Combo{combo_num}'
            current_ratchet = None
            match_results = []
            break

    # Ratchet detection (line after style header, before matches)
    if current_style and not current_ratchet:
        for p in parts:
            if re.match(r'^\d+-\d+[A-Za-z]+$', p.strip()):
                if p.strip() not in ['SF', 'KO', 'BF', 'XF']:
                    current_ratchet = p.strip()
                    match_results = []
                    break

    # Match row detection (numbered 1.0 - 50.0)
    if len(parts) > 2 and current_ratchet:
        first = parts[0].strip()
        m4 = re.match(r'^(\d+)\.0$', first)
        if m4:
            result = parts[2].strip() if len(parts) > 2 else ""
            if result and result != '-' and len(result) >= 2 and (result.startswith('v') or result.startswith('x')):
                match_results.append(result)

# Final flush
flush_combo()

# Filter meaningful combos (with actual matches)
active = [c for c in all_combos if c['total_matches'] > 0]

# Output results
output = []
output.append("=" * 80)
output.append("BEYBLADE X XCICLOPEDIA - BATTLE TEST RESULTS ANALYSIS")
output.append("=" * 80)
output.append(f"\nTotal combo configurations tested: {len(all_combos)}")
output.append(f"Combos with actual battles: {len(active)}")
output.append(f"Sources: {sorted(set(c['source'] for c in active))}")
output.append(f"Unique blades tested: {len(set(c['blade'] for c in active))}")

# ====== PER-BLADE SUMMARY ======
output.append("\n" + "=" * 80)
output.append("PER-BLADE SUMMARY (all combos aggregated)")
output.append("=" * 80)

blade_data = defaultdict(lambda: {
    "weights": set(), "total_w": 0, "total_l": 0, "total_pts_w": 0, "total_pts_l": 0,
    "sf": 0, "ko": 0, "bf": 0, "xf": 0, "combos": [],
    "agr_w": 0, "agr_l": 0, "est_w": 0, "est_l": 0, "semi_w": 0, "semi_l": 0,
    "sources": set()
})

for c in active:
    bd = blade_data[c['blade']]
    if c['weight']:
        bd['weights'].add(c['weight'])
    bd['total_w'] += c['wins']
    bd['total_l'] += c['losses']
    bd['total_pts_w'] += c['win_pts']
    bd['total_pts_l'] += c['loss_pts']
    bd['sf'] += c['win_sf']
    bd['ko'] += c['win_ko']
    bd['bf'] += c['win_bf']
    bd['xf'] += c['win_xf']
    bd['combos'].append(c)
    bd['sources'].add(c['source'])

    style = c['style']
    if style == 'Agresiva':
        bd['agr_w'] += c['wins']
        bd['agr_l'] += c['losses']
    elif style == 'Estacionaria':
        bd['est_w'] += c['wins']
        bd['est_l'] += c['losses']
    elif style == 'Semiagresiva':
        bd['semi_w'] += c['wins']
        bd['semi_l'] += c['losses']

# Sort blades by total wins descending
sorted_blades = sorted(blade_data.items(), key=lambda x: (x[1]['total_w'], x[1]['total_pts_w']), reverse=True)

for blade, bd in sorted_blades:
    total = bd['total_w'] + bd['total_l']
    if total == 0:
        continue
    wr = bd['total_w'] / total * 100 if total > 0 else 0
    weights_str = '/'.join(sorted(bd['weights'])) + 'g' if bd['weights'] else '?g'

    # Most common win type
    win_types = {'SF': bd['sf'], 'KO': bd['ko'], 'BF': bd['bf'], 'XF': bd['xf']}
    best_type = max(win_types, key=win_types.get) if any(win_types.values()) else 'N/A'

    output.append(f"\n  {blade} ({weights_str}) [{', '.join(sorted(bd['sources']))}]")
    output.append(f"    Overall: {bd['total_w']}W-{bd['total_l']}L ({wr:.0f}% WR) | Points: +{bd['total_pts_w']}/-{bd['total_pts_l']}")
    output.append(f"    By Style: AGR={bd['agr_w']}W-{bd['agr_l']}L | EST={bd['est_w']}W-{bd['est_l']}L | SEMI={bd['semi_w']}W-{bd['semi_l']}L")
    output.append(f"    Win Types: SF={bd['sf']} KO={bd['ko']} BF={bd['bf']} XF={bd['xf']} | Most Common: {best_type}")

# ====== TOP 10 MOST WINNING COMBOS ======
output.append("\n\n" + "=" * 80)
output.append("TOP 10 MOST WINNING COMBOS OVERALL (by wins, then win%)")
output.append("=" * 80)

# Only main styles (Agresiva/Estacionaria/Semiagresiva), not Combo4/5
main_style_combos = [c for c in active if c['style'] in ('Agresiva', 'Estacionaria', 'Semiagresiva')]
sorted_combos = sorted(main_style_combos, key=lambda c: (c['wins'], c['wins']/(c['total_matches'] or 1), c['win_pts']), reverse=True)

for i, c in enumerate(sorted_combos[:15]):
    wr = c['wins'] / c['total_matches'] * 100 if c['total_matches'] > 0 else 0
    output.append(f"  #{i+1}: {c['blade']} {c['ratchet']} [{c['style']}] - {c['wins']}W-{c['losses']}L ({wr:.0f}%) | Pts: +{c['win_pts']}/-{c['loss_pts']} | Src: {c['source']}")

# ====== BEST IN AGGRESSIVE ======
output.append("\n\n" + "=" * 80)
output.append("TOP 10 BEST IN AGGRESSIVE (Agresiva)")
output.append("=" * 80)

agr = [c for c in active if c['style'] == 'Agresiva']
agr_sorted = sorted(agr, key=lambda c: (c['wins'], c['win_pts']), reverse=True)
for i, c in enumerate(agr_sorted[:10]):
    wr = c['wins'] / c['total_matches'] * 100 if c['total_matches'] > 0 else 0
    output.append(f"  #{i+1}: {c['blade']} {c['ratchet']} - {c['wins']}W-{c['losses']}L ({wr:.0f}%) | SF:{c['win_sf']} KO:{c['win_ko']} BF:{c['win_bf']} XF:{c['win_xf']} | Src: {c['source']}")

# ====== BEST IN STATIONARY ======
output.append("\n\n" + "=" * 80)
output.append("TOP 10 BEST IN STATIONARY/DEFENSIVE (Estacionaria)")
output.append("=" * 80)

est = [c for c in active if c['style'] == 'Estacionaria']
est_sorted = sorted(est, key=lambda c: (c['wins'], c['win_pts']), reverse=True)
for i, c in enumerate(est_sorted[:10]):
    wr = c['wins'] / c['total_matches'] * 100 if c['total_matches'] > 0 else 0
    output.append(f"  #{i+1}: {c['blade']} {c['ratchet']} - {c['wins']}W-{c['losses']}L ({wr:.0f}%) | SF:{c['win_sf']} KO:{c['win_ko']} BF:{c['win_bf']} XF:{c['win_xf']} | Src: {c['source']}")

# ====== BEST IN SEMI-AGGRESSIVE ======
output.append("\n\n" + "=" * 80)
output.append("TOP 10 BEST IN SEMI-AGGRESSIVE (Semiagresiva)")
output.append("=" * 80)

semi = [c for c in active if c['style'] == 'Semiagresiva']
semi_sorted = sorted(semi, key=lambda c: (c['wins'], c['win_pts']), reverse=True)
for i, c in enumerate(semi_sorted[:10]):
    wr = c['wins'] / c['total_matches'] * 100 if c['total_matches'] > 0 else 0
    output.append(f"  #{i+1}: {c['blade']} {c['ratchet']} - {c['wins']}W-{c['losses']}L ({wr:.0f}%) | SF:{c['win_sf']} KO:{c['win_ko']} BF:{c['win_bf']} XF:{c['win_xf']} | Src: {c['source']}")

# ====== BEST COMBO4 RESULTS ======
output.append("\n\n" + "=" * 80)
output.append("TOP 10 BEST EXTRA COMBOS (Combo4 / other combos)")
output.append("=" * 80)

combo_extra = [c for c in active if c['style'] not in ('Agresiva', 'Estacionaria', 'Semiagresiva')]
combo_sorted = sorted(combo_extra, key=lambda c: (c['wins'], c['win_pts']), reverse=True)
for i, c in enumerate(combo_sorted[:10]):
    wr = c['wins'] / c['total_matches'] * 100 if c['total_matches'] > 0 else 0
    output.append(f"  #{i+1}: {c['blade']} {c['ratchet']} [{c['style']}] - {c['wins']}W-{c['losses']}L ({wr:.0f}%) | SF:{c['win_sf']} KO:{c['win_ko']} BF:{c['win_bf']} XF:{c['win_xf']} | Src: {c['source']}")

# ====== VICTORY TYPE ANALYSIS ======
output.append("\n\n" + "=" * 80)
output.append("VICTORY TYPE DISTRIBUTION (across all combos)")
output.append("=" * 80)

total_sf = sum(c['win_sf'] for c in active)
total_ko = sum(c['win_ko'] for c in active)
total_bf = sum(c['win_bf'] for c in active)
total_xf = sum(c['win_xf'] for c in active)
total_wins = total_sf + total_ko + total_bf + total_xf

if total_wins > 0:
    output.append(f"  Spin Finish (SF):    {total_sf} ({total_sf/total_wins*100:.1f}%) - 1pt each")
    output.append(f"  Knockout (KO):       {total_ko} ({total_ko/total_wins*100:.1f}%) - 2pts each")
    output.append(f"  Burst Finish (BF):   {total_bf} ({total_bf/total_wins*100:.1f}%) - 2pts each")
    output.append(f"  Xtreme Finish (XF):  {total_xf} ({total_xf/total_wins*100:.1f}%) - 3pts each")

# ====== MOST COMMON VICTORY TYPE PER BLADE ======
output.append("\n\n" + "=" * 80)
output.append("MOST COMMON VICTORY TYPE PER BLADE")
output.append("=" * 80)

for blade, bd in sorted_blades:
    if bd['total_w'] == 0:
        continue
    win_types = {'SF': bd['sf'], 'KO': bd['ko'], 'BF': bd['bf'], 'XF': bd['xf']}
    best_type = max(win_types, key=win_types.get)
    total_blade_wins = sum(win_types.values())
    best_pct = win_types[best_type] / total_blade_wins * 100 if total_blade_wins > 0 else 0
    output.append(f"  {blade}: {best_type} ({win_types[best_type]}/{total_blade_wins} = {best_pct:.0f}%) | SF={bd['sf']} KO={bd['ko']} BF={bd['bf']} XF={bd['xf']}")

# ====== STRUCTURED JSON DATA ======
output.append("\n\n" + "=" * 80)
output.append("STRUCTURED DATA (JSON) - for combo recommendation validation")
output.append("=" * 80)

# Create compact structured data
structured = {
    "metadata": {
        "total_combos_tested": len(active),
        "total_blades": len(set(c['blade'] for c in active)),
        "sources": sorted(set(c['source'] for c in active))
    },
    "blade_rankings": [],
    "top_combos_by_style": {
        "agresiva": [],
        "estacionaria": [],
        "semiagresiva": []
    }
}

for blade, bd in sorted_blades[:30]:
    if bd['total_w'] == 0:
        continue
    total = bd['total_w'] + bd['total_l']
    structured["blade_rankings"].append({
        "blade": blade,
        "weight": '/'.join(sorted(bd['weights'])) + 'g' if bd['weights'] else None,
        "total_wins": bd['total_w'],
        "total_losses": bd['total_l'],
        "win_rate": round(bd['total_w']/total*100, 1) if total > 0 else 0,
        "best_style": 'Agresiva' if bd['agr_w'] >= bd['est_w'] and bd['agr_w'] >= bd['semi_w'] else ('Estacionaria' if bd['est_w'] >= bd['semi_w'] else 'Semiagresiva'),
        "dominant_win_type": max({'SF': bd['sf'], 'KO': bd['ko'], 'BF': bd['bf'], 'XF': bd['xf']}, key=lambda k: {'SF': bd['sf'], 'KO': bd['ko'], 'BF': bd['bf'], 'XF': bd['xf']}[k]),
        "best_combos": []
    })

    # Add best combos for this blade
    blade_combos = sorted([c for c in active if c['blade'] == blade and c['style'] in ('Agresiva','Estacionaria','Semiagresiva')],
                         key=lambda c: (c['wins'], c['win_pts']), reverse=True)
    for bc in blade_combos[:3]:
        structured["blade_rankings"][-1]["best_combos"].append({
            "ratchet": bc['ratchet'],
            "style": bc['style'],
            "record": f"{bc['wins']}W-{bc['losses']}L",
            "win_pts": bc['win_pts']
        })

for style_key, style_name in [("agresiva","Agresiva"),("estacionaria","Estacionaria"),("semiagresiva","Semiagresiva")]:
    style_combos = sorted([c for c in active if c['style'] == style_name], key=lambda c: (c['wins'], c['win_pts']), reverse=True)
    for sc in style_combos[:10]:
        structured["top_combos_by_style"][style_key].append({
            "blade": sc['blade'],
            "ratchet": sc['ratchet'],
            "wins": sc['wins'],
            "losses": sc['losses'],
            "win_rate": round(sc['wins']/sc['total_matches']*100, 1) if sc['total_matches'] > 0 else 0,
            "win_types": {"SF": sc['win_sf'], "KO": sc['win_ko'], "BF": sc['win_bf'], "XF": sc['win_xf']},
            "source": sc['source']
        })

output.append(json.dumps(structured, indent=2, ensure_ascii=False))

# Write output
result = '\n'.join(output)
with open("C:/Users/ariel/Desktop/go/copa-omega/battle_analysis.txt", 'w', encoding='utf-8') as f:
    f.write(result)

print(result[:200])
print(f"\n\n... Full output saved to battle_analysis.txt ({len(result)} chars)")
