import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

# Same inputs as v2/v3 that produced the good result
ref_flyer = read_b64('public/posts/la-mision-ninja.png')
reiyu_img = read_b64('tmp_reiyu_anidb.png')
ghost_circle = read_b64('tmp_ghost_circle_full.webp')
logo_bladers = read_b64('public/bladers-logo.png')
# Add the ghost logo as reference so Gemini knows what it looks like
ghost_logo = read_b64('tmp_fantasma_logo_v2.png')

prompt = """I'm giving you 5 images:
1. REFERENCE FLYER (La Mision Ninja) - copy this EXACT layout, gradient style, typography hierarchy
2. CHARACTER: Reiyu Kuwabara - use in upper portion
3. BEYBLADE: Ghost Circle - show in the composition
4. BLADERS SANTA FE LOGO - use at bottom exactly as-is
5. TOURNAMENT LOGO: "La Maldicion del Fantasma" ghost skull emblem - USE THIS EXACT LOGO in the center badge position. DO NOT create a different logo. DO NOT use a ninja logo.

CREATE A FLYER following image 1's layout EXACTLY but with these specific changes:

UPPER PORTION (character area):
- Reiyu Kuwabara (image 2) prominently placed like the characters in reference
- Ghost Circle beyblade (image 3) visible
- Behind the character, show the Ghost beast face (the skull/ghost from the beyblade's center) LARGE as background element, similar to how the reference has a stadium behind the characters

GRADIENT TRANSITION (from image area to info area):
- Start with warm naranja (#ec790f) at the top of the gradient
- Transition GRADUALLY to magenta/rosa (#8B1A5C) at the bottom
- Not abrupt - smooth warm-to-magenta flow
- Same diagonal cut angle as reference

CENTER BADGE:
- Use image 5 (the ghost skull shield logo) EXACTLY as provided
- Position it overlapping the gradient transition like the ninja badge does in reference

LOWER INFO AREA:
- Background: magenta/rosa deep tones (instead of teal)
- Add subtle HALFTONE DOT PATTERN texture (small dots at low opacity for depth)

TEXT (Normatica Bold font style, all white, with subtle drop shadow):
- "INSCRIPCIONES ABIERTAS!" - 72px bold, two lines
- "SAB-28" left side | vertical white line separator | "BLADERS.SFE" right side - 63px bold
- "MARZO" below SAB-28 | "PARQUE FEDERAL" with pin icon below BLADERS.SFE - smaller
- "Hora de comienzo: 16:00h" - 40px, rosa/pink accent color
- "PARTICIPA POR UN BEYBLADE" - in gradient button (magenta to rosa, rounded corners, 65% opacity)
- Bladers Santa Fe logo (image 4) at very bottom, centered, ~260px wide

FORMAT: 1080x1440 pixels (3:4 ratio). This is critical - NOT square, NOT 4:5.
STYLE: Vibrant, energetic, competitive. Keep the warm-to-magenta palette vibrant, NOT dark or gloomy."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': ref_flyer}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu_img}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost_circle}},
        {'inlineData': {'mimeType': 'image/png', 'data': logo_bladers}},
        {'inlineData': {'mimeType': 'image/png', 'data': ghost_logo}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating v3 mejorada...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

for p in result.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        # Version numbering
        ver = 1
        while os.path.exists(f'public/posts/fantasma-elementos/flyer_v3_mejorada_{ver}.png'):
            ver += 1
        outpath = f'public/posts/fantasma-elementos/flyer_v3_mejorada_{ver}.png'
        with open(outpath, 'wb') as f:
            f.write(img)
        with open(outpath, 'rb') as f:
            f.read(16)
            w = struct.unpack('>I', f.read(4))[0]
            h = struct.unpack('>I', f.read(4))[0]
        print(f'Saved: {outpath} ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:200])
