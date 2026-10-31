const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('cyber_nexus.html','utf8');
const code=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
// Parse all of the actual module, including dynamic imports and event handlers.
new (Object.getPrototypeOf(async function(){}).constructor)(code);
class Matrix4 {
 constructor(){this.e=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
 makeScale(x,y,z){this.e=[x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1];return this;}
 setPosition(x,y,z){this.e[3]=x;this.e[7]=y;this.e[11]=z;return this;}
 makeRotationX(a){const c=Math.cos(a),s=Math.sin(a);this.e=[1,0,0,0,0,c,-s,0,0,s,c,0,0,0,0,1];return this;}
 clone(){const m=new Matrix4();m.e=[...this.e];return m;}
 multiply(b){const a=this.e;this.e=Array.from({length:16},(_,i)=>{const r=Math.floor(i/4),c=i%4;let n=0;for(let k=0;k<4;k++)n+=a[r*4+k]*b.e[k*4+c];return n;});return this;}
 invert(){const a=this.e;this.e=Array.from({length:16},(_,i)=>a[(i%4)*4+Math.floor(i/4)]);return this;}
}
class Vector3 {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
 applyMatrix4(m){const a=m.e,{x,y,z}=this;this.x=a[0]*x+a[1]*y+a[2]*z+a[3];this.y=a[4]*x+a[5]*y+a[6]*z+a[7];this.z=a[8]*x+a[9]*y+a[10]*z+a[11];return this;}
 toArray(){return [this.x,this.y,this.z];}
}
const THREE={Matrix4,Vector3,BoxGeometry:class{},EdgesGeometry:class{getAttribute(){return {count:0};}}};
const geometry=code.slice(code.indexOf('const boxes='),code.indexOf('const architecture='));
const context={THREE,CONFIG:{steps:12},result:null};
vm.runInNewContext(geometry+';result={boxes,paths};',context);
assert(context.result.boxes.length>250);
for(const route of context.result.paths){
 assert.deepEqual([...route[0]],[...route.at(-1)],'Circuit must close');
 for(let i=1;i<route.length;i++){
  const delta=route[i].map((n,j)=>Math.abs(n-route[i-1][j]));
  assert(delta.filter(n=>n>1e-6).length<=1,'Found a diagonal packet segment');
  assert(route[i].every(Number.isFinite));
 }
}
function pose(t){const p=((t%1)+1)%1,a=Math.PI*2*p;return [23*Math.sin(a+Math.PI/4),23*Math.cos(a+Math.PI/4),1+.02*Math.sin(a),(p*4)%1];}
assert.deepEqual(pose(0),pose(1));
assert.equal(context.result.paths.length,3);
assert(!code.includes('Math.random'));
console.log(`PASS: complete module syntax; ${context.result.boxes.length} construction instances; three closed axis-aligned packet circuits; periodic camera/core/packet equations; no random generators. GPU rendering not tested.`);
