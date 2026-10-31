const fs=require('node:fs');
let h=fs.readFileSync('breathing_cathedral.html','utf8');
h=h.replaceAll('The Breathing Cathedral','The Floating Quartet').replaceAll('The Breathing<br>Cathedral','The Floating<br>Quartet');
h=h.replaceAll('breathing-cathedral','floating-quartet').replaceAll('kevs-loop-studio-cathedral-v1','kevs-loop-studio-quartet-v1');
h=h.replace(/bloom: 4,/, 'bloom: 1,').replace(/size: 3,/, 'size: 1,');
h=h.replace(/petals: 10,/, 'petals: 12,').replace(/quality: "full",/, 'quality: "draft",');
h=h.replace('colourA: "#00d9ff"','colourA: "#b6ff00"').replace('colourB: "#ffb000"','colourB: "#00d9ff"');
h=h.replace('A luminous ribbed flower opens into a floating cathedral and folds closed','Four luminous ribbed flowers float and unfold at staggered intervals');
h=h.replace(/A flower made from light\.[\s\S]*?gather back into a bud\./,'Four floating structures made from light. Each unfolds at a different point in the loop, with woven ribs and an inner geometric shell.');
h=h.replace('x: WIDTH / 2 + x * frame.size * perspective','x: (frame.cx ?? WIDTH / 2) + x * frame.size * perspective');
h=h.replace('y: HEIGHT / 2 + y2 * frame.size * perspective','y: (frame.cy ?? HEIGHT / 2) + y2 * frame.size * perspective');
const start=h.indexOf('            function render(');
const end=h.indexOf('            /* =========================================================',start);
let old=h.slice(start,end);
const geometry=old.slice(old.indexOf('                // Draw rear petals first.'),old.indexOf('                ctx.restore();'));
const extra=`
                    // Diagonal lattice crossing the existing ribs.
                    for (let band=0;band<4;band++) {
                        const path=[];
                        for(let k=0;k<=16;k++) {
                            const u=k/16;
                            path.push(project(surface(petal, -1+2*u, .12+band*.18+u*.15, frame),frame));
                        }
                        strokePath(path,rgbB,brightness*.34,.9,0);
                    }
                    // Smaller inner ribs make a second vaulted shell.
                    for(const across of [-1,0,1]) {
                        const path=[];
                        for(let k=0;k<=24;k++) {
                            const q=surface(petal,across,k/24,frame);
                            path.push(project({x:q.x*.62,y:q.y*.72,z:q.z*.62},frame));
                        }
                        strokePath(path,rgbA,brightness*.34,.85,0);
                    }
`;
let body=geometry.replace('                    // Lights travel along closed out-and-back paths.',extra+'\n                    // Lights travel along closed out-and-back paths.');
// Keep beads small enough to preserve structure in the four-object composition.
body=body.replace('(5 + settings.glow * 5)', '(3 + settings.glow * 3)').replace('(8 + settings.glow * 7)','(5 + settings.glow * 4)').replace('20 + settings.glow * 15','12 + settings.glow * 8');
const render=`            function render(turn = phase, fullDetail = false) {
                const cycle=((turn%1)+1)%1;
                const clock=cycle*TAU;
                const full=fullDetail||settings.quality==='full';
                const ribs=full?11:7,steps=full?42:28,crossbars=full?16:10;
                ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
                ctx.fillStyle=settings.background;ctx.fillRect(0,0,WIDTH,HEIGHT);
                if(settings.stars)for(const d of dust){
                    const x=d.x+Math.sin(clock+d.phase)*d.drift;
                    const y=d.y+Math.cos(clock+d.phase)*d.drift;
                    ctx.fillStyle=rgba(rgbA,d.alpha*(.7+.3*Math.sin(clock+d.phase)));
                    ctx.beginPath();ctx.arc(x,y,d.radius,0,TAU);ctx.fill();
                }
                // Four independently breathing sculptures in a staggered vertical arrangement.
                const placements=[
                    {x:292,y:570,offset:0,scale:.98},
                    {x:788,y:650,offset:.25,scale:.92},
                    {x:292,y:1240,offset:.50,scale:1.04},
                    {x:788,y:1320,offset:.75,scale:1}
                ];
                for(const place of placements) {
                    const frame=sceneState(cycle+place.offset);
                    frame.cx=place.x+18*Math.sin(clock+place.offset*TAU);
                    frame.cy=place.y+28*Math.cos(clock+place.offset*TAU);
                    frame.size=114*settings.size*place.scale;
                    frame.yaw+=place.offset*TAU;
                    ctx.globalAlpha=1;
                    ctx.drawImage(halo,frame.cx-265,frame.cy-285,530,570);
                    ctx.save();ctx.globalCompositeOperation='lighter';
                    ctx.lineCap='round';ctx.lineJoin='round';
${body}
                    ctx.restore();ctx.globalAlpha=1;
                }
            }

`;
h=h.slice(0,start)+render+h.slice(end);
// A deterministic render hook for offline geometry verification.
h=h.replace('            buildColours();\n            buildDust();','            buildColours();\n            buildDust();');
const pos=h.lastIndexOf('            requestAnimationFrame(animate);');
h=h.slice(0,pos)+`            window.quartet={renderAt:t=>render(t),settings};\n`+h.slice(pos);
fs.writeFileSync('floating_quartet.html',h);
new Function(h.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log('Created floating_quartet.html; JavaScript syntax passes.');
