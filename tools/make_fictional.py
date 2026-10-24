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

# coach names: the private copy uses real coaching surnames for flavor; the public copy uses generic names so no
# generated coach can match or suggest a real person
GF=['Mike','Dan','Ryan','Steve','Josh','Matt','Marcus','Jeff','Chris','Eli','Dave','Pat','Kyle','Will','Troy','Tony','Blake','Jay','Scott','Tom','Bo','Jerry','Neal','Ken','Barry','Sam','Thomas','Kenny','Drew','Andy','Charles','Jake','Justin','Shane','Kevin','Derek','Rich','Joey','Tim','Mario','Jason','Wade','Cole','Grant','Hank','Walt','Russ','Doug','Gary','Lou','Earl','Ray','Glen','Wes','Brady','Carter','Darnell','Andre','Terrell','Luis']
GL=['Ashford','Bennett','Calloway','Danforth','Easley','Fairchild','Garrison','Hadley','Jessup','Kimball','Lattimore','Mabry','Nolan','Oakley','Pendleton','Quarles','Rowland','Sutter','Talbot','Upton','Vance','Whitaker','Yates','Ackerman','Barlow','Crowder','Dunlap','Ellison','Finch','Gentry','Hollis','Keane','Lowry','Mercer','Noble','Ortega','Prescott','Radford','Shelby','Thorne','Underwood','Voss','Weller','Abbott','Brandt','Corley','Driscoll','Eckert','Galloway','Harmon','Jansen','Kessler','Nash','Overton','Ramsey','Sloan','Tolliver','Vickers','Wainwright','Yancey','Barrett','Colston','Delgado','Easton','Farris','Grady','Hatcher','Lyle','Mosley','Purcell']
for nm,lst in (('COACH_FIRST',GF),('COACH_LAST',GL)):
    a=s.index('const %s=['%nm);b=s.index('];',a)+2
    s=s[:a]+'const %s=%s;'%(nm,json.dumps(lst).replace('"',"'"))+s[b:]

# trademarked names stay out of the public copy: fictional conferences, award and playoff names
CN={'SEC':'Deep South','Big Ten':'Great Lakes','Big 12':'Plains','ACC':'Seaboard','American':'Metro','Mountain West':'Rockies','Pac-12':'Pacific Rim','Sun Belt':'Bayou','MAC':'Midlands','Conference USA':'Heritage'}
a=s.index('const CONFS={');b=s.index('};',a)+2
blk=s[a:b]
for k,v in CN.items():
    assert ("name:'%s'"%k) in blk,k
    blk=blk.replace("name:'%s'"%k,"name:'%s'"%v)
s=s[:a]+blk+s[b:]
s=re.sub(r'(?<![A-Za-z])Heisman','Iron Helmet',s)
s=s.replace('College Football Playoff','National Playoff')
open(dst,'w').write(s)
# also emit the real-name league as an import file
open(dst+'.league.txt','w').write('\n'.join('%s | %s | %s | %s'%(r[0].replace("\\'","'"),r[1].replace("\\'","'"),r[4],r[2]) for r in rows)+'\n')
print('fictional page written; real names remaining:', sum(s.count(r[0]) for r in rows if r[0] not in ('Texas','Florida','Georgia','Ohio','Miami','Washington','Houston','Memphis','Buffalo','Toledo','Charlotte','Tulsa','Delaware','Liberty','Navy','Army','Rice','Temple','Hawaii','Nevada','Wyoming','Kent State','Akron')))
