const {chromium}=require('playwright');const {spawn}=require('child_process');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+process.cwd()+'/reel.html');await p.evaluate(()=>document.fonts.ready);
const FPS=30,DUR=38,N=FPS*DUR;
const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',''+FPS,'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium','video.mp4']);
for(let f=0;f<N;f++){await p.evaluate(t=>render(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:93});
 if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r)); if(f%150==0)console.log(f);}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();})();
