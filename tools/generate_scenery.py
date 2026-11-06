"""Generate cohesive sand landscape and market panorama using reference-derived original sprites."""
from PIL import Image,ImageDraw,ImageFilter,ImageEnhance
from pathlib import Path
import numpy as np, random, math
P=Path(__file__).resolve().parents[1]/'assets'/'art';random.seed(1741)

def sand_scene(w,h,market=False):
 yy,xx=np.indices((h,w),dtype=np.float32)
 rng=np.random.default_rng(113)
 cloud=np.array(Image.fromarray(rng.integers(0,255,(max(1,h//22),max(1,w//22)),dtype=np.uint8)).resize((w,h),Image.Resampling.BICUBIC),dtype=np.float32)/255-.5
 grain=rng.normal(0,.7,(h,w)).astype('float32')
 base=np.zeros((h,w,3),dtype=np.float32)
 glow=np.exp(-((xx-w*.3)/(w*.61))**2-((yy-h*.10)/(h*.6))**2)
 for ch,(a,dy,g) in enumerate([(239,-13,7),(197,-16,18),(130,-12,30)]):
  base[:,:,ch]=a+dy*(yy/h)+g*glow+cloud*10+grain
 arr=np.clip(base,0,255).astype('uint8')
 im=Image.fromarray(arr,'RGB').convert('RGBA')
 d=ImageDraw.Draw(im,'RGBA')
 # dunes far from center, organic curves not a tile board
 for k in range(0 if market else 9):
  cy=int((.16+.085*k)*h);x=int(random.random()*w);rx=int(w*(.10+random.random()*.1));ry=int(h*(.010+random.random()*.023))
  d.ellipse((x-rx,cy-ry,x+rx,cy+ry),fill=(185,133,61,13))
 # some distant rocks and sparse tufts of grass, subtle enough to keep interaction clear
 for i in range(75 if market else 125):
  x=int(random.random()*w);y=int(random.random()*h)
  if market and y<h*.79:continue
  r=2+random.random()*4.5
  if i%4==0:
   d.ellipse((x-r,y-r*.35,x+r,y+r*.38),fill=(154,104,53,44))
   d.ellipse((x-r*.7,y-r*.4,x+r*.5,y+r*.10),fill=(253,229,174,65))
  else:
   color=(83,121,54,82) if i%3==0 else (162,115,59,60)
   d.line((x,y,x-3,y-3-r*.5),fill=color,width=2)
   d.line((x,y,x+4,y-2-r*.6),fill=color,width=2)
 return im

ground=sand_scene(1600,1000);ground.save(P/'ground-desert.png',optimize=True)

w,h=1600,580
market=sand_scene(w,h,True)
d=ImageDraw.Draw(market,'RGBA')
# sandstone city wall in far background
coords=[(0,370),(0,288),(110,281),(110,259),(172,257),(172,278),(322,278),(322,249),(384,251),(384,270),(515,267),(515,251),(590,250),(590,269),(850,267),(850,254),(910,253),(910,270),(1130,275),(1130,255),(1200,256),(1200,279),(1600,285),(1600,395)]
d.polygon(coords,fill=(197,132,79,96))
d.line((0,295,1600,295),fill=(255,227,170,92),width=5)
# irregular warm sandstone court rather than checkerboard
for k in range(15):
 y=405+k*14;col=(176,129,76,11) if k%2==0 else (255,239,192,15)
 d.line([(0,y+30*math.sin(k)),(800,y),(1600,y+20*math.cos(k))],fill=col,width=2)
# Ground shadow below market hall
shadow=Image.new('RGBA',(w,h),(0,0,0,0));sd=ImageDraw.Draw(shadow)
sd.ellipse((325,435,1310,580),fill=(82,48,20,78))
shadow=shadow.filter(ImageFilter.GaussianBlur(35));market=Image.alpha_composite(market,shadow)

def paste_sprite(key,xy,size):
 global market
 im=Image.open(P/(key+'.png')).convert('RGBA');im.thumbnail(size,Image.Resampling.LANCZOS)
 market.alpha_composite(im,(int(xy[0]-(im.width/2)),int(xy[1]-im.height)))

paste_sprite('ref-market',(825,548),(765,550))
paste_sprite('ref-jars',(1335,549),(250,225))
paste_sprite('ref-rugs',(281,540),(280,225))
paste_sprite('ref-fence',(1430,557),(300,126))
paste_sprite('ref-grass',(115,553),(130,120))
market.convert('RGB').save(P/'market-panorama.jpg',quality=93,optimize=True)
print('Generated ground-desert.png, market-panorama.jpg')
