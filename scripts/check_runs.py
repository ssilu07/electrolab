import subprocess
import urllib.request
import json
import time

def get_token():
    p = subprocess.Popen(['git', 'credential', 'fill'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
    out, _ = p.communicate('url=https://github.com/ssilu07/electrolab.git\n')
    for line in out.splitlines():
        if line.startswith('password='):
            return line.split('=', 1)[1].strip()
    return None

token = get_token()
headers = {
    'Authorization': f'Bearer {token}',
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Antigravity'
}

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)

def fetch_latest_run():
    req = urllib.request.Request('https://api.github.com/repos/ssilu07/electrolab/actions/runs?per_page=1', headers=headers)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        runs = data.get('workflow_runs', [])
        return runs[0] if runs else None

def get_job_log(job_id):
    logs_req = urllib.request.Request(f'https://api.github.com/repos/ssilu07/electrolab/actions/jobs/{job_id}/logs', headers={
        'Authorization': f'Bearer {token}',
        'User-Agent': 'Antigravity'
    })
    try:
        opener.open(logs_req)
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303, 307):
            redirect_url = e.headers['Location']
            req2 = urllib.request.Request(redirect_url)
            with urllib.request.urlopen(req2) as resp:
                return resp.read().decode('utf-8', errors='replace')
    return ""

if __name__ == '__main__':
    run = fetch_latest_run()
    if run:
        print(f"Latest Run: ID={run['id']}, Status={run['status']}, Conclusion={run['conclusion']}, Commit={run['head_commit']['message'][:50]}")
