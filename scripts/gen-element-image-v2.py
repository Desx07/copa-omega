import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

reiyu = read_b64('tmp_reiyu_anidb.png')
ghost = read_b64('tmp_ghost_circle_blade.webp')

prompt = """2 images:
1. Reiyu Kuwabara from Beyblade X anime - use this EXACT character
2. Ghost Circle beyblade - use the ghost/skull face from the center as a large spectral presence

Create an illustration with ONLY these two elements:
- Reiyu Kuwabara (image 1) front and center, dynamic pose
- The GHOST BEAST face (from image 2 center chip) appearing LARGE behind her as a spectral guardian
- Warm vibrant background - oranges, pinks, energy effects
- Anime style, high energy

ONLY Reiyu and the ghost beast. NO other characters. NO random people. NO invented characters. Just Reiyu and the ghost. NO text, NO logos.

Square format."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating Reiyu + Ghost beast only...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

for p in result.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        ver = 1
        while os.path.exists(f'public/posts/fantasma-elementos/element_image_v{ver}.png'):
            ver += 1
        outpath = f'public/posts/fantasma-elementos/element_image_v{ver}.png'
        with open(outpath, 'wb') as f:
            f.write(img)
        with open(outpath, 'rb') as f:
            f.read(16)
            w = struct.unpack('>I', f.read(4))[0]
            h = struct.unpack('>I', f.read(4))[0]
        print(f'Saved: {outpath} ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:200])
