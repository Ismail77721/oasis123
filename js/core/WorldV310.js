(function(){'use strict';const G=OasisGameState,L=OasisMapLayout,W=OasisWorld,C=OASIS_CONFIG;
function enlarge(s){if(s.houseLayout34)return s;const old={...s.house};if(old.size===7){s.houseLayout34=true;return s;}const n=s.worldSize,origin=old.row*n+old.col;
 const free=i=>{const area=W.rect(s,i,7,7);return area&&area.every(j=>{const o=L.objectAt(s,j);return !o||o.kind==='home';});};
 const choices=Array.from({length:n*n},(_,i)=>i).sort((a,b)=>Math.abs(Math.floor(a/n)-old.row)+Math.abs(a%n-old.col)-Math.abs(Math.floor(b/n)-old.row)-Math.abs(b%n-old.col));const a=choices.find(free);
 if(a!==undefined){s.house={...old,size:7,row:Math.floor(a/n),col:a%n};s.houseLayout34=true;W.invalidate(s);}else{s.houseEnlargementPending=true;}return s;}
const norm=G.normalize,fresh=G.createNew;G.normalize=s=>enlarge(norm(s));G.createNew=()=>enlarge(fresh());const expand=OasisFamilyLand.expand;OasisFamilyLand.expand=s=>{const r=expand(s);if(r.ok){enlarge(s);if(s.houseLayout34)delete s.houseEnlargementPending;}return r;};
C.version='3.4.0';window.OasisIrrigation={rows:s=>OasisProgression.irrigationRadius(s),distance:s=>OasisProgression.irrigationRadius(s)*2-1};window.OasisHouse31={enlarge};
})();
