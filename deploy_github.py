"""
deploy_github.py — One-command GitHub Pages Deployment
Uses GitHub REST API — no git install needed!

Usage:
  python deploy_github.py YOUR_GITHUB_TOKEN YOUR_GITHUB_USERNAME

How to get your token:
  1. Go to https://github.com/settings/tokens/new
  2. Token name: nearme-deploy
  3. Select scopes: repo (full), workflow
  4. Click "Generate token" → Copy it
  5. Run: python deploy_github.py ghp_xxxx rinkusingh
"""

import sys, os, json, base64, urllib.request, urllib.error, time

REPO_NAME = "nearme-app"
DEPLOY_DIR = os.path.dirname(os.path.abspath(__file__))
SKIP_NAMES = {'.git','__pycache__','node_modules','data','.DS_Store'}
SKIP_EXT   = {'.pyc','.pyo','.log','.zip'}
SKIP_FILES = {'ngrok.exe','cloudflared.exe','ngrok.zip'}

def should_include(path):
    name = os.path.basename(path)
    _, ext = os.path.splitext(name)
    if name in SKIP_FILES: return False
    if ext in SKIP_EXT: return False
    return True

def read_file_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode()

def gh_api(token, method, path, data=None):
    url = f"https://api.github.com{path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "NearMe-Deploy/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        txt = e.read().decode()
        try:    return json.loads(txt), e.code
        except: return {"message": txt}, e.code

def deploy(token, username):
    print("\n" + "="*55)
    print("  NearMe -> GitHub Pages Deployment")
    print("="*55)

    # 1. Create or verify repo
    print(f"\n[1/5] Creating repo '{username}/{REPO_NAME}'...")
    repo, status = gh_api(token, "POST", "/user/repos", {
        "name": REPO_NAME, "description": "NearMe — Discover What's Around You",
        "private": False, "auto_init": False,
        "homepage": f"https://{username}.github.io/{REPO_NAME}",
    })
    if status == 422:
        print(f"  Repo already exists — updating...")
        repo, _ = gh_api(token, "GET", f"/repos/{username}/{REPO_NAME}")
    elif status not in (200, 201):
        print(f"  Error: {repo.get('message','Unknown error')}")
        return

    # 2. Collect files
    print("\n[2/5] Collecting files...")
    files = []
    for root, dirs, fnames in os.walk(DEPLOY_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_NAMES and not d.startswith('.')]
        for fname in fnames:
            full = os.path.join(root, fname)
            if not should_include(full): continue
            rel = os.path.relpath(full, DEPLOY_DIR).replace('\\', '/')
            files.append((rel, full))
            print(f"  + {rel}")
    print(f"  Total: {len(files)} files")

    # 3. Get existing SHAs
    print("\n[3/5] Fetching existing file SHAs...")
    existing = {}
    tree_data, _ = gh_api(token, "GET", f"/repos/{username}/{REPO_NAME}/git/trees/main?recursive=1")
    if tree_data.get("tree"):
        for item in tree_data["tree"]:
            existing[item["path"]] = item.get("sha","")

    # 4. Upload files
    print("\n[4/5] Uploading files...")
    ok = 0
    for rel, full in files:
        content = read_file_b64(full)
        payload = {"message": f"Deploy NearMe: {rel}", "content": content}
        if rel in existing:
            payload["sha"] = existing[rel]
        _, status = gh_api(token, "PUT", f"/repos/{username}/{REPO_NAME}/contents/{rel}", payload)
        if status in (200, 201):
            ok += 1
            print(f"  [{ok}/{len(files)}] {rel}")
        else:
            print(f"  SKIP: {rel} (status {status})")
        time.sleep(0.1)  # Rate limit safety

    # 5. Enable GitHub Pages
    print("\n[5/5] Enabling GitHub Pages...")
    pages, ps = gh_api(token, "POST", f"/repos/{username}/{REPO_NAME}/pages", {
        "source": {"branch": "main", "path": "/"}
    })
    if ps not in (200, 201, 409):
        print(f"  Pages note: {pages.get('message','')}")

    # Wait for pages to be ready
    print("  Waiting for Pages to go live...")
    page_url = f"https://{username}.github.io/{REPO_NAME}"
    for _ in range(10):
        time.sleep(4)
        try:
            urllib.request.urlopen(page_url)
            break
        except: pass

    print("\n" + "="*55)
    print("  GITHUB PAGES DEPLOYED!")
    print("="*55)
    print(f"\n  Main App:    {page_url}")
    print(f"  Admin Panel: {page_url}/admin.html")
    print(f"  Repo:        https://github.com/{username}/{REPO_NAME}")
    print(f"\n  (Bookmark these — they never change!)")
    print("="*55 + "\n")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("\nUsage: python deploy_github.py YOUR_TOKEN YOUR_USERNAME")
        print("\nGet your free token at:")
        print("  https://github.com/settings/tokens/new")
        print("  Scopes: repo (full) + workflow")
        sys.exit(1)
    deploy(sys.argv[1], sys.argv[2])
