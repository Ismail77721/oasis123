/* Device-local daily budget, independent of farm imports and new games. */
(function(){'use strict';
 const KEY='oasis_parental_v1',MAX=240*60000;
 const dateKey=now=>{const d=new Date(now-60000);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
 function normalize(raw={},now=Date.now()){
  const current=dateKey(now),day=typeof raw.day==='string'?raw.day:current;
  return {day:current>day?current:day,usedMs:current>day?0:Math.max(0,Number(raw.usedMs)||0),limitMinutes:Math.min(240,Math.max(1,Math.floor(Number(raw.limitMinutes)||240))),pinHash:raw.pinHash||'',salt:raw.salt||'',failures:Math.max(0,Number(raw.failures)||0),retryAt:Number(raw.retryAt)||0};
 }
 function advance(raw,elapsed,active,now){const s=normalize(raw,now);if(active)s.usedMs=Math.min(MAX,s.usedMs+Math.max(0,elapsed));return s;}
 function remaining(s){return Math.max(0,Math.min(240,s.limitMinutes)*60000-s.usedMs);}
 let memory={},last=0,wasActive=false,available=true;
 function read(){try{memory=normalize(JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{available=false;memory=normalize(memory);}return memory;}
 function write(s){memory=s;try{localStorage.setItem(KEY,JSON.stringify(s));available=true;}catch{available=false;}return s;}
 function tick(active,now=Date.now(),mono=performance.now()){const elapsed=last?Math.min(5000,Math.max(0,mono-last)):0;last=mono;const s=advance(read(),elapsed,wasActive,now);wasActive=active&&remaining(s)>0;return write(s);}
 const hex=a=>[...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('');
 async function hash(pin,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256));}
 async function createPIN(pin){if(!/^\d{6}$/.test(pin))throw Error('Нужны ровно шесть цифр');const s=read();if(s.pinHash)throw Error('PIN уже установлен');s.salt=hex(crypto.getRandomValues(new Uint8Array(16)));s.pinHash=await hash(pin,s.salt);write(s);if(!available)throw Error('Не удалось сохранить PIN. Проверь доступ к хранилищу.');}
 async function verify(pin){const s=read();if(Date.now()<s.retryAt)throw Error('Подожди минуту перед следующей попыткой');if(!s.pinHash)return false;const ok=await hash(pin,s.salt)===s.pinHash;if(ok){s.failures=0;s.retryAt=0;}else{if(++s.failures>=5){s.retryAt=Date.now()+60000;s.failures=0;}}write(s);return ok;}
 function setLimit(minutes){const n=Number(minutes);if(!Number.isInteger(n)||n<1||n>240)throw Error('Укажи от 1 до 240 минут');const s=read();s.limitMinutes=n;write(s);}
 window.OasisPlayLimit={KEY,MAX,dateKey,normalize,advance,remaining,read,tick,createPIN,verify,setLimit,get storageAvailable(){return available;}};
})();
