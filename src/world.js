import {Geometry,clamp} from './engine.js';
const seed=(()=>{let s=19731027;return()=>((s=Math.imul(1664525,s)+1013904223|0)>>>0)/4294967296})();
export const rooms=[
 {id:'exterior',name:'THE FORGOTTEN ENTRANCE',x1:-22,x2:22,z1:32,z2:55,open:true},
 {id:'lobby',name:'THE WELCOME LOBBY',x1:-9,x2:9,z1:16,z2:32},
 {id:'hall',name:'THE GRAND HALL',x1:-9,x2:9,z1:0,z2:16},
 {id:'party',name:'ROBIN’S PARTY ROOM',x1:-31,x2:-9,z1:0,z2:16},
 {id:'arcade',name:'THE STARLIGHT ARCADE',x1:9,x2:31,z1:0,z2:16},
 {id:'backstage',name:'THE BACKSTAGE WING',x1:-31,x2:-9,z1:-18,z2:0},
 {id:'security',name:'THE SECURITY OFFICE',x1:9,x2:31,z1:-18,z2:0},
 {id:'service',name:'THE SERVICE PASSAGE',x1:-9,x2:9,z1:-33,z2:0},
 {id:'maintenance',name:'THE BOILER ROOM',x1:-31,x2:-9,z1:-33,z2:-18},
 {id:'office',name:'EDWIN’S PRIVATE OFFICE',x1:9,x2:31,z1:-33,z2:-18},
 {id:'final',name:'THE LAST BIRTHDAY ROOM',x1:-9,x2:9,z1:-47,z2:-33}
];
export const doors=[
 {id:'entrance',name:'Rusty front doors',x:0,z:32,orient:'z',lock:'entrance',a:'exterior',b:'lobby'},
 {id:'lobbyHall',name:'Grand Hall doors',x:0,z:16,orient:'z',a:'lobby',b:'hall'},
 {id:'partyDoor',name:'Birthday room',x:-9,z:8,orient:'x',a:'hall',b:'party'},
 {id:'arcadeDoor',name:'Arcade passage',x:9,z:8,orient:'x',a:'hall',b:'arcade'},
 {id:'serviceDoor',name:'Service passage',x:0,z:0,orient:'z',a:'hall',b:'service'},
 {id:'stageDoor',name:'Backstage door · STAFF ONLY',x:-20,z:0,orient:'z',lock:'backstage',a:'party',b:'backstage'},
 {id:'controlDoor',name:'Security access',x:20,z:0,orient:'z',lock:'security',a:'arcade',b:'security'},
 {id:'maintenanceDoor',name:'Maintenance stairwell',x:-20,z:-18,orient:'z',a:'backstage',b:'maintenance'},
 {id:'officeDoor',name:'Executive office',x:20,z:-18,orient:'z',lock:'office',a:'security',b:'office'},
 {id:'corridorBack',name:'Backstage side hall',x:-9,z:-10,orient:'x',lock:'backstage',a:'backstage',b:'service'},
 {id:'corridorSec',name:'Security side hall',x:9,z:-10,orient:'x',lock:'security',a:'security',b:'service'},
 {id:'corridorMaint',name:'Boiler passage',x:-9,z:-25,orient:'x',a:'maintenance',b:'service'},
 {id:'corridorOffice',name:'Executive side hall',x:9,z:-25,orient:'x',lock:'office',a:'office',b:'service'},
 {id:'finalDoor',name:'The birthday room · DO NOT ENTER',x:0,z:-33,orient:'z',lock:'final',a:'service',b:'final'}
];
export const objects=[
 {id:'invitation',label:'Read the unmarked birthday invitation',x:1.5,z:36.5,kind:'letter',room:'exterior'},
 {id:'guestbook',label:'Read the guest register',x:-5.9,z:25.2,kind:'book',room:'lobby'},
 {id:'robinPhoto',label:'Examine Robin’s seventh-birthday photograph',x:-21.8,z:8,kind:'photo',room:'party'},
 {id:'staffPass',label:'Collect the backstage staff pass',x:-25.5,z:4.3,kind:'key',room:'party'},
 {id:'fuse',label:'Restore the arcade fuse box',x:27,z:8,kind:'switch',room:'arcade'},
 {id:'officeKey',label:'Collect the office key',x:14.2,z:2.8,kind:'key',room:'arcade'},
 {id:'film',label:'Pick up a roll of camera film',x:24,z:3.9,kind:'film',room:'arcade'},
 {id:'ruthMemo',label:'Read Ruth Hale’s inspection warning',x:-25,z:-8,kind:'letter',room:'backstage'},
 {id:'incident',label:'Examine the 1973 fire report',x:-18,z:-14,kind:'book',room:'backstage'},
 {id:'securityLogs',label:'Examine the locked-exit records',x:24,z:-12,kind:'letter',room:'security'},
 {id:'exitOrder',label:'Read Edwin’s written exit order',x:17,z:-28.5,kind:'letter',room:'office'},
 {id:'edwinTape',label:'Play Edwin Candlewick’s dictation tape',x:25,z:-24,kind:'tape',room:'office'},
 {id:'valve',label:'Open the emergency suppression valve',x:-24,z:-28,kind:'switch',room:'maintenance'},
 {id:'battery',label:'Collect flashlight batteries',x:-17,z:-23,kind:'battery',room:'maintenance'},
 {id:'cake',label:'Approach the last birthday cake',x:0,z:-41.5,kind:'cake',room:'final'}
];
export const evidenceIds=['robinPhoto','ruthMemo','incident','securityLogs','exitOrder','edwinTape'];
export function roomAt(x,z){return rooms.find(r=>x>=r.x1-.01&&x<=r.x2+.01&&z>=r.z1-.01&&z<=r.z2+.01)?.id||'exterior'}
export class Palace{
 constructor(){this.geo=new Geometry();this.walls=[];this.build()}
 color(room){return {lobby:'#473b38',hall:'#3b2b2d',party:'#50353a',arcade:'#2b3849',backstage:'#393330',security:'#2c393c',service:'#312c2d',maintenance:'#343634',office:'#49342d',final:'#60332e'}[room]||'#272a2c'}
 solid(x,z,w,d){this.walls.push({x1:x-w/2,x2:x+w/2,z1:z-d/2,z2:z+d/2})}
 wall(x,z,w,d,h,color){this.geo.box(x,h/2,z,w,h,d,color);this.solid(x,z,w,d)}
 addSide(r,side){let along=doors.filter(d=>(d.a===r.id||d.b===r.id)&&((side==='north'&&d.orient==='z'&&Math.abs(d.z-r.z2)<.01)||(side==='south'&&d.orient==='z'&&Math.abs(d.z-r.z1)<.01)||(side==='west'&&d.orient==='x'&&Math.abs(d.x-r.x1)<.01)||(side==='east'&&d.orient==='x'&&Math.abs(d.x-r.x2)<.01))).map(d=>side==='north'||side==='south'?d.x:d.z).sort((a,b)=>a-b);const horiz=side==='north'||side==='south',lo=horiz?r.x1:r.z1,hi=horiz?r.x2:r.z2,coord=(side==='north'?r.z2:side==='south'?r.z1:side==='west'?r.x1:r.x2),t=.34;let cursor=lo;const wallSection=(a,b)=>{if(b-a<=.08)return;const cx=(a+b)/2,sz=b-a;if(horiz)this.wall(cx,coord,sz,t,4.6,this.color(r.id));else this.wall(coord,cx,t,sz,4.6,this.color(r.id));};for(const pos of along){wallSection(cursor,pos-1.65);cursor=pos+1.65;const x=horiz?pos:coord,z=horiz?coord:pos;this.geo.box(x,3.86,z,horiz?3.45:.53,1.5,horiz?.53:3.45,'#392927');this.geo.box(horiz?pos-1.7:coord,2.18,horiz?coord:pos-1.7,horiz?.25:.50,4.35,horiz?.50:.25,'#5e4342');this.geo.box(horiz?pos+1.7:coord,2.18,horiz?coord:pos+1.7,horiz?.25:.50,4.35,horiz?.50:.25,'#5e4342');}wallSection(cursor,hi)}
 build(){const g=this.geo;
 // Rain-washed forecourt, parking lines, structural facade, moonlit entrance.
 g.box(0,-.18,42,62,.34,46,'#292d32');g.box(0,.02,34,22,.03,6,'#313033');g.box(0,4.3,32.4,21,1.5,.8,'#4f3b39');g.box(-12,3.2,32,3,6.5,1.3,'#4a3b3b');g.box(12,3.2,32,3,6.5,1.3,'#4a3b3b');
 for(let i=0;i<9;i++){let x=-8+i*2;g.box(x,4.8,32.7,1.4,.15,.16,i%3?'#d7a76e':'#8b4549',1.2)}
 g.box(0,5.55,32.5,8,1.05,.5,'#432624');for(let i=-6;i<=6;i++){g.sphere(i*.47,5.63,32.82,.10,.10,.10,'#dd8359',2)}
 g.box(-14,1.2,41,1.9,2.1,4.7,'#272625');g.box(-14,.48,43,1.94,.62,1.1,'#544745');g.box(-13.3,.9,44.2,.12,.37,.15,'#9d422e');g.box(16,1,42,5,1.7,2.3,'#1f2328');g.box(16,1,40.76,4.6,.6,.12,'#4e4b4a');
 for(let i=0;i<28;i++){let x=-22+seed()*44,z=33+seed()*21;g.box(x,.04,z,.05,.015,.5,'#81969b',.8,seed()*3)}
 for(const r of rooms){if(r.open)continue;const {x1,x2,z1,z2,id}=r;for(let x=x1+.85;x<x2;x+=1.7)for(let z=z1+.85;z<z2;z+=1.7){const c=((Math.floor(x*3)+Math.floor(z*3))%3===0)?'#544643':'#373336';g.box(x,-.09,z,1.68,.18,1.68,c)}g.box((x1+x2)/2,4.5,(z1+z2)/2,x2-x1,.20,z2-z1,'#202023');this.addSide(r,'north');this.addSide(r,'south');this.addSide(r,'east');this.addSide(r,'west');for(let x=x1+3;x<x2;x+=5.8){g.box(x,4.34,z1+.8,.13,.15,z2-z1-1.6,'#615249')}}
 for(const r of rooms){if(r.open)continue;const cx=(r.x1+r.x2)/2,cz=(r.z1+r.z2)/2;g.box(cx,4.35,cz,.7,.2,1.1,'#a26c4d',1.4);g.sphere(cx,4.0,cz,.14,.15,.14,'#edb072',2.2);for(let i=0;i<5;i++){const x=r.x1+1.1+i*(r.x2-r.x1-2.2)/4;g.box(x,1.2,r.z1+.17,.16,2.3,.22,'#51403b');g.box(x,1.2,r.z2-.17,.16,2.3,.22,'#51403b')}}
 // Lobby ticket booth + once-cheerful greeting arch.
 g.box(-6.1,1.25,25.2,3.6,1.45,2.2,'#59453c');g.box(-6.1,2.2,25.2,4.1,.21,2.6,'#936044');g.box(5,1.6,27,2.4,3,1.2,'#47483d');g.box(5,2.8,26.35,2,1.0,.13,'#9e6c50',.35);
 for(let i=0;i<7;i++){const x=-6+i*2;g.rod([x,3.25,23],[x+.9,2.82,22.5],.033,['#8e4951','#a58858','#555c88'][i%3])}g.box(0,3.16,18,9,.2,.9,'#7b3f38');
 // Main hall trophy cases, decorative stage doors, old carpeting.
 g.box(0,-.002,8,7,.05,15,'#583332');for(let i=0;i<8;i++){let z=2+i*1.6;g.box(-7.4,1.38,z,1.5,2.5,1.1,'#4d3c36');g.box(7.4,1.38,z,1.5,2.5,1.1,'#4b3931');g.sphere(-7.4,2.25,z,.25,.35,.25,'#98784e',.45)}
 // Robin's seventh birthday room: stage, velvet curtains, balloons, cake, chairs.
 g.box(-20,.43,2.5,16,.85,5.2,'#4b292e');g.box(-20,3.05,.3,18,2.8,.3,'#7f2b37');for(let i=0;i<8;i++)g.box(-28+i*2.2,2.8,.6,.7,3,.6,i%2?'#4c202a':'#8b3941');
 g.box(-20,4.08,.75,15,.35,1.0,'#bf7952',.22);for(let i=0;i<12;i++){g.sphere(-27+i*1.25,4.10,1.3,.15,.16,.15,'#c58b56',1.6)}
 this.bunnyPoster(-20,1.55,1.16,g);
 for(const [x,z] of [[-26,11],[-14,10],[-19,12]]){g.box(x,.9,z,3.2,.2,2.2,'#664742');for(const dx of [-1.2,1.2])for(const dz of [-.8,.8])g.box(x+dx,.43,z+dz,.11,.9,.12,'#563e37');g.box(x,1,z,.2,.15,1.2,'#af6a65');for(let i=0;i<4;i++)g.box(x+(i-1.5)*.55,.98,z-.5,.16,.12,.14,'#ce9d55')}
 for(let i=0;i<11;i++){const x=-29+seed()*18,z=3+seed()*12;g.rod([x,.5,z],[x+.2,2.5,z],.016,'#98806c');g.sphere(x+.2,2.6,z,.37,.47,.32,['#8d4a55','#bd985a','#5d7477'][i%3],.22)}
 // Arcade cabinets, glitched neon panels, prize shelf.
 for(let i=0;i<8;i++){let x=11.8+i*2.2,z=i%2?13.5:2.4;g.box(x,1.35,z,1.4,2.6,1.4,'#252c38');g.box(x,1.9,z+(i%2?-.72:.72),1.08,.85,.09,['#514d78','#2d6967','#6a3750'][i%3],1.3);g.box(x,.56,z+(i%2?-.72:.72),1,.17,.14,'#886149');g.sphere(x-.25,.76,z+(i%2?-.85:.85),.075,.075,.075,'#da6b69',1.5)}
 g.box(27,2.1,8,1.7,2.8,.5,'#403e3b');g.box(27,2,7.65,1.12,.4,.08,'#bf6b48',1.6);
 // Backstage: hanging costume racks, wooden crates, blackened smoke damage.
 for(let i=0;i<8;i++){const x=-28+seed()*16,z=-2-seed()*14;g.box(x,.5,z,1.9,1,1.7,'#58443b');g.box(x,.89,z,1.94,.08,1.74,'#8b6a4c');g.rod([x-.6,.7,z-.85],[x+.6,.7,z+.85],.022,'#3e2c2b')}
 for(let i=0;i<4;i++){const x=-26+i*4.2;g.rod([x,4.28,-9],[x,1.8+seed()*.9,-9],.03,'#8d7e68');g.sphere(x,1.57,-9,.43,.44,.4,'#4a3536')}
 // Security: security desk and wall of damaged monitors.
 g.box(20,.86,-12,8,1.65,2.2,'#50413b');for(let x=12;x<29;x+=2.5)for(let y=2.5;y<4.1;y+=.9){g.box(x,y,-17.8,2.0,.72,.15,'#222730');g.box(x,y,-17.69,1.6,.52,.08,'#354f52',.58)}
 // Maintenance pipes and furnace.
 for(let i=0;i<7;i++){let z=-32+i*1.8;g.rod([-28,3.6,z],[-11,3.6,z],.075,'#7a5447');g.rod([-28,3.6,z],[-28,1.1,z],.065,'#796258')}g.box(-23,1.4,-29,5.7,2.6,3.4,'#393738');g.box(-23,1.55,-27.15,3.2,1.25,.08,'#a44931',1.5);g.sphere(-23,1.5,-27.0,.65,.5,.12,'#ea753b',2.4);
 // Executive office, wall safe, cigar humidor, filing cabinets.
 g.box(20,.95,-25,7,1.65,3,'#593f32');g.box(20,1.9,-25,7.5,.25,3.1,'#895b45');g.box(27,1.95,-30.5,4,3.5,1.5,'#363333');for(let i=0;i<4;i++)g.box(27,1+i*.7,-29.73,3.3,.2,.08,'#8c6c52');g.box(15,2.2,-32.66,2.6,2.6,.16,'#60413a');g.box(15,2.2,-32.53,1.9,.4,.08,'#9f705a');
 // Service passage: bare light strips, pipes, water patches.
 for(let z=-31;z<0;z+=3){g.box(-7.8,3,z,.12,.15,2.4,'#9d5348',.33);g.box(7.8,2.5,z,.12,.15,2.4,'#9b6851');g.box(-2,.007,z,1.5,.012,1.1,'#3f454a')}
 // The last room is suspiciously untouched, as if yesterday's party never ended.
 g.box(0,-.01,-40,13,.045,13,'#692d33');g.box(0,1,-41.5,4.2,.25,3.3,'#8b5544');for(let dx of [-1.5,1.5])for(let dz of [-1.1,1.1])g.box(dx,.48,-41.5+dz,.18,.9,.18,'#8e6451');g.sphere(0,1.36,-41.5,1.0,.28,.85,'#d9bc94');g.sphere(0,1.49,-41.5,.8,.27,.66,'#f0dfbe');for(let i=0;i<7;i++){let a=i/7*6.283;let x=Math.cos(a)*.62,z=-41.5+Math.sin(a)*.45;g.rod([x,1.65,z],[x,2.04,z],.028,'#e2b8aa');g.sphere(x,2.12,z,.06,.11,.06,'#e78d44',2.6)}
 for(let i=0;i<18;i++){let x=-7+seed()*14,z=-46+seed()*11;g.rod([x,.15,z],[x+.2,3.1,z],.015,'#847b6c');g.sphere(x+.2,3.2,z,.34,.39,.32,i%2?'#6f5d8e':'#a54d57',.48)}
 // Dust, ash, torn pennants and discarded party favors in every room.
 for(const r of rooms){if(r.open)continue;for(let i=0;i<28;i++){let x=r.x1+.5+seed()*(r.x2-r.x1-1),z=r.z1+.5+seed()*(r.z2-r.z1-1);g.box(x,.017,z,.06+seed()*.17,.025,.08+seed()*.26,['#6e5a4a','#6c363b','#4d5561'][i%3],0,seed()*3)}for(let i=0;i<8;i++){const x=r.x1+.3+seed()*(r.x2-r.x1-.6),z=r.z1+.3+seed()*(r.z2-r.z1-.6);g.box(x,2.65,z,.06,.07,.06,'#72706b',.05)}}
 // Pickup/symbolic interactable meshes (glowing items are visible in 3D).
 for(const o of objects){if(o.kind==='cake')continue;const col={letter:'#cdb89a',photo:'#c3a18f',book:'#74614d',key:'#d1b479',film:'#a8a0a6',switch:'#9b5c44',battery:'#c9bc77',tape:'#716d67'}[o.kind]||'#a39988';if(o.kind==='switch'){g.box(o.x,1.65,o.z,.73,1.1,.31,'#665047');g.box(o.x,1.85,o.z+.18,.37,.35,.12,col,1.1)}else if(o.kind==='key'){g.rod([o.x-.1,.9,o.z],[o.x+.25,.9,o.z],.04,'#c9b179',1);g.torus(o.x-.22,.91,o.z,.13,.032,'#d3a46e',1)}else if(o.kind==='film'){g.box(o.x,1,o.z,.4,.3,.35,col,1)}else if(o.kind==='battery'){g.box(o.x,1,o.z,.26,.55,.27,col,.6)}else{g.box(o.x,.85,o.z,.54,.07,.4,col,.55,seed()*1.5)}}
 }
 bunnyPoster(x,y,z,g){g.sphere(x,y,z,.9,.95,.24,'#9a8076',.15);g.rod([x-.4,y+.55,z],[x-.5,y+1.4,z],.22,'#9c837b');g.rod([x+.4,y+.55,z],[x+.55,y+1.42,z],.22,'#9c837b');g.sphere(x-.31,y+.13,z+.23,.18,.25,.09,'#171718');g.sphere(x+.31,y+.13,z+.23,.18,.25,.09,'#171718');g.sphere(x,y-.2,z+.29,.18,.13,.11,'#ae5b62');g.box(x,y-.52,z+.21,.35,.12,.09,'#d6c7a2')}
 getCollider({x,z},radius=.29){for(const w of this.walls){let px=clamp(x,w.x1,w.x2),pz=clamp(z,w.z1,w.z2);if((x-px)**2+(z-pz)**2<radius*radius)return true}return false}
}
