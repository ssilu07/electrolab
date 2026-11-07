import base64
import os
import shutil
import sys

def extract_alias(data):
    oid = bytes([0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x09, 0x14])
    pos = data.find(oid)
    if pos != -1:
        bmp_pos = data.find(b'\x1e', pos + len(oid))
        if bmp_pos != -1:
            length = data[bmp_pos + 1]
            alias_bytes = data[bmp_pos + 2 : bmp_pos + 2 + length]
            extracted = alias_bytes.decode('utf-16-be', errors='ignore')
            if extracted:
                return extracted
    return 'key0'

def set_github_env(alias):
    github_env = os.environ.get('GITHUB_ENV')
    if github_env and os.path.exists(github_env):
        with open(github_env, 'a', encoding='utf-8') as f:
            f.write(f"ACTUAL_KEY_ALIAS={alias}\n")
            f.write("HAS_KEYSTORE=true\n")

def main():
    target_path = os.path.join('android', 'app', 'release.jks')
    repo_keystore = os.path.join('android', 'app', 'electrolab.jks')

    # Strategy 1: Dedicated keystore in repository (always 100% complete, never truncated)
    if os.path.exists(repo_keystore) and os.path.getsize(repo_keystore) > 0:
        shutil.copyfile(repo_keystore, target_path)
        with open(target_path, 'rb') as f:
            data = f.read()
        alias = extract_alias(data)
        print(f"Using repository keystore from {repo_keystore} ({len(data)} bytes). Alias: {alias}")
        set_github_env(alias)
        return

    # Strategy 2: Base64 environment variable from GitHub Secrets
    raw = os.environ.get('KEYSTORE_BASE64', '')
    if not raw or not raw.strip():
        print("No keystore found. Proceeding unsigned.")
        sys.exit(0)

    clean = ''.join(raw.split()).replace('"', '').replace("'", "")
    missing = len(clean) % 4
    if missing:
        clean += '=' * (4 - missing)

    try:
        data = base64.b64decode(clean)
        os.makedirs('android/app', exist_ok=True)
        with open(target_path, 'wb') as f:
            f.write(data)

        alias = extract_alias(data)
        print(f"Decoded keystore from base64: {len(data)} bytes. Alias: {alias}")
        set_github_env(alias)
    except Exception as e:
        print(f"Error decoding keystore: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
