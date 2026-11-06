/* Compatible saves: 10x10 legacy world is centered in expanded 16x16 map. */
(function(){'use strict';
 function tile(){return{crop:null,plantedAt:0,watered:false,canal:false,building:null,productionAt:0,perennialEstablished:false,lastIrrigationTick:0};}
 const size=()=>OASIS_CONFIG.worldSize;
 function fresh(){const seedBank={},inventory={};for(const id of Object.keys(OASIS_CONFIG.crops)){seedBank[id]=0;inventory[id]=0;}
  Object.assign(seedBank,{watermelon:2,clover:3});
  for(const b of Object.values(OASIS_BUILDINGS))inventory[b.product]=0;
  return {version:OASIS_CONFIG.version,worldSize:size(),createdAt:Date.now(),lastSavedAt:Date.now(),coins:100,energy:20,water:10,selectedCrop:'watermelon',seedEconomyVersion:1,seedBank,orders:[],ordersCompleted:0,lastRecoveryAt:0,tool:'plant',inventory,hiddenSadaqaTotal:0,barakatLevel:0,barakatPoints:0,totalDonated:0,totalSold:0,donationHistory:[],profile:{name:'',gender:'',created:false},tutorialStep:0,tutorialDone:false,dailyQuests:null,tools:{rake:1,spade:1,shears:1,vessel:1,bucket:1},upgrades:{harvest:1,irrigation:1},stats:{planted:0,harvested:0,canalsBuilt:0,buildingsBuilt:0},claimedQuests:[],tiles:Array.from({length:size()*size()},tile)};
 }
 function normalize(s){const f=fresh();if(!s||typeof s!=='object')return f;
  const x=Object.assign({},f,s);x.version=OASIS_CONFIG.version;x.worldSize=size();
  for(const key of ['coins','water','energy','totalSold','hiddenSadaqaTotal','barakatPoints','totalDonated'])x[key]=Number.isFinite(x[key])?Math.max(0,x[key]):(f[key]||0);
  x.inventory=Object.assign({},f.inventory,s.inventory||{});
  for(const key of Object.keys(x.inventory))x.inventory[key]=Number.isFinite(x.inventory[key])?Math.max(0,Math.floor(x.inventory[key])):0;
  x.profile=Object.assign({},f.profile,s.profile||{});x.profile.name=String(x.profile.name||'').slice(0,24);x.profile.gender=['male','female'].includes(x.profile.gender)?x.profile.gender:'';x.profile.created=!!x.profile.created;
  x.tutorialStep=Number.isInteger(x.tutorialStep)?Math.max(0,Math.min(7,x.tutorialStep)):0;x.tutorialDone=!!x.tutorialDone;
  x.tools=Object.assign({},f.tools,s.tools||{});
  if(!s.tools){x.tools.rake=Math.max(1,Math.min(10,(Number(s.upgrades?.harvest)||1)*2-1));x.tools.spade=Math.max(1,Math.min(10,(Number(s.upgrades?.irrigation)||1)*2-1));}
  for(const id of Object.keys(f.tools))x.tools[id]=Number.isInteger(x.tools[id])?Math.max(1,Math.min(10,x.tools[id])):1;
  x.water=Math.min(x.water,OasisProgression.maxWater(x));
  x.dailyQuests=s.dailyQuests&&typeof s.dailyQuests==='object'?s.dailyQuests:null;
  x.upgrades=Object.assign({},f.upgrades,s.upgrades||{});
  x.stats=Object.assign({},f.stats,s.stats||{});for(const key of Object.keys(f.stats))x.stats[key]=Number.isFinite(x.stats[key])?Math.max(0,Math.floor(x.stats[key])):0;
  x.seedBank=Object.assign({},f.seedBank,s.seedBank||{});
  if(s.seedEconomyVersion!==1){x.seedBank.watermelon=Math.max(x.seedBank.watermelon,2);x.seedBank.clover=Math.max(x.seedBank.clover,3);}
  for(const id of Object.keys(OASIS_CONFIG.crops))x.seedBank[id]=Number.isInteger(x.seedBank[id])?Math.max(0,x.seedBank[id]):0;
  x.seedEconomyVersion=1;x.orders=Array.isArray(s.orders)?s.orders.slice(0,6):[];x.ordersCompleted=Number.isInteger(s.ordersCompleted)?Math.max(0,s.ordersCompleted):0;
  x.lastRecoveryAt=Number.isFinite(s.lastRecoveryAt)?Math.max(0,s.lastRecoveryAt):0;
  x.claimedQuests=Array.isArray(s.claimedQuests)?[...new Set(s.claimedQuests.filter(v=>Number.isInteger(v)&&v>=0&&v<6))]:[];
  x.donationHistory=Array.isArray(s.donationHistory)?s.donationHistory.filter(v=>typeof v==='string').slice(-90):[];
  if(!Number.isFinite(s.barakatPoints)&&Number.isFinite(s.barakatLevel))x.barakatPoints=Math.max(0,s.barakatLevel)*35;
  x.barakatLevel=Math.min(20,Math.floor(x.barakatPoints/35));
  const source=Array.isArray(s.tiles)?s.tiles:[],side=Number.isInteger(s.worldSize)?s.worldSize:(source.length===size()*size()?size():10);
  const oldSide=Number.isInteger(side)&&side>0?side:10;
  let cells=Array.from({length:size()*size()},tile);
  if(oldSide===size()){
   for(let i=0;i<Math.min(source.length,cells.length);i++)cells[i]=Object.assign(tile(),source[i]||{});
  }else{
   const shift=Math.floor((size()-oldSide)/2);
   for(let i=0;i<source.length&&i<oldSide*oldSide;i++){
    const rr=Math.floor(i/oldSide)+shift,cc=i%oldSide+shift;
    if(rr>=0&&rr<size()&&cc>=0&&cc<size())cells[rr*size()+cc]=Object.assign(tile(),source[i]||{});
   }
  }
  x.tiles=cells.map(t=>{if(t.crop&&!OASIS_CONFIG.crops[t.crop])t.crop=null;if(t.building&&!OASIS_BUILDINGS[t.building])t.building=null;return t;});
  if(!OASIS_CONFIG.crops[x.selectedCrop])x.selectedCrop='watermelon';
  if(!['plant','canal','building','remove'].includes(x.tool))x.tool='plant';
  return x;
 }
 window.OasisGameState={createNew:fresh,normalize,tile};
})();
