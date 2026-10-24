#!/bin/bash
# usage: ship.sh <version> "<release notes>"   builds all targets from gridiron-dynasty.html and pushes
set -e
V="$1"; NOTES="$2"
S=/home/claude/saturdaysweater/tools
R=/home/claude/saturdaysweater
cd /home/claude
sed -i "s/<meta name=\"app-version\" content=\"[0-9.]*\">/<meta name=\"app-version\" content=\"$V\">/" $S/build_desktop.py
python3 - "$V" "$NOTES" <<'PY'
import json,sys,re
v,notes=sys.argv[1],sys.argv[2]
cl=json.load(open('/home/claude/saturdaysweater/CHANGELOG.json'))
cl=[c for c in cl if c['version']!=v]
cl.insert(0,{'version':v,'notes':notes})
def pub(t):
    t=re.sub(r'(?<![A-Za-z])Heisman','Iron Helmet',t)
    for a,b in (('College Football Playoff','National Playoff'),('Big Ten','Great Lakes'),('Big 12','Plains'),('Pac-12','Pacific Rim'),('Sun Belt','Bayou'),('Mountain West','Rockies'),('Conference USA','Heritage')):t=t.replace(a,b)
    return re.sub(r'\bSEC\b','Deep South',re.sub(r'\bACC\b','Seaboard',t))
cl=[dict(c,notes=pub(c['notes'])) for c in cl]
json.dump(cl,open('/home/claude/saturdaysweater/CHANGELOG.json','w'),indent=1)
p='/home/claude/gridiron-dynasty.html';s=open(p).read()
s=re.sub(r"const APP_VERSION='[^']*';","const APP_VERSION='%s';"%v,s,count=1)
s=re.sub(r"const CHANGELOG=\[.*?\];\n",lambda m:"const CHANGELOG="+json.dumps(cl[:70],ensure_ascii=False).replace('</','<\\/')+";\n",s,count=1,flags=re.S)
open(p,'w').write(s)
PY
python3 $S/make_fictional.py gridiron-dynasty.html gridiron-public.html >/dev/null
python3 $S/build_web.py gridiron-public.html $R/site/play/index.html >/dev/null
SRC=/home/claude/gridiron-public.html OUT=$R/desktop python3 $S/build_desktop.py >/dev/null
cp $R/desktop/app/index.html $R/app/index.html && rm -f $R/desktop/app/index.html $R/desktop/README.md $R/desktop/.gitignore
SRC=/home/claude/gridiron-dynasty.html OUT=/home/claude/gridiron-dynasty-desktop python3 $S/build_desktop.py >/dev/null
python3 -c "
from PIL import Image
for d in ['gridiron-dynasty-desktop/build','saturdaysweater/desktop/build']:
    Image.open(d+'/icon.png').save(d+'/icon.ico',sizes=[(256,256),(128,128),(64,64),(48,48),(32,32),(16,16)])"
python3 - "$V" "$NOTES" <<'PY'
import json,sys,hashlib
h=hashlib.sha256(open('/home/claude/saturdaysweater/app/index.html','rb').read()).hexdigest()
json.dump({"version":sys.argv[1],"notes":sys.argv[2],"sha256":h},open('/home/claude/saturdaysweater/version.json','w'),indent=2)
PY
grep -q "content=\"$V\"" $R/app/index.html
cp $R/CHANGELOG.json $R/site/changelog.json
python3 - <<'PY'
import json,re,html
cl=json.load(open('/home/claude/saturdaysweater/CHANGELOG.json'))[:6]
def first(n):
    m=re.match(r'^(.*?[.!?])(\s|$)',n);return m.group(1) if m else n
items=''.join('<div class="item"><div class="v">%s</div><div>%s</div></div>'%(html.escape(c['version']),html.escape(first(c['notes']))) for c in cl)
p='/home/claude/saturdaysweater/site/index.html';s=open(p).read()
s=re.sub(r'<!--WN-->.*?<!--/WN-->','<!--WN-->'+items+'<!--/WN-->',s,count=1,flags=re.S)
open(p,'w').write(s)
PY
cd $R && git add -A && git -c user.name="RoTok9" -c user.email="rolt2023@gmail.com" commit -q -m "$V: $NOTES

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01HBQyJtzy8Sp6i9vWAcSez4" && git push 2>&1 | tail -1
echo "shipped $V"
