import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

# References
dominio = read_b64('C:/Users/ariel/Downloads/03-12 POST TORNEO 7.png')
reiyu = read_b64('tmp_reiyu_anidb.png')
ghost = read_b64('tmp_ghost_circle_blade.webp')

prompt = """I'm showing you 3 images:
1. REFERENCE - "Dominio Salvaje" flyer. Look at the UPPER HALF ONLY - see how it's filled edge-to-edge with multiple anime characters in dynamic poses, vibrant colors, action feel. This is the visual density and energy level I want.
2. CHARACTER - Reiyu Kuwabara from Beyblade X anime. She must be the MAIN character, prominently in the center.
3. GHOST CIRCLE beyblade - the ghost/skull face in the center chip is the "beast" that should appear LARGE behind Reiyu as a spectral presence.

Create ONLY the upper illustration portion - NO TEXT, NO LOGOS, NO EVENT INFO, NO BADGES.

Requirements:
- Reiyu Kuwabara (image 2) front and center, dynamic anime pose
- The GHOST BEAST (skull/ghost face from image 3) appearing LARGE behind her, spectral and menacing, like a spirit guardian
- Other Beyblade X characters or action elements filling the edges (like Dominio Salvaje does with its character collage)
- Warm vibrant colors - oranges, pinks, magentas, but WARM not dark
- Anime action style, high energy
- Edge-to-edge composition, no empty corners

DO NOT include:
- Any text
- Any logo or badge
- Any event information
- Any borders or frames

Just pure character illustration art. Square format."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': dominio}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating main illustration element...')
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
        print(f'Image saved: {outpath} ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:200])
