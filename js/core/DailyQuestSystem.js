/* 3 daily tasks, consistent local date, one claim per day. */
(function(){'use strict';
 function key(at=Date.now()){const d=new Date(at);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 function metrics(s){return{planted:s.stats?.planted||0,harvested:s.stats?.harvested||0,canalsBuilt:s.stats?.canalsBuilt||0,buildingsBuilt:s.stats?.buildingsBuilt||0,sales:s.totalSold||0,orders:s.ordersCompleted||0};}
 const tasks=[
  {id:'planted',title:'Посади растения',unit:'посадок',goal:2,reward:22},
  {id:'harvested',title:'Собери урожай',unit:'ед.',goal:6,reward:28},
  {id:'sales',title:'Продай товары',unit:'монет',goal:30,reward:32},
  {id:'orders',title:'Выполни заказы',unit:'заказов',goal:1,reward:40},
  {id:'canalsBuilt',title:'Проложи каналы',unit:'каналов',goal:2,reward:26},
  {id:'buildingsBuilt',title:'Построй хозяйственное здание',unit:'построек',goal:1,reward:45}
 ];
 function ensure(s,at=Date.now()){
  const day=key(at);
  if(s.dailyQuests?.date!==day||!Array.isArray(s.dailyQuests.items)||s.dailyQuests.items.length!==3||!s.dailyQuests.baseline||s.dailyQuests.items.some(q=>!q||!tasks.some(t=>t.id===q.id)||!Number.isFinite(q.goal)||q.goal<1)){
   const dayNo=Math.floor(new Date(day+'T12:00:00').getTime()/86400000);
   const indices=[dayNo%4,(dayNo+1)%4,4+(dayNo%2)];
   const rank=Math.min(3,Math.floor((OasisProgression.level(s)-1)/6));
   s.dailyQuests={date:day,baseline:metrics(s),items:indices.map((idx,i)=>({id:tasks[idx].id,goal:tasks[idx].goal+(rank*(idx===2?12:1)),reward:tasks[idx].reward+rank*10,claimed:false}))};
  }
  return s.dailyQuests;
 }
 function overview(s,at=Date.now()){
  const data=ensure(s,at),m=metrics(s);
  return data.items.map((q,i)=>({...q,index:i,title:tasks.find(t=>t.id===q.id)?.title||q.id,progress:Math.max(0,Math.min(q.goal,(m[q.id]||0)-(data.baseline[q.id]||0)))}));
 }
 function claim(s,index,at=Date.now()){
  const q=overview(s,at)[index],item=s.dailyQuests.items[index];
  if(!q||!item||item.claimed||q.progress<q.goal)return{ok:false,reason:'Задание ещё не завершено'};
  item.claimed=true;s.coins=Math.round((s.coins+q.reward)*100)/100;return{ok:true,reward:q.reward};
 }
 window.OasisDailyQuests={key,ensure,overview,claim};
})();
