(function(){'use strict';const C=OASIS_CONFIG,L=OasisMapLayout,W=OasisWorld;
const neighbors=(s,i)=>[i-s.worldSize,i+s.worldSize,i-1,i+1].filter(j=>j>=0&&j<s.tiles.length&&Math.abs(Math.floor(i/s.worldSize)-Math.floor(j/s.worldSize))+Math.abs(i%s.worldSize-j%s.worldSize)===1);
function quote(s,path){const unique=[...new Set(path)],n=s.worldSize,empty=[];if(!unique.length)return{ok:false,reason:'Выбери сегмент канала'};for(const i of unique){if(!Number.isInteger(i)||i<0||i>=s.tiles.length)return{ok:false,reason:'За границей участка'};const o=L.objectAt(s,i);if(o&&!['canal','well'].includes(o.kind))return{ok:false,reason:'Участок занят'};if(!o)empty.push(i);}if(!empty.length)return{ok:false,reason:'Здесь уже есть канал'};
const selected=new Set(unique),water=i=>i>=0&&i<s.tiles.length&&!OasisWell.inside(s,i)&&(s.tiles[i].canal||selected.has(i));
for(const i of empty){for(const a of [i,i-1,i-n,i-n-1]){if(a<0||a%n===n-1||Math.floor(a/n)>=n-1)continue;const square=[a,a+1,a+n,a+n+1];if(square.every(water))return{ok:false,reason:'Ширина канала — одна клетка. Поверни сегмент или выбери соседнее место'};}}
const queue=OasisWell.area(s),seen=new Set(queue);for(let k=0;k<queue.length;k++)for(const j of neighbors(s,queue[k]))if(!seen.has(j)&&(selected.has(j)||s.tiles[j].canal)){seen.add(j);queue.push(j);}if(unique.some(i=>!seen.has(i)))return{ok:false,reason:'Соедини сегмент с колодцем или действующим каналом'};
const price=empty.length*OasisProgression.canalPrice(s);return{ok:s.coins>=price,empty,price,reason:s.coins<price?'Нужно '+price+' монет, сейчас '+s.coins:undefined};}
L.canalQuote=quote;L.layCanal=(s,path,axis)=>{const q=quote(s,path);if(!q.ok)return q;for(const i of q.empty)Object.assign(s.tiles[i],{canal:true,canalAxis:axis||'row'});s.coins-=q.price;s.stats.canalsBuilt=(s.stats.canalsBuilt||0)+q.empty.length;W.invalidate(s);return q;};
const priorMove=L.move;L.move=(s,o,i)=>{const q=L.check(s,i,o);if(!q.ok)return q;return priorMove(s,o,i);};
C.version='3.3.0';window.OasisCanal32={neighbors,quote};
})();
