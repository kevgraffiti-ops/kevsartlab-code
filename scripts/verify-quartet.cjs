const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('floating_quartet.html','utf8');
let coords=[];
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),moveTo(x,y){coords.push([x,y]);},lineTo(x,y){coords.push([x,y]);}}, {get:(t,k)=>k in t?t[k]:()=>{}});
function el(type='button'){return {type,value:'',dataset:{},addEventListener(){},getContext:()=>ctx};}
const elements={};
for(const match of html.matchAll(/<(?:input|button|canvas|p|output|select)[^>]*id="([^"]+)"[^>]*>/g)) elements[match[1]]=el(match[0].match(/type="([^"]+)"/)?.[1]);
const document={getElementById:id=>elements[id],querySelectorAll:()=>[],createElement:()=>el(),addEventListener(){}};
const window={};vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],{window,document,matchMedia:()=>({matches:false}),performance:{now:()=>0},requestAnimationFrame(){},console});
assert(window.quartet);assert.equal(elements.art.width,1080);assert.equal(elements.art.height,1920);
function signature(t){coords=[];window.quartet.renderAt(t);return JSON.stringify(coords.map(p=>p.map(n=>+n.toFixed(6))));}
assert.equal(signature(0),signature(1),'Loop seam differs');
for(const max of [false,true]){
 if(max)Object.assign(window.quartet.settings,{size:1.12,bloom:1.15,petals:16,twist:1,quality:'full'});
 for(let i=0;i<32;i++){
  coords=[];window.quartet.renderAt(i/32);
  assert(coords.length>10000);
  for(const [x,y]of coords)assert(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1080&&y>=0&&y<=1920,`Invalid or cropped vertex ${x},${y}`);
 }
}
console.log('PASS: actual inline script executes, fixed 1080x1920 buffer, matching loop endpoints, all rib/lattice vertices inside frame at 32 phases for default and maximum controls.');
for(let i=1;i<=4;i++)window.quartet.settings['scale'+i]=1.2;
elements.connectAll.onclick();
for(const p of ['12','13','14','23','24','34'])assert.equal(window.quartet.settings['link'+p],true);
for(const shape of ['flower','orb','diamond','torus']){
 for(let i=1;i<=4;i++)window.quartet.settings['shape'+i]=shape;
 assert.equal(signature(0),signature(1),shape+' seam');
 for(let i=0;i<8;i++){
  coords=[];window.quartet.renderAt(i/8);
  for(const [x,y]of coords)assert(Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1080&&y>=0&&y<=1920,shape+' exceeds frame');
 }
}
elements.disconnectAll.onclick();
for(const p of ['12','13','14','23','24','34'])assert.equal(window.quartet.settings['link'+p],false);
// Model select attributes for the persisted-preset validation path.
for(let i=1;i<=4;i++){
 const e=elements['shape'+i];e.tagName='SELECT';e.options=['flower','orb','diamond','torus'].map(value=>({value}));
}
window.quartet.applySettings({shape1:'orb',shape2:'diamond',shape3:'torus',shape4:'invalid',link12:true,outer1:'#ff7900'});
assert.equal(window.quartet.settings.shape1,'orb');assert.equal(window.quartet.settings.shape2,'diamond');assert.equal(window.quartet.settings.shape3,'torus');
assert.equal(window.quartet.settings.shape4,'torus');assert.equal(window.quartet.settings.link12,true);assert.equal(window.quartet.settings.outer1,'#ff7900');
console.log('PASS: all four shapes at maximum per-object scale, connections, exact seams, connect/separate buttons, saved shape/link/colour validation.');
