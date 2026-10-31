// Offline checks of the real inline script. No browser or network access.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/phantom_diamond.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
let draws=[],raf,now=0,downloads=[],recorders=[];
const context={fillRect(){},save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},bezierCurveTo(){},closePath(){},fill(){},fillText(){},
  createRadialGradient(){return {addColorStop(){}};},drawImage(sprite,x,y,w=sprite.width,h=sprite.height){assert([x,y,w,h].every(Number.isFinite));draws.push([x,y,w,h]);}};
function el(type='button'){return {type,value:'',checked:false,disabled:false,hidden:false,textContent:'',dataset:{},events:{},addEventListener(k,fn){this.events[k]=fn;},click(){downloads.push(this.download);},remove(){},getContext(){return context;},toBlob(cb){cb(new Blob(['png']));}};}
const elements={};for(const m of html.matchAll(/<(?:input|button|canvas|p|output)[^>]*id="([^"]+)"[^>]*>/g)){
  const e=el(m[0].match(/type="([^"]+)"/)?.[1]);
  e.min=m[0].match(/min="([^"]+)"/)?.[1];e.max=m[0].match(/max="([^"]+)"/)?.[1];elements[m[1]]=e;
}
let tracksStopped=0;
elements.art.captureStream=()=>({getTracks:()=>[{stop(){tracksStopped++;}}]});
const palettes=['electric','reactor','ember'].map(p=>Object.assign(el(),{dataset:{palette:p}}));
const docListeners={};const document={hidden:false,body:{appendChild(){}},getElementById:id=>elements[id],createElement:()=>el(),
 querySelectorAll:s=>s==='[data-palette]'?palettes:[...palettes,...['pause','restart','cover','reset','record'].map(id=>elements[id])],
 addEventListener:(k,f)=>{(docListeners[k]??=[]).push(f);},removeEventListener:(k,f)=>{docListeners[k]=(docListeners[k]||[]).filter(x=>x!==f);}};
class Recorder {static isTypeSupported(t){return t==='video/webm;codecs=vp8';}constructor(stream,opts){this.mimeType=opts.mimeType;this.state='inactive';recorders.push(this);}start(){this.state='recording';}stop(){assert.equal(this.state,'recording');this.state='inactive';this.ondataavailable({data:new Blob(['video'])});this.onstop();}}
const sandbox={document,window:{matchMedia:()=>({matches:false}),MediaRecorder:Recorder},MediaRecorder:Recorder,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>now},
requestAnimationFrame:f=>raf=f,setTimeout:()=>1,clearTimeout(){},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Blob,console};
vm.runInNewContext(script,sandbox);
const api=sandbox.window.phantomDiamond;assert.equal(elements.art.width,1080);assert.equal(elements.art.height,1920);assert.equal(api.particleCount(),5420);
draws=[];api.renderAt(0);const first=JSON.stringify(draws);draws=[];api.renderAt(16);assert.equal(JSON.stringify(draws),first,'Loop endpoints must match exactly');
for(let t=0;t<16;t+=0.25){draws=[];api.renderAt(t);for(const [x,y,w,h]of draws){assert(x>=0&&y>=0&&x+w<=1080&&y+h<=1920,'Artwork outside canvas');}}
elements.depth.value='0.42';elements.depth.events.input();elements.size.value='1.12';elements.size.events.input();elements.tilt.value='25';elements.tilt.events.input();
for(let t=0;t<16;t+=0.25){draws=[];api.renderAt(t);for(const [x,y,w,h]of draws)assert(x>=0&&y>=0&&x+w<=1080&&y+h<=1920,'Maximum settings crop artwork');}
elements.white.checked=true;elements.white.events.input();palettes[2].events.click();assert.equal(api.getSettings().colorA,'#ff421b');assert.equal(api.getSettings().white,false);
elements.reset.onclick();assert.equal(api.getSettings().depth,.40);
elements.cover.onclick();assert(downloads.includes('kevs-art-lab-phantom-diamond-cover.png'));
elements.record.onclick();assert(elements.size.disabled);now=16001;raf(now);assert(downloads.includes('kevs-art-lab-phantom-diamond.webm'));assert(!elements.size.disabled);assert.equal(tracksStopped,1);
const count=downloads.length;elements.record.onclick();elements.cancel.onclick();assert.equal(downloads.length,count);assert.equal(tracksStopped,2);
elements.record.onclick();document.hidden=true;for(const f of [...docListeners.visibilitychange])f();assert.equal(downloads.length,count);assert.equal(tracksStopped,3);
console.log('PASS: JavaScript execution, fixed resolution, 5,420 particles, exact loop seam, full-turn canvas bounds at default/max settings, palette/reset controls, cover workflow, recording completion/cancellation/hidden-tab cleanup.');
console.log('Browser rendering, real encoding performance and perceptual reversal still require a browser preview.');

