import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

ref_flyer = read_b64('public/posts/la-mision-ninja.png')
reiyu_img = read_b64('tmp_reiyu_anidb.png')
ghost_circle = read_b64('tmp_ghost_circle_full.webp')
bladers_logo = read_b64('public/bladers-logo.png')

prompt = """I'm giving you 4 images:
1. REFERENCE FLYER layout
2. CHARACTER: Reiyu Kuwabara
3. BEYBLADE: Ghost Circle
4. BLADERS SANTA FE LOGO

Create a flyer with the SAME layout as image 1 BUT:
- DO NOT include any tournament logo/badge/shield in the center. Leave that area as just the background gradient transition. I will add the logo myself later.
- Character (image 2) in upper portion
- Ghost Circle beyblade (image 3) visible
- Bladers Santa Fe logo (image 4) at bottom
- Magenta/pink vibrant color palette
- Diagonal gradient cut from image area to info area

TEXT:
- "INSCRIPCIONES ABIERTAS!" (large bold white)
- "SAB-28  |  BLADERS.SFE" (medium bold)
- "MARZO       PARQUE FEDERAL" (with pin icon)
- "Hora de comienzo: 16:00h" (small accent)
- "PARTICIPA POR UN BEYBLADE" (button)

IMPORTANT: NO tournament badge/logo/shield in the center. Just the character, background, gradient cut, and info text. Leave clean space in the center where the gradient transitions for me to place a logo later."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': ref_flyer}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu_img}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost_circle}},
        {'inlineData': {'mimeType': 'image/png', 'data': bladers_logo}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating base without logo...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

parts_out = result.get('candidates', [{}])[0].get('content', {}).get('parts', [])
for p in parts_out:
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        outpath = 'tmp_flyer_base_nologo.png'
        with open(outpath, 'wb') as f:
            f.write(img)
        with open(outpath, 'rb') as f:
            f.read(16)
            w = struct.unpack('>I', f.read(4))[0]
            h = struct.unpack('>I', f.read(4))[0]
        print(f'Saved: {outpath} ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:200])
