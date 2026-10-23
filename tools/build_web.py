import sys
src,dst=sys.argv[1],sys.argv[2]
s=open(src).read()
def rep(old,new):
    global s
    assert s.count(old)==1,(old[:70],s.count(old))
    s=s.replace(old,new)
rep('<meta name="claude:viewport-fit-sides" content="cover">\n','')
rep("""if(typeof window!=='undefined'&&app){
  window.claude?.hot?.snapshot?.(()=>({G,UI,SLOT}));
  window.claude?.hot?.ready?window.claude.hot.ready(boot):boot(window.claude?.hot?.data??{});
}""","""if(typeof window!=='undefined'&&app){boot({});}""")
rep('<style>\n','<style>\nhtml{background:var(--bg)}\nimg{max-width:100%}[hidden]{display:none!important}\n')
head='''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Saturday Sweater: run a college football program. Recruit, manage the roster, win press conferences, chase the 12-team playoff.">
<meta name="theme-color" content="#0d1014">
<link rel="icon" href="../icon.png">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="../icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Saturday Sweater">
'''
s=head+s.replace('<div id="app"></div>','</head>\n<body>\n<div id="app"></div>',1)+'\n<script>if("serviceWorker" in navigator){addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{});});}</script>\n</body>\n</html>\n'
open(dst,'w').write(s)
print('web build ok',len(s))
