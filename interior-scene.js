import * as THREE from './vendor/three.module.js';

const TYPES={office:{name:'WORKPLACE / 01',width:20,depth:14,height:3.65,ceiling:3.05},warehouse:{name:'LOGISTICS / 02',width:26,depth:20,height:6.1,ceiling:5.55},datacentre:{name:'DATA HALL / 03',width:22,depth:16,height:4.45,ceiling:3.85}};
const v=(x,y,z)=>new THREE.Vector3(x,y,z);

/** A separate, disposable human-scale scene. All operating states are illustrative. */
export function createInteriorScene({type='office'}={}){
  if(!TYPES[type])type='office';
  const spec=TYPES[type],W=spec.width,D=spec.depth,H=spec.height;
  const scene=new THREE.Scene();scene.name=`V3 ${type} interior`;scene.background=new THREE.Color('#0a1726');scene.fog=new THREE.Fog('#0a1726',35,80);
  const root=new THREE.Group();root.name='Human-scale building';scene.add(root);
  const materials=new Set(),geometries=new Set(),textures=new Set(),batches=new Map(),colliders=[];
  const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,10),sphereGeo=new THREE.SphereGeometry(1,8,5);
  [boxGeo,cylGeo,sphereGeo].forEach(g=>geometries.add(g));
  const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.66,metalness:.12,...extra});materials.add(m);return m;};
  const basic=(color,extra={})=>{const m=new THREE.MeshBasicMaterial({color,...extra});materials.add(m);return m;};
  const M={floor:mat('#536a7d',{roughness:.82}),wall:mat('#8a9aaa'),dark:mat('#182f43'),frame:mat('#597588',{metalness:.72,roughness:.32}),edge:mat('#b1c4ce',{metalness:.6,roughness:.38}),white:mat('#c7d5dc'),wood:mat('#9f8e76',{roughness:.65}),seat:mat('#3b6078'),glass:mat('#91b8ca',{transparent:true,opacity:.14,depthWrite:false,roughness:.18,metalness:.18}),carpet:mat('#314b61',{roughness:1}),leaf:mat('#527c74',{roughness:.95}),soil:mat('#24343c'),server:mat('#203346',{metalness:.5,roughness:.4}),grille:mat('#587485',{metalness:.65}),duct:mat('#699ba9',{metalness:.65,roughness:.35}),air:basic('#78e9f3'),water:mat('#408fd2',{emissive:'#24679d',emissiveIntensity:.35}),power:mat('#dab04e',{emissive:'#b68b25',emissiveIntensity:.25}),fire:mat('#b85b55'),controls:mat('#62c99d',{emissive:'#2b8a65',emissiveIntensity:.3}),light:mat('#d9eff8',{emissive:'#a9d9f0',emissiveIntensity:1.25}),screen:basic('#69bacd'),occupant:mat('#526b7b',{roughness:1}),parcel:mat('#ac9473',{roughness:.95}),line:basic('#a0d6e1')};
  const ceiling=new THREE.Group();ceiling.name='Removable architectural ceiling';root.add(ceiling);
  const occupants=new THREE.Group();occupants.name='Occupancy indication';root.add(occupants);
  const dynamic=new THREE.Group();root.add(dynamic);
  const dummy=new THREE.Object3D(),up=v(0,1,0);
  function box(w,h,d,x,y,z,m,parent=root,rotation=0){return instance(boxGeo,m,[w,h,d],[x,y,z],[0,rotation,0],parent);}
  function instance(geo,m,scale,position,rotation=[0,0,0],parent=root){const key=`${geo.uuid}/${m.uuid}/${parent.uuid}`;let batch=batches.get(key);if(!batch){batch={geo,m,parent,items:[]};batches.set(key,batch);}dummy.position.set(...position);dummy.scale.set(...scale);dummy.rotation.set(...rotation);dummy.updateMatrix();batch.items.push(dummy.matrix.clone());}
  function cyl(r,h,x,y,z,m,parent=root){instance(cylGeo,m,[r,h,r],[x,y,z],[0,0,0],parent);}
  function beam(a,b,r,m,parent=root){const av=v(...a),bv=v(...b);dummy.position.copy(av).add(bv).multiplyScalar(.5);dummy.scale.set(r,av.distanceTo(bv),r);dummy.quaternion.setFromUnitVectors(up,bv.sub(av).normalize());dummy.updateMatrix();const key=`${cylGeo.uuid}/${m.uuid}/${parent.uuid}`;let batch=batches.get(key);if(!batch){batch={geo:cylGeo,m,parent,items:[]};batches.set(key,batch);}batch.items.push(dummy.matrix.clone());}
  function solid(w,h,d,x,y,z,m,parent=dynamic){const mesh=new THREE.Mesh(boxGeo,m);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=!m.transparent;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function block(x,z,w,d){colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});}
  function plant(x,z,s=1){cyl(.22*s,.4*s,x,.2*s,z,M.dark);cyl(.2*s,.025,x,.405*s,z,M.soil);beam([x,.3*s,z],[x,1.2*s,z],.025*s,M.leaf);for(let i=0;i<7;i++){const a=i*2.4;instance(sphereGeo,M.leaf,[.36*s,.075*s,.15*s],[x+Math.cos(a)*.2*s,(.65+i*.085)*s,z+Math.sin(a)*.2*s],[.3, -a,.15]);}block(x,z,.55*s,.55*s);}
  function chair(x,z,rotation=0){const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=rotation;root.add(c);box(.5,.09,.5,0,.47,0,M.seat,c);box(.48,.55,.09,0,.78,.22,M.seat,c);cyl(.035,.39,0,.24,0,M.frame,c);for(const a of [0,1.26,2.52,3.78,5.04])beam([0,.07,0],[Math.cos(a)*.31,.07,Math.sin(a)*.31],.025,M.frame,c);return c;}
  function workstation(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;root.add(g);box(1.6,.07,.78,0,.76,0,M.wood,g);for(const xx of [-.66,.66]){box(.055,.7,.055,xx,.375,-.2,M.frame,g);box(.08,.05,.65,xx,.045,0,M.frame,g);}box(.58,.36,.035,0,1.06,-.22,M.dark,g);box(.53,.30,.009,0,1.06,-.196,M.screen,g);box(.045,.2,.045,0,.86,-.22,M.frame,g);box(.4,.025,.14,-.08,.81,.12,M.dark,g);box(.09,.035,.13,.45,.82,.13,M.dark,g);const cg=chair(0,.65,0);g.add(cg);cg.position.set(0,0,.65);block(x,z,1.8,1.75);}
  function person(x,z){instance(sphereGeo,M.occupant,[.13,.16,.13],[x,1.25,z],[0,0,0],occupants);box(.35,.53,.24,x,.85,z,M.occupant,occupants);for(const side of [-1,1]){box(.12,.5,.16,x+side*.095,.32,z,M.occupant,occupants);box(.13,.08,.25,x+side*.095,.055,z-.035,M.occupant,occupants);box(.08,.42,.1,x+side*.23,.86,z,M.occupant,occupants);}}
  function label(text,x,y,z,width=2.6,rotation=0){if(typeof document==='undefined')return;const c=document.createElement('canvas');c.width=768;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#122c40';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#a6d4e2';ctx.font='500 28px sans-serif';ctx.textBaseline='middle';ctx.fillText(text,24,49);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.add(texture);const material=basic('#ffffff',{map:texture});const geo=new THREE.PlaneGeometry(width,width/8);geometries.add(geo);const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);mesh.rotation.y=rotation;root.add(mesh);}
  // Enclosure and glazing. Front elevation remains open for the dollhouse view.
  box(W,.18,D,0,-.1,0,M.floor);box(W,.16,D,0,H+.1,0,M.dark,ceiling);
  box(W,H,.2,0,H/2,-D/2,M.wall);box(.2,H,D,-W/2,H/2,0,M.dark);box(.2,H,D,W/2,H/2,0,M.dark);
  for(const x of [-W/2+.15,W/2-.15])for(let z=-D/2+2;z<D/2;z+=4){box(.06,2.2,3.35,x,1.7,z,M.glass);box(.09,.06,3.6,x,2.82,z,M.frame);box(.09,2.8,.07,x,1.4,z-1.8,M.frame);}
  for(let z=-D/2+.5;z<D/2;z+=1){box(.035,.003,.65,-1.7,.006,z,M.line);box(.035,.003,.65,1.7,.006,z,M.line);}
  for(let x=-W/2+.2;x<W/2;x+=2){box(.018,.004,D,x,.005,0,M.frame);}
  for(let z=-D/2+.2;z<D/2;z+=2){box(W,.004,.018,0,.006,z,M.frame);}
  label(spec.name,0,2.7,-D/2+.115,3.6);
  label('ENGINEERING EXPLORER  /  ILLUSTRATIVE',0,.18,D/2-.18,3.8);

  if(type==='office'){
    // Meeting room at left, open workspace at right, corridor down the middle.
    box(6.4,.025,6.6,-5.45,.025,-2,M.carpet);
    box(5.8,.035,8.8,5.7,.035,-.4,M.carpet);
    box(.035,2.65,6.4,-2.12,1.325,-2,M.glass);box(.055,.055,6.5,-2.12,2.68,-2,M.frame);block(-2.12,-2,.12,6.4);
    box(2.35,2.65,.035,-7.45,1.325,1.25,M.glass);box(1.5,2.65,.035,-2.85,1.325,1.25,M.glass);block(-7.45,1.25,2.35,.12);block(-2.85,1.25,1.5,.12);
    box(3.3,.09,1.25,-5.5,.76,-1.5,M.wood);for(const x of [-6.65,-4.35])box(.12,.69,.85,x,.365,-1.5,M.dark);block(-5.5,-1.5,4.3,2.7);
    for(const x of [-6.6,-5.5,-4.4]){chair(x,-.35,0);chair(x,-2.65,Math.PI);}chair(-7.45,-1.5,Math.PI/2);chair(-3.55,-1.5,-Math.PI/2);
    box(2.4,1.25,.06,-5.5,1.7,-5.3,M.dark);box(2.22,1.07,.015,-5.5,1.7,-5.26,M.screen);
    for(const x of [4.1,7.0])for(const z of [-3.8,.2,4.2])workstation(x,z,Math.PI);
    person(4.1,-4.45);person(7, -.45);person(-5.5,-.1);
    plant(-8.6,4.8,1.1);plant(8.6,-5.5,.9);
    box(2.9,.42,.8,-5.8,.25,4.5,M.seat);box(2.9,.55,.17,-5.8,.65,4.9,M.seat);block(-5.8,4.5,3.1,1);
    label('MEETING / COLLABORATION',-5.45,2.5,1.29,3.5);label('WORKSPACE',5.5,2.6,-6.86,2.4);
  }else if(type==='warehouse'){
    for(const x of [-8.1,8.1])for(const z of [-5.8,.4,6.3]){
      const w=5.6,d=2.25;for(const xx of [-w/2,w/2])for(const zz of [-d/2,d/2])box(.13,4.8,.13,x+xx,2.4,z+zz,M.power);
      for(const y of [.2,1.8,3.4]){box(w,.13,d,x,y,z,M.frame);for(let i=0;i<3;i++){const px=x-1.8+i*1.8;box(1.5,.15,1.8,px,y+.15,z,M.wood);for(const dx of [-.45,.45])for(const dz of [-.42,.42])box(.85,1.15,.78,px+dx,y+.8,z+dz,M.parcel);}}
      block(x,z,w+.2,d+.2);
    }
    for(let z=-8;z<=8;z+=4){box(W,.14,.14,0,H-.7,z,M.frame);for(let x=-12;x<12;x+=4){beam([x,H-.7,z],[x+2,H-1.45,z],.055,M.frame);beam([x+2,H-1.45,z],[x+4,H-.7,z],.055,M.frame);}}
    box(1.7,.88,.85,-3.3,.44,7.6,M.dark);box(1.8,.07,.95,-3.3,.92,7.6,M.wood);block(-3.3,7.6,2,1.2);person(-3.3,6.7);
    box(4.4,3.7,.1,0,1.85,-D/2+.12,M.frame);for(let y=.25;y<3.8;y+=.32)box(4.3,.025,.02,0,y,-D/2+.19,M.edge);
    label('RECEIVING / CLEAR AISLE',0,4.2,-D/2+.2,4);label('STORAGE ZONE A',-8,5.15,-5.8,3.2);label('STORAGE ZONE B',8,5.15,-5.8,3.2);
  }else{
    for(const x of [-7.5,-4.2,4.2,7.5])for(const z of [-4.9,-2.8,-.7,1.4,3.5]){
      box(1.15,2.25,1.65,x,1.2,z,M.server);box(1.07,2.12,.04,x,1.2,z+.85,M.grille);
      for(let y=.25;y<2.25;y+=.2){box(.92,.025,.018,x,y,z+.88,M.dark);box(.025,.025,.025,x+.39,y,z+.9,M.controls);}
      box(1.13,.035,1.7,x,2.35,z,M.edge);block(x,z,1.25,1.8);
    }
    for(const x of [-5.8,5.8]){box(1.3,.012,12.5,x,.012,-.4,M.dark);for(let z=-6;z<6;z+=.28)box(1.22,.013,.025,x,.02,z,M.grille);}
    for(const x of [-9.7,9.7]){box(1.3,2.7,1.2,x,1.35,-6.4,M.white);for(let y=.4;y<2.6;y+=.13)box(1.15,.035,.03,x,y,-5.78,M.grille);block(x,-6.4,1.5,1.4);}
    for(let x=-10;x<=10;x+=2)box(.02,.012,D,x,.016,0,M.edge);
    label('COLD AISLE A',-5.8,3.05,5.7,2.1);label('COLD AISLE B',5.8,3.05,5.7,2.1);label('CONTINUOUS OPERATION',0,3.8,-D/2+.12,3.4);
  }

  // Services are kept physically distinct: air in cyan, power amber, water blue, controls green.
  const serviceY=type==='warehouse'?4.35:type==='datacentre'?3.2:2.83;
  for(const x of [-.7,.7])box(.6,.32,D-1,x,serviceY,0,M.duct);
  for(const x of [-W/2+2.5,W/2-2.5]){
    box(.36,.24,D-2,x,serviceY-.12,0,M.duct);
    for(const z of [-D/2+2,0,D/2-2]){box(W/2-3,.24,.34,(x<0?-1:1)*(W/4-.75),serviceY-.12,z,M.duct);box(.68,.1,.68,x,serviceY-.3,z,M.white);for(let k=-2;k<=2;k++)box(.55,.014,.025,x,serviceY-.36,z+k*.095,M.grille);}
  }
  for(const [x,m,r]of [[1.12,M.water,.07],[1.35,M.water,.07],[-1.18,M.fire,.045]])beam([x,serviceY+.08,-D/2+.5],[x,serviceY+.08,D/2-.5],r,m);
  box(.24,.055,D-1,-1.55,serviceY+.07,0,M.power);box(.07,.045,D-1,1.58,serviceY+.05,0,M.controls);
  for(let z=-D/2+1;z<D/2;z+=2.2){for(const x of [-W/2+3,0,W/2-3]){box(1.15,.045,.18,x,Math.min(serviceY-.42,H-.4),z,M.light);beam([x,serviceY-.38,z],[x,H-.1,z],.012,M.frame);}}
  // Ceiling tiles cover services in the workplace; revealing them is a deliberate cutaway.
  if(type==='office')for(let x=-9;x<=9;x+=2)for(let z=-6;z<=6;z+=2)box(1.94,.035,1.94,x,2.62,z,M.white,ceiling);

  function target(id,title,position,description){const group=new THREE.Group();group.name=title;group.userData.inspectId=id;dynamic.add(group);return {group,info:{id,title,position:v(...position),description}};}
  const diffuser=target('diffuser','Supply terminal',[2.7,serviceY-.35,-.05],'A terminal on the affected branch. Compare the local air response with the demand in the space.');
  solid(.85,.13,.85,2.7,serviceY-.35,-.05,M.white,diffuser.group);for(let i=-3;i<=3;i++)solid(.68,.025,.025,2.7,serviceY-.425,i*.105,M.grille,diffuser.group);
  const damper=target('damper','Branch damper',[1.9,serviceY,-.05],'The AHU continues to run while a branch damper can restrict local supply. Inspect the blade position and controls indication together.');
  for(const yy of [-.24,.24])solid(.48,.035,.62,1.9,serviceY+yy,-.05,M.frame,damper.group);for(const zz of [-.31,.31])solid(.48,.48,.035,1.9,serviceY,zz-.05,M.frame,damper.group);const damperBlade=solid(.43,.025,.54,1.9,serviceY,-.05,M.power,damper.group);const actuator=solid(.19,.2,.16,1.9,serviceY+.33,-.05,M.dark,damper.group);actuator.rotation.y=.2;
  const sensor=target('sensor','Room sensor',[-1.95,1.5,2.2],'The occupied zone still calls for ventilation. A demand signal alone does not prove that air has reached the space.');
  solid(.08,1.42,.08,-1.95,.71,2.2,M.frame,sensor.group);solid(.4,.04,.4,-1.95,.02,2.2,M.dark,sensor.group);solid(.3,.43,.085,-1.95,1.5,2.2,M.white,sensor.group);solid(.22,.19,.01,-1.95,1.56,2.25,M.screen,sensor.group);block(-1.95,2.2,.4,.4);
  const panel=target('panel','AHU status panel',[0,1.52,-D/2+.22],'Fan status is available. When the branch is restricted, fan-running status and local airflow tell different parts of the story.');
  solid(1.1,1.42,.16,0,1.25,-D/2+.22,M.dark,panel.group);solid(.9,.52,.018,0,1.51,-D/2+.31,M.screen,panel.group);const statusMat=mat('#62c99d',{emissive:'#2b8a65',emissiveIntensity:.65});const statusLamp=solid(.12,.12,.035,.35,1.04,-D/2+.33,statusMat,panel.group);label('AHU / FAN STATUS',0,2.13,-D/2+.33,1.8);
  const targets=[diffuser.info,damper.info,sensor.info,panel.info];
  const targetRingMaterial=basic('#a1eff4',{transparent:true,opacity:.8});const ringGeo=new THREE.TorusGeometry(.34,.015,4,24);geometries.add(ringGeo);const selectionRing=new THREE.Mesh(ringGeo,targetRingMaterial);selectionRing.visible=false;dynamic.add(selectionRing);
  const particleCount=18,flowGeo=new THREE.SphereGeometry(.045,5,3);geometries.add(flowGeo);const airflow=new THREE.InstancedMesh(flowGeo,M.air,particleCount);airflow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);airflow.name='Air movement indication';dynamic.add(airflow);
  let flowPhase=0,lastKey='',disposed=false;
  const hemi=new THREE.HemisphereLight('#cfecff','#24364a',1.8);scene.add(hemi);
  const key=new THREE.DirectionalLight('#d6eafb',2.35);key.position.set(4,10,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-W/2-2,right:W/2+2,top:D/2+2,bottom:-D/2-2,near:1,far:40});key.shadow.normalBias=.04;key.shadow.bias=-.0001;scene.add(key);scene.add(new THREE.DirectionalLight('#6599cf',.75));
  // Flatten furniture transforms once, so identical chairs/desks remain one draw per material.
  root.updateMatrixWorld(true);const merged=new Map();
  for(const batch of batches.values()){const parent=batch.parent===ceiling?ceiling:batch.parent===occupants?occupants:root;const key=`${batch.geo.uuid}/${batch.m.uuid}/${parent.uuid}`;let pool=merged.get(key);if(!pool){pool={geo:batch.geo,m:batch.m,parent,items:[]};merged.set(key,pool);}const relative=new THREE.Matrix4().copy(parent.matrixWorld).invert().multiply(batch.parent.matrixWorld);for(const matrix of batch.items)pool.items.push(new THREE.Matrix4().multiplyMatrices(relative,matrix));}
  for(const batch of merged.values()){const mesh=new THREE.InstancedMesh(batch.geo,batch.m,batch.items.length);batch.items.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=!batch.m.transparent&&!batch.m.isMeshBasicMaterial;mesh.receiveShadow=!batch.m.isMeshBasicMaterial;batch.parent.add(mesh);mesh.computeBoundingSphere();}
  const entry={position:v(0,1.7,D/2-1.35),target:v(0,1.7,-2)};
  const views={overview:{position:v(W*.64,H+9,D*.74),target:v(0,1.65,0)},workspace:{position:v(type==='office'?2.4:0,1.7,3.5),target:v(type==='office'?6.5:type==='warehouse'?-8:5.8,1.5,-1)},services:{position:v(-.7,2.05,3.25),target:v(1.9,serviceY,-.05)},controls:{position:v(.6,1.7,-D/2+3.5),target:v(0,1.5,-D/2+.25)}};
  function update(time,dt,state={}){
    if(disposed)return;
    const period=['startup','busy','night'].includes(state.period)?state.period:'busy',fault=!!state.faultActive,night=period==='night',continuous=type==='datacentre';
    const changedKey=[period,fault,!!state.reveal,state.selected||''].join('|');
    if(changedKey!==lastKey){lastKey=changedKey;ceiling.visible=!state.reveal;occupants.visible=period==='busy';const lighting=night&&!continuous?.22:period==='startup'?.72:1;M.light.emissiveIntensity=lighting*1.5;M.screen.color.set(night&&!continuous?'#304b65':'#69bacd');hemi.intensity=night?1.1:1.8;key.intensity=night?1.25:2.35;damperBlade.rotation.z=fault?Math.PI/2:0;statusMat.color.set(fault?'#e9b867':'#62c99d');statusMat.emissive.set(fault?'#a87829':'#2b8a65');M.air.color.set(fault?'#eac58a':'#78e9f3');const selected=targets.find(t=>t.id===state.selected);selectionRing.visible=!!selected;if(selected){selectionRing.position.copy(selected.position);selectionRing.rotation.set(selected.id==='damper'||selected.id==='diffuser'?Math.PI/2:0,0,0);}scene.userData.shadowDirty=true;}
    const operating=continuous||!night,rate=fault?.12:period==='startup'?.55:1;if(state.motion!==false)flowPhase+=Math.min(Math.max(Number(dt)||0,0),.1)*rate;
    airflow.visible=operating;for(let i=0;i<particleCount;i++){const t=(flowPhase*.4+i/particleCount)%1;const branch=i%3;dummy.position.set(branch===0?.7:2.7,serviceY-.1-(branch===0?0:t*1.9),branch===0?-D/2+1+t*(D-2):-.05+(i%2?.14:-.14));dummy.scale.setScalar(fault?.65:1);dummy.rotation.set(0,0,0);dummy.updateMatrix();airflow.setMatrixAt(i,dummy.matrix);}airflow.instanceMatrix.needsUpdate=true;
    const previous=scene.userData.operating;if(!previous||previous.period!==period||previous.faultActive!==fault)scene.userData.operating={period,faultActive:fault,fanRunning:operating,localAirflow:operating?(fault?'restricted':'available'):'standby',occupied:period==='busy'};
  }
  update(0,0,{period:'busy',reveal:true});scene.updateMatrixWorld(true);
  return {scene,entry,views,colliders,bounds:{minX:-W/2+.45,maxX:W/2-.45,minZ:-D/2+.55,maxZ:D/2-.55},targets,update,dispose(){if(disposed)return;disposed=true;scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isLight&&o.shadow){o.shadow.map?.dispose();o.shadow.mapPass?.dispose();}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.clear();},get type(){return type;}};
}
