#!/usr/bin/env python3
"""Self-contained checks before and after Vite build; exits nonzero on errors."""
from pathlib import Path
import sys, json, re
from xml.etree import ElementTree as ET
root = Path(__file__).resolve().parents[1]
required = [
    'package.json', 'vite.config.js', 'index.html',
    'src/main.jsx', 'src/App.jsx', 'src/RobotScene.jsx', 'src/Reticle.jsx',
    'src/native.js', 'src/style.css',
    'android/settings.gradle', 'android/build.gradle', 'android/app/build.gradle',
    'android/app/src/main/AndroidManifest.xml',
    'android/app/src/main/java/vn/aujunpeak/gamecore/MainActivity.java',
    'android/app/src/main/java/vn/aujunpeak/gamecore/OverlayService.java',
    'android/app/src/main/java/vn/aujunpeak/gamecore/ReticleView.java',
]
errors = []
for file in required:
    p = root / file
    if not p.is_file() or not p.stat().st_size:
        errors.append(f'Missing/empty: {file}')
package = json.loads((root / 'package.json').read_text(encoding='utf-8'))
if not all(p in package['dependencies'] for p in ('react','react-dom','three','lucide-react')):
    errors.append('React dependency missing')
if not package.get('scripts', {}).get('android'):
    errors.append('npm run android not defined')
manifest = ET.parse(root / 'android/app/src/main/AndroidManifest.xml').getroot()
ANDROID = '{http://schemas.android.com/apk/res/android}'
perms = [e.attrib.get(ANDROID+'name') for e in manifest.findall('uses-permission')]
for permission in ('android.permission.SYSTEM_ALERT_WINDOW','android.permission.FOREGROUND_SERVICE','android.permission.FOREGROUND_SERVICE_SPECIAL_USE'):
    if permission not in perms: errors.append('Missing Android permission '+permission)
services = manifest.findall('application/service')
if not any(e.attrib.get(ANDROID+'name') == '.OverlayService' for e in services):
    errors.append('Missing OverlayService declaration')
if len(list((root/'android/app/src/main/res').rglob('ic_launcher.png'))) < 5:
    errors.append('Missing icon densities')
if '--phase' in sys.argv and sys.argv[sys.argv.index('--phase')+1] == 'assets':
    asset = root / 'android/app/src/main/assets'
    if not (asset/'index.html').is_file(): errors.append('Missing Android web index')
    else:
        html = (asset/'index.html').read_text(encoding='utf-8')
        bundles = re.findall(r'(?:src|href)="([^"]+\.(?:js|css))"', html)
        if not bundles: errors.append('No built JS/CSS bundles linked in index.html')
        for rel in bundles:
            if not (asset/rel.lstrip('./')).exists(): errors.append('Bundle missing: '+rel)
    if not (asset/'assets').is_dir(): errors.append('Built Vite assets directory missing')
if errors:
    print('PREFLIGHT FAILED:')
    for error in errors: print(' - '+error)
    sys.exit(1)
print('PRE-FLIGHT PASSED', '(assets)' if '--phase' in sys.argv and sys.argv[-1]=='assets' else '(source)')
