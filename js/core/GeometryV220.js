/* One-time lossless expansion of legacy anchors; never overwrites crops or production. */
(function(){'use strict';
const G=OasisGameState,C=OASIS_CONFIG,L=OasisMapLayout,E=OasisEconomy;
function migrate(s){
 if(!s.createdAt)s.createdAt=Date.now();if(s.geometryVersion===2)return s;
 const old=s.worldSize,n=old*4,tiles=Array.from({length:n*n},G.tile),at=i=>Math.floor(i/old)*4*n+(i%old)*4;
 const well=s.wellPosition? s.wellPosition.row*old+s.wellPosition.col:C.wellIndex;
 s.tiles.forEach((t,i)=>{const j=at(i);tiles[j]={...t};if(t.crop)tiles[j].cropArea=true;if(t.building)tiles[j].buildingArea=true;});
 // Subdivide each original water connection without charging the owner.
 s.tiles.forEach((t,i)=>{if(!t.canal&&i!==well)return;for(const step of [1,old]){const j=i+step;if(j>=old*old||(step===1&&Math.floor(i/old)!==Math.floor(j/old)))continue;if(!s.tiles[j]?.canal&&j!==well)continue;for(let k=1;k<4;k++)tiles[at(i)+k*(step===1?1:n)].canal=true;}});
 const oldTiles=s.tiles;s.tiles=tiles;s.worldSize=n;C.worldSize=n;C.wellIndex=at(well);s.wellPosition={row:Math.floor(C.wellIndex/n),col:C.wellIndex%n};s.wellArea=true;
 s.house={...s.house,row:s.house.row*4,col:s.house.col*4,size:OasisFamilyLand.houseSide(s.house)*2};
 for(const w of Object.values(s.workers||{})){for(const k of ['target','from'])if(w[k]>=0)w[k]=at(w[k]);w.state='idle';w.target=-1;}
 if(Array.isArray(s.workerPlan?.area))s.workerPlan.area=s.workerPlan.area.map(at);
 s.geometryVersion=2;s.activityLog=Array.isArray(s.activityLog)?s.activityLog.slice(-120):[];
 s.activityLog.push({at:Date.now(),text:'Участок перестроен на просторную сетку. Растения, постройки и запасы сохранены.'});
 return s;
}
const fresh=G.createNew,normalize=G.normalize;
G.createNew=()=>migrate(fresh());G.normalize=raw=>migrate(normalize(raw));
const plant=E.plant;
E.plant=function(s,i,id,now){if(s.geometryVersion===2){const q=L.check(s,i,{kind:'crop',id});if(!q.ok)return q;}const r=plant(s,i,id,now);if(r.ok&&s.geometryVersion===2)s.tiles[i].cropArea=true;return r;};
C.version='2.2.0';OASIS_BUILDINGS.camel.title='Загон для верблюдов';OASIS_BUILDINGS.sheep.title='Шатёр для овец';
window.OasisGeometry={migrate};
})();
