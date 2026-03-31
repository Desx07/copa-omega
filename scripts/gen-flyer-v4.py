import json, base64, sys, io, urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def call_gemini(parts):
    payload = {
        'contents': [{'parts': parts}],
        'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
    }
    data = json.dumps(payload).encode('utf-8')
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req, timeout=300)
    result = json.loads(resp.read().decode('utf-8'))
    if 'error' in result:
        print('ERROR:', result['error']['message'][:500])
        return None
    parts_out = result.get('candidates', [{}])[0].get('content', {}).get('parts', [])
    for p in parts_out:
        if 'inlineData' in p:
            return base64.b64decode(p['inlineData']['data'])
        elif 'text' in p:
            print('text:', p['text'][:200])
    return None

# === STEP 1: Generate thematic logo ===
print('=== STEP 1: Generating tournament logo ===')

ninja_ref = read_b64('public/posts/la-mision-ninja.png')
caballero_logo = read_b64('C:/Users/ariel/Downloads/la_orden_del_caballero_logo_transparent_8192.png')
ghost_blade = read_b64('tmp_ghost_circle_blade.webp')

logo_parts = [
    {'inlineData': {'mimeType': 'image/png', 'data': caballero_logo}},
    {'inlineData': {'mimeType': 'image/webp', 'data': ghost_blade}},
    {'text': """Image 1 shows "La Orden del Caballero" tournament logo - a knight/cowboy character in a dark shield with blue and gold accents. This is the STYLE reference for how tournament logos should look - like a sports team emblem, NOT a video game logo.

Image 2 shows the Ghost Circle beyblade with a ghost/skull face in the center chip.

Create a NEW tournament logo/emblem in the SAME style as image 1 (sports team emblem style) but themed for "LA MALDICION DEL FANTASMA":
- Shield/emblem shape similar to image 1
- Feature the ghost creature from image 2's center chip (the white ghost/skull face with flames)
- Text: "LA MALDICION DEL" in smaller text above, "FANTASMA" in large bold text below
- Color scheme: magenta/pink and silver (matching Ghost Circle's pink/silver colors)
- Style: sports team emblem, professional, clean. NOT video-gamey or cartoonish
- Small decorative lines flanking the text like image 1 has
- Transparent background
- High resolution, clean edges"""}
]

logo_img = call_gemini(logo_parts)
if logo_img:
    with open('tmp_fantasma_logo_v2.png', 'wb') as f:
        f.write(logo_img)
    print(f'Logo generated! ({len(logo_img)} bytes)')
else:
    print('Failed to generate logo')
    sys.exit(1)

# === STEP 2: Generate full flyer ===
print('=== STEP 2: Generating full flyer (1080x1440 post format) ===')

ref_mision = read_b64('public/posts/la-mision-ninja.png')
ref_caballero = read_b64('C:/Users/ariel/Downloads/ORDEN DEL CABALLERO/03-12 POST TORNEO 01 (1).png')
reiyu = read_b64('tmp_reiyu_anidb.png')
fantasma_logo = read_b64('tmp_fantasma_logo_v2.png')
bladers_logo = read_b64('public/bladers-logo.png')

flyer_parts = [
    {'inlineData': {'mimeType': 'image/png', 'data': ref_mision}},
    {'inlineData': {'mimeType': 'image/png', 'data': ref_caballero}},
    {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
    {'inlineData': {'mimeType': 'image/png', 'data': fantasma_logo}},
    {'inlineData': {'mimeType': 'image/png', 'data': bladers_logo}},
    {'text': """Create a tournament flyer for Instagram feed post (1080x1440 pixels).

I'm giving you 5 images:
1. REFERENCE FLYER A (La Mision Ninja) - layout reference for tournament announcement posts
2. REFERENCE FLYER B (La Orden del Caballero results) - shows the halftone DOT PATTERN overlay on photos, the cyan color framing, and the bridge silhouette in background. NOTE the DOTS/HALFTONE texture over the image area - this is critical!
3. CHARACTER - Reiyu Kuwabara from Beyblade X anime. Place her prominently in the upper portion
4. TOURNAMENT LOGO - "La Maldicion del Fantasma" badge. Place in center area
5. BLADERS SANTA FE LOGO - Use at bottom, exactly as-is, DO NOT redraw or modify

DESIGN RULES:
- FORMAT: 1080x1440 pixels (Instagram feed POST, NOT story)
- Upper portion: Reiyu Kuwabara character (image 3) with a ghostly/spectral themed background. NOT a stadium - use ghost/spectral energy effects, fog, maybe supernatural elements
- ADD HALFTONE DOT PATTERN texture overlay on the image area (like reference B shows). This gives the image depth and prevents flat colors
- DIAGONAL GRADIENT CUT separating image area from info area (like reference A). The cut should be vibrant magenta/pink tones
- Tournament logo (image 4) positioned at center, overlapping the gradient cut
- Lower info area with solid gradient background
- COLOR PALETTE: Use the same warm, vibrant approach as reference A but with magenta/pink/silver tones (matching Ghost Circle beyblade colors). The gradients should be VIBRANT - think pink-magenta for the cuts and a complementary warm tone for the info background. NOT dark or gloomy. Look at how reference A uses orange-to-teal - do the same energy but with pink-to-purple or pink-to-teal
- Bladers Santa Fe logo (image 5) at the bottom, exactly as provided

TEXT HIERARCHY (Normatica Bold font style - thick, impactful):
- "INSCRIPCIONES ABIERTAS!" (large bold white text)
- "SAB-28  |  BLADERS.SFE" (medium bold, with vertical line separator)
- "MARZO       PARQUE FEDERAL" (smaller text below, with location pin icon)
- "Hora de comienzo: 16:00h" (small, colored accent - magenta/pink)
- "PARTICIPA POR UN BEYBLADE" (in rounded gradient button, with trophy emoji)

IMPORTANT: Make it look like a professional esports tournament poster. Vibrant, energetic, competitive. The halftone dot pattern and gradient cuts are essential to the Bladers SFE visual identity."""}
]

flyer_img = call_gemini(flyer_parts)
if flyer_img:
    with open('public/posts/la-maldicion-del-fantasma.png', 'wb') as f:
        f.write(flyer_img)
    print(f'FLYER GENERATED! ({len(flyer_img)} bytes)')
else:
    print('Failed to generate flyer')
