"""Extract self-contained sprites from user-supplied reference image for the OASIS prototype.
Usage: python tools/extract_reference_art.py /path/to/reference.png
The source image is only read, not redistributed. Crops are output as transparent PNG.
"""
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw
from pathlib import Path
import numpy as np, cv2, sys

ref=Image.open(sys.argv[1]).convert('RGB')
W,H=ref.size
SX=W/1860; SY=H/800
out=Path(__file__).resolve().parents[1]/'assets'/'art'
out.mkdir(exist_ok=True)
# Independent objects from user's original reference. Each padded rectangle is in preview coordinates (1860×800).
regions={
 'ref-clover':(315,76,496,231),
 'ref-watermelon':(393,143,737,392),
 'ref-grass':(257,236,402,380),
 'ref-dates':(627,5,913,390),
 'ref-fig':(897,121,1087,386),
 'ref-pomegranate':(1071,122,1272,389),
 'ref-well':(1278,84,1479,323),
 'ref-sheep':(11,388,450,748),
 'ref-camel':(465,385,909,763),
 'ref-market':(899,372,1472,767),
 'ref-jars':(1651,408,1843,588),
 'ref-rugs':(1459,398,1658,609),
 'ref-fence':(1451,594,1851,754),
 'ref-canal':(1482,42,1850,197)
}

def extract(key,box):
 x0,y0,x1,y1=box; coords=tuple(round(v*(SX if j%2==0 else SY)) for j,v in enumerate(box))
 src=np.array(ref.crop(coords)); h,w=src.shape[:2]
 # mask segmentation with certainty away from object and at the central core
 # graphcut learns the warm, nearly uniform sand from edge bands
 m=np.full((h,w),cv2.GC_PR_BGD,dtype=np.uint8)
 b=max(7,round(min(h,w)*.035));m[:b,:]=cv2.GC_BGD;m[-b:,:]=cv2.GC_BGD;m[:,:b]=cv2.GC_BGD;m[:,-b:]=cv2.GC_BGD
 # dark and saturated colors are hard positives (green plants, wood, water, carpets)
 bgr=cv2.cvtColor(src,cv2.COLOR_RGB2BGR)
 hsv=cv2.cvtColor(bgr,cv2.COLOR_BGR2HSV)
 rgb=src.astype('int16')
 dark=(rgb[:,:,0]<150)&(rgb[:,:,1]<135)
 green=(rgb[:,:,1]>rgb[:,:,0]*.84)&(rgb[:,:,1]>rgb[:,:,2]*1.3)&(rgb[:,:,0]<200)
 blue=(rgb[:,:,2]>rgb[:,:,0]*.6)&(rgb[:,:,2]>rgb[:,:,1]*.89)&(rgb[:,:,1]<200)
 colorful=(hsv[:,:,1]>92)&(hsv[:,:,2]<212)
 cert=(dark|green|blue|colorful)
 cert[:b,:]=False;cert[-b:,:]=False;cert[:,:b]=False;cert[:,-b:]=False
 # assure at least seed pixels in central area
 if int(cert.sum())<50:cert[h//2-4:h//2+4,w//2-4:w//2+4]=True
 m[cert]=cv2.GC_FGD
 # probable foreground around center, independent of sand color; avoid hard mask outside
 iy0,iy1=int(h*.13),int(h*.89);ix0,ix1=int(w*.12),int(w*.89)
 middle=m[iy0:iy1,ix0:ix1];middle[middle==cv2.GC_PR_BGD]=cv2.GC_PR_FGD
 bg=np.zeros((1,65),np.float64);fg=np.zeros((1,65),np.float64)
 try:cv2.grabCut(bgr,m,None,bg,fg,6,cv2.GC_INIT_WITH_MASK)
 except Exception as e: print(key,'grabcut error',e)
 a=np.where((m==cv2.GC_FGD)|(m==cv2.GC_PR_FGD),255,0).astype('uint8')
 # remove little islands, keep components of material size
 n,lab,stats,cent=cv2.connectedComponentsWithStats(a)
 keep=np.zeros_like(a)
 area=max(200,int(w*h*.0007))
 for i in range(1,n):
  if stats[i,cv2.CC_STAT_AREA]>=area:keep[lab==i]=255
 # soften edges but keep nearly all details (3px feather)
 # Keep the main contiguous sprite and drop accidentally captured adjacent objects.
 if key in ('ref-watermelon','ref-dates','ref-clover','ref-canal','ref-market'):
  count,labels,st,_=cv2.connectedComponentsWithStats(keep)
  if count>1:
   largest=1+int(np.argmax(st[1:,cv2.CC_STAT_AREA]))
   keep=np.where(labels==largest,255,0).astype('uint8')
 # avoid neighboring objects at reference sheet edges
 if key=='ref-watermelon':
  for yy in range(h):
   if yy < h*.56:keep[yy,int(w*.78):]=0
   elif yy>h*.80:keep[yy,int(w*.92):]=0
 if key=='ref-dates':
  for yy in range(h):
   if yy>h*.36:keep[yy,:int(w*.26)]=0
 if key=='ref-market':
  keep[:int(h*.25),:int(w*.22)]=0
 if key=='ref-clover':
  keep[int(h*.86):,int(w*.84):]=0
 if key=='ref-canal':
  keep[int(h*.87):,int(w*.65):]=0
 a=cv2.GaussianBlur(keep,(3,3),.65)
 a[:b,:]=0;a[-b:,:]=0;a[:,:b]=0;a[:,-b:]=0
 # enlarge anti-aliased alpha just inside edge, remove apparent light halo
 alpha=Image.fromarray(a,'L'); img=Image.fromarray(src,'RGB').convert('RGBA');img.putalpha(alpha)
 bbox=alpha.getbbox()
 if bbox:img=img.crop((max(0,bbox[0]-2),max(0,bbox[1]-2),min(w,bbox[2]+2),min(h,bbox[3]+2)))
 img.save(out/(key+'.png'),optimize=True)
 return img

images={k:extract(k,b) for k,b in regions.items()}
# new transparent cropped textures become actual gameplay assets; growth sprites use small green growth versions.
for id,key in [('watermelon','ref-watermelon'),('clover','ref-clover'),('melon','ref-watermelon'),('fig','ref-fig'),('pomegranate','ref-pomegranate'),('dates','ref-dates')]:
 original=images[key].copy()
 if id=='melon':
  # color-balance the green fruit toward warm yellow while keeping rest original
  dat=np.array(original).astype('int16');R,G,B=dat[:,:,0],dat[:,:,1],dat[:,:,2]
  # intentionally keep greenery, tint only larger near-center fruits below canopy
  sel=(G>R*1.08)&(G>B*1.2)&(R<145)
  dat[:,:,0][sel]=np.minimum(255,R[sel]*1.5+30)
  dat[:,:,1][sel]=np.minimum(255,G[sel]*1.02+10)
  original=Image.fromarray(dat.astype('uint8'),'RGBA')
 original.thumbnail((560,450),Image.Resampling.LANCZOS)
 original.save(out/(id+'-ripe.png'),optimize=True)
 young=original.copy();young.thumbnail((round(original.width*.70),round(original.height*.70)),Image.Resampling.LANCZOS)
 young=ImageEnhance.Color(young).enhance(.90)
 young.save(out/(id+'-grow.png'),optimize=True)
for id,key in [('building-sheep','ref-sheep'),('building-camel','ref-camel'),('well','ref-well')]:
 original=images[key].copy();original.thumbnail((620,540),Image.Resampling.LANCZOS)
 original.save(out/(id+'.png'),optimize=True)
# contact sheet for visual quality review
thumbs=[]
for name in regions:
 img=images[name].copy();img.thumbnail((250,205))
 thumbs.append((name,img))
from PIL import ImageFont
sheet=Image.new('RGB',(1000,((len(thumbs)+3)//4)*265),(246,222,174));d=ImageDraw.Draw(sheet)
for j,(name,img) in enumerate(thumbs):
 x=(j%4)*250;y=(j//4)*265
 sheet.paste(img,(x+(250-img.width)//2,y+(216-img.height)//2),img)
 d.text((x+12,y+227),name,fill=(80,51,32))
sheet.save(str(out/'contact-sheet.jpg'),quality=90)
print('Extracted',len(images),'sprites from',ref.size)
