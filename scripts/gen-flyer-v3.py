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

# === STEP 1: Generate thematic tournament logo/badge ===
print('=== STEP 1: Generating tournament logo badge ===')

ninja_logo_ref = read_b64('public/posts/la-mision-ninja.png')
ghost_avatar = read_b64('tmp_ghost_circle_blade.webp')

logo_parts = [
    {'inlineData': {'mimeType': 'image/png', 'data': ninja_logo_ref}},
    {'inlineData': {'mimeType': 'image/webp', 'data': ghost_avatar}},
    {'text': """Look at image 1 - see the tournament logo/badge in the center of the flyer. It's a shield-shaped badge with "LA MISION NINJA" text and a ninja character with katanas. This is the style reference.

Image 2 shows a Ghost Circle beyblade with a ghost/skull face in the center - this is the ghost beast avatar.

Now create a NEW tournament logo/badge in the SAME style as the ninja badge but themed for "LA MALDICION DEL FANTASMA" (The Ghost's Curse):
- Same shield/badge shape and proportions as the ninja one
- Replace the ninja with a ghostly/spectral ghost creature based on image 2's ghost face
- Text says "LA MALDICION DEL FANTASMA" in the same bold style
- Color scheme: magenta/pink and silver (matching Ghost Circle's colors) instead of the ninja's green/purple
- The ghost should look menacing but stylized like an esports logo
- Transparent or simple background so it can be placed on any flyer
- High quality, crisp edges, professional esports badge design

Output ONLY the badge/logo, nothing else. PNG with transparent background ideally."""}
]

logo_img = call_gemini(logo_parts)
if logo_img:
    with open('tmp_fantasma_logo.png', 'wb') as f:
        f.write(logo_img)
    print(f'Logo generated! ({len(logo_img)} bytes)')
else:
    print('Failed to generate logo')
    sys.exit(1)

# === STEP 2: Generate full flyer ===
print('=== STEP 2: Generating full flyer ===')

ref_flyer = read_b64('public/posts/la-mision-ninja.png')
reiyu = read_b64('tmp_reiyu_anidb.png')
fantasma_logo = read_b64('tmp_fantasma_logo.png')
bladers_logo = read_b64('public/bladers-logo.png')

flyer_parts = [
    {'inlineData': {'mimeType': 'image/png', 'data': ref_flyer}},
    {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
    {'inlineData': {'mimeType': 'image/png', 'data': fantasma_logo}},
    {'inlineData': {'mimeType': 'image/png', 'data': bladers_logo}},
    {'text': """Create a tournament flyer following the EXACT layout of image 1 (reference flyer). Here's what each image is:

1. REFERENCE FLYER - Copy this EXACT layout, gradient cuts, typography hierarchy
2. CHARACTER - Reiyu Kuwabara, place her as the main character in the upper portion
3. TOURNAMENT LOGO - "La Maldicion del Fantasma" badge, place in center exactly like the ninja badge in the reference
4. BLADERS SANTA FE LOGO - Place at the very bottom, use exactly as-is, DO NOT modify

CRITICAL LAYOUT RULES (copy from reference exactly):
- Upper 50%: Character (image 2) as main visual with anime-style background scenes
- DIAGONAL GRADIENT CUT separating upper image area from lower info area (this is key to the style!)
- Tournament badge/logo (image 3) positioned at the center, overlapping the gradient cut
- Lower 50%: Solid color background with event information

COLOR PALETTE: Use pink/magenta tones (matching Ghost Circle beyblade) instead of the orange/teal of the reference. So:
- Gradient cut: magenta/pink tones (instead of orange)
- Lower background: deep purple or dark magenta gradient (instead of teal)
- Text: white, with pink accents for "Hora de comienzo"
- Button: magenta/pink gradient (instead of red-orange)

TEXT (same hierarchy and sizes as reference):
- "INSCRIPCIONES ABIERTAS!" (large bold, white)
- "SAB-28  |  BLADERS.SFE" (medium bold, white, vertical line separator)
- "MARZO  |  PARQUE FEDERAL" (smaller, below, with location pin icon)
- "Hora de comienzo: 16:00h" (small, pink/magenta accent color)
- "PARTICIPA POR UN BEYBLADE" (in a rounded button, white text)
- Bladers Santa Fe logo (image 4) at very bottom

FORMAT: 1080x1920 pixels (Instagram STORY - vertical, taller than reference!)
Make it vibrant, energetic, competitive. NOT dark or gloomy."""}
]

flyer_img = call_gemini(flyer_parts)
if flyer_img:
    with open('public/posts/la-maldicion-del-fantasma.png', 'wb') as f:
        f.write(flyer_img)
    print(f'FLYER GENERATED! ({len(flyer_img)} bytes)')
else:
    print('Failed to generate flyer')
