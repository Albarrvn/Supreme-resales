const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const b=await chromium.launch();const SC=+(process.env.SCALE||1);const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:SC});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+process.cwd()+'/'+(process.env.PAGE||'patrones.html'));await p.evaluate(()=>document.fonts.ready);if(process.env.CFG)await p.addScriptTag({path:process.env.CFG});
const FPS=+(process.env.FPS||30),DUR=+(process.env.DUR||43.5),N=FPS*DUR;
const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',''+FPS,'-i','-',...(SC>1?['-vf','scale=1080:1920:flags=lanczos']:[]),'-c:v','libx264','-pix_fmt','yuv420p','-profile:v','high','-crf',process.env.CRF||'18','-preset',process.env.PRESET||'medium','-tune','animation',(process.env.OUT||'video.mp4')]);
for(let f=0;f<N;f++){await p.evaluate(t=>render(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:+(process.env.Q||93)});
 if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r)); if(f%150==0)console.log(f);}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();})();
