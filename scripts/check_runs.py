import subprocess
import urllib.request
import json

def get_token():
    p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    out, _ = p.communicate('url=https://github.com/ssilu07/electrolab.git\n')
    for line in out.splitlines():
        if line.startswith('password='):
            return line.split('=', 1)[1].strip()
    return None

token = get_token()

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)

run_id = 42360332488
jobs_req = urllib.request.Request(f'https://api.github.com/repos/ssilu07/electrolab/actions/runs/{run_id}/jobs', headers={
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Antigravity'
})
with urllib.request.urlopen(jobs_req) as resp:
    jobs_data = json.loads(resp.read().decode())
    job_id = jobs_data['jobs'][0]['id']

logs_req = urllib.request.Request(f'https://api.github.com/repos/ssilu07/electrolab/actions/jobs/{job_id}/logs', headers={
    'Authorization': f'Bearer {token}',
    'User-Agent': 'Antigravity'
})

redirect_url = None
try:
    opener.open(logs_req)
except urllib.error.HTTPError as e:
    if e.code in (301, 302, 303, 307):
        redirect_url = e.headers['Location']

if redirect_url:
    req2 = urllib.request.Request(redirect_url)
    with urllib.request.urlopen(req2) as resp:
        content = resp.read().decode('utf-8', errors='replace')
        lines = content.splitlines()
        capturing = False
        captured = []
        for line in lines:
            if "Deploy Directly to Google Play Store" in line or "upload-google-play" in line or capturing:
                capturing = True
                captured.append(line)
        print("\n".join(captured[-50:]))
