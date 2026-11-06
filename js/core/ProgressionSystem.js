/* Pure progression model shared by farm, market and automated tests. */
(function(){'use strict';
 const thresholds=[0,80,220,450,780,1200,1720,2350,3100,4000,5100,6400,7900,9650,11650,13900,16500,19450,22800,26500];
 // After level 20 the game continues indefinitely; increasingly demanding trade milestones.
 const bonusCost=k=>4000*k+275*k*(k-1);
 const level=s=>{const total=Math.max(0,Number(s.totalSold)||0);let lv=1;
  for(let i=1;i<thresholds.length;i++)if(total>=thresholds[i])lv=i+1;
  if(lv<20)return lv;
  const extra=Math.max(0,total-thresholds[19]);
  let k=Math.max(0,Math.floor((Math.sqrt(3725*3725+1100*extra)-3725)/550));
  while(k>0&&bonusCost(k)>extra)k--;
  while(bonusCost(k+1)<=extra)k++;
  return 20+k;
 };
 const nextTarget=s=>{const lv=level(s);return lv<20?thresholds[lv]:thresholds[19]+bonusCost(lv-19);};
 const rank=(s,id)=>Math.max(1,Math.min(10,Number(s.tools?.[id])||1));
 const toolPrice=(s,id)=>{const t=OASIS_TOOLS[id],r=rank(s,id);return t&&r<10?Math.round(t.base*Math.pow(t.scale,r-1)):null;};
 function upgrade(s,id){if(!OASIS_TOOLS[id])return{ok:false,reason:'Неизвестный инструмент'};const price=toolPrice(s,id);if(price===null)return{ok:false,reason:'Максимальный уровень'};if(s.coins<price)return{ok:false,reason:'Недостаточно монет'};s.coins=Math.round((s.coins-price)*100)/100;s.tools[id]=rank(s,id)+1;return{ok:true,price,level:s.tools[id]};}
 const maxWater=s=>10+2*(rank(s,'bucket')-1);
 const canalPrice=s=>Math.max(1,4-Math.floor((rank(s,'spade')-1)/3));
 const irrigationRadius=s=>rank(s,'spade')>=7?3:rank(s,'spade')>=4?2:1;
 const cropBonus=s=>Math.floor((rank(s,'rake')-1)/2);
 const woolBonus=s=>Math.floor((rank(s,'shears')-1)/2);
 const milkBonus=s=>Math.floor((rank(s,'vessel')-1)/2);
 window.OasisProgression={thresholds,level,nextTarget,rank,toolPrice,upgrade,maxWater,canalPrice,irrigationRadius,cropBonus,woolBonus,milkBonus};
})();
