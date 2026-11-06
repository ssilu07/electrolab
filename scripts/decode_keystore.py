import base64
import os
import sys

def main():
    raw = os.environ.get('KEYSTORE_BASE64', '')
    if not raw or not raw.strip():
        print("No KEYSTORE_BASE64 found in environment. Proceeding unsigned.")
        sys.exit(0)

    # Sanitize whitespace, newlines, and quotes
    clean = ''.join(raw.split())
    clean = clean.replace('"', '').replace("'", "")

    # Fix base64 padding if needed
    missing = len(clean) % 4
    if missing:
        clean += '=' * (4 - missing)

    try:
        data = base64.b64decode(clean)
        os.makedirs('android/app', exist_ok=True)
        target_path = os.path.join('android', 'app', 'release.jks')
        with open(target_path, 'wb') as f:
            f.write(data)
        print(f"Keystore successfully decoded: {len(data)} bytes written to {target_path}")
    except Exception as e:
        print(f"Error decoding keystore: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
