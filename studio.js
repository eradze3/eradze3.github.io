import * as THREE from './vendor/three.module.js';
import {studioMaterials} from './materials.js';
import {createWindowScene} from './window-scene.js';

/** An explorable studio, with geometry and locally drawn illustrative surfaces. */
export function createStudio(scene) {
  const root=new THREE.Group();root.name='Giorgi’s studio';scene.add(root);
  const interactive={model:new THREE.Group(),digital:new THREE.Group(),wall:new THREE.Group()};
  Object.entries(interactive).forEach(([area,g])=>{g.name=area;g.userData.area=area;root.add(g);});
  const staticParts=new THREE.Group();root.add(staticParts);
  const std=(color,options={})=>new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.15,...options});
  const pbr=studioMaterials();
  const concrete=pbr.wall,dark=std('#111d25'),black=std('#11171c',{roughness:.42}),steel=pbr.metal,paper=std('#d7d8cd',{metalness:0,roughness:.95}),wood=pbr.wood,linen=pbr.fabric,green=std('#375e43',{metalness:0,roughness:.64,side:THREE.DoubleSide}),green2=std('#547c58',{metalness:0,roughness:.7,side:THREE.DoubleSide});
  const amber=new THREE.MeshBasicMaterial({color:'#ffd0a0'}),cyan=new THREE.MeshBasicMaterial({color:'#74e6ee'}),purple=new THREE.MeshBasicMaterial({color:'#b591e2'});
  const boxCache=new Map(),cylinderCache=new Map();
  function mesh(geo,mat,parent=staticParts){const o=new THREE.Mesh(geo,mat);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  // Physical UVs survive static batching: one UV unit is one local world unit.
  // Material texture.repeat=.5 therefore gives a two-metre surface tile.
  function physicalUV(geo){const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));if(nx>ny&&nx>nz)uv.setXY(i,p.getZ(i),p.getY(i));else if(ny>nz)uv.setXY(i,p.getX(i),p.getZ(i));else uv.setXY(i,p.getX(i),p.getY(i));}uv.needsUpdate=true;return geo;}
  function box(w,h,d,x,y,z,mat=concrete,parent=staticParts){const key=[w,h,d].join('/');let geo=boxCache.get(key);if(!geo){geo=physicalUV(new THREE.BoxGeometry(w,h,d));boxCache.set(key,geo);}const o=mesh(geo,mat,parent);o.position.set(x,y,z);return o;}
  function cyl(r,h,x,y,z,mat=steel,parent=staticParts){const key=[r,h].join('/');let geo=cylinderCache.get(key);if(!geo){geo=new THREE.CylinderGeometry(r,r,h,20);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*Math.PI*r*2,uv.getY(i)*h);cylinderCache.set(key,geo);}const o=mesh(geo,mat,parent);o.position.set(x,y,z);return o;}
  function rod(a,b,r,mat=steel,parent=staticParts){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=cyl(r,av.distanceTo(bv),0,0,0,mat,parent);o.position.copy(av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o;}
  function roundedSlab(w,d,h,x,y,z,mat,parent=staticParts,r=.09){
    const s=new THREE.Shape(),l=-w/2,rr=w/2,b=-d/2,t=d/2;s.moveTo(l+r,b);s.lineTo(rr-r,b);s.quadraticCurveTo(rr,b,rr,b+r);s.lineTo(rr,t-r);s.quadraticCurveTo(rr,t,rr-r,t);s.lineTo(l+r,t);s.quadraticCurveTo(l,t,l,t-r);s.lineTo(l,b+r);s.quadraticCurveTo(l,b,l+r,b);
    const bevel=Math.min(.025,h*.18);const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:8});physicalUV(geo);const o=mesh(geo,mat,parent);o.rotation.x=-Math.PI/2;o.position.set(x,y,z);return o;
  }
  function cushion(w,h,d,r,mat,parent){const g=new THREE.BoxGeometry(w,h,d,12,12,4),p=g.attributes.position,n=g.attributes.normal,v=new THREE.Vector3(),inner=new THREE.Vector3(),dir=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);inner.set(THREE.MathUtils.clamp(v.x,-w/2+r,w/2-r),THREE.MathUtils.clamp(v.y,-h/2+r,h/2-r),THREE.MathUtils.clamp(v.z,-d/2+r,d/2-r));dir.copy(v).sub(inner).normalize();v.copy(inner).addScaledVector(dir,r);p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,dir.x,dir.y,dir.z);}physicalUV(g);return mesh(g,mat,parent);}
  function canvasSurface(width,height,draw,basic=false,density=1){
    if(typeof document==='undefined')return {material:basic?new THREE.MeshBasicMaterial({color:'#67818c'}):std('#aab2b1'),update:()=>{}};
    const canvas=document.createElement('canvas');canvas.width=Math.round(width*density);canvas.height=Math.round(height*density);const ctx=canvas.getContext('2d');ctx.setTransform(density,0,0,density,0,0);draw(ctx,width,height);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=16;
    const material=basic?new THREE.MeshBasicMaterial({map:texture,toneMapped:false}):new THREE.MeshStandardMaterial({map:texture,roughness:.9,metalness:0});
    return {material,texture,canvas,update(fn){ctx.setTransform(density,0,0,density,0,0);fn(ctx,width,height);texture.needsUpdate=true;}};
  }
  const noisy=canvasSurface(256,256,(c,w,h)=>{c.fillStyle='#58616a';c.fillRect(0,0,w,h);let seed=51;for(let i=0;i<18000;i++){seed=(seed*16807)%2147483647;const x=seed%w;seed=(seed*16807)%2147483647;const y=seed%h;c.fillStyle=i%2?'#ffffff08':'#0000000a';c.fillRect(x,y,1+(i%2),1);}});
  noisy.material.color.set('#68727c');
  if(noisy.texture){noisy.texture.wrapS=noisy.texture.wrapT=THREE.RepeatWrapping;noisy.texture.repeat.set(4,2);}

  // The room is open toward +z; the front is deliberately unobstructed for navigation.
  roundedSlab(22.5,16.6,.24,0,-.28,0,pbr.wall,staticParts,.1);
  box(22,.06,16,0,-.1,0,pbr.floor);
  // Recessed construction joints, rather than a bright graph-paper floor grid.
  for(let x=-10;x<=10;x+=2)box(.009,.003,16,x,-.068,0,dark);
  for(let z=-6;z<=6;z+=2)box(22,.003,.009,0,-.068,z,dark);
  box(9,7.1,.25,-6.5,3.48,-7.9,pbr.wall);box(7,7.1,.25,7.5,3.48,-7.9,pbr.wall);
  box(6,1.05,.25,1,.45,-7.9,pbr.wall);box(6,.62,.25,1,6.74,-7.9,pbr.wall);
  box(.24,7.1,11.9,-11,3.48,-1.95,pbr.wall);box(.24,7.1,4,11,3.48,-5.95,pbr.wall);
  box(.045,.045,11.8,-10.86,.18,-2,amber);box(21.7,.045,.045,0,.18,-7.7,amber);box(.045,.045,4,10.86,.18,-5.9,amber);
  // Fine warm strips and exposed studio beams are actual geometry.
  for(const z of [-6.7,1.7]){box(21.7,.13,.19,0,6.9,z,dark);box(16,.025,.045,0,6.82,z,amber);}
  for(const x of [-10.7,10.7])box(.22,6.9,.22,x,3.4,-7.55,steel);

  // The stencil-clipped exterior is created after batching; the opening itself
  // remains transparent to the real hills, tower and distant city geometry.
  // Stepped perimeter, recessed mullions and seals give the glazing physical depth.
  for(const x of [-2.09,4.09]){box(.12,5.64,.28,x,3.7,-7.66,steel);box(.038,5.47,.11,x+(x<0?.069:-.069),3.7,-7.51,black);}
  for(const y of [.94,6.46]){box(6.3,.12,.28,1,y,-7.66,steel);box(6.08,.025,.07,1,y+(y<4?.077:-.077),-7.50,black);}
  for(const x of [0,2]){box(.062,5.44,.14,x,3.7,-7.59,black);box(.016,5.4,.013,x+.024,3.7,-7.51,steel);}
  for(const y of [2.75,4.6]){box(6,.058,.14,1,y,-7.59,black);box(6,.012,.013,1,y+.021,-7.51,steel);}
  roundedSlab(6.45,.5,.06,1,.93,-7.47,pbr.table,staticParts,.025);
  box(6.37,.018,.025,1,.987,-7.23,steel);

  // The exhibition table. Everything inside the central footprint is reserved for
  // the separately authored occupied-building model.
  const table=interactive.model;
  roundedSlab(8.05,5.2,.18,0,.96,1,pbr.table,table,.12);
  roundedSlab(6.7,4.25,.85,0,.05,1,pbr.wall,table,.05);
  for(const x of [-3.99,3.99])box(.022,.018,5.04,x,1.157,1,cyan,table);
  for(const z of [-1.56,3.56])box(7.98,.018,.022,0,1.157,z,cyan,table);
  for(const x of [-3.91,3.91])box(.012,.006,4.88,x,1.169,1,steel,table);
  for(const z of [-1.44,3.44])box(7.82,.006,.012,0,1.169,z,steel,table);
  for(const x of [-3.72,3.72])for(const z of [-1.3,3.3]){cyl(.018,.006,x,1.173,z,steel,table);box(.022,.007,.003,x,1.175,z,black,table);}
  for(const z of [-1.12,3.12])box(6.7,.022,.025,0,.12,z,amber,table);
  for(const x of [-3.35,3.35])box(.025,.022,4.22,x,.12,1,amber,table);
  // Rolled drawings, a ruler, samples and a mug remain outside the model base.
  for(let i=0;i<3;i++){const roll=cyl(.085,.95,-3.1+i*.19,1.25,2.65,paper,table);roll.rotation.z=Math.PI/2;const ring=mesh(new THREE.TorusGeometry(.075,.013,6,18),linen,table);ring.rotation.y=Math.PI/2;ring.position.copy(roll.position);ring.position.x+=.48;}
  box(1.25,.014,.65,-2.15,1.18,2.9,paper,table);box(1.42,.015,.05,-1.9,1.2,3.28,steel,table);
  for(let i=0;i<3;i++)box(.38,.065,.34,1.85+i*.48,1.2,3.04,[noisy.material,paper,wood][i],table);
  cyl(.15,.3,3.3,1.32,2.8,black,table);const mugHandle=mesh(new THREE.TorusGeometry(.11,.023,6,16),steel,table);mugHandle.position.set(3.48,1.35,2.8);mugHandle.rotation.y=Math.PI/2;cyl(.125,.006,3.3,1.475,2.8,std('#21140f'),table);

  function plan(c,w,h,background='#d3d5cd',ink='#4f6166'){
    c.fillStyle=background;c.fillRect(0,0,w,h);c.strokeStyle=ink;c.lineWidth=3;c.strokeRect(35,45,w-70,h-100);
    c.lineWidth=2;for(let i=1;i<4;i++){const x=35+i*(w-70)/4;c.beginPath();c.moveTo(x,45);c.lineTo(x,h-55);c.stroke();}
    for(let i=1;i<3;i++){const y=45+i*(h-100)/3;c.beginPath();c.moveTo(35,y);c.lineTo(w-35,y);c.stroke();}
    c.lineWidth=1;for(let i=0;i<12;i++){const x=55+(i%4)*(w-75)/4,y=70+Math.floor(i/4)*(h-100)/3;c.strokeRect(x,y,28,17);c.strokeRect(x+40,y,18,35);c.beginPath();c.arc(x+20,y+52,12,0,Math.PI*2);c.stroke();}
    c.strokeStyle='#a27a53';c.beginPath();c.moveTo(24,h*.5);c.lineTo(w-24,h*.5);c.lineTo(w-24,24);c.stroke();c.fillStyle=ink;c.font='13px monospace';c.fillText('SCHEMATIC STUDY / NOT A CLIENT DRAWING',35,h-20);
  }
  const drawing=canvasSurface(512,384,plan,false,3);const paperModel=mesh(new THREE.PlaneGeometry(1.25,.65),drawing.material,table);paperModel.rotation.x=-Math.PI/2;paperModel.position.set(-2.15,1.195,2.9);

  // Project wall: several physical papers, conceptual project thumbnails and
  // annotation slips, with a stateful main board for the leadership narrative.
  const wall=interactive.wall;
  // The board and its review furniture form one left-wall experience area.
  // Authoring coordinates remain local, so papers, screens and labels retain alignment.
  wall.rotation.y=Math.PI/2;wall.position.set(-3.05,0,-6.05);
  box(7.4,4.15,.12,-6.55,3.8,-7.65,wood,wall);box(7.25,4,.025,-6.55,3.8,-7.575,std('#3e4646'),wall);
  for(const x of [-10.23,-2.87]){box(.037,4.12,.043,x,3.8,-7.56,steel,wall);box(.012,4.08,.013,x+(x<-6?.027:-.027),3.8,-7.532,black,wall);}
  for(const y of [1.74,5.86])box(7.4,.037,.043,-6.55,y,-7.56,steel,wall);
  const plaque=canvasSurface(768,96,(c,w,h)=>{c.fillStyle='#172d3e';c.fillRect(0,0,w,h);c.fillStyle='#c5d5dd';c.font='24px monospace';c.fillText('GE  /  EXPERIENCE & LEADERSHIP',29,58);},false,2);
  box(2.92,.38,.035,-6.55,1.46,-7.53,steel,wall);const plaqueFace=mesh(new THREE.PlaneGeometry(2.84,.355),plaque.material,wall);plaqueFace.position.set(-6.55,1.46,-7.508);
  let wallTopic=0;
  const wallMain=canvasSurface(1024,640,(c,w,h)=>drawWall(c,w,h,0),false,3);
  function drawWall(c,w,h,topic){
    c.fillStyle='#d2d2c4';c.fillRect(0,0,w,h);c.fillStyle='#263b44';c.font='bold 36px sans-serif';c.fillText(['PROJECT COORDINATION','PEOPLE & DELIVERY','ENGINEERING PERSPECTIVE'][topic%3],42,62);
    c.fillStyle='#68726c';c.font='18px monospace';c.fillText('GIORGI ERADZE / STUDIO NOTES',42,97);
    c.save();c.translate(42,126);plan(c,610,420,'#e3e2d6','#4d6168');c.restore();
    c.strokeStyle=topic===1?'#cb8b57':'#638d87';c.lineWidth=4;c.beginPath();c.ellipse(360,325,110,48,-.2,0,Math.PI*2);c.stroke();
    const notes=[['DISCIPLINES','INTERFACES','REVIEW'],['PRIORITIES','OWNERSHIP','HANDOVER'],['WHOLE BUILDING','SYSTEMS','DECISIONS']][topic%3];
    notes.forEach((n,i)=>{c.fillStyle=['#c7b593','#b5c3b6','#c2c5c0'][i];c.fillRect(692,155+i*114,280,93);c.fillStyle='#354447';c.font='22px monospace';c.fillText(n,710,193+i*114);c.font='16px sans-serif';c.fillText(['Understand the context','Connect the right people','Make the next step clear'][i],710,221+i*114);});
    c.fillStyle='#67746e';c.font='16px monospace';c.fillText('CONCEPTUAL STUDIO DISPLAY',42,600);
  }
  const wallFace=mesh(new THREE.PlaneGeometry(4.7,2.94),wallMain.material,wall);wallFace.position.set(-5.45,3.75,-7.52);wallFace.rotation.z=-.009;
  function thumbnail(style){return canvasSurface(512,320,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#708994');g.addColorStop(1,'#b1b1a0');c.fillStyle=g;c.fillRect(0,0,w,h);c.fillStyle='#525d5b';c.fillRect(0,258,w,62);const height=style?140:185;c.fillStyle=style?'#787d75':'#b4b1a1';c.fillRect(70,258-height,365,height);for(let y=85;y<250;y+=29)for(let x=83;x<428;x+=33){c.fillStyle=style?'#42575d':'#6c858a';c.fillRect(x,y,22,20);}c.fillStyle='#b5b29e';c.beginPath();c.moveTo(70,258-height);c.lineTo(104,50);c.lineTo(466,50);c.lineTo(435,258-height);c.fill();c.strokeStyle='#a6a596';c.lineWidth=4;c.strokeRect(70,258-height,365,height);c.fillStyle='#243a40';c.font='13px monospace';c.fillText('CONCEPT / SECTOR STUDY',18,298);},false,2);}
  [0,1].forEach((s,i)=>{const thumb=thumbnail(s);const p=mesh(new THREE.PlaneGeometry(2.05,1.28),thumb.material,wall);p.position.set(-9.02,4.47-i*1.53,-7.52);p.rotation.z=i?.018:-.012;const mount=box(2.13,1.36,.025,-9.02,4.47-i*1.53,-7.56,paper,wall);mount.rotation.z=p.rotation.z;});
  // Slightly curled paper edges and real pins break the perfect diagram-board flatness.
  for(let i=0;i<5;i++){const px=-8.8+i*1.3,py=i%2?5.46:2.14;const note=box(.42,.3,.009,px,py,-7.46,[paper,linen,wood][i%3],wall);note.rotation.z=(i-2)*.025;const pin=cyl(.022,.026,px,py+.12,-7.42,steel,wall);pin.rotation.x=Math.PI/2;}
  // Clips, wall lamps and a review table give the board tangible depth.
  for(const x of [-9.6,-7.9,-5.3,-2.3])box(.07,.12,.06,x,5.74,-7.5,steel,wall);
  for(const x of [-8.65,-4.4]){box(2.5,.07,.16,x,6.05,-7.28,black,wall);box(2.32,.015,.11,x,6,-7.28,amber,wall);rod([x,6.05,-7.4],[x,6.2,-7.7],.03,steel,wall);}
  // Slim architectural review desk: a stone-like top, inset work surface,
  // blade supports and a concealed service tray instead of thin four-leg scaffolding.
  roundedSlab(5.7,1.35,.065,-6.8,1.055,-5.75,pbr.table,wall,.035);
  roundedSlab(4.85,.99,.006,-6.8,1.134,-5.75,dark,wall,.025);
  box(5.45,.032,.035,-6.8,1.052,-5.095,wood,wall);
  for(const x of [-9.15,-4.45]){
    box(.105,1.06,1.08,x,.53,-5.75,steel,wall);
    box(.35,.035,1.22,x,.035,-5.75,steel,wall);
    box(.025,.78,.76,x+.06,.56,-5.75,pbr.wood,wall);
  }
  box(4.85,.12,.3,-6.8,.94,-6.18,dark,wall);
  box(4.9,.05,.07,-6.8,1.02,-6.3,steel,wall);
  box(5.47,.012,.014,-6.8,1.11,-5.073,steel,wall);
  for(const x of [-8.7,-4.8]){cyl(.055,.006,x,1.145,-6.16,black,wall);const grommet=mesh(new THREE.TorusGeometry(.053,.006,4,12),steel,wall);grommet.rotation.x=Math.PI/2;grommet.position.set(x,1.148,-6.16);}
  for(const x of [-8,-5.8]){cyl(.32,.1,x,.63,-4.55,black,wall);for(const a of [0,Math.PI*.5,Math.PI,Math.PI*1.5])rod([x+Math.cos(a)*.22,.59,-4.55+Math.sin(a)*.22],[x+Math.cos(a)*.3,.05,-4.55+Math.sin(a)*.3],.025,steel,wall);const foot=mesh(new THREE.TorusGeometry(.25,.018,6,24),steel,wall);foot.rotation.x=Math.PI/2;foot.position.set(x,.25,-4.55);}
  const reviewDrawing=mesh(new THREE.PlaneGeometry(1.3,.8),drawing.material,wall);reviewDrawing.rotation.x=-Math.PI/2;reviewDrawing.rotation.z=-.08;reviewDrawing.position.set(-7.5,1.15,-5.75);
  for(let i=0;i<2;i++){const roll=cyl(.07,.8,-8.8+i*.2,1.17,-5.75,paper,wall);roll.rotation.z=Math.PI/2;}

  // Digital lab: dual screens, an ergonomic chair, rack and everyday tools.
  const digital=interactive.digital;
  roundedSlab(5.9,1.65,.065,7,.885,-5.7,pbr.table,digital,.035);
  roundedSlab(3.2,.66,.006,6.75,.967,-5.18,dark,digital,.035);
  box(5.65,.032,.032,7,.886,-4.898,pbr.wood,digital);
  for(const x of [4.4,9.6]){box(.09,.84,1.15,x,.43,-5.8,steel,digital);box(.46,.035,1.35,x,.04,-5.8,steel,digital);box(.44,.1,1.32,x,.858,-5.8,steel,digital);}
  box(4.75,.1,.33,7,.79,-6.22,dark,digital);
  box(4.9,.045,.07,7,.86,-6.37,steel,digital);
  box(5.69,.013,.015,7,.944,-4.872,steel,digital);
  for(const x of [5.55,8.3]){cyl(.057,.008,x,.968,-6.23,black,digital);const grommet=mesh(new THREE.TorusGeometry(.055,.006,4,12),steel,digital);grommet.rotation.x=Math.PI/2;grommet.position.set(x,.974,-6.23);}
  box(5.6,.02,.025,7,.88,-4.84,purple,digital);
  const deskScreen=canvasSurface(1024,640,(c,w,h)=>drawMonitor(c,w,h,0,false),true,3);
  const secondScreen=canvasSurface(1024,640,(c,w,h)=>drawMonitor(c,w,h,0,true),true,3);
  function drawMonitor(c,w,h,step,detail,tab='os'){
    const ai=tab==='ai';
    c.fillStyle='#101c29';c.fillRect(0,0,w,h);c.fillStyle='#202b3c';c.fillRect(0,0,w,69);c.fillStyle='#e2e8ed';c.font='bold 28px sans-serif';c.fillText(ai?'AI WORKFLOW':'LAYOUT OS',32,45);c.font='15px monospace';c.fillStyle='#b29ad6';c.fillText(ai?'SCRIPTED DEMO':'WORKFLOW DEMO',w-210,42);
    c.fillStyle='#172637';c.fillRect(0,69,178,h-69);(ai?['Input','Suggestions','Review','Approve']:['Overview','Projects','Team','Reviews']).forEach((t,i)=>{c.fillStyle=i===1?'#bda1e9':'#839bae';c.font='20px sans-serif';c.fillText(t,25,125+i*65);});
    c.fillStyle='#deebf1';c.font='28px sans-serif';c.fillText(detail?'Engineering review':ai?'Human-reviewed assistance':'Connected coordination',212,123);c.font='16px monospace';c.fillStyle='#8197a7';c.fillText(ai?'ILLUSTRATIVE INPUT / NO LIVE ANALYSIS':'SAMPLE TASK / MEP-001',212,155);
    const cols=ai?['INPUT','REVIEW','APPROVE']:['DRAFT','ASSIGNED','REVIEWED'];cols.forEach((t,i)=>{const active=step>=i+1;c.fillStyle=active?'#b994e0':'#354758';c.fillRect(212+i*258,192,230,5);c.font='18px monospace';c.fillText(t,212+i*258,232);});
    if(detail){c.strokeStyle='#577789';c.lineWidth=2;c.strokeRect(230,285,365,240);for(let x=285;x<570;x+=70){c.beginPath();c.moveTo(x,285);c.lineTo(x,525);c.stroke();}for(let y=335;y<520;y+=65){c.beginPath();c.moveTo(230,y);c.lineTo(595,y);c.stroke();}c.strokeStyle=step>=3?'#8bd8b1':'#c39bdd';c.lineWidth=4;c.beginPath();c.moveTo(235,365);c.lineTo(420,365);c.lineTo(420,430);c.lineTo(590,430);c.stroke();c.fillStyle='#91b0bd';c.font='18px sans-serif';['Electrical','Mechanical','Coordination'].forEach((s,i)=>c.fillText(s,640,320+i*65));c.fillStyle=step>=3?'#8bd8b1':'#c39bdd';c.fillText(step>=3?'Review complete':'Review pending',640,530);}
    else{const nodeNames=ai?['INPUT','REVIEW','APPROVE']:['OBSERVE','ASSIGN','REVIEW'];const nodes=[{x:240,y:355,t:nodeNames[0]},{x:495,y:355,t:nodeNames[1]},{x:750,y:355,t:nodeNames[2]}];c.strokeStyle='#886eab';c.lineWidth=3;c.beginPath();c.moveTo(290,388);c.lineTo(850,388);c.stroke();nodes.forEach((n,i)=>{c.fillStyle=step>=i+1?'#674d88':'#263b50';c.fillRect(n.x,n.y,180,66);c.strokeStyle=step>=i+1?'#cba7ef':'#4d6477';c.strokeRect(n.x,n.y,180,66);c.fillStyle='#e7edf2';c.font='19px monospace';c.fillText(n.t,n.x+27,n.y+40);});c.fillStyle='#9aafbe';c.font='18px sans-serif';const lines=ai?['Explore a human-reviewed assistance workflow.','Sample input prepared for structured review.','Suggested output awaits engineering judgement.','Engineer approval completes this demonstration.']:['Explore a workflow shaped by engineering work.','Observation captured for coordination.','Discipline owner assigned.','Review checkpoint recorded.'];c.fillText(lines[Math.min(step,3)],228,485);}
    c.fillStyle='#677f90';c.font='14px monospace';c.fillText(ai?'SCRIPTED EXAMPLE / NO LIVE AI SERVICE':'ILLUSTRATIVE DATA / PRODUCT IN TESTING',212,600);
  }
  function monitor(x,angle,surface){
    const g=new THREE.Group();g.position.set(x,0,-5.85);g.rotation.y=angle;digital.add(g);
    roundedSlab(.61,.36,.023,0,.96,.1,steel,g,.022);
    const stem=box(.075,.34,.065,0,1.14,-.025,steel,g);stem.rotation.x=-.14;
    box(.16,.085,.075,0,1.31,-.048,black,g);
    box(1.91,1.21,.075,0,1.84,0,black,g);
    for(const xx of [-.936,.936])box(.012,1.18,.011,xx,1.84,.041,steel,g);
    box(1.87,.012,.011,0,2.431,.041,steel,g);
    box(1.86,.026,.014,0,1.256,.044,black,g);
    const p=mesh(new THREE.PlaneGeometry(1.78,1.112),surface.material,g);p.position.set(0,1.84,.057);p.castShadow=false;
    box(.11,.006,.007,0,1.257,.055,steel,g);
    const light=cyl(.007,.006,.83,1.257,.055,cyan,g);light.rotation.x=Math.PI/2;
    rod([0,1.45,-.06],[.04,1.1,-.09],.012,black,g);rod([.04,1.1,-.09],[.13,.98,-.35],.012,black,g);
    return g;
  }
  monitor(5.83,.07,deskScreen);monitor(7.95,-.12,secondScreen);
  roundedSlab(1.35,.42,.035,6.35,.95,-5.12,black,digital,.035);for(let row=0;row<4;row++)for(let key=0;key<14;key++)box(.07,.015,.055,5.85+key*.079,.992,-5.27+row*.075,linen,digital);
  roundedSlab(.48,.42,.012,7.48,.95,-5.08,linen,digital,.025);const mouse=mesh(new THREE.SphereGeometry(.11,12,8),black,digital);mouse.position.set(7.48,1.01,-5.08);mouse.scale.set(.65,.4,1);
  box(.6,.95,.92,9.1,.5,-5.6,black,digital);box(.45,.8,.02,9.1,.5,-5.125,steel,digital);for(let i=0;i<3;i++)cyl(.013,.018,9.18,.65-i*.09,-5.1,purple,digital).rotation.x=Math.PI/2;
  // A padded ergonomic chair, with softened upholstery and a shaped back shell.
  const chair=new THREE.Group();chair.position.set(6.85,0,-3.95);chair.rotation.y=-.18;digital.add(chair);cyl(.045,.58,0,.33,0,steel,chair);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod([0,.18,0],[Math.cos(a)*.44,.12,Math.sin(a)*.44],.035,steel,chair);const wheel=cyl(.067,.045,Math.cos(a)*.44,.075,Math.sin(a)*.44,black,chair);wheel.rotation.z=Math.PI/2;}
  const seat=cushion(.78,.17,.7,.072,linen,chair);seat.position.set(0,.63,.01);seat.rotation.x=-.035;
  const shellBack=cushion(.75,.91,.13,.055,black,chair);shellBack.position.set(0,1.13,-.35);shellBack.rotation.x=-.13;
  const back=cushion(.67,.83,.12,.05,linen,chair);const bp=back.geometry.attributes.position;for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i);bp.setZ(i,bp.getZ(i)+x*x*.4+Math.sin(y*3)*.018);}back.geometry.computeVertexNormals();back.position.set(0,1.13,-.268);back.rotation.x=-.13;
  const lumbar=cushion(.53,.19,.075,.03,linen,chair);lumbar.position.set(0,.93,-.175);lumbar.rotation.x=-.1;
  for(const x of [-.44,.44]){rod([x,.6,.03],[x,.88,.03],.025,steel,chair);roundedSlab(.13,.43,.055,x,.86,.02,black,chair,.04);}
  rod([0,.65,-.25],[0,1.05,-.43],.045,steel,chair);
  // Compact rack, shelves and desk lamp.
  box(1.15,2.45,1.2,10,.23+1.22,-6.8,black,digital);for(let i=0;i<8;i++){box(.96,.21,.03,10,.55+i*.25,-6.18,steel,digital);box(.32,.018,.025,9.8,.55+i*.25,-6.15,purple,digital);for(let k=0;k<3;k++)box(.02,.02,.02,10.2+k*.07,.55+i*.25,-6.14,cyan,digital);}
  cyl(.19,.035,9.1,.955,-5.95,black,digital);rod([9.1,.98,-5.95],[9.1,1.75,-6.0],.025,steel,digital);rod([9.1,1.75,-6],[8.75,2,-5.6],.025,steel,digital);const shade=mesh(new THREE.ConeGeometry(.21,.26,20,1,true),black,digital);shade.position.set(8.75,1.92,-5.6);cyl(.15,.015,8.75,1.8,-5.6,amber,digital);
  function book(w,h,d,x,y,z,cover,parent){
    box(w-.014,h-.024,d-.026,x,y,z,paper,parent);
    for(const side of [-1,1])box(.012,h,d,x+side*w*.5,y,z,cover,parent);
    box(w,h,.018,x,y,z+d*.5,cover,parent);
    // Endpaper lip, printed spine bars and tiny binding ridges.
    for(const yy of [-h*.3,h*.3])box(w*.72,.012,.003,x,y+yy,z+d*.5+.011,linen,parent);
    box(w*.58,.04,.004,x,y+h*.1,z+d*.5+.012,paper,parent);
    for(let i=1;i<4;i++)box(w-.03,.002,d-.045,x,y-h*.5+i*.006,z,paper,parent);
  }
  for(const y of [3.3,4.45]){roundedSlab(5.5,.65,.1,7.8,y-.05,-7.35,wood,digital,.025);box(5.3,.018,.025,7.8,y-.06,-7.03,amber,digital);for(let i=0;i<12;i++){const h=.35+(i%4)*.08;book(.12+(i%3)*.02,h,.34,5.35+i*.17,y+.05+h/2,-7.27,[black,wood,linen,concrete][i%4],digital);}}

  function leafGeometry(){const positions=[],uvs=[],indices=[],rows=6,sides=4;for(let row=0;row<=rows;row++){const t=row/rows,half=Math.pow(Math.sin(Math.PI*t),.8)*.22;for(let col=0;col<=sides;col++){const v=col/sides*2-1;positions.push(v*half,t,.035*(1-v*v)*Math.sin(Math.PI*t)-.12*t*t);uvs.push(col/sides,t);if(row<rows&&col<sides){const a=row*(sides+1)+col;indices.push(a,a+1,a+sides+1,a+1,a+sides+2,a+sides+1);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();return g;}
  const leafGeo=leafGeometry(),soil=std('#26251d',{metalness:0,roughness:1}),ceramic=std('#727469',{roughness:.85,metalness:0});
  function plant(x,z,height,parent=staticParts,y=0){
    const r=height*.17,ph=height*.26;
    const profile=[new THREE.Vector2(r*.72,0),new THREE.Vector2(r*.78,.015),new THREE.Vector2(r*.91,ph*.5),new THREE.Vector2(r,ph*.96),new THREE.Vector2(r,ph),new THREE.Vector2(r*.92,ph+.008),new THREE.Vector2(r*.88,ph*.96),new THREE.Vector2(r*.7,.03)];
    const pot=mesh(new THREE.LatheGeometry(profile,12),ceramic,parent);pot.position.set(x,y,z);cyl(r*.87,.012,x,y+ph*.93,z,soil,parent);
    rod([x,y+ph*.9,z],[x,y+height*.96,z],height*.01,wood,parent);
    for(let i=0;i<28;i++){const a=i*2.399,level=.35+(i%8)*.075,yy=y+height*level,reach=height*(.11+(i%4)*.042);const ex=x+Math.cos(a)*reach,ez=z+Math.sin(a)*reach;rod([x,yy-.11*height,z],[ex,yy,ez],height*.0037,green,parent);const leaf=mesh(leafGeo,i%3?green:green2,parent);const length=height*(.19+.045*Math.sin(i*1.7)),width=.85+(i%4)*.13;leaf.scale.set(length*width,length,length);leaf.position.set(ex,yy,ez);const direction=new THREE.Vector3(Math.cos(a)*.7,.55+(i%3)*.1,Math.sin(a)*.7).normalize();leaf.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);leaf.rotateY(Math.sin(i)*.5);
    }
  }
  plant(-10,-3.9,2.1,wall);plant(10,-3.7,1.9,digital);plant(9.6,-7.25,.9,digital,4.5);
  // Shelves occupy the vacated rear-wall zone, leaving the left review area open.
  const shelf=new THREE.Group();shelf.position.set(-6.3,0,-7.3);shelf.rotation.y=Math.PI/2;root.add(shelf);for(const z of [-1.7,.7])box(.09,3.8,.09,0,1.9,z,steel,shelf);for(const y of [.4,1.35,2.3,3.25]){roundedSlab(.65,2.6,.09,0,y-.045,-.5,wood,shelf,.025);for(let i=0;i<6;i++)book(.34,.44+i%2*.12,.13,0,y+.28,-1.45+i*.17,[linen,dark,wood][i%3],shelf);}
  plant(0,-.7,.65,shelf,3.35);

  // Restrained practical lights. Main scene illumination remains owned by caller.
  const lampWarm=new THREE.PointLight('#ffcb94',8,10,2);lampWarm.position.set(-6.5,5.7,-6.9);wall.add(lampWarm);
  const lampCool=new THREE.PointLight('#bd9aeb',5,7,2);lampCool.position.set(7,2,-5);root.add(lampCool);

  // Preserve interactive ownership while batching each group's static meshes.
  function markArea(g,area){g.traverse(o=>{if(o.isMesh)o.userData.area=area;});}
  Object.entries(interactive).forEach(([area,g])=>markArea(g,area));
  function batch(g){
    for(const child of [...g.children])if(child.isGroup)batch(child);
    const buckets=new Map();for(const o of g.children){if(!o.isMesh||o.material.transparent||o.geometry.type==='PlaneGeometry')continue;const list=buckets.get(o.material)||[];list.push(o);buckets.set(o.material,list);}
    for(const [mat,list]of buckets){if(list.length<3)continue;const geos=[];let count=0;for(const o of list){o.updateMatrix();const geom=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geom.applyMatrix4(o.matrix);geos.push(geom);count+=geom.attributes.position.count;}
      const merged=new THREE.BufferGeometry();for(const attr of ['position','normal','uv']){const size=attr==='uv'?2:3,arr=new Float32Array(count*size);let offset=0;for(const geom of geos){if(geom.attributes[attr])arr.set(geom.attributes[attr].array,offset);offset+=geom.attributes.position.count*size;}merged.setAttribute(attr,new THREE.BufferAttribute(arr,size));}merged.computeBoundingSphere();const out=mesh(merged,mat,g);out.userData.area=list[0].userData.area;list.forEach(o=>g.remove(o));geos.forEach(o=>o.dispose());
    }
  }
  batch(root);
  const windowScene=createWindowScene(scene);
  const anchors={
    model:{position:new THREE.Vector3(7.8,5.9,10),target:new THREE.Vector3(0,2.65,.8)},
    digital:{position:new THREE.Vector3(5,2.5,-.4),target:new THREE.Vector3(7,1.75,-5.65)},
    wall:{position:new THREE.Vector3(-5.4,3.5,3.7),target:new THREE.Vector3(-10.58,3.65,.5)}
  };
  const colliders=[
    {minX:-4.15,maxX:4.15,minZ:-1.75,maxZ:3.75},
    {minX:3.9,maxX:10.2,minZ:-6.65,maxZ:-4.72},
    {minX:6.25,maxX:7.5,minZ:-4.55,maxZ:-3.35},
    // Left review desk and its two stools, transformed with the complete wall group.
    {minX:-9.62,maxX:-8.0,minZ:-2.25,maxZ:3.75},
    {minX:-8.05,maxX:-7.15,minZ:1.5,maxZ:2.4},
    {minX:-8.05,maxX:-7.15,minZ:-.7,maxZ:.2},
    {minX:-8.15,maxX:-5.35,minZ:-7.75,maxZ:-6.85},
    {minX:-7.4,maxX:-6.5,minZ:3.5,maxZ:4.4}
  ];
  const hotspotPositions={model:new THREE.Vector3(2.3,2,3.3),digital:new THREE.Vector3(7,2.55,-5.65),wall:new THREE.Vector3(-10.45,6.4,.5)};
  let lastStep=-1,lastTopic=-1,lastTab='';
  function update(t,dt,state={}){
    windowScene.update(t,dt,state);
    const step=Math.max(0,Math.min(3,Number(state.digitalStep)||0)),tab=state.digitalTab==='ai'?'ai':'os';if(step!==lastStep||tab!==lastTab){deskScreen.update((c,w,h)=>drawMonitor(c,w,h,step,false,tab));secondScreen.update((c,w,h)=>drawMonitor(c,w,h,step,true,tab));lastStep=step;lastTab=tab;}
    const topic=Math.max(0,Math.min(2,Number(state.wallTopic)||0));if(topic!==lastTopic){wallMain.update((c,w,h)=>drawWall(c,w,h,topic));lastTopic=topic;wallTopic=topic;}
    lampCool.intensity=state.area==='digital'?11:7;lampWarm.intensity=state.area==='wall'?20:15;
  }
  return {root,tableTop:1.15,interactive,colliders,anchors,hotspotPositions,windowScene,update};
}

