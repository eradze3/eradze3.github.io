import * as THREE from './vendor/three.module.js';
import {modelMaterials} from './materials.js';

/** A furnished, sectional building model. All dimensions and engineering are illustrative. */
export function createProjectModel(scene) {
  const root=new THREE.Group();root.name='Occupied project model';root.position.set(0,1.2,.8);root.userData.area='model';scene.add(root);
  const floors=[],services=[],ceilings=[],flows=[],fans=[];
  const systems={};for(const id of ['electrical','elv','hvac','plumbing','bms']){const g=new THREE.Group();g.name=id;g.userData.area='model';g.userData.system=id;root.add(g);systems[id]=g;}
  const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.12,...extra});
  const finishes=modelMaterials();
  function finish(source,color){const m=source.clone();m.color.set(color);return m;}
  const M={
    stone:finish(finishes.stone,'#c2d0d5',1.5),edge:mat('#d5e0e3',{roughness:.48}),frame:finish(finishes.metal,'#667e8b',1),black:mat('#283843',{roughness:.58}),wood:finish(finishes.wood,'#a5a8a4',2),wall:mat('#c9d2d3',{roughness:.88}),carpet:finish(finishes.fabric,'#708590',4),seat:finish(finishes.fabric,'#718b99',2),white:mat('#dce7e9',{roughness:.38}),leaf:mat('#577a6b',{roughness:.8}),leaf2:mat('#84a092',{roughness:.7}),soil:mat('#39443e'),
    glass:mat('#9dc7d3',{transparent:true,opacity:.13,metalness:.15,roughness:.22,envMapIntensity:.8,depthWrite:false}),
    screen:new THREE.MeshBasicMaterial({color:'#42616a'}),
    light:mat('#f3d5aa',{emissive:'#f1c386',emissiveIntensity:.8,roughness:.45}),
    electrical:mat('#ffcb3f',{emissive:'#ffb600',emissiveIntensity:1,metalness:.18,roughness:.4}),
    elv:mat('#bd67ff',{emissive:'#a84cff',emissiveIntensity:.9,metalness:.12}),
    hvac:mat('#1dd1e6',{metalness:.28,roughness:.35,emissive:'#09aeca',emissiveIntensity:.7}),
    plumbing:mat('#408cff',{metalness:.2,emissive:'#1d6dff',emissiveIntensity:.95}),
    fire:mat('#f35b48',{metalness:.18,emissive:'#ee3826',emissiveIntensity:.8}),hot:mat('#d89365'),
    bms:mat('#50ee88',{emissive:'#18d95c',emissiveIntensity:1.1,metalness:.1})
  };
  // Self-lit materials provide a crisp MEP highlight without a bloom pass or duplicate meshes.
  const serviceVisuals=['electrical','elv','hvac','plumbing','fire','bms'].map(id=>({id,material:M[id],color:M[id].color.clone(),glow:M[id].emissiveIntensity}));
  const routeWidth=new Map([[M.electrical,1.65],[M.elv,1.6],[M.hvac,1.3],[M.plumbing,1.65],[M.fire,1.55],[M.bms,1.75]]);
  M.frame.roughness=.37;M.frame.metalness=.65;
  const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,8),leafGeo=new THREE.SphereGeometry(1,6,3),softCache=new Map();
  function mesh(geometry,material,parent=root){const m=new THREE.Mesh(geometry,material);m.userData.area='model';m.castShadow=!material.transparent&&!material.isMeshBasicMaterial;m.receiveShadow=!material.isMeshBasicMaterial;parent.add(m);return m;}
  function box(w,h,d,x,y,z,m,parent=root){const o=mesh(boxGeo,m,parent);o.scale.set(w,h,d);o.position.set(x,y,z);return o;}
  function cyl(r,h,x,y,z,m,parent=root){const o=mesh(cylGeo,m,parent);o.scale.set(r,h,r);o.position.set(x,y,z);return o;}
  // A small bevel and rounded corners catch the room lighting without a heavy modifier stack.
  function softBox(w,h,d,x,y,z,m,parent=root,r=.012){const key=[w,h,d,r].join(':');let geo=softCache.get(key);if(!geo){const a=Math.min(r,w*.2,d*.2),bevel=h>=.04?Math.min(.005,h*.15,a*.35):0,l=-w/2,rr=w/2,b=-d/2,t=d/2,s=new THREE.Shape();s.moveTo(l+a,b);s.lineTo(rr-a,b);s.quadraticCurveTo(rr,b,rr,b+a);s.lineTo(rr,t-a);s.quadraticCurveTo(rr,t,rr-a,t);s.lineTo(l+a,t);s.quadraticCurveTo(l,t,l,t-a);s.lineTo(l,b+a);s.quadraticCurveTo(l,b,l+a,b);geo=new THREE.ExtrudeGeometry(s,{depth:h-2*bevel,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,curveSegments:2,steps:1});geo.rotateX(-Math.PI/2);geo.translate(0,-h/2+bevel,0);softCache.set(key,geo);}const o=mesh(geo,m,parent);o.position.set(x,y,z);return o;}
  function beam(a,b,r,m,parent=root){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),o=cyl(r,p.distanceTo(q),0,0,0,m,parent);o.position.copy(p.clone().add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());return o;}
  function linePath(points){const path=new THREE.CurvePath();for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));return path;}
  function pipe(points,r,m,parent=root){const curve=linePath(points);const o=mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*3),r*(routeWidth.get(m)||1),5,false),m,parent);return {curve,o};}
  function flow(curve,id,parent,count=2){for(let i=0;i<count;i++){const o=mesh(new THREE.SphereGeometry(.025,6,4),new THREE.MeshBasicMaterial({color:{electrical:'#fff2bc',elv:'#ecd0ff',hvac:'#c3fbff',plumbing:'#d2e8ff',bms:'#dcffe8'}[id]}),parent);o.userData.dynamic=true;flows.push({curve,id,object:o,offset:i/count});}}
  function duct(points,w,h,parent){for(let i=1;i<points.length;i++){const a=new THREE.Vector3(...points[i-1]),b=new THREE.Vector3(...points[i]),o=box(w*1.3,h*1.3,a.distanceTo(b),0,0,0,M.hvac,parent);o.position.copy(a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),b.sub(a).normalize());}}
  function plant(x,y,z,scale,parent){cyl(scale*.15,scale*.26,x,y+scale*.13,z,M.stone,parent);cyl(scale*.132,.005,x,y+scale*.265,z,M.soil,parent);beam([x,y+scale*.23,z],[x,y+scale*.63,z],scale*.014,M.leaf,parent);for(let i=0;i<10;i++){const angle=i*2.4,yy=y+scale*(.32+(i%5)*.075),reach=scale*(.12+(i%3)*.025),ex=x+Math.cos(angle)*reach,ez=z+Math.sin(angle)*reach;beam([x,yy-.035*scale,z],[ex,yy+.035*scale,ez],scale*.006,M.leaf,parent);const leaf=mesh(leafGeo,i%3?M.leaf:M.leaf2,parent);leaf.position.set(ex,yy+.04*scale,ez);leaf.scale.set(scale*.15,scale*.018,scale*.055);leaf.rotation.set(Math.sin(i)*.35,-angle,Math.cos(i)*.3);}}
  function chair(x,z,rotation,parent){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);softBox(.21,.043,.205,0,.22,0,M.seat,g,.038);const back=softBox(.205,.035,.21,0,.34,.097,M.seat,g,.04);back.rotation.x=Math.PI/2-.13;beam([0,.2,.05],[0,.4,.115],.011,M.frame,g);cyl(.014,.17,0,.12,0,M.frame,g);for(let i=0;i<5;i++){const a=i*Math.PI*2/5,xx=Math.cos(a)*.115,zz=Math.sin(a)*.115;beam([0,.045,0],[xx,.025,zz],.009,M.frame,g);const wheel=cyl(.021,.019,xx,.025,zz,M.black,g);wheel.rotation.z=Math.PI/2;}for(const xx of [-.125,.125]){beam([xx,.22,0],[xx,.3,0],.008,M.frame,g);softBox(.035,.018,.11,xx,.31,0,M.black,g,.012);}return g;}
  function desk(x,z,rotation,parent,servicesGroup){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);softBox(.62,.032,.34,0,.34,0,M.wood,g,.025);for(const xx of [-.26,.26]){box(.025,.3,.027,xx,.17,-.1,M.frame,g);softBox(.045,.018,.28,xx,.025,-.02,M.frame,g,.012);}softBox(.215,.018,.145,0,.47,-.08,M.black,g,.008).rotation.x=Math.PI/2;box(.186,.116,.004,0,.47,-.068,M.screen,g);box(.014,.05,.014,0,.37,-.08,M.frame,g);softBox(.09,.008,.055,0,.36,-.08,M.frame,g,.009);softBox(.185,.01,.068,-.025,.365,.07,M.black,g,.009);for(let row=0;row<3;row++)for(let k=0;k<8;k++)box(.012,.002,.009,-.1+k*.021,.372,.05+row*.018,M.frame,g);const mouse=mesh(leafGeo,M.black,g);mouse.position.set(.14,.373,.07);mouse.scale.set(.018,.007,.027);chair(0,.29,0,g);box(.05,.004,.08,.23,.362,.03,M.white,g);cyl(.019,.037,.23,.38,-.07,M.white,g);if(servicesGroup){box(.028,.035,.028,x,.18,z-.15,M.bms,servicesGroup);}}
  function glassWall(w,h,x,z,rotation,parent,door=false){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);box(w,h,.017,0,h/2+.08,0,M.glass,g);box(w,.018,.025,0,h+.08,0,M.frame,g);for(const xx of [-w/2,w/2])box(.018,h,.025,xx,h/2+.08,0,M.frame,g);if(door){box(.017,h,.025,w/2-.28,h/2+.08,0,M.frame,g);box(.018,.08,.025,w/2-.05,.45,.02,M.frame,g);}}
  function rail(a,b,y,parent){beam([a[0],y,a[1]],[b[0],y,b[1]],.012,M.frame,parent);const count=Math.max(2,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.3));for(let i=0;i<=count;i++){const x=THREE.MathUtils.lerp(a[0],b[0],i/count),z=THREE.MathUtils.lerp(a[1],b[1],i/count);beam([x,y-.28,z],[x,y,z],.008,M.frame,parent);}}
  // Section-model base, entrance threshold and terrace. The front remains open for inspection.
  softBox(5.65,.1,3.75,0,-.04,0,M.frame,root,.055);softBox(5.5,.055,3.65,0,.04,0,M.stone,root,.035);
  for(const x of [-2.4,2.1]){box(.65,.17,.22,x,.13,1.69,M.frame);for(let k=0;k<3;k++)plant(x-.2+k*.2,.2,1.69,.22,root);}
  const shaft=new THREE.Group();shaft.name='Continuous service shaft';root.add(shaft);
  const shaftBack=box(.6,3.18,.035,2.32,1.59,-1.5,M.frame,shaft),shaftSide=box(.035,3.18,.42,2.61,1.59,-1.3,M.frame,shaft);
  // Vertical routes are continuous from foundation to rooftop, including in reveal view.
  const risers=[];const riserMap={electrical:[2.13,-1.34],elv:[2.24,-1.34],hvac:[2.41,-1.32],plumbing:[2.53,-1.32],bms:[2.03,-1.34]};
  for(const[id,[x,z]]of Object.entries(riserMap)){const r=(id==='hvac'?.049:id==='plumbing'?.024:.018)*(routeWidth.get(M[id])||1);const o=cyl(r,3.2,x,1.6,z,M[id],systems[id]);o.userData.dynamic=true;risers.push({o,id,x,z});}
  for(let f=0;f<3;f++){
    const g=new THREE.Group();g.name=`Occupied floor ${f+1}`;g.position.y=f*1.05;g.userData.baseY=f*1.05;root.add(g);floors.push(g);
    const sg={};for(const id of Object.keys(systems)){const s=new THREE.Group();s.position.y=g.position.y;s.userData.system=id;s.userData.area='model';systems[id].add(s);sg[id]=s;}services.push(sg);
    // Split slabs leave the stairwell opening intact at the upper floors.
    if(f===0)softBox(5.4,.075,3.4,0,.035,0,M.stone,g,.018);else{softBox(3.2,.075,3.4,-1.1,.035,0,M.stone,g,.015);softBox(.85,.075,3.4,2.275,.035,0,M.stone,g,.015);softBox(1.35,.075,.54,1.175,.035,-1.43,M.stone,g,.015);softBox(1.35,.075,.38,1.175,.035,1.51,M.stone,g,.015);}
    softBox(5.4,.055,.055,0,.07,1.69,M.edge,g,.012);
    box(2.85,.008,2.7,-1.1,.073,-.07,M.carpet,g);
    // Structure and selective facade: rear and one front bay have glazing, the rest is cut away.
    for(const x of [-2.65,-.5,2.65])for(const z of [-1.65,1.65])softBox(.085,.98,.085,x,.56,z,M.frame,g,.012);
    for(const z of [-1.65,1.65])softBox(5.4,.09,.09,0,1.025,z,M.edge,g,.015);
    for(const x of [-2.65,2.65])softBox(.09,.09,3.4,x,1.025,0,M.edge,g,.015);
    glassWall(4.65,.84,-.3,-1.67,0,g);for(let x=-2.5;x<1.9;x+=.4)box(.022,.86,.025,x,.52,-1.68,M.frame,g);
    glassWall(1.3,.84,-2,1.67,0,g);for(const x of [-2.45,-2.02,-1.6])box(.022,.86,.025,x,.52,1.68,M.frame,g);
    glassWall(2.45,.84,-2.67,-.32,Math.PI/2,g);for(const z of [-1.42,-.9,-.4,.1,.6])box(.025,.86,.022,-2.68,.52,z,M.frame,g);
    // Corridor separates usable rooms from the stair and service core.
    glassWall(2.55,.8,-.45,-.05,Math.PI/2,g,true);glassWall(2.1,.8,-1.55,.15,0,g,true);
    if(f===0){desk(-2.05,-.75,Math.PI,g,sg.bms);desk(-1.15,-.75,Math.PI,g,sg.bms);desk(-2.05,.85,0,g,sg.bms);desk(-1.15,.85,0,g,sg.bms);}
    if(f===1){
      softBox(1.15,.045,.53,-1.55,.37,-.65,M.wood,g,.09);for(const xx of [-1.85,-1.25])softBox(.14,.3,.34,xx,.2,-.65,M.frame,g,.025);for(const x of [-1.95,-1.55,-1.15]){chair(x,-.15,0,g);chair(x,-1.13,Math.PI,g);}for(const x of [-1.9,-1.2])desk(x,.85,0,g,sg.bms);
      box(.75,.38,.035,-1.55,.62,-1.58,M.black,g);box(.68,.31,.012,-1.55,.62,-1.55,M.screen,g);
    }
    if(f===2){
      for(const x of [-2.05,-1.15])desk(x,-.72,Math.PI,g,sg.bms);
      softBox(.98,.1,.36,-1.7,.12,1.12,M.frame,g,.04);for(const xx of [-1.96,-1.44])softBox(.45,.12,.34,xx,.21,1.12,M.seat,g,.045);softBox(.95,.27,.1,-1.7,.34,1.29,M.seat,g,.04);for(const xx of [-2.18,-1.22])softBox(.1,.24,.4,xx,.22,1.12,M.seat,g,.035);softBox(.42,.035,.32,-1.6,.23,.62,M.wood,g,.05);cyl(.08,.2,-1.6,.12,.62,M.frame,g);chair(-.9,.7,-Math.PI/2,g);
    }
    plant(-2.32,.08,.28,.4,g);plant(-.83,.08,-1.3,.33,g);
    // WCs and utility cupboard occupy the rear-right corner rather than an entire technical floor.
    box(.65,.8,.045,.96,.48,-1.55,M.wall,g);box(.045,.8,.7,.62,.48,-1.24,M.wall,g);box(.045,.8,.7,1.29,.48,-1.24,M.wall,g);box(.65,.8,.045,.96,.48,-.9,M.wall,g);box(.22,.12,.21,.98,.22,-1.23,M.white,g);box(.2,.23,.07,.98,.31,-1.4,M.white,g);box(.24,.06,.18,.76,.4,-1.2,M.white,g);pipe([[.75,.4,-1.2],[.75,.45,-1.2],[.75,.45,-1.14]],.009,M.frame,g);
    // A real straight stair connects landing to landing. Upper-floor slab aperture is open.
    if(f<2){const n=15;for(let i=0;i<n;i++){const y=.1+i*.066,z=1.23-i*.15;box(.85,.045,.17,1.25,y,z,M.edge,g);}beam([.8,.38,1.28],[.8,1.32,-.87],.012,M.frame,g);beam([1.7,.38,1.28],[1.7,1.32,-.87],.012,M.frame,g);for(let i=0;i<8;i++){const z=1.2-i*.29,y=.39+i*.128;beam([.8,y-.25,z],[.8,y,z],.008,M.frame,g);beam([1.7,y-.25,z],[1.7,y,z],.008,M.frame,g);}}
    if(f>0){rail([.55,1.34],[1.8,1.34],.4,g);rail([.55,-1.14],[1.8,-1.14],.4,g);}
    // Suspended ceilings: modest panels become translucent when the model is opened.
    const ceilingMat=mat('#d8d9cc',{transparent:true,opacity:.94,depthWrite:false,side:THREE.DoubleSide});ceilings.push(ceilingMat);
    box(2.9,.018,2.7,-1.1,.947,0,ceilingMat,g);box(.6,.018,2.7,.04,.947,0,ceilingMat,g);
    // HVAC main is routed from shaft into the corridor, then to rooms; every branch connects.
    duct([[2.41,.89,-1.32],[1.9,.89,-1.32],[1.9,.89,-.4],[-2.35,.89,-.4]],.12,.09,sg.hvac);
    for(const x of [-1.95,-1.1,-.05])for(const z of [-1,.9]){duct([[x,.89,-.4],[x,.89,z]],.075,.055,sg.hvac);box(.18,.018,.18,x,.93,z,M.white,sg.hvac);for(let k=-2;k<=2;k++)box(.13,.006,.009,x,.918,z+k*.023,M.hvac,sg.hvac);}
    flow(linePath([[2.41,.89,-1.32],[1.9,.89,-1.32],[1.9,.89,-.4],[-2.35,.89,-.4]]),'hvac',sg.hvac,2);
    // Cable tray with two lips and connected lighting / power branches.
    pipe([[2.13,.84,-1.34],[1.7,.84,-1.34],[1.7,.84,.35],[-2.35,.84,.35]],.015,M.electrical,sg.electrical);
    box(4.05,.02,.085,-.325,.82,.35,M.frame,sg.electrical);for(const z of [.31,.39])box(4.05,.035,.009,-.325,.834,z,M.electrical,sg.electrical);
    for(const x of [-2.05,-1.1])for(const z of [-.8,.82]){pipe([[x,.84,.35],[x,.84,z],[x,.93,z]],.008,M.electrical,sg.electrical);box(.5,.012,.035,x,.93,z,M.light,sg.electrical);}
    flow(linePath([[2.13,.84,-1.34],[1.7,.84,-1.34],[1.7,.84,.35],[-2.35,.84,.35]]),'electrical',sg.electrical,2);
    // ELV tray follows its own route, with wall/data drops to occupied work areas.
    const data=pipe([[2.24,.79,-1.34],[1.8,.79,-1.34],[1.8,.79,.52],[-2.35,.79,.52]],.012,M.elv,sg.elv);flow(data.curve,'elv',sg.elv,2);
    for(const x of [-2.05,-1.1])pipe([[x,.79,.52],[x,.79,-1.48],[x,.22,-1.48]],.008,M.elv,sg.elv);
    box(.08,.045,.06,-2.47,.78,1.43,M.elv,sg.elv);cyl(.015,.025,-2.47,.75,1.44,M.black,sg.elv);
    // Domestic-water connection to the WC and a separate high-level fire branch.
    const water=pipe([[2.53,.76,-1.32],[1.46,.76,-1.32],[1.46,.3,-1.32],[.98,.3,-1.32]],.012,M.plumbing,sg.plumbing);flow(water.curve,'plumbing',sg.plumbing,1);
    pipe([[2.55,.82,-1.3],[2.55,.82,1.12],[-2.35,.82,1.12]],.015,M.fire,sg.plumbing);
    for(const x of [-2,-1,0,1.7]){beam([x,.82,1.12],[x,.93,1.12],.008,M.fire,sg.plumbing);cyl(.025,.012,x,.93,1.12,M.white,sg.plumbing);}
    pipe([[2.5,.24,-1.28],[1.45,.24,-1.28],[.98,.24,-1.28]],.022,M.frame,sg.plumbing);
    // BMS sensors have an actual circuit back to the riser.
    const controls=pipe([[2.03,.73,-1.34],[1.85,.73,-1.34],[1.85,.73,-.65],[-2.35,.73,-.65]],.006,M.bms,sg.bms);flow(controls.curve,'bms',sg.bms,1);
    for(const x of [-2.35,-.4]){pipe([[x,.73,-.65],[x,.55,-.65]],.005,M.bms,sg.bms);box(.045,.06,.025,x,.52,-.65,M.bms,sg.bms);}
    // Wall luminaires make the inhabited scale read even with the ceiling closed.
    for(const x of [-2.3,-.8])box(.2,.025,.035,x,.72,-1.62,M.light,sg.electrical);
  }
  const roof=new THREE.Group();roof.position.y=3.15;roof.userData.baseY=3.15;root.add(roof);
  softBox(5.52,.11,3.52,0,.02,0,M.stone,roof,.035);for(const z of [-1.74,1.74])softBox(5.52,.075,.055,0,.1,z,M.edge,roof,.012);
  const roofServices={};for(const id of Object.keys(systems)){const g=new THREE.Group();g.position.y=3.15;g.userData.system=id;systems[id].add(g);roofServices[id]=g;}
  // Compact rooftop AHU and heat-rejection unit connected to the same shaft.
  box(1.25,.32,.57,1.25,.25,-1.02,M.white,roofServices.hvac);box(1.28,.04,.6,1.25,.43,-1.02,M.frame,roofServices.hvac);
  for(let x=.75;x<1.8;x+=.11)box(.04,.24,.015,x,.25,-.72,M.hvac,roofServices.hvac);
  duct([[2.41,.15,-1.32],[2.41,.25,-1.32],[1.88,.25,-1.32]],.13,.11,roofServices.hvac);
  for(const x of [.95,1.55]){cyl(.14,.025,x,.47,-1.02,M.frame,roofServices.hvac);const fan=new THREE.Group();fan.position.set(x,.488,-1.02);fan.userData.dynamic=true;roofServices.hvac.add(fan);for(let i=0;i<4;i++){const b=box(.23,.012,.045,0,0,0,M.black,fan);b.rotation.y=i*Math.PI/4;}fans.push(fan);}
  pipe([[2.53,.13,-1.32],[2.53,.2,-.5],[1.2,.2,-.5],[1.2,.25,-.73]],.016,M.plumbing,roofServices.plumbing);
  pipe([[2.13,.12,-1.34],[2.13,.18,-.65],[1.7,.18,-.65],[1.7,.25,-.74]],.012,M.electrical,roofServices.electrical);
  box(.25,.28,.15,2.05,.23,-.35,M.frame,roofServices.electrical);box(.12,.05,.014,2.05,.28,-.264,M.bms,roofServices.bms);
  // Small occupied roof terrace gives the upper model a human-scale ending.
  box(1.7,.025,1.15,-1.38,.09,.72,M.wood,roof);cyl(.22,.025,-1.4,.33,.7,M.wood,roof);cyl(.025,.23,-1.4,.2,.7,M.frame,roof);chair(-1.8,.7,Math.PI/2,roof);chair(-1,.7,-Math.PI/2,roof);plant(-2.25,.1,1.14,.45,roof);rail([-2.65,1.62],[-.4,1.62],.42,roof);
  // Batch across static furniture subgroups, preserving independently movable tiers,
  // service groups, shafts, particles and fans. Glass is batched per tier as well.
  function batch(group,recursive=true){
    group.updateWorldMatrix(true,true);const inverse=new THREE.Matrix4().copy(group.matrixWorld).invert(),buckets=new Map();
    function collect(o){if(o.userData.dynamic)return;if(o.isMesh){const list=buckets.get(o.material)||[];list.push(o);buckets.set(o.material,list);}else if(recursive&&o.isGroup)for(const child of o.children)collect(child);}
    for(const child of group.children)collect(child);
    for(const[material,list]of buckets){if(list.length<2)continue;const parts=[];let count=0;for(const o of list){const transform=new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld),g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(transform);parts.push(g);count+=g.attributes.position.count;}
      const geometry=new THREE.BufferGeometry();for(const key of ['position','normal','uv']){const size=key==='uv'?2:3,arr=new Float32Array(count*size);let offset=0;for(const p of parts){if(p.attributes[key])arr.set(p.attributes[key].array,offset);offset+=p.attributes.position.count*size;}geometry.setAttribute(key,new THREE.BufferAttribute(arr,size));}geometry.computeBoundingSphere();const out=mesh(geometry,material,group);out.userData.system=group.userData.system;list.forEach(o=>o.parent.remove(o));parts.forEach(p=>p.dispose());
    }
  }
  shaftBack.userData.dynamic=true;shaftSide.userData.dynamic=true;
  floors.forEach(f=>batch(f));for(const level of services)Object.values(level).forEach(g=>batch(g));batch(roof);Object.values(roofServices).forEach(g=>batch(g));fans.forEach(f=>batch(f));batch(root,false);
  let runTime=0;
  function update(t,dt,state={}){
    const reveal=THREE.MathUtils.clamp(Number(state.reveal)||0,0,1),power=state.power!==false,motion=state.motion!==false,layer=state.layer||'all',highlight=state.serviceGlow!==false;
    if(motion)runTime+=dt;
    floors.forEach((f,i)=>{f.position.y=f.userData.baseY+i*reveal*.32;for(const s of Object.values(services[i]))s.position.y=f.position.y;ceilings[i].opacity=.94-reveal*.88;});
    roof.position.y=3.15+reveal*1.5;Object.values(roofServices).forEach(g=>g.position.y=roof.position.y);
    const top=roof.position.y+.12;shaftBack.scale.y=top;shaftBack.position.y=top/2;shaftSide.scale.y=top;shaftSide.position.y=top/2;
    risers.forEach(r=>{r.o.scale.y=top;r.o.position.y=top/2;});
    for(const[id,g]of Object.entries(systems))g.visible=layer==='all'||layer===id;
    flows.forEach(f=>{f.object.visible=power;if(power)f.object.position.copy(f.curve.getPoint((runTime*.12+f.offset)%1));});
    if(power&&motion)fans.forEach(f=>f.rotation.y+=dt*5);
    serviceVisuals.forEach(s=>{s.material.emissiveIntensity=power?(highlight?s.glow:.055):0;s.material.color.copy(s.color).multiplyScalar(power?1:.55);});
    M.light.emissiveIntensity=power?.8:.02;M.light.color.set(power?'#f3d5aa':'#656c67');M.screen.color.set(power?'#42616a':'#22313a');
  }
  update(0,0,{});
  return {root,floors,roof,systems,update};
}
