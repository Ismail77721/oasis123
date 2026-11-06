'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),context={window:{},console,Math,Date,Number,JSON,Array,Set,Map,Intl};
context.Phaser={Scene:class{constructor(){}}};vm.createContext(context);
const include=name=>vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
for(const file of ['js/config.js','js/core/ProgressionSystem.js','js/core/GameState.js','js/core/TimeSystem.js','js/core/EconomySystem.js','js/core/DailyQuestSystem.js','js/core/SadakaSystem.js','js/core/LandFamilySystem.js','js/scenes/MainScene.js','js/scenes/SceneV160.js']){
 include(file);Object.assign(context,context.window);
}
const L=context.OasisFamilyLand,G=context.OasisGameState,E=context.OasisEconomy,C=context.OASIS_CONFIG,B=context.OASIS_BUILDINGS,S=context.OasisSadaka;
let s=G.createNew();
assert.equal(C.worldSize,16);assert.equal(C.wellIndex,119);assert.equal(s.tiles.length,256);
assert.equal(C.dayMinutes,60);assert.equal(C.nightMinutes,60);assert.equal(s.house.level,1);assert.equal(L.footprint(s).length,16);
assert(!L.footprint(s).includes(C.wellIndex));
assert.equal(E.plant(s,L.footprint(s)[0],'clover').ok,false,'house must reject planting');
assert(B.mill&&B.loom&&B.mill.product==='flour'&&B.loom.product==='cloth');
assert.equal(s.inventory.flour,0);assert.equal(s.inventory.cloth,0);
// Starter needs must be achievable; food can also be bought with coins.
assert(s.family.needs.every(x=>C.crops[x.id]));
assert.equal(s.family.met,false);s.inventory.watermelon=3;
let fed=L.feed(s,1000000);assert.equal(fed.ok,true);assert.equal(s.family.met,true);assert.equal(s.inventory.watermelon,2);
assert.equal(L.feed(s,1000001).ok,false,'cannot repeat feeding same day');
L.ensureFamily(s,1000000+7200001);assert.equal(s.family.met,false,'family needs reset after full 2h cycle');
// House upgrades cost money, levels bounded.
s.coins=6000;const lvl=s.house.level;const up=L.upgradeHome(s);assert(up.ok&&s.house.level===lvl+1);assert(s.coins<6000);
// Expand twice and preserve the relative positions of every former tile.
s.tiles[120].crop='watermelon';s.tiles[120].plantedAt=12345;s.tiles[136].building='sheep';
const sourcePositions=[{r:7,c:8,field:'crop',value:'watermelon'},{r:8,c:8,field:'building',value:'sheep'}];
const homeCopy={...s.house},wellOld=C.wellIndex;
const first=L.expand(s);assert(first.ok);assert.equal(s.worldSize,20);assert.equal(C.wellIndex,(7+2)*20+7+2);
assert.equal(s.tiles[9*20+10].crop,'watermelon');assert.equal(s.tiles[10*20+10].building,'sheep');
assert.equal(s.house.row,homeCopy.row+2);assert.equal(s.house.col,homeCopy.col+2);assert.equal(s.tiles.length,400);
const reloaded=G.normalize(JSON.parse(JSON.stringify(s)));assert.equal(reloaded.tiles[9*20+10].crop,'watermelon');assert.equal(reloaded.house.row,s.house.row);assert.equal(C.wellIndex,(7+2)*20+7+2);
const second=L.expand(s);assert(second.ok);assert.equal(s.worldSize,24);assert.equal(s.tiles.length,576);
assert.equal(s.tiles[11*24+12].crop,'watermelon');assert.equal(s.tiles[12*24+12].building,'sheep');assert.equal(L.expansionPrice(s),null);assert.equal(L.expand(s).ok,false);
assert.equal(G.normalize(JSON.parse(JSON.stringify(s))).tiles[11*24+12].crop,'watermelon');
// Normal new game must reset world size and start with first house.
s=G.createNew();assert.equal(s.worldSize,16);assert.equal(C.wellIndex,wellOld);
// Composite orders include seeds/raw/processed products at more advanced levels.
s.totalSold=1000000;s.coins=2000;s.tiles[80].building='mill';s.tiles[81].building='loom';
const orders=E.ensureOrders(s);assert.equal(orders.length,6);assert(orders.some(x=>x.items.length>1),'at least one composite order');
assert.equal(new Set(orders.map(o=>o.items.map(i=>`${i.category}:${i.id}:${i.quantity}`).join('|'))).size,6,'unique orders');
assert(orders.every(o=>o.reward>0));
const multi=orders.find(o=>o.items.length>1);let needed={};
for(const it of multi.items){const field=it.category==='seed'?'seedBank':'inventory';s[field][it.id]=it.quantity+1;needed[`${field}:${it.id}`]=s[field][it.id];}
const idx=s.orders.indexOf(multi);let beforeOrders=s.ordersCompleted,beforeCoins=s.coins;
const done=E.completeOrder(s,idx);assert(done.ok,done.reason);assert.equal(s.ordersCompleted,beforeOrders+1);assert(s.coins>beforeCoins);
for(const it of multi.items){const field=it.category==='seed'?'seedBank':'inventory';assert.equal(s[field][it.id],needed[`${field}:${it.id}`]-it.quantity);}
// Sale recognizes new finished goods.
s.inventory.flour=5;s.inventory.cloth=4;assert(E.sell(s,'flour',2).ok);assert(E.sell(s,'cloth',2).ok);
// Sadaqa: exact id, not the undefined key from v1.5.
const req=S.list(s).find(x=>x.coins);assert(req);const got=S.donate(s,req.id);assert(got.ok,got.reason);assert.equal(S.donate(s,req.id).ok,false);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const sceneCode=fs.readFileSync(path.join(root,'js/scenes/SceneV160.js'),'utf8');
assert(html.includes('id="home-panel"')&&html.includes('id="family-hud"'));assert(!html.includes('patch_v150.js'));
assert(sceneCode.includes('OasisSadaka.donate(this.s,req.id)'));
assert(!sceneCode.includes('barakatPoints')&&!sceneCode.includes('Баракат'));
for(let i=1;i<=5;i++)assert(fs.existsSync(path.join(root,'assets/art/home-'+i+'.png')));
console.log('PASS v1.6: house blocking/feeding/upgrades, 16→20→24 expansion with save roundtrip, home assets, composite orders, flour/cloth sale, sadaka id and hidden barakat');
