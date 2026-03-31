import json, base64, sys, io, urllib.request, struct

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

reiyu = read_b64('tmp_reiyu_anidb.png')
ghost_circle = read_b64('tmp_ghost_circle_full.webp')

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost_circle}},
        {'text': """Generate ONLY a background illustration with the character. NO TEXT, NO LOGOS, NO BADGES.

Image 1: Reiyu Kuwabara character - place her prominently in the center
Image 2: Ghost Circle beyblade - place it visible near the character

Create a vibrant magenta/pink themed anime background scene with:
- Reiyu Kuwabara (image 1) as the main character, prominent, center-ish
- Ghost Circle beyblade (image 2) visible in the scene
- Background: energetic spectral/ghostly energy effects in magenta/pink/hot pink tones
- Dynamic anime action pose feel
- Vibrant, bright, NOT dark

CRITICAL RULES:
- DO NOT add ANY text whatsoever
- DO NOT add any logo, badge, shield, or emblem
- DO NOT add any event information
- ONLY the character, beyblade, and animated background
- This is JUST the background art layer - text and logos will be added separately later

Square format."""}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating background art only (no text/logos)...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

for p in result.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        with open('tmp_element_background.png', 'wb') as f:
            f.write(img)
        with open('tmp_element_background.png', 'rb') as f:
            f.read(16)
            w = struct.unpack('>I', f.read(4))[0]
            h = struct.unpack('>I', f.read(4))[0]
        print(f'Background saved: {w}x{h}, {len(img)} bytes')
    elif 'text' in p:
        print('text:', p['text'][:100])
