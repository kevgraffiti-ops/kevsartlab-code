const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('lantern_garden.html','utf8');
let coords=[];
const gradient=()=>({addColorStop(){}});
const ctx=new Proxy({createRadialGradient:gradient,createLinearGradient:gradient,
 moveTo(x,y){coords.push([x,y]);},lineTo(x,y){coords.push([x,y]);},
 arc(x,y,r){assert(Number.isFinite(r)&&r>=0);coords.push([x,y]);}},
 {get:(t,k)=>k in t?t[k]:()=>{}});
function el(type='button'){return {type,value:'',dataset:{},addEventListener(){},getContext:()=>ctx};}
const elements={};
for(const match of html.matchAll(/<(?:input|button|canvas|p|output|select)[^>]*id="([^"]+)"[^>]*>/g))elements[match[1]]=el(match[0].match(/type="([^"]+)"/)?.[1]);
const document={getElementById:id=>elements[id],querySelectorAll:()=>[],createElement:()=>el(),addEventListener(){}};
const window={};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{window,document,matchMedia:()=>({matches:false}),performance:{now:()=>0},requestAnimationFrame(){},console});
const app=window.lanternGarden;
assert(app);assert.equal(elements.art.width,1080);assert.equal(elements.art.height,1920);assert.equal(app.settings.duration,12);
function signature(t){coords=[];app.renderAt(t);return JSON.stringify(coords.map(p=>p.map(n=>+n.toFixed(5))));}
assert.equal(signature(0),signature(1),'Loop endpoint mismatch');
assert.notEqual(signature(0),signature(.25),'Scene should move');
for(const shape of ['flower','orb','diamond','torus']){
 for(let n=1;n<=4;n++)app.settings['shape'+n]=shape;
 assert.equal(signature(0),signature(1),shape+' seam');
 for(let i=0;i<24;i++){
  coords=[];app.renderAt(i/24);
  assert(coords.length>10000);
  for(const p of coords)assert(p.every(Number.isFinite),'Non-finite coordinate');
 }
}
elements.connectAll.onclick();
for(const pair of ['12','13','14','23','24','34'])assert.equal(app.settings['link'+pair],true);
elements.disconnectAll.onclick();
for(const pair of ['12','13','14','23','24','34'])assert.equal(app.settings['link'+pair],false);
console.log('PASS: inline JavaScript executes; 1080x1920; 12-second default; moving geometry; matching loop endpoints for all shapes; 96 sampled frames with finite coordinates; connect/disconnect controls. Offline mocked Canvas checks, not browser visual or recording verification.');
