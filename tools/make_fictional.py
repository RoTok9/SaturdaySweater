# Produce a copy of the game page with fictional schools as the default league and no real names in the file.
import re, json, sys
src, dst = sys.argv[1], sys.argv[2]
s=open(src).read()
teams_block=s[s.index('const TEAMS=['):s.index('];',s.index('const TEAMS=['))+2]
rows=re.findall(r"\['((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)','(\w+)',(\d+),'(#[0-9A-Fa-f]{6})','(\w+)'\]",teams_block)
fict_block=s[s.index('const FICTIONAL=['):s.index('];',s.index('const FICTIONAL=['))+2]
fict=re.findall(r"\['((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)'\]",fict_block)
assert len(rows)==len(fict)==136
acad_block=s[s.index('const ACADEMIC={'):s.index('};',s.index('const ACADEMIC={'))+2]
acad=dict(re.findall(r"'([^']+)':(\d+)",acad_block))
acad_idx=[int(acad.get(r[0].replace("\\'","'"),5)) for r in rows]
new_rows=["['%s','%s','%s',%s,'%s','%s']"%(fict[i][0],fict[i][1],r[2],r[3],r[4],r[5]) for i,r in enumerate(rows)]
s=s.replace(teams_block,'const TEAMS=[\n'+',\n'.join(new_rows)+'\n];')
s=s.replace(acad_block,'const ACADEMIC_IDX='+json.dumps(acad_idx)+';')
assert s.count("case 'academics':return ACADEMIC[team.name]||5;")==1
s=s.replace("case 'academics':return ACADEMIC[team.name]||5;","case 'academics':return ACADEMIC_IDX[team.id]||5;")
old='<button class="btn sm ghost" data-act="leaguepreset" data-id="fictional">Load fictional league</button><button class="btn sm ghost" data-act="leaguepreset" data-id="original">Restore original names</button>'
assert s.count(old)==1
s=s.replace(old,'<button class="btn sm ghost" data-act="leaguepreset" data-id="original">Reset to default league</button>')
s=s.replace("Rename any school, change its nickname or colors, load the fictional league, or paste in a league a friend shared.","Rename any school, change its nickname or colors, or paste in a league a friend shared.")
ab=s[s.index('const ABBRS=['):s.index('];',s.index('const ABBRS=['))+2]
s=s.replace(ab,'const ABBRS=[];')
rr=s[s.index('const REAL_RIVALRIES=['):s.index('];',s.index('const REAL_RIVALRIES=['))+2]
s=s.replace(rr,'const REAL_RIVALRIES=[];')
open(dst,'w').write(s)
# also emit the real-name league as an import file
open(dst+'.league.txt','w').write('\n'.join('%s | %s | %s | %s'%(r[0].replace("\\'","'"),r[1].replace("\\'","'"),r[4],r[2]) for r in rows)+'\n')
print('fictional page written; real names remaining:', sum(s.count(r[0]) for r in rows if r[0] not in ('Texas','Florida','Georgia','Ohio','Miami','Washington','Houston','Memphis','Buffalo','Toledo','Charlotte','Tulsa','Delaware','Liberty','Navy','Army','Rice','Temple','Hawaii','Nevada','Wyoming','Kent State','Akron')))
