from pathlib import Path
from PIL import Image
import json,re,numpy as np
p=Path(__file__).resolve().parents[1]
html=(p/'index.html').read_text()
for url in re.findall(r'(?:src|href)="([^"#]+)"',html):
 if url.startswith(('https:','http:','data:')):continue
 assert (p/url.split('?')[0]).exists(),url
s=(p/'js/core/CartoonAssets.js').read_text();a=json.loads(s.split('=',1)[1].split(';',1)[0])
for key in a:
 assert (p/a[key]['file']).exists(),key
annual=['watermelon','clover','melon','cumin','flowers','barley','wheat']
for id in annual:
 for stage in range(6):
  key=f'{id}-{stage}';m=a[key];im=Image.open(p/m['file']).convert('RGBA');ys,xs=np.where(np.array(im)[:,:,3]>40);w,h=im.size
  scale=.94/max(m['rm'],m['cm'])
  # In grid units a centered 2x2 footprint has |row|, |column| <= 1.
  row=(2*(ys-h/2)-(xs-w/2))/w*scale;col=(2*(ys-h/2)+(xs-w/2))/w*scale
  assert np.max(np.abs(row))<1 and np.max(np.abs(col))<1,key
print('PASS local entrypoint assets and all 42 annual crop stages contained within 2x2 grid footprints')
