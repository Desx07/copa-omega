import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

# Dominio Salvaje as PRIMARY reference (not La Mision Ninja)
dominio = read_b64('C:/Users/ariel/Downloads/03-12 POST TORNEO 7.png')
# Also La Mision Ninja as secondary
mision = read_b64('public/posts/la-mision-ninja.png')
# Character
reiyu = read_b64('tmp_reiyu_anidb.png')
# Ghost logo
ghost_logo = read_b64('tmp_fantasma_logo_v2.png')
# Bladers logo
bladers = read_b64('public/bladers-logo.png')

prompt = """5 images provided:
1. DOMINIO SALVAJE flyer - THIS IS THE PRIMARY REFERENCE. Copy this EXACT visual style, warmth, color tone, layout, gradient feel, text hierarchy. This is how Bladers Santa Fe flyers MUST look.
2. LA MISION NINJA flyer - secondary reference, same brand but different tournament
3. REIYU KUWABARA character - use as main character
4. TOURNAMENT LOGO "La Maldicion del Fantasma" - use this ghost skull emblem in the center
5. BLADERS SANTA FE logo - use at the bottom exactly

STUDY IMAGE 1 (DOMINIO SALVAJE) CAREFULLY:
- Upper half: FILLED with multiple anime character art, edge to edge, vibrant and dynamic
- Tournament logo: integrated into the center, overlapping image and info area
- Gradient: WARM - the image fades into a golden/warm background below
- Lower area: WARM golden/orange background, NOT dark. Subtle halftone dot texture
- Text: white, bold, clean hierarchy with drop shadows
- Logo Bladers SF: bottom center with companion logo
- Overall: WARM, VIBRANT, ENERGETIC. Golden and orange tones

NOW CREATE a flyer for "LA MALDICION DEL FANTASMA" following EXACTLY the Dominio Salvaje style but:
- Use Reiyu Kuwabara (image 3) as the main character in the upper portion, with Ghost Circle beyblade and the ghost beast face visible in the background
- Put the ghost skull tournament logo (image 4) in the center, same position as Dominio Salvaje's logo
- The warm golden tones from Dominio Salvaje should shift SLIGHTLY toward pink/magenta warmth (think warm rose gold, NOT dark magenta/purple). Keep it WARM and BRIGHT
- Same text hierarchy as references:
  "INSCRIPCIONES ABIERTAS!" (large bold white)
  "SAB-28 | BLADERS.SFE" (medium bold with separator)
  "MARZO    PARQUE FEDERAL" (smaller with pin icon)
  "Hora de comienzo: 16:00h" (accent color)
  "PARTICIPA POR UN BEYBLADE" (button)
- Bladers Santa Fe logo (image 5) at the very bottom
- Halftone dot texture on the lower portion
- Format: 1080x1920 vertical (Instagram STORY)

CRITICAL: Keep the WARM, VIBRANT, GOLDEN feel of Dominio Salvaje. Just shift the warm tones slightly toward rose/pink. Do NOT make it dark or gloomy."""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': dominio}},
        {'inlineData': {'mimeType': 'image/png', 'data': mision}},
        {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
        {'inlineData': {'mimeType': 'image/png', 'data': ghost_logo}},
        {'inlineData': {'mimeType': 'image/png', 'data': bladers}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating with Dominio Salvaje as primary reference...')
resp = urllib.request.urlopen(req, timeout=300)
result = json.loads(resp.read().decode('utf-8'))

if 'error' in result:
    print('ERROR:', result['error']['message'][:500])
    sys.exit(1)

for p in result.get('candidates', [{}])[0].get('content', {}).get('parts', []):
    if 'inlineData' in p:
        img = base64.b64decode(p['inlineData']['data'])
        ver = 1
        while os.path.exists(f'public/posts/fantasma-elementos/flyer_final_v{ver}.png'):
            ver += 1
        outpath = f'public/posts/fantasma-elementos/flyer_final_v{ver}.png'
        with open(outpath, 'wb') as f:
            f.write(img)
        with open(outpath, 'rb') as f:
            f.read(16)
            w = struct.unpack('>I', f.read(4))[0]
            h = struct.unpack('>I', f.read(4))[0]
        print(f'Saved: {outpath} ({w}x{h}, {len(img)} bytes)')
    elif 'text' in p:
        print('text:', p['text'][:200])
