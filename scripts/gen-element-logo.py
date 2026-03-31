import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

# Reference: La Orden del Caballero logo (the GOOD one)
caballero = read_b64('C:/Users/ariel/Downloads/la_orden_del_caballero_logo_transparent_8192.png')

prompt = """Image 1 shows "La Orden del Caballero" - a tournament logo/emblem for a Beyblade community. Study its style: it's a dark shield with a mysterious cowboy/knight character, blue and gold swirl accents, clean professional sports team emblem design. The text "LA ORDEN DEL" is small above and "CABALLERO" is large bold below, with decorative lines flanking the text.

Now create a NEW tournament logo in this EXACT SAME STYLE for "LA MALDICION DEL FANTASMA" (The Ghost's Curse):

- Same dark shield shape as the reference
- Instead of the cowboy, use a menacing GHOST/PHANTOM face (spectral, ethereal, with flowing ghostly wisps)
- Colors: magenta/pink and silver accents (instead of blue/gold) to match the Ghost Circle beyblade
- Text layout identical to reference: "LA MALDICION DEL" small above, "FANTASMA" large bold below
- Same decorative line elements flanking the text
- Professional sports team emblem quality - NOT cartoonish, NOT video-game style
- TRANSPARENT BACKGROUND - no white, no colored background, just the emblem floating

OUTPUT: Only the logo emblem on a fully transparent background. Nothing else."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': caballero}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating tournament logo element...')
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
