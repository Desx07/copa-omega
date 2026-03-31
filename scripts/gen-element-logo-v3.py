import json, base64, sys, io, urllib.request, struct, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('utf-8')

caballero = read_b64('C:/Users/ariel/Downloads/la_orden_del_caballero_logo_transparent_8192.png')
ghost_blade = read_b64('tmp_ghost_circle_blade.webp')

prompt = """2 images:
1. "La Orden del Caballero" tournament logo - STYLE reference. Clean sports emblem, dark shield, character silhouette, simple and professional.
2. Ghost Circle beyblade - see the GHOST FACE in the center chip. This is the specific ghost character that must appear in the logo. It has a white skull-like ghost face with angry expression and flame-like wisps.

Create a tournament emblem for "LA MALDICION DEL FANTASMA":
- Same clean shield style as image 1
- Inside the shield: the SPECIFIC ghost face from image 2's center chip (the white skull ghost with the angry expression), NOT a generic cartoon ghost
- Subtle magenta/pink accent swirls
- Text: "LA MALDICION DEL" small above, "FANTASMA" large bold below
- Decorative lines flanking the text

CRITICAL:
- The ghost must look like the one from image 2 (Ghost Circle's beast), not a generic ghost
- TRANSPARENT BACKGROUND - absolutely NO white background, NO colored background. The emblem must float on nothing. Generate it as a PNG with alpha transparency.
- Clean, professional, sports emblem style"""

payload = {
    'contents': [{'parts': [
        {'inlineData': {'mimeType': 'image/png', 'data': caballero}},
        {'inlineData': {'mimeType': 'image/webp', 'data': ghost_blade}},
        {'text': prompt}
    ]}],
    'generationConfig': {'responseModalities': ['TEXT', 'IMAGE']}
}

data = json.dumps(payload).encode('utf-8')
url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=AIzaSyBTpCDSh3es9fgD5IwUZjTpA0fVj5pgqs8'
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

print('Generating logo with Ghost Circle beast + transparent bg...')
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

        # Also auto-clean white bg with node canvas
        import subprocess
        subprocess.run(['node', '-e', f"""
const {{ createCanvas, loadImage }} = require('canvas');
const fs = require('fs');
async function main() {{
  const img = await loadImage('{outpath}');
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height);
  const px = d.data;
  for (let i = 0; i < px.length; i += 4) {{
    const r=px[i],g=px[i+1],b=px[i+2];
    const bright=(r+g+b)/3;
    const sat=Math.max(r,g,b)-Math.min(r,g,b);
    if (bright>240 && sat<20) px[i+3]=0;
    else if (bright>220 && sat<30) px[i+3]=Math.floor(px[i+3]*0.15);
    else if (bright>200 && sat<40) px[i+3]=Math.floor(px[i+3]*0.4);
  }}
  ctx.putImageData(d, 0, 0);
  const cleanPath = '{outpath}'.replace('.png','_clean.png');
  fs.writeFileSync(cleanPath, c.toBuffer('image/png'));
  console.log('Cleaned:', cleanPath);
}}
main();
"""], check=True)
    elif 'text' in p:
        print('text:', p['text'][:200])
