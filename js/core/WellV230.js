/* One footprint for rendering, placement and the water network. */
(function(){'use strict';const L=OasisMapLayout,C=OASIS_CONFIG,G=OasisGameState;
function area(s,anchor=C.wellIndex){const n=s.worldSize,r=Math.floor(anchor/n),c=anchor%n,k=s.wellSize||2;return Array.from({length:k*k},(_,i)=>(r+Math.floor(i/k))*n+c+i%k).filter(i=>i>=0&&i<n*n&&i%n>=c);}
function inside(s,i){const n=s.worldSize,r=Math.floor(i/n),c=i%n,a=C.wellIndex,k=s.wellSize||2;return Number.isInteger(i)&&r>=Math.floor(a/n)&&r<Math.floor(a/n)+k&&c>=a%n&&c<a%n+k;}
const object=L.objectAt;L.objectAt=function(s,i){return inside(s,i)?{kind:'well',anchor:C.wellIndex}:object(s,i);};
// The original placement functions close over objectAt: their well size is updated in MapLayout too.
function migrate(s){if(s.wellSize===3)return s;const n=s.worldSize,old=C.wellIndex,or=Math.floor(old/n),oc=old%n;
 function free(a){let r=Math.floor(a/n),c=a%n;if(r<0||c<0||r+3>n||c+3>n)return false;for(let dr=0;dr<3;dr++)for(let dc=0;dc<3;dc++){const o=L.objectAt(s,(r+dr)*n+c+dc);if(o&&!['well','canal'].includes(o.kind))return false;}return true;}
 let anchor=old;if(!free(anchor)){const candidates=[];for(let r=0;r<n-2;r++)for(let c=0;c<n-2;c++)candidates.push(r*n+c);candidates.sort((a,b)=>Math.abs(Math.floor(a/n)-or)+Math.abs(a%n-oc)-Math.abs(Math.floor(b/n)-or)-Math.abs(b%n-oc));anchor=candidates.find(free);}
 if(anchor===undefined){s.wellUpgradePending=true;return s;} // never replace a player's crop to make room
 s.wellSize=3;s.wellArea=true;s.wellPosition={row:Math.floor(anchor/n),col:anchor%n};C.wellIndex=anchor;delete s.wellUpgradePending;
 // Retain channels inside the new footprint as hidden hydraulic connections.
 // If a crowded save required relocating the well, reconnect its old inlet along free cells.
 if(anchor!==old){const queue=area(s),seen=new Set(queue),parents=new Map();let reached=false;for(let k=0;k<queue.length;k++){const i=queue[k];if(i===old){reached=true;break;}for(const j of [i-n,i+n,i-1,i+1]){if(j<0||j>=n*n||Math.abs(Math.floor(i/n)-Math.floor(j/n))+Math.abs(i%n-j%n)!==1||seen.has(j))continue;const o=L.objectAt(s,j);if(o&&!['well','canal'].includes(o.kind))continue;seen.add(j);parents.set(j,i);queue.push(j);}}if(reached){let i=old;while(parents.has(i)){if(!inside(s,i))s.tiles[i].canal=true;i=parents.get(i);}}}
 return s;}
const fresh=G.createNew,normal=G.normalize;G.createNew=()=>migrate(fresh());G.normalize=s=>migrate(normal(s));
window.OasisWell={area,inside,migrate};C.version='2.3.0';
})();
