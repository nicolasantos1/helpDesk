"""Run browser checks on the isolated public demo, without loading DB secrets."""
import json
import os
from pathlib import Path
import subprocess

values = dict(line.split('=', 1) for line in Path('.env.cloud').read_text().splitlines() if '=' in line)
env = os.environ.copy()
env['SEED_PASSWORD'] = json.loads(values['SEED_PASSWORD'])
env['DEPLOYMENT_URL'] = 'https://helpdeskiweti.vercel.app'
raise SystemExit(subprocess.call(['npm', 'run', 'test:deployment'], env=env))
