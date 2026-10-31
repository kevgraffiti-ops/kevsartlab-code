const fs = require('node:fs');
let html = fs.readFileSync('floating_quartet.html', 'utf8');
html = html.replaceAll('The Floating Quartet','The Lantern Garden').replaceAll('Floating Quartet','Lantern Garden')
 .replaceAll('floating-quartet','lantern-garden').replaceAll('quartet-v2','lantern-garden-v1')
 .replace('Four floating structures made from light. Each unfolds at a different point in the loop, with woven ribs and an inner geometric shell.', 'A slow journey through a floating garden. Amber lanterns breathe above dark water, exchanging seeds of light through drifting ribbons.')
 .replace('1: top left · 2: top right · 3: bottom left · 4: bottom right.', '1: foreground · 2: left middle · 3: right middle · 4: distant.')
 .replace('duration: 16','duration: 12').replaceAll('outer1: "#b6ff00", inner1: "#00d9ff"','outer1: "#ff9d35", inner1: "#fff1c9"')
 .replaceAll('outer2: "#b6ff00", inner2: "#00d9ff"','outer2: "#ff7900", inner2: "#ffe4a3"')
 .replaceAll('outer3: "#b6ff00", inner3: "#00d9ff"','outer3: "#ffb000", inner3: "#b9f5ff"')
 .replaceAll('outer4: "#b6ff00", inner4: "#00d9ff"','outer4: "#ffcf79", inner4: "#fff1c9"')
 .replace('colourA: "#b6ff00"','colourA: "#ff9d35"').replace('colourB: "#00d9ff"','colourB: "#fff1c9"')
 .replace('link12: false','link12: true').replace('link23: false','link23: true').replace('link34: false','link34: true');
const start = html.indexOf('            function drawConnections(');
const end = html.indexOf('            function render(',start);
html = html.slice(0,start) + `
            // Shared periodic camera: nearby lanterns have stronger parallax.
            function gardenFrames(cycle) {
                const clock=cycle*TAU;
                const camera=settings.orbit ? Math.sin(clock)*.48 : 0;
                const lift=settings.orbit ? Math.cos(clock)*.14 : 0;
                const travel=settings.orbit ? Math.sin(clock)*.22 : 0;
                const world=[
                    {x:.08,y:.65,z:3.8,offset:.22},
                    {x:-1.45,y:-1.18,z:5.9,offset:.48},
                    {x:1.55,y:-.38,z:6.8,offset:.72},
                    {x:.25,y:-2.55,z:9.2,offset:0}
                ];
                return world.map((p,i)=>{
                    const depth=p.z+travel, lens=700/depth;
                    const frame=sceneState(cycle+p.offset);
                    frame.cx=540+(p.x-camera+.12*Math.sin(clock+i))*lens;
                    frame.cy=860+(p.y-lift+.16*Math.cos(clock+i))*lens;
                    frame.size=lens*settings.size*settings['scale'+(i+1)];
                    frame.shape=settings['shape'+(i+1)];
                    frame.yaw+=i*.65;
                    frame.depth=depth; frame.index=i;
                    if(frame.shape==='torus')frame.pitch=.8+.15*Math.sin(clock);
                    return frame;
                });
            }
            function drawConnections(frames,clock) {
                ctx.save();ctx.globalCompositeOperation='lighter';
                for(const pair of ['12','13','14','23','24','34']) {
                    if(!settings['link'+pair])continue;
                    const a=frames[+pair[0]-1],b=frames[+pair[1]-1];
                    const palette=objectPalette(+pair[0]);
                    const dx=b.cx-a.cx,dy=b.cy-a.cy,length=Math.max(1,Math.hypot(dx,dy));
                    function point(t,lane=0) {
                        const bend=Math.sin(Math.PI*t)*(65+32*Math.sin(clock+t*TAU+ +pair)+lane);
                        return {x:a.cx+dx*t-dy/length*bend,y:a.cy+dy*t+dx/length*bend};
                    }
                    for(const lane of [-7,0,7])strokePath(Array.from({length:49},(_,i)=>point(i/48,lane)),palette.b,.25,1,settings.glow);
                    for(let i=0;i<7;i++){
                        const t=((clock/TAU+i/7)%1+1)%1;
                        drawParticle(point(t),palette.sb,5+3*Math.sin(Math.PI*t),Math.sin(Math.PI*t)**2*.8);
                    }
                    ctx.globalAlpha=1;
                }
                ctx.restore();
            }
            const reflection=document.createElement('canvas');
            reflection.width=540;reflection.height=960;
            const reflectionContext=reflection.getContext('2d');
            function atmosphere(clock) {
                ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
                ctx.fillStyle=settings.background;ctx.fillRect(0,0,WIDTH,HEIGHT);
                const night=ctx.createRadialGradient(540,900,30,540,900,1100);
                night.addColorStop(0,'rgba(15,48,69,.55)');night.addColorStop(1,'rgba(0,8,20,0)');
                ctx.fillStyle=night;ctx.fillRect(0,0,WIDTH,HEIGHT);
                for(let i=0;i<4;i++) {
                    const x=540+260*Math.sin(clock+i*1.7),y=600+i*280+55*Math.cos(clock+i);
                    ctx.globalAlpha=.55;ctx.drawImage(halo,x-650,y-190,1300,380);
                }
                ctx.globalAlpha=1;
                if(settings.stars)for(const d of dust){
                    const x=d.x+Math.sin(clock+d.phase)*d.drift*2;
                    const y=d.y+Math.cos(clock+d.phase)*d.drift*2;
                    ctx.fillStyle=rgba(rgbA,d.alpha*(.8+.2*Math.sin(clock+d.phase)));
                    ctx.beginPath();ctx.arc(x,y,d.radius,0,TAU);ctx.fill();
                }
            }
            function water(clock) {
                // Low resolution reflection buffer is cheap, and never feeds back.
                reflectionContext.clearRect(0,0,540,960);
                reflectionContext.drawImage(canvas,0,0,540,960);
                ctx.save();ctx.globalCompositeOperation='source-over';
                for(let y=1480;y<1920;y+=8){
                    const distance=y-1480;
                    const sourceY=(1480-distance*1.5)/2;
                    const ripple=Math.sin(distance*.065+clock*2)* (2+distance*.035);
                    ctx.globalAlpha=.23*(1-distance/460);
                    ctx.drawImage(reflection,0,sourceY,540,6,ripple,y,1080,8);
                }
                ctx.globalAlpha=1;
                const fade=ctx.createLinearGradient(0,1460,0,1920);
                fade.addColorStop(0,'rgba(1,7,14,0)');fade.addColorStop(1,'rgba(1,7,14,.8)');
                ctx.fillStyle=fade;ctx.fillRect(0,1460,1080,460);
                ctx.restore();
            }
` + html.slice(end);
const bgStart=html.indexOf("                ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';", html.indexOf('function render('));
const bgEnd=html.indexOf('                drawConnections(frames,clock);',bgStart);
html=html.slice(0,bgStart)+`                atmosphere(clock);
                const frames=gardenFrames(cycle);
`+html.slice(bgEnd);
html=html.replace('for(let index=0;index<4;index++) {\n                    const frame=frames[index];', 'for(const frame of [...frames].sort((a,b)=>b.depth-a.depth)) {\n                    const index=frame.index;');
// Normalise newlines before modifications that span lines.
html=html.replace(/\r\n/g,'\n');
html=html.replace('for(let index=0;index<4;index++) {\n                    const frame=frames[index];', 'for(const frame of [...frames].sort((a,b)=>b.depth-a.depth)) {\n                    const index=frame.index;');
html=html.replace('                    // Long architectural ribs.', `                    // Translucent silk catches the light between the ribs.
                    ctx.globalAlpha=1;
                    const silk=[];
                    for(let j=0;j<=20;j++)silk.push(project(surface(petal,-1,j/20,frame),frame));
                    for(let j=20;j>=0;j--)silk.push(project(surface(petal,1,j/20,frame),frame));
                    ctx.beginPath();silk.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
                    ctx.closePath();ctx.fillStyle=rgba(rgbA,.018+brightness*.025);ctx.fill();

                    // Long architectural ribs.`);
html=html.replace('                    ctx.restore();ctx.globalAlpha=1;\n                }\n            }', `                    // Seeds leave the opening flower and return on closed paths.
                    for(let s=0;s<18;s++) {
                        const angle=s*2.399963, excursion=.5-.5*Math.cos(frame.theta+s*.19);
                        const r=(.25+excursion*1.4)*frame.size;
                        const p={x:frame.cx+Math.cos(angle+clock)*r,
                            y:frame.cy-Math.sin(excursion*Math.PI)*frame.size*1.6+Math.sin(angle+clock)*r*.35};
                        drawParticle(p,spriteB,3+excursion*4,excursion*.65);
                    }
                    ctx.restore();ctx.globalAlpha=1;
                }
                water(clock);
            }`);
html=html.replace('window.quartet=', 'window.lanternGarden=').replace('The Floating<br>Quartet','The Lantern<br>Garden');
fs.writeFileSync('lantern_garden.html',html);
console.log('Created lantern_garden.html; original preserved.');
