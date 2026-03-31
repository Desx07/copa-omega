import json, base64, sys, io, urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

ref_flyer = read_b64('public/posts/la-mision-ninja.png')
reiyu = read_b64('tmp_reiyu_anidb.png')
fantasma_logo = read_b64('tmp_fantasma_logo_v2.png')
bladers_logo = read_b64('public/bladers-logo.png')

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': ref_flyer}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
        {'inlineData': {'mimeType': 'image/png', 'data': fantasma_logo}},
        {'inlineData': {'mimeType': 'image/png', 'data': bladers_logo}},
        {'text': """4 images:
1. REFERENCE FLYER layout (La Mision Ninja) - follow this layout
2. CHARACTER: Reiyu Kuwabara - place prominently in upper portion
3. TOURNAMENT LOGO: "La Maldicion del Fantasma" ghost emblem - USE THIS EXACT LOGO in the center. DO NOT create a new logo. DO NOT copy the ninja logo from image 1. Use image 3 AS-IS.
4. BLADERS SANTA FE LOGO - use at bottom exactly as-is

Create a flyer with the SAME layout as image 1 but:
- Reiyu (image 2) as the character instead of ninja characters
- Image 3 EXACT LOGO in the center badge position (the ghost skull shield with magenta/silver colors). THIS IS THE MOST IMPORTANT INSTRUCTION: use image 3 exactly, do not redraw it, do not use the ninja logo
- Image 4 exact logo at bottom
- Background behind Reiyu: ghostly/spectral pink/magenta energy effects
- Gradient cut: magenta/pink diagonal transition (instead of orange)
- Lower area: dark teal/purple gradient for info section
- Halftone dot pattern texture on image area

TEXT (Spanish, correct spelling):
- "INSCRIPCIONES ABIERTAS!" (large bold white)
- "SAB-28  |  BLADERS.SFE" (medium bold, vertical separator)
- "MARZO       PARQUE FEDERAL" (smaller, pin icon)
- "Hora de comienzo: 16:00h" (small pink accent)
- "PARTICIPA POR UN BEYBLADE" (gradient button, trophy)

4:5 ratio vertical. Vibrant, energetic, NOT dark."""}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating with correct ghost logo...')
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
        elif 'text' in p:
            print('text:', p['text'][:200])
