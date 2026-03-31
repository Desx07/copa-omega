import json, base64, sys, io, urllib.request, struct

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

reiyu = read_b64('tmp_reiyu_anidb.png')
ghost_blade = read_b64('tmp_ghost_circle_blade.webp')
ref = read_b64('public/posts/fantasma-elementos/VERSION_QUE_GUSTO_screenshot.png')

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': ref}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost_blade}},
        {'text': """Image 1 is a REFERENCE flyer - see how it has a STADIUM as the large background behind the character. I want the same layout but instead of a stadium, use the GHOST FACE from image 3 as the large background element.

Image 2: Reiyu Kuwabara character - place prominently
Image 3: Ghost Circle beyblade - the ghost/skull face in the center is what I want LARGE as the background, like the stadium is in image 1

Create ONLY the background art - NO TEXT, NO LOGOS, NO BADGES, NO EVENT INFO.

Requirements:
- Reiyu Kuwabara (image 2) prominent in center/foreground
- The GHOST FACE/SKULL from image 3's center chip displayed LARGE behind her as the background element (like the stadium is in image 1)
- Vibrant magenta/pink energy effects
- Dynamic anime feel
- The ghost face should be big, atmospheric, looming behind the character
- NO text of any kind
- NO logos or badges
- ONLY character art + ghost background

Square format."""}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating background with ghost face behind Reiyu...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

for p in result.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        with open('public/posts/fantasma-elementos/fondo_ghost_face.png', 'wb') as f:
            f.write(img)
        with open('public/posts/fantasma-elementos/fondo_ghost_face.png', 'rb') as f:
            f.read(16)
            w = struct.unpack('>I', f.read(4))[0]
            h = struct.unpack('>I', f.read(4))[0]
        print(f'Saved: fondo_ghost_face.png ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:100])
