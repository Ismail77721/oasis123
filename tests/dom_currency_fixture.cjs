// DOM support for the shared currency renderer in legacy scene fixtures.
module.exports=function(ctx){
 const d=ctx.document,old=d.getElementById;
 d.getElementById=function(id){const e=old(id);if(!e.querySelector)e.querySelector=function(q){return this.children?.find(x=>q==='[data-coin-value]'&&x.dataset?.coinValue!==undefined)};return e;};
 d.createTextNode=text=>({textContent:text});
 require('vm').runInContext(require('fs').readFileSync(require('path').join(__dirname,'../js/core/UIV230.js'),'utf8'),ctx);
 Object.assign(ctx,ctx.window);
};
