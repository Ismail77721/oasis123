from pathlib import Path
import cairosvg, math
r=Path(__file__).resolve().parent.parent / 'assets' / 'art';r.mkdir(exist_ok=True,parents=True)
PRE='''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="220" viewBox="0 0 200 220"><defs>
<linearGradient id="leaf" x2=".4" y2="1"><stop stop-color="#82d468"/><stop offset=".50" stop-color="#48a75e"/><stop offset="1" stop-color="#277c51"/></linearGradient>
<linearGradient id="sand" x2=".3" y2="1"><stop stop-color="#fce6a0"/><stop offset="1" stop-color="#cca166"/></linearGradient>
<linearGradient id="terracotta" x2=".8" y2="1"><stop stop-color="#f9ce8a"/><stop offset=".5" stop-color="#da995e"/><stop offset="1" stop-color="#a8683e"/></linearGradient>
<linearGradient id="water" x2=".65" y2="1"><stop stop-color="#a4f4e3"/><stop offset="1" stop-color="#299ac3"/></linearGradient>
<radialGradient id="fruit"><stop stop-color="#d2ed84"/><stop offset=".55" stop-color="#72c451"/><stop offset="1" stop-color="#318346"/></radialGradient>
<radialGradient id="melon"><stop stop-color="#fff1a0"/><stop offset=".66" stop-color="#e6c35c"/><stop offset="1" stop-color="#b99543"/></radialGradient>
<radialGradient id="pom"><stop stop-color="#ff9e6f"/><stop offset=".68" stop-color="#e95348"/><stop offset="1" stop-color="#a9333a"/></radialGradient>
<radialGradient id="fig"><stop stop-color="#cd9cea"/><stop offset=".65" stop-color="#9957bb"/><stop offset="1" stop-color="#66347b"/></radialGradient></defs>
<ellipse cx="100" cy="198" rx="66" ry="12" fill="#78552a" opacity=".20"/>
'''
POST='</svg>'
def output(name, art):
 path=r/(name+'.png');cairosvg.svg2png(bytestring=(PRE+art+POST).encode(),write_to=str(path),output_width=400,output_height=440)
 print(name,path.stat().st_size)
# watermelons and melons surrounded by leaf vines
for kind in ['watermelon','melon','clover']:
 for ripe in [False,True]:
  content='''<g stroke="#317a48" stroke-width="6" fill="none" stroke-linecap="round"><path d="M58 183 Q85 160 112 174 Q143 186 158 164"/><path d="M93 179 Q98 148 125 151"/></g>'''
  for x,y,rot in [(61,171,-30),(93,166,35),(133,180,65),(107,145,-42),(155,154,15)]:
   content+=f'<path d="M{x} {y} q-21 -20 -25 -1 q13 16 25 1 q13 -18 25 -4 q-5 18 -25 4" fill="url(#leaf)" stroke="#287649" stroke-width="2" transform="rotate({rot} {x} {y})"/>'
  if kind=='clover':
   for x,y,scale in [(65,163,.8),(105,146,1),(140,174,.85)]:
    content+=f'<g transform="translate({x} {y}) scale({scale})"><path d="M0 12 Q-12 -5 -17 -17 Q-12 -31 0 -21 Q12 -31 17 -17 Q12 -5 0 12" fill="url(#leaf)" stroke="#2a8042" stroke-width="2"/>'
    if ripe:content+='<circle cx="0" cy="-10" r="4" fill="#fcf2a5"/>'
    content+='</g>'
  elif ripe:
   color='url(#fruit)' if kind=='watermelon' else 'url(#melon)'
   for x,y,s in [(74,167,1),(127,178,.86)]:
    content+=f'<g transform="translate({x} {y}) scale({s})"><ellipse cy="-6" rx="28" ry="22" fill="{color}" stroke="#{"246942" if kind=="watermelon" else "bb9b48"}" stroke-width="3"/>'
    if kind=='watermelon':
     content+='<path d="M-14 -23 Q-20 -4 -13 10 M0 -27 Q-5 -5 0 15 M15 -24 Q22 -3 14 10" fill="none" stroke="#256c40" stroke-width="3" opacity=".75"/>'
    else:
     content+='<path d="M-17 -17 Q0 -24 17 -17 M-24 -5 Q0 -12 24 -5 M-16 8 Q0 1 16 8" fill="none" stroke="#b99543" stroke-width="2" opacity=".65"/>'
    content+='</g>'
  output(f'{kind}-'+('ripe' if ripe else 'grow'),content)
# trees and bushes
for kind in ['fig','pomegranate']:
 for ripe in [False,True]:
  a='''<path d="M99 193 Q94 155 101 115" stroke="#895633" stroke-width="12" stroke-linecap="round" fill="none"/>
<path d="M101 161 Q79 132 62 132 M101 143 Q122 120 149 128" stroke="#895633" stroke-width="7" fill="none" stroke-linecap="round"/>'''
  for x,y,rad in [(70,117,30),(101,98,37),(137,116,33),(92,140,29),(132,145,24)]:
   a+=f'<ellipse cx="{x}" cy="{y}" rx="{rad}" ry="{rad*.72}" fill="url(#leaf)" stroke="#267750" stroke-width="3"/>'
   a+=f'<path d="M{x-rad*.45} {y-4} Q{x} {y-rad*.6} {x+rad*.7} {y-7}" stroke="#a5e991" stroke-width="3" fill="none" opacity=".6"/>'
  if ripe:
   for x,y in [(67,133),(101,118),(135,127),(117,154),(78,153)]:
    a+=f'<ellipse cx="{x}" cy="{y}" rx="10" ry="12" fill="url(#{"fig" if kind=="fig" else "pom"})" stroke="#{"66347b" if kind=="fig" else "9e352c"}" stroke-width="2"/>'
    if kind=='pomegranate':a+=f'<path d="M{x-4} {y-11} l-3 -6 7 3 7 -3 -3 6" fill="#d9b651"/>'
  output(f'{kind}-'+('ripe' if ripe else 'grow'),a)
# palm
for ripe in [False,True]:
 a='''<path d="M101 194 Q93 143 104 87" fill="none" stroke="#805335" stroke-width="20" stroke-linecap="round"/>
<path d="M101 194 Q93 143 104 87" fill="none" stroke="#b77c46" stroke-width="9" stroke-linecap="round" stroke-dasharray="9 8"/>
'''
 for deg in [0,45,90,135,180,225,270,315]:
  d=math.radians(deg); x=104+math.cos(d)*77; y=85+math.sin(d)*30
  a+=f'<path d="M104 83 Q{104+math.cos(d)*42:.1f} {65+math.sin(d)*10:.1f} {x:.1f} {y:.1f} Q{104+math.cos(d)*35:.1f} {105+math.sin(d)*27:.1f} 104 83" fill="url(#leaf)" stroke="#286d47" stroke-width="2"/>'
  for n in range(3):
   v=(n+1)/4;px=104+math.cos(d)*77*v;py=83+math.sin(d)*30*v
   a+=f'<path d="M{px:.1f} {py:.1f} l{-math.sin(d)*12:.1f} {math.cos(d)*9+7:.1f}" stroke="#3d9c58" stroke-width="3"/>'
 if ripe:
  for x,y in [(89,117),(106,112),(119,123),(97,130),(112,135)]:a+=f'<ellipse cx="{x}" cy="{y}" rx="5" ry="9" fill="#c7943d" stroke="#85532b" stroke-width="1"/>'
 output('dates-'+('ripe' if ripe else 'grow'),a)
# sheep closed tent
output('building-sheep','''<path d="M33 164 L99 68 169 166 Z" fill="#413b32" stroke="#2f2b27" stroke-width="5"/>
<path d="M99 68 L99 164 169 166 Z" fill="#625346"/>
<path d="M51 149 L99 84 147 150" stroke="#bb9064" stroke-width="5" fill="none" opacity=".8"/>
<path d="M36 164 L169 166 161 189 44 188Z" fill="#8e6345" stroke="#4c392e" stroke-width="4"/>
<path d="M86 188 L99 136 112 188Z" fill="#272722"/>
<path d="M24 195 L24 111 M175 195 L175 116" stroke="#745035" stroke-width="5"/>
<path d="M24 110 L98 67 175 115" stroke="#d8b77c" stroke-width="2" fill="none"/>
<path d="M55 166 L75 166 M124 166 L146 166" stroke="#e0b47b" stroke-width="3"/>''')
# camel closed adobe building - no animal
output('building-camel','''<path d="M36 104 L163 104 160 188 37 188Z" fill="url(#terracotta)" stroke="#905a37" stroke-width="5"/>
<path d="M25 107 L95 61 178 107Z" fill="#af6b43" stroke="#814c33" stroke-width="5"/>
<path d="M53 108 L100 80 148 107" fill="none" stroke="#e9b676" stroke-width="3"/>
<path d="M81 188 L81 141 Q100 118 119 141 L119 188" fill="#604331" stroke="#855638" stroke-width="5"/>
<rect x="85" y="145" width="13" height="42" fill="#94674b"/>
<rect x="102" y="145" width="13" height="42" fill="#9d6f50"/>
<path d="M83 154 L115 154 M83 170 L115 170" stroke="#cba17a" stroke-width="2"/>
<rect x="49" y="122" width="17" height="22" rx="4" fill="#815538" stroke="#e7b67b" stroke-width="3"/>
<rect x="136" y="122" width="17" height="22" rx="4" fill="#815538" stroke="#e7b67b" stroke-width="3"/>
<path d="M37 164 L81 164 M119 164 L160 164" stroke="#a56f45" stroke-width="3"/>''')
# fountain/well
output('well','''<ellipse cx="100" cy="187" rx="77" ry="25" fill="#9b794a" opacity=".4"/>
<path d="M47 127 Q100 94 154 128 L150 180 Q100 210 51 181Z" fill="url(#terracotta)" stroke="#96643d" stroke-width="5"/>
<path d="M51 130 Q101 99 151 130 L150 150 Q99 179 50 149Z" fill="#916648"/>
<ellipse cx="100" cy="132" rx="55" ry="23" fill="#f2cf96" stroke="#ab7c4b" stroke-width="5"/>
<ellipse cx="100" cy="132" rx="44" ry="15" fill="url(#water)" stroke="#3e97a9" stroke-width="2"/>
<path d="M81 128 Q98 124 114 131 M93 139 Q112 139 126 135" fill="none" stroke="#d6fcf1" stroke-width="3" opacity=".75"/>
<path d="M51 158 L68 162 M78 169 L94 172 M106 172 L124 169 M133 163 L149 156" stroke="#edc48b" stroke-width="4"/>
<path d="M64 118 L64 72 M136 118 L136 72" stroke="#915e38" stroke-width="8"/>
<path d="M48 77 L99 42 152 77Z" fill="#cb874b" stroke="#97633d" stroke-width="5"/>
<path d="M65 78 L99 56 136 78" fill="none" stroke="#eec38e" stroke-width="4"/>''')

# Trim transparent padding to make sprites readable at phone screen sizes.
from PIL import Image
for png in r.glob('*.png'):
    im=Image.open(png).convert('RGBA')
    bbox=im.getchannel('A').getbbox()
    if bbox:
        l,t,right,b=bbox;pad=14
        cropped=im.crop((max(0,l-pad),max(0,t-pad),min(im.width,right+pad),min(im.height,b+pad)))
        cropped.save(png,optimize=True)
