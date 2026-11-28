const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+process.cwd()+'/'+(process.env.PAGE||'patrones.html'));await p.evaluate(()=>document.fonts.ready);
if(process.env.CFG)await p.addScriptTag({path:process.env.CFG});
for(const t of process.argv.slice(2).map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot({path:`st_${t}.jpg`,type:'jpeg',quality:80});}
await b.close();})();
