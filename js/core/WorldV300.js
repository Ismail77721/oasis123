(function(){'use strict';
const C=OASIS_CONFIG,G=OasisGameState,L=OasisMapLayout,F=OasisFamilyLand,E=OasisEconomy;
C.version='3.0.0';
// Build one occupancy index per model mutation. Large farms do not rescan nearby buildings per pixel.
let cachedState,cachedVersion=-1,grid;
function invalidate(s){s.mapRevision=(s.mapRevision||0)+1;cachedState=null;}
function rect(s,a,rows,cols){const n=s.worldSize,r=Math.floor(a/n),c=a%n;if(!Number.isInteger(a)||a<0||r+rows>n||c+cols>n)return null;return Array.from({length:rows*cols},(_,i)=>(r+Math.floor(i/cols))*n+c+i%cols);}
function occupancy(s){if(cachedState===s&&cachedVersion===(s.mapRevision||0))return grid;grid=new Array(s.tiles.length);const put=(kind,a,area)=>{for(const i of area||[])grid[i]={kind,anchor:a};};
 s.tiles.forEach((t,i)=>{if(t.canal)put('canal',i,[i]);if(t.crop)put('crop',i,rect(s,i,2,2));if(t.building)put('building',i,rect(s,i,...L.buildingSize(t.building,t.buildingRotated)));});
 put('home',s.house.row*s.worldSize+s.house.col,F.footprint(s));put('well',C.wellIndex,OasisWell.area(s));cachedState=s;cachedVersion=s.mapRevision||0;return grid;}
L.objectAt=(s,i)=>occupancy(s)[i]||null;L.cropAt=(s,i)=>{const o=L.objectAt(s,i);return o?.kind==='crop'?o.anchor:null;};L.buildingAt=(s,i)=>{const o=L.objectAt(s,i);return o?.kind==='building'?o.anchor:null;};
L.areaFor=function(s,a,o){if(o.kind==='home')return rect(s,a,F.houseSide(s.house),F.houseSide(s.house));if(o.kind==='well')return rect(s,a,s.wellSize||3,s.wellSize||3);if(o.kind==='building')return rect(s,a,...L.buildingSize(o.id||s.tiles[o.anchor]?.building,o.rotated??s.tiles[o.anchor]?.buildingRotated));return rect(s,a,o.kind==='crop'?2:1,o.kind==='crop'?2:1);};
L.check=function(s,a,o){const area=L.areaFor(s,a,o);if(!area)return{ok:false,reason:'Участок выходит за границы фермы'};for(const i of area){const t=L.objectAt(s,i);if(t&&(t.kind!==o.kind||t.anchor!==o.anchor))return{ok:false,area,reason:'Участок занят'};}return{ok:true,area};};
for(const name of ['plant','harvest']){const old=E[name];E[name]=function(s,...args){const r=old(s,...args);if(r.ok)invalidate(s);return r;};}
for(const name of ['move','layCanal']){const old=L[name];L[name]=function(s,...args){const r=old(s,...args);if(r.ok)invalidate(s);return r;};}
for(const name of ['uproot','dismantle']){const old=OasisFarmSystems[name];OasisFarmSystems[name]=function(s,...args){const r=old(s,...args);if(r.ok)invalidate(s);return r;};}
const expand=F.expand;F.expand=function(s){const r=expand(s);if(r.ok)invalidate(s);return r;};
function migrate(s){
 if(s.cartoonGeometry===1){s.editorPausedAt=null;s.tool='plant';invalidate(s);return s;}
 // Preserve crops, canals, goods and production timestamps. Relocate only enlarged buildings.
 const buildings=s.tiles.flatMap((t,i)=>t.building?[{i,t:{...t}}]:[]);
 for(const b of buildings)s.tiles[b.i]=G.tile();invalidate(s);
 for(const b of buildings){let chosen=null;const n=s.worldSize,origin=b.i;
  const candidates=Array.from({length:n*n},(_,i)=>i).sort((a,c)=>(Math.abs(Math.floor(a/n)-Math.floor(origin/n))+Math.abs(a%n-origin%n))-(Math.abs(Math.floor(c/n)-Math.floor(origin/n))+Math.abs(c%n-origin%n)));
  chosen=candidates.find(i=>L.check(s,i,{kind:'building',id:b.t.building,rotated:b.t.buildingRotated}).ok);
  if(chosen===undefined){s.packedBuildings||=[];s.packedBuildings.push(b.t);}else s.tiles[chosen]=b.t;
  invalidate(s);
 }
 s.cartoonGeometry=1;s.editorPausedAt=null;s.tool='plant';
 for(const w of Object.values(s.workers||{})){w.state='idle';w.target=-1;}
 if(buildings.length){s.activityLog||=[];s.activityLog.push({at:Date.now(),text:'Постройки получили просторные участки. Если места не хватило, здание сохранено в разделе «Постройки → Сохранённые».'});}
 return s;
}
const normal=G.normalize,fresh=G.createNew;G.normalize=s=>migrate(normal(s));G.createNew=()=>migrate(fresh());
window.OasisWorld={invalidate,rect,occupancy,migrate};
})();
