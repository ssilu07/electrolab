import subprocess
import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

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

req = urllib.request.Request('https://api.github.com/repos/ssilu07/electrolab/actions/runs?per_page=1', headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    runs = data.get('workflow_runs', [])
    if runs:
        run = runs[0]
        print(f"Latest Run: ID={run['id']}, Status={run['status']}, Conclusion={run['conclusion']}, Commit={run['head_commit']['message']}")
        print(f"Created: {run['created_at']}, Updated: {run['updated_at']}")
        print(f"URL: {run['html_url']}")
        try:
            req_jobs = urllib.request.Request(run['jobs_url'], headers=headers)
            with urllib.request.urlopen(req_jobs) as jresp:
                jdata = json.loads(jresp.read().decode())
                for job in jdata.get('jobs', []):
                    print(f"\nJob: {job['name']} [{job['status']}]")
                    for step in job.get('steps', []):
                        conc = f" ({step['conclusion']})" if step['conclusion'] else ""
                        print(f"  - {step['name']}: {step['status']}{conc}")
        except Exception as e:
            pass
