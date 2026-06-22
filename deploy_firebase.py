"""
deploy_firebase.py — NearMe Firebase Hosting Deployment
Deploys your site to Google's Firebase Hosting (free, fast, permanent)
Your site will be live at: https://nearme-app.web.app

Usage:
  python deploy_firebase.py YOUR_FIREBASE_TOKEN

Get your token:
  1. Install Firebase CLI: npm install -g firebase-tools
  2. Run: firebase login:ci
  3. Copy the token shown
"""

import sys, os, json, urllib.request, base64, hashlib, mimetypes

SITE_ID = 'nearme-app'  # Change to your Firebase project ID

INCLUDE = [
    'index.html','admin.html','app.js','auth.js','tracker.js',
    'subscription.js','subscription.css','style.css','manifest.json','sw.js',
    'README.md',
]

def get_mime(path):
    m, _ = mimetypes.guess_type(path)
    return m or 'application/octet-stream'

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()

def api(token, method, url, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        url, data=body, method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read())

def upload_file(upload_url, token, path):
    with open(path, 'rb') as f:
        data = f.read()
    req = urllib.request.Request(
        upload_url, data=data, method='POST',
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': get_mime(path),
        }
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code

def main():
    if len(sys.argv) < 2:
        print('\nUsage: python deploy_firebase.py YOUR_TOKEN\n')
        print('Get token: firebase login:ci')
        sys.exit(1)

    token = sys.argv[1].strip()
    base  = os.path.dirname(os.path.abspath(__file__))

    print('=' * 55)
    print('  NearMe → Firebase Hosting (Google)')
    print('=' * 55)

    # Collect files
    files = {}
    for name in INCLUDE:
        path = os.path.join(base, name)
        if os.path.exists(path):
            files[f'/{name}'] = path
    # Add icons if they exist
    for icon in ['icon-192.png','icon-512.png','favicon.ico']:
        p = os.path.join(base, icon)
        if os.path.exists(p):
            files[f'/{icon}'] = p

    print(f'\n[1/4] Found {len(files)} files to deploy')
    for f in files: print(f'  + {f}')

    # Build file hashes
    file_hashes = {}
    for web_path, local_path in files.items():
        file_hashes[web_path] = sha256_file(local_path)

    # Create version
    print(f'\n[2/4] Creating Firebase version...')
    BASE_URL = 'https://firebasehosting.googleapis.com/v1beta1'
    site_url = f'{BASE_URL}/sites/{SITE_ID}/versions'
    version_data = {
        'config': {
            'headers': [
                {'glob':'**','headers':{'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}},
                {'glob':'**/*.js','headers':{'Cache-Control':'public,max-age=31536000,immutable'}},
                {'glob':'**/*.css','headers':{'Cache-Control':'public,max-age=31536000,immutable'}},
            ],
            'rewrites': [{'glob':'**','path':'/index.html'}],
        }
    }
    ver = api(token, 'POST', site_url, version_data)
    ver_name = ver.get('name','')
    if not ver_name:
        print(f'\n❌ Failed to create version. Response: {ver}')
        print('\nMake sure:')
        print('  1. Firebase project exists with ID: nearme-app')
        print('  2. Firebase Hosting is enabled')
        print('  3. Token is valid (run: firebase login:ci)')
        sys.exit(1)
    print(f'   Version: {ver_name.split("/")[-1]}')

    # Populate files
    print(f'\n[3/4] Uploading {len(files)} files...')
    pop_url = f'{BASE_URL}/{ver_name}:populateFiles'
    pop_data = {'files': file_hashes}
    pop_res = api(token, 'POST', pop_url, pop_data)
    upload_url = pop_res.get('uploadUrl','')
    required   = pop_res.get('uploadRequiredHashes',[])

    if upload_url:
        for web_path, local_path in files.items():
            fhash = file_hashes[web_path]
            if not required or fhash in required:
                url = f'{upload_url}/{fhash}'
                code = upload_file(url, token, local_path)
                status = '✓' if code in (200,204) else f'⚠ {code}'
                print(f'  {status} {web_path}')
    else:
        print('   (All files already cached)')

    # Finalize
    print(f'\n[4/4] Finalizing deployment...')
    fin_url = f'{BASE_URL}/{ver_name}?updateMask=status'
    fin_res = api(token, 'PATCH', fin_url, {'status':'FINALIZED'})

    # Release
    rel_url = f'{BASE_URL}/sites/{SITE_ID}/releases?versionName={ver_name}'
    api(token, 'POST', rel_url)

    print('\n' + '=' * 55)
    print('  🔥 FIREBASE HOSTING DEPLOYED (Google)!')
    print('=' * 55)
    print(f'\n  🌐 Main App:    https://{SITE_ID}.web.app')
    print(f'  🌐 Alt URL:     https://{SITE_ID}.firebaseapp.com')
    print(f'  🔐 Admin Panel: https://{SITE_ID}.web.app/admin.html')
    print('\n  (Hosted on Google\'s CDN — super fast!)')
    print('=' * 55 + '\n')

if __name__ == '__main__':
    main()
