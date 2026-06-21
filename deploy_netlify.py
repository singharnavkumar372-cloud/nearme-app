"""
deploy_netlify.py — One-click Netlify Deployment
Usage:
  python deploy_netlify.py YOUR_NETLIFY_TOKEN

How to get your token:
  1. Go to https://app.netlify.com
  2. Sign up FREE (GitHub login works)
  3. Go to: User Settings → Applications → Personal Access Tokens
  4. Click "New access token" → name it "nearme" → Copy it
  5. Run: python deploy_netlify.py YOUR_TOKEN_HERE
"""

import sys, os, zipfile, json, urllib.request, urllib.parse, io, time

SITE_NAME = "nearme-rinks"   # Change this to something unique
DEPLOY_DIR = os.path.dirname(os.path.abspath(__file__))
SKIP = {'.git','data','__pycache__','ngrok.zip','ngrok.exe','cloudflared.exe','*.pyc','node_modules'}

def should_include(path):
    name = os.path.basename(path)
    return not any(name == s or name.endswith('.pyc') for s in SKIP)

def create_zip():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(DEPLOY_DIR):
            dirs[:] = [d for d in dirs if d not in SKIP and not d.startswith('.')]
            for f in files:
                full = os.path.join(root, f)
                if not should_include(full): continue
                rel = os.path.relpath(full, DEPLOY_DIR)
                zf.write(full, rel)
                print(f"  + {rel}")
    buf.seek(0)
    return buf.read()

def api(token, method, path, data=None, is_zip=False):
    url = f"https://api.netlify.com/api/v1{path}"
    headers = {"Authorization": f"Bearer {token}"}
    if is_zip:
        headers["Content-Type"] = "application/zip"
        body = data
    elif data:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode()
    else:
        body = None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ERROR {e.code}: {err[:200]}")
        return None

def deploy(token):
    print("\n" + "="*50)
    print("  NearMe → Netlify Deployment")
    print("="*50)

    # 1. Check/Create site
    print("\n[1/4] Checking Netlify site...")
    sites = api(token, "GET", "/sites") or []
    site = next((s for s in sites if s.get("name") == SITE_NAME), None)
    if not site:
        print(f"  Creating site '{SITE_NAME}'...")
        site = api(token, "POST", "/sites", {"name": SITE_NAME})
        if not site:
            print("  Could not create site. Try changing SITE_NAME in this script.")
            return
    site_id = site["id"]
    print(f"  Site ID: {site_id}")
    print(f"  URL: https://{SITE_NAME}.netlify.app")

    # 2. Build ZIP
    print("\n[2/4] Packaging files...")
    zip_data = create_zip()
    print(f"  ZIP size: {len(zip_data)//1024} KB")

    # 3. Deploy
    print("\n[3/4] Uploading to Netlify...")
    result = api(token, "POST", f"/sites/{site_id}/deploys", zip_data, is_zip=True)
    if not result:
        print("  Upload failed!")
        return
    deploy_id = result.get("id")
    print(f"  Deploy ID: {deploy_id}")

    # 4. Wait for ready
    print("\n[4/4] Waiting for deploy to go live...")
    for i in range(20):
        time.sleep(3)
        d = api(token, "GET", f"/sites/{site_id}/deploys/{deploy_id}")
        state = d.get("state","?") if d else "?"
        print(f"  Status: {state}...", end="\r")
        if state == "ready":
            break

    print("\n")
    print("="*50)
    print("  DEPLOYED SUCCESSFULLY!")
    print("="*50)
    print(f"\n  Main App:    https://{SITE_NAME}.netlify.app")
    print(f"  Admin Panel: https://{SITE_NAME}.netlify.app/admin.html")
    print(f"\n  (Bookmark these — they never change!)")
    print("="*50 + "\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("\nUsage: python deploy_netlify.py YOUR_NETLIFY_TOKEN")
        print("\nGet your free token at:")
        print("  https://app.netlify.com/user/applications#personal-access-tokens")
        sys.exit(1)
    deploy(sys.argv[1])
