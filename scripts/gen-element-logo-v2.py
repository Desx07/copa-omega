import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

caballero = read_b64('C:/Users/ariel/Downloads/la_orden_del_caballero_logo_transparent_8192.png')
mision_ninja = read_b64('public/posts/la-mision-ninja.png')

prompt = """Image 1: "La Orden del Caballero" logo - a CLEAN, SIMPLE sports team emblem. Dark shield, character silhouette, subtle colored accents, small text above and large text below. It's NOT dramatic or scary - it's a clean professional emblem.

Image 2: A flyer showing "La Mision Ninja" logo - another clean tournament emblem with a ninja character in a shield badge.

Create a tournament logo for "LA MALDICION DEL FANTASMA" in the SAME clean, simple style:

- Simple dark shield shape
- A stylized ghost/phantom silhouette inside (NOT a scary skull with flames - just a clean ghost silhouette, like how La Orden has a clean cowboy silhouette)
- Subtle magenta/pink accent swirls (like the blue/gold accents in La Orden)
- Text: "LA MALDICION DEL" small above, "FANTASMA" large bold below
- Small decorative lines flanking the text
- CLEAN, SIMPLE, PROFESSIONAL - like a sports team badge
- NOT horror movie style, NOT dramatic flames, NOT scary
- Transparent background

Think of it as a community tournament badge, not a horror movie poster."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': caballero}},
        {'inlineData': {'mimeType': 'image/png', 'data': mision_ninja}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating clean simple logo...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

for p in result.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        ver = 1
        while os.path.exists(f'public/posts/fantasma-elementos/element_logo_v{ver}.png'):
            ver += 1
        outpath = f'public/posts/fantasma-elementos/element_logo_v{ver}.png'
        with open(outpath, 'wb') as f:
            f.write(img)
        with open(outpath, 'rb') as f:
            f.read(16)
            w = struct.unpack('>I', f.read(4))[0]
            h = struct.unpack('>I', f.read(4))[0]
        print(f'Logo saved: {outpath} ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:200])
