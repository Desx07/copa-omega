import json, base64, sys, io, urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

ref_mision = read_b64('public/posts/la-mision-ninja.png')
reiyu = read_b64('tmp_reiyu_anidb.png')
fantasma_logo = read_b64('tmp_fantasma_logo_v2.png')
bladers_logo = read_b64('public/bladers-logo.png')
ref_caballero = read_b64('C:/Users/ariel/Downloads/ORDEN DEL CABALLERO/03-12 POST TORNEO 01 (1).png')

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': ref_mision}},
        {'inlineData': {'mimeType': 'image/png', 'data': ref_caballero}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
        {'inlineData': {'mimeType': 'image/png', 'data': fantasma_logo}},
        {'inlineData': {'mimeType': 'image/png', 'data': bladers_logo}},
        {'text': """Create a tournament announcement flyer. EXACT dimensions: 1080 pixels wide x 1350 pixels tall (4:5 ratio, Instagram feed post).

5 images provided:
1. REFERENCE A - La Mision Ninja flyer (copy this layout EXACTLY)
2. REFERENCE B - La Orden del Caballero post (shows halftone dot pattern overlay style)
3. Reiyu Kuwabara character - place in upper area like ref A places characters
4. La Maldicion del Fantasma tournament logo - place in center like ref A
5. Bladers Santa Fe logo - place at bottom EXACTLY as-is

COPY THE LAYOUT OF REFERENCE A EXACTLY:
- Upper half: character art with anime background + halftone dot texture overlay (like ref B)
- Diagonal gradient cut from image area to info area
- Tournament logo badge overlapping the cut in the center
- Lower half: event info on solid gradient background

COLORS: Vibrant magenta/pink gradient cuts (instead of orange). Lower area: teal-to-dark gradient like ref A.

TEXT - SPELL CORRECTLY, SPANISH:
- "INSCRIPCIONES ABIERTAS!" (large bold white)
- "SAB-28  |  BLADERS.SFE" (medium bold)
- "MARZO       PARQUE FEDERAL" (with pin icon)
- "Hora de comienzo: 16:00h" (small accent)
- "PARTICIPA POR UN BEYBLADE" (button)
- Bladers Santa Fe real logo at bottom

CRITICAL: Image must be EXACTLY 1080x1350 pixels. 4:5 vertical ratio. This is non-negotiable."""}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating 1080x1350 flyer...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
else:
    parts = result.get('candidates', [{}])[0].get('content', {}).get('parts', [])
    for p in parts:
        if 'inlineData' in p:
            img = base64.b64decode(p['inlineData']['data'])
            with open('public/posts/la-maldicion-del-fantasma.png', 'wb') as f:
                f.write(img)
            print(f'DONE! ({len(img)} bytes)')
            # Check dimensions
            import struct
            with open('public/posts/la-maldicion-del-fantasma.png', 'rb') as f:
                f.read(16)
                w = struct.unpack('>I', f.read(4))[0]
                h = struct.unpack('>I', f.read(4))[0]
            print(f'Dimensions: {w}x{h}')
        elif 'text' in p:
            print('text:', p['text'][:200])
