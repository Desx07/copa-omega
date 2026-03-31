import json, base64, sys, io, urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

def call_gemini(parts):
    payload = {
        'contents': [{'parts': parts}],
        'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
    }
    data = json.dumps(payload).encode('utf-8')
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    resp = urllib.request.urlopen(req, timeout=300)
    result = json.loads(resp.read().decode('utf-8'))
    if 'error' in result:
        print('ERROR:', result['error']['message'][:500])
        return None
    parts_out = result.get('candidates', [{}])[0].get('content', {}).get('parts', [])
    for p in parts_out:
        if 'inlineData' in p:
            return base64.b64decode(p['inlineData']['data'])
        elif 'text' in p:
            print('text:', p['text'][:200])
    return None

# Use the EXACT same inputs as v3 which produced the good result
ref_flyer = read_b64('public/posts/la-mision-ninja.png')
reiyu = read_b64('tmp_reiyu_anidb.png')
ghost_circle = read_b64('tmp_ghost_circle_full.webp')
bladers_logo = read_b64('public/bladers-logo.png')

print('Generating flyer based on the good v3 version with refinements...')

flyer_parts = [
    {'inlineData': {'mimeType': 'image/png', 'data': ref_flyer}},
    {'inlineData': {'mimeType': 'image/png', 'data': reiyu}},
    {'inlineData': {'mimeType': 'image/webp', 'data': ghost_circle}},
    {'inlineData': {'mimeType': 'image/png', 'data': bladers_logo}},
    {'text': """I'm giving you 4 images:
1. A REFERENCE FLYER (La Mision Ninja) - copy this EXACT layout structure, typography hierarchy, and design pattern
2. The CHARACTER Reiyu Kuwabara - use this exact character in the new flyer
3. The BEYBLADE Ghost Circle - use the GHOST BEAST from the center of this beyblade (the white ghost/skull face) as a visual element, NOT the beyblade itself repeated
4. The BLADERS SANTA FE LOGO - use this exact logo at the bottom, DO NOT modify it

Create a NEW tournament flyer following the EXACT same layout as image 1 but with these changes:
- Character from image 2 (Reiyu Kuwabara) placed in the upper portion prominently
- The ghost beast/avatar from image 3's center chip as a background or accent element
- A thematic tournament badge/shield in the center saying "LA MALDICION DEL FANTASMA" with a ghost motif - style it like a sports team emblem
- Logo from image 4 at the bottom exactly as-is
- Color palette: magenta/pink vibrant tones (matching Ghost Circle's pink/silver colors). Use the SAME gradient cut approach as image 1 (diagonal gradient separating image from info) but in magenta/pink tones instead of orange
- Lower info area: use a complementary dark magenta or teal gradient like image 1 uses teal
- Add subtle halftone dot pattern texture on the image area for depth

KEEP THIS EXACT TEXT (spell correctly in Spanish):
- "INSCRIPCIONES ABIERTAS!" (large bold white, two lines)
- "SAB-28  |  BLADERS.SFE" (medium bold with vertical separator)
- "MARZO       PARQUE FEDERAL" (smaller, with location pin icon)
- "Hora de comienzo: 16:00h" (small, magenta/pink accent color)
- "PARTICIPA POR UN BEYBLADE" (in rounded gradient button with trophy emoji)
- Bladers Santa Fe logo (image 4) at very bottom

CRITICAL:
- Make it 4:5 vertical ratio for Instagram feed post
- Keep it vibrant, energetic, competitive - NOT dark or gloomy
- The background behind Reiyu should be thematic (ghostly/spectral effects, not a random stadium)
- DO NOT put 3 copies of the same beyblade"""}
]

flyer_img = call_gemini(flyer_parts)
if flyer_img:
    with open('public/posts/la-maldicion-del-fantasma.png', 'wb') as f:
        f.write(flyer_img)
    import struct
    with open('public/posts/la-maldicion-del-fantasma.png', 'rb') as f:
        f.read(16)
        w = struct.unpack('>I', f.read(4))[0]
        h = struct.unpack('>I', f.read(4))[0]
    print(f'DONE! {w}x{h} ({len(flyer_img)} bytes)')
else:
    print('Failed')
