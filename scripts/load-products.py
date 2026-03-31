import json, sys, io, os, urllib.request, mimetypes

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjZXlwZ3BneHVzZWJpYW9md3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQzNjMzNCwiZXhwIjoyMDg5MDEyMzM0fQ.nvo7MmPmpnP32nVS2Kihls8pYAjye6vwxSjzYQqnyvI"
URL = "https://dceypgpgxusebiaofwpb.supabase.co"
IMAGES_DIR = "C:/Users/ariel/Downloads/ventas 1"

products = [
    {"file": "wizard-rod-5-80db.png", "name": "Wizard Rod 5-80DB", "price": 25000},
    {"file": "wizard-rod-5-70db.png", "name": "Wizard Rod 5-70DB", "price": 25000},
    {"file": "dran-sword-3-60f.png", "name": "Dran Sword 3-60F", "price": 25000},
    {"file": "dran-dragger-4-60r.png", "name": "Dran Dragger 4-60R", "price": 25000},
    {"file": "dran-dragger-1-60gf.png", "name": "Dran Dragger 1-60GF", "price": 25000},
    {"file": "dran-buster-1-60a.png", "name": "Dran Buster 1-60A", "price": 25000},
    {"file": "hells-scythe-4-60t.png", "name": "Hells Scythe 4-60T", "price": 25000},
    {"file": "hells-chain-5-60ht.png", "name": "Hells Chain 5-60HT", "price": 25000},
    {"file": "hells-chain-5-60ht-verde.png", "name": "Hells Chain 5-60HT (Verde)", "price": 25000},
    {"file": "silver-wolf-3-80fb.png", "name": "Silver Wolf 3-80FB", "price": 25000},
    {"file": "shark-scale-4-55lo.png", "name": "Shark Scale 4-55LO", "price": 25000},
    {"file": "shark-edge-5-60gp.png", "name": "Shark Edge 5-60GP", "price": 25000},
    {"file": "phoenix-wing-9-60gf.png", "name": "Phoenix Wing 9-60GF", "price": 25000},
    {"file": "phoenix-wing-9-60gf-negro.png", "name": "Phoenix Wing 9-60GF (Negro)", "price": 25000},
    {"file": "phoenix-wing-9-80db.png", "name": "Phoenix Wing 9-80DB", "price": 25000},
    {"file": "phoenix-rudder-9-70g.png", "name": "Phoenix Rudder 9-70G", "price": 25000},
    {"file": "pegasus-blast-a-tr.png", "name": "Pegasus Blast A-Tr", "price": 25000},
    {"file": "pegasus-blast-a-tr-rojo.png", "name": "Pegasus Blast A-Tr (Rojo)", "price": 25000},
    {"file": "shelter-drake-7-80gp.png", "name": "Shelter Drake 7-80GP", "price": 25000},
    {"file": "wizard-arrow-4-80b.png", "name": "Wizard Arrow 4-80B", "price": 25000},
    {"file": "wizard-arc-r4-55lo.png", "name": "Wizard Arc R4-55LO", "price": 25000},
    {"file": "ghost-circle-4-70d.png", "name": "Ghost Circle 4-70D", "price": 25000},
    {"file": "crimson-garuda-4-70tp.png", "name": "Crimson Garuda 4-70TP", "price": 25000},
    {"file": "impact-drake-9-60lr.png", "name": "Impact Drake 9-60LR", "price": 30000},
    {"file": "sol-eclipse-d5-70tk.png", "name": "Sol Eclipse D5-70TK", "price": 25000},
    {"file": "unicorn-sing-5-60gp.png", "name": "Unicorn Sing 5-60GP", "price": 25000},
    {"file": "knight-lance-4-80hn.png", "name": "Knight Lance 4-80HN", "price": 25000},
    {"file": "knight-shield-3-80h.png", "name": "Knight Shield 3-80H", "price": 25000},
    {"file": "leon-crest-7-60gn.png", "name": "Leon Crest 7-60GN", "price": 25000},
    {"file": "face-lion-5-60p.png", "name": "Face Lion 5-60P", "price": 25000},
    {"file": "weiss-tiger-3-60u.png", "name": "Weiss Tiger 3-60U", "price": 25000},
    {"file": "fox-rush-j9-70gr.png", "name": "Fox Rush J9-70GR", "price": 25000},
    {"file": "fox-rush-j0-80db.png", "name": "Fox Rush J0-80DB", "price": 25000},
    {"file": "fox-rush-j2-70u.png", "name": "Fox Rush J2-70U", "price": 25000},
    {"file": "cerberus-flame-w5-80wb.png", "name": "Cerberus Flame W5-80WB", "price": 25000},
    {"file": "black-shell-4-70d.png", "name": "Black Shell 4-70D", "price": 25000},
    {"file": "wyvern-gale-5-80gb.png", "name": "Wyvern Gale 5-80GB", "price": 25000},
    {"file": "tricera-press-m-85bs.png", "name": "Tricera Press M-85BS", "price": 25000},
    {"file": "tyranno-beat-4-70q.png", "name": "Tyranno Beat 4-70Q", "price": 25000},
    {"file": "dark-perseus-b6-80w.png", "name": "Dark Perseus B6-80W", "price": 25000},
    {"file": "tail-vaiper-5-80o.png", "name": "Tail Vaiper 5-80O", "price": 25000},
    {"file": "whale-wale-5-80e.png", "name": "Whale Wale 5-80E", "price": 25000},
    {"file": "scorpion-spear-0-70z.png", "name": "Scorpion Spear 0-70Z", "price": 25000},
    {"file": "cobalt-dragoon-2-60c-lanzador.png", "name": "Cobalt Dragoon 2-60C + Lanzador Giro Izq", "price": 40000},
    {"file": "samurai-saber-2-70l.png", "name": "Samurai Saber 2-70L", "price": 35000},
    {"file": "set-dran-edicion-especial.png", "name": "Set Dran Edicion Especial", "price": 40000},
    {"file": "set-custom-ux10.png", "name": "Set Custom UX-10", "price": 45000},
    {"file": "estadio-xtreme.png", "name": "Estadio Xtreme", "price": 120000},
]

def api_call(method, path, data=None, content_type='application/json'):
    url = URL + path
    if data and content_type == 'application/json':
        body = json.dumps(data).encode('utf-8')
    else:
        body = data
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header('Authorization', f'Bearer {SERVICE_KEY}')
    req.add_header('apikey', SERVICE_KEY)
    req.add_header('Content-Type', content_type)
    if method == 'POST' and content_type == 'application/json':
        req.add_header('Prefer', 'return=representation')
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8')
        print(f'  API Error {e.code}: {err[:200]}')
        return None

def upload_image(file_path, product_id):
    file_name = os.path.basename(file_path)
    storage_path = f'{product_id}/{file_name}'

    with open(file_path, 'rb') as f:
        file_data = f.read()

    upload_url = f'{URL}/storage/v1/object/products/{storage_path}'
    req = urllib.request.Request(upload_url, data=file_data, method='POST')
    req.add_header('Authorization', f'Bearer {SERVICE_KEY}')
    req.add_header('apikey', SERVICE_KEY)
    req.add_header('Content-Type', 'image/png')

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        public_url = f'{URL}/storage/v1/object/public/products/{storage_path}'
        return public_url
    except urllib.error.HTTPError as e:
        err = e.read().decode('utf-8')
        print(f'  Upload error: {err[:200]}')
        return None

loaded = 0
errors = 0

for i, p in enumerate(products):
    print(f'[{i+1}/{len(products)}] {p["name"]}...', end=' ')

    # Create product
    result = api_call('POST', '/rest/v1/products', {
        'name': p['name'],
        'price': p['price'],
        'stock': 1,
        'is_active': True,
        'description': f'Beyblade X - {p["name"]}'
    })

    if not result or len(result) == 0:
        print('FAILED to create product')
        errors += 1
        continue

    product_id = result[0]['id']

    # Upload image
    file_path = os.path.join(IMAGES_DIR, p['file'])
    if not os.path.exists(file_path):
        print(f'FILE NOT FOUND: {file_path}')
        errors += 1
        continue

    image_url = upload_image(file_path, product_id)
    if not image_url:
        print('FAILED to upload image')
        errors += 1
        continue

    # Create product_image record
    img_result = api_call('POST', '/rest/v1/product_images', {
        'product_id': product_id,
        'image_url': image_url,
        'sort_order': 0
    })

    if img_result:
        print('OK')
        loaded += 1
    else:
        print('Image record failed')
        errors += 1

print(f'\n=== Done: {loaded} loaded, {errors} errors ===')
