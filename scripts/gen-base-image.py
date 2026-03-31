import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def get_png_dimensions(path):
    with open(path, 'rb') as f:
        f.read(16)
        w = struct.unpack('>I', f.read(4))[0]
        h = struct.unpack('>I', f.read(4))[0]
    return w, h

# Same inputs as the v3 that user liked
ref_flyer = read_b64('public/posts/la-mision-ninja.png')
reiyu_img = read_b64('tmp_reiyu_anidb.png')
ghost_circle = read_b64('tmp_ghost_circle_full.webp')
logo_bladers = read_b64('public/bladers-logo.png')

# Same prompt as gen-flyer-v2.py
prompt = """I'm giving you 4 images:
1. A REFERENCE FLYER (La Mision Ninja) - copy this EXACT layout structure, typography hierarchy, and design pattern
2. The CHARACTER Reiyu Kuwabara - use this exact character in the new flyer
3. The BEYBLADE Ghost Circle - use this exact beyblade in the new flyer
4. The BLADERS SANTA FE LOGO - use this exact logo at the bottom, DO NOT modify it

Create a NEW tournament flyer following the EXACT same layout as image 1 but with:
- Character from image 2 (Reiyu Kuwabara) placed in the upper portion like the ninja characters in the reference
- Beyblade from image 3 (Ghost Circle) visible in the composition like the reference shows beyblades
- Logo from image 4 at the bottom exactly as-is
- Tournament name badge/shield in the center saying: LA MALDICION DEL FANTASMA
- Color palette based on the CHARACTER and BEYBLADE colors: magenta/pink, silver, light blue (NOT dark/black - use VIBRANT colors like the reference flyer)
- Background gradient should be vibrant and energetic like the reference (orange gradient), but using pink/magenta tones to match Ghost Circle

KEEP THIS EXACT TEXT HIERARCHY (same font sizes as reference):
- "LA MALDICION DEL FANTASMA" in the shield/badge (large, bold)
- "INSCRIPCIONES ABIERTAS!" (large bold text below badge)
- "SAB-28  |  BLADERS.SFE" (medium bold, with vertical separator)
- "MARZO  |  PARQUE FEDERAL" (smaller, below the above)
- "Hora de comienzo: 16:00h" (small, colored accent)
- "PARTICIPA POR UN BEYBLADE" (button with trophy emoji)
- Bladers Santa Fe logo (image 4) at very bottom

Format: vertical Instagram post (4:5 ratio).
IMPORTANT: Keep the vibrant, energetic, competitive style. NOT dark or gloomy."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': ref_flyer}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu_img}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost_circle}},
        {'inlineData': {'mimeType': 'image/png', 'data': logo_bladers}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating base image...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

parts_out = result.get('candidates', [{}])[0].get('content', {}).get('parts', [])
for p in parts_out:
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        # Find next available version number
        ver = 1
        while os.path.exists(f'tmp_flyer_base_v{ver}.png'):
            ver += 1
        outpath = f'tmp_flyer_base_v{ver}.png'
        with open(outpath, 'wb') as f:
            f.write(img)
        w, h = get_png_dimensions(outpath)
        print(f'Saved: {outpath} ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:200])
