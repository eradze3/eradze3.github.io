import * as THREE from './vendor/three.module.js';
import {createInteriorServices} from './interior-services.js';

const TYPES={office:{name:'WORKPLACE / 01',width:20,depth:14,height:3.65,ceiling:3.05},warehouse:{name:'LOGISTICS / 02',width:26,depth:20,height:6.1,ceiling:5.55},datacentre:{name:'DATA HALL / 03',width:22,depth:16,height:4.45,ceiling:3.85},hotel:{name:'HOTEL / GUEST LEVEL 01',width:18,depth:14,height:3.65,ceiling:2.6}};
const v=(x,y,z)=>new THREE.Vector3(x,y,z);

/** A separate, disposable human-scale scene. All operating states are illustrative. */
export function createInteriorScene({type='office'}={}){
  if(!TYPES[type])type='office';
  const spec=TYPES[type],W=spec.width,D=spec.depth,H=spec.height;
  const scene=new THREE.Scene();scene.name=`V4 ${type} interior`;scene.background=new THREE.Color('#0a1726');scene.fog=new THREE.Fog('#0a1726',35,80);
  const root=new THREE.Group();root.name='Human-scale building';scene.add(root);
  const materials=new Set(),geometries=new Set(),textures=new Set(),batches=new Map(),colliders=[];
  const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,10),sphereGeo=new THREE.SphereGeometry(1,8,5);
  [boxGeo,cylGeo,sphereGeo].forEach(g=>geometries.add(g));
  const mat=(color,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness:.66,metalness:.12,...extra});materials.add(m);return m;};
  const basic=(color,extra={})=>{const m=new THREE.MeshBasicMaterial({color,...extra});materials.add(m);return m;};
  const M={floor:mat('#536a7d',{roughness:.82}),wall:mat('#8a9aaa'),dark:mat('#182f43'),frame:mat('#597588',{metalness:.72,roughness:.32}),edge:mat('#b1c4ce',{metalness:.6,roughness:.38}),white:mat('#c7d5dc'),wood:mat('#9f8e76',{roughness:.65}),seat:mat('#3b6078'),glass:mat('#91b8ca',{transparent:true,opacity:.14,depthWrite:false,roughness:.18,metalness:.18}),carpet:mat('#314b61',{roughness:1}),leaf:mat('#527c74',{roughness:.95}),soil:mat('#24343c'),server:mat('#203346',{metalness:.5,roughness:.4}),grille:mat('#587485',{metalness:.65}),duct:mat('#699ba9',{metalness:.65,roughness:.35}),air:basic('#78e9f3'),water:mat('#408fd2',{emissive:'#24679d',emissiveIntensity:.35}),power:mat('#dab04e',{emissive:'#b68b25',emissiveIntensity:.25}),fire:mat('#b85b55'),controls:mat('#62c99d',{emissive:'#2b8a65',emissiveIntensity:.3}),light:mat('#d9eff8',{emissive:'#a9d9f0',emissiveIntensity:1.25}),screen:basic('#69bacd'),occupant:mat('#526b7b',{roughness:1}),parcel:mat('#ac9473',{roughness:.95}),line:basic('#a0d6e1')};
  const architecture=new THREE.Group();architecture.name='Sectionable architecture';architecture.userData.batchRoot=true;architecture.userData.architecture=true;root.add(architecture);
  const ceiling=new THREE.Group();ceiling.name='Removable architectural ceiling';ceiling.userData.batchRoot=true;ceiling.userData.architecture=true;root.add(ceiling);
  const occupants=new THREE.Group();occupants.name='Occupancy indication';occupants.userData.batchRoot=true;root.add(occupants);
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
  box(W,H,.2,0,H/2,-D/2,M.wall,architecture);box(.2,H,D,-W/2,H/2,0,M.dark,architecture);box(.2,H,D,W/2,H/2,0,M.dark,architecture);
  for(const sign of [-1,1]){box(W/2-1.4,H,.16,sign*(W/4+.7),H/2,D/2,M.wall,architecture);box(.09,2.65,.12,sign*1.35,1.325,D/2,M.frame,architecture);}box(2.8,.09,.12,0,2.65,D/2,M.frame,architecture);box(W,H-2.7,.16,0,(H+2.7)/2,D/2,M.wall,architecture);
  box(2.65,.02,.35,0,.02,D/2-.1,M.edge);
  // Fine bump maps add surface definition without additional draw calls or downloaded assets.
  const grain=new Uint8Array(64*64*4);let seed=983;for(let i=0;i<64*64;i++){seed=seed*16807%2147483647;const n=120+(seed%30);grain.set([n,n,n,255],i*4);}const rough=new THREE.DataTexture(grain,64,64,THREE.RGBAFormat);rough.wrapS=rough.wrapT=THREE.RepeatWrapping;rough.repeat.set(14,14);rough.needsUpdate=true;textures.add(rough);M.floor.bumpMap=rough;M.floor.bumpScale=.025;M.wall.bumpMap=rough;M.wall.bumpScale=.009;M.wood.bumpMap=rough;M.wood.bumpScale=.008;
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
    box(.035,2.65,6.4,-2.12,1.325,-2,M.glass,architecture);box(.055,.055,6.5,-2.12,2.68,-2,M.frame);block(-2.12,-2,.12,6.4);
    box(2.35,2.65,.035,-7.45,1.325,1.25,M.glass,architecture);box(1.5,2.65,.035,-2.85,1.325,1.25,M.glass,architecture);block(-7.45,1.25,2.35,.12);block(-2.85,1.25,1.5,.12);
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
  }else if(type==='datacentre'){
    for(const x of [-7.5,-4.2,4.2,7.5])for(const z of [-4.9,-2.8,-.7,1.4,3.5]){
      const face=x===-7.5||x===4.2?1:-1;box(1.15,2.25,1.65,x,1.2,z,M.server);box(.04,2.12,1.54,x+face*.595,1.2,z,M.grille);
      for(let y=.25;y<2.25;y+=.2){box(.018,.025,1.4,x+face*.625,y,z,M.dark);box(.025,.025,.025,x+face*.64,y,z+.6,M.controls);}
      box(1.13,.035,1.7,x,2.35,z,M.edge);block(x,z,1.25,1.8);
    }
    for(const x of [-5.8,5.8]){box(1.3,.012,12.5,x,.012,-.4,M.dark);for(let z=-6;z<6;z+=.28)box(1.22,.013,.025,x,.02,z,M.grille);}
    for(const x of [-9.7,9.7]){box(1.3,2.7,1.2,x,1.35,-6.4,M.white);for(let y=.4;y<2.6;y+=.13)box(1.15,.035,.03,x,y,-5.78,M.grille);block(x,-6.4,1.5,1.4);}
    for(let x=-10;x<=10;x+=2)box(.02,.012,D,x,.016,0,M.edge);
    label('COLD AISLE A',-5.8,3.05,5.7,2.1);label('COLD AISLE B',5.8,3.05,5.7,2.1);label('CONTINUOUS OPERATION',0,3.8,-D/2+.12,3.4);
  }


  if(type==='hotel'){
    // A 3.2m illustrative central corridor; doors open into furnished guest spaces.
    box(3.25,.018,D,0,.018,0,M.carpet);
    for(const side of [-1,1]){
      const wallX=side*1.8;
      // The door opening spans z=2.25..3.65, and is kept out of the collision geometry.
      box(.13,2.65,9.15,wallX,1.325,-2.325,M.wall,architecture);block(wallX,-2.325,.13,9.15);
      box(.13,2.65,3.25,wallX,1.325,5.275,M.wall,architecture);block(wallX,5.275,.13,3.25);
      box(.16,.2,1.55,wallX,2.65,2.95,M.wood,architecture);for(const zz of [2.22,3.68])box(.17,2.6,.045,wallX,1.3,zz,M.wood,architecture);
      box(5.9,.025,7.6,side*5.3,.025,.6,M.carpet);
      // Bed, headboard, duvet, pillows and bedside lighting.
      box(2.05,.32,2.1,side*5.6,.23,-.6,M.wood);box(1.98,.25,2.02,side*5.6,.51,-.6,M.white);box(2.1,1.05,.1,side*5.6,.7,-1.7,M.wood);
      box(1.96,.07,1.35,side*5.6,.67,-.2,M.seat);for(const dx of [-.5,.5])box(.7,.14,.42,side*5.6+dx,.7,-1.26,M.white);block(side*5.6,-.6,2.25,2.4);
      for(const dx of [-1.4,1.4]){box(.55,.48,.55,side*5.6+dx,.24,-1.35,M.wood);cyl(.11,.035,side*5.6+dx,.51,-1.35,M.frame);cyl(.018,.3,side*5.6+dx,.67,-1.35,M.frame);cyl(.14,.2,side*5.6+dx,.86,-1.35,M.light);}
      box(1.5,.06,.65,side*6.5,.76,4.7,M.wood);for(const dx of [-.6,.6])box(.04,.7,.5,side*6.5+dx,.37,4.7,M.frame);chair(side*6.5,3.9,Math.PI);block(side*6.5,4.5,1.8,1.5);
      box(.8,2.25,1.2,side*8.2,1.125,4.6,M.wood);block(side*8.2,4.6,1,1.4);
      box(2.0,1.05,.07,side*5.5,1.6,5.8,M.dark);box(1.86,.91,.012,side*5.5,1.6,5.75,M.screen);
      // Ensuite is accessible through an opening, not a solid wall disguised as a doorway.
      box(3.1,2.65,.12,side*7.25,1.325,-3.1,M.wall,architecture);block(side*7.25,-3.1,3.1,.12);
      box(.12,2.65,3.75,side*4.75,1.325,-5.0,M.wall,architecture);block(side*4.75,-5,.12,3.75);
      box(3.8,.018,3.7,side*6.8,.035,-5.0,M.white);
      box(1.15,.75,.58,side*5.7,.4,-5.2,M.wood);box(1.18,.06,.61,side*5.7,.81,-5.2,M.white);cyl(.18,.06,side*5.7,.85,-5.2,M.edge);beam([side*5.7,.88,-5.43],[side*5.7,1.1,-5.43],.018,M.frame);beam([side*5.7,1.1,-5.43],[side*5.7,1.1,-5.25],.018,M.frame);box(1.1,.8,.025,side*5.7,1.45,-5.57,M.glass);block(side*5.7,-5.2,1.3,.8);
      box(.46,.39,.63,side*6.85,.23,-5.3,M.white);box(.48,.5,.18,side*6.85,.65,-5.62,M.white);block(side*6.85,-5.3,.65,.85);
      box(1.15,.07,1.2,side*7.65,.08,-4.2,M.edge);box(.025,2.05,1.2,side*7.05,1.08,-4.2,M.glass,architecture);block(side*7.05,-4.2,.025,1.2);
      beam([side*8.2,.85,-4.6],[side*8.2,2.18,-4.6],.018,M.frame);beam([side*8.2,2.18,-4.6],[side*7.9,2.18,-4.6],.018,M.frame);cyl(.1,.025,side*7.9,2.16,-4.6,M.frame);
      label(side>0?'GUESTROOM 101 / ENSUITE':'GUESTROOM 102',side*4.5,2.3,5.9,2.8);
    }
    label('GUEST CORRIDOR · OCCUPIED AT NIGHT',0,2.35,-6.88,3.2);
    // Rear plant closet is separate from the guest sleeping and ensuite areas.
    for(const [xx,ww] of [[-4.24,1.0],[-2.31,.98]]){box(ww,2.6,.12,xx,1.3,-3.25,M.wall,architecture);block(xx,-3.25,ww,.12);}box(2.94,.2,.12,-3.27,2.6,-3.25,M.wall,architecture);label('VENTILATION SERVICE CLOSET',-3.25,2.45,-3.17,2.8);
  }

  const serviceY=type==='warehouse'?4.35:type==='datacentre'?3.25:2.92;
  for(let z=-D/2+1;z<D/2;z+=2.2){for(const x of [-W/2+3,0,W/2-3]){box(1.15,.045,.18,x,Math.min(serviceY-.52,H-.4),z,M.light);beam([x,serviceY-.48,z],[x,H-.1,z],.012,M.frame);}}
  if(type==='office'||type==='hotel')for(let x=-W/2+1;x<W/2;x+=2)for(let z=-D/2+1;z<D/2;z+=2)box(1.94,.035,1.94,x,2.6,z,M.white,ceiling);
  const service=createInteriorServices({scene,root,architecture,box,beam,cyl,solid,label,block,instance,sphereGeo,M,mat,basic,materials,geometries,colliders,W,D,H,type});
  const targets=service.targets;
  const hemi=new THREE.HemisphereLight('#cfecff','#24364a',1.8);scene.add(hemi);
  const key=new THREE.DirectionalLight('#d6eafb',2.35);key.position.set(4,10,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-W/2-2,right:W/2+2,top:D/2+2,bottom:-D/2-2,near:1,far:40});key.shadow.normalBias=.04;key.shadow.bias=-.0001;scene.add(key);scene.add(new THREE.DirectionalLight('#6599cf',.75));

  // Architecture uses shared clipping materials; equipment and service paths remain inspectable.
  const sectionPlane=new THREE.Plane(v(-1,0,0),W/2+.2),clipMaterials=new Map();
  function sectionMaterial(m){if(!clipMaterials.has(m)){const clone=m.clone();clone.clippingPlanes=[];clone.clipShadows=true;materials.add(clone);clipMaterials.set(m,clone);}return clipMaterials.get(m);}
  root.updateMatrixWorld(true);const merged=new Map();
  for(const batch of batches.values()){let parent=batch.parent;while(parent!==root&&!parent.userData.batchRoot)parent=parent.parent||root;const material=parent.userData.architecture?sectionMaterial(batch.m):batch.m;const mergeKey=batch.geo.uuid+'/'+material.uuid+'/'+parent.uuid;let pool=merged.get(mergeKey);if(!pool){pool={geo:batch.geo,m:material,parent,items:[]};merged.set(mergeKey,pool);}const relative=new THREE.Matrix4().copy(parent.matrixWorld).invert().multiply(batch.parent.matrixWorld);for(const matrix of batch.items)pool.items.push(new THREE.Matrix4().multiplyMatrices(relative,matrix));}
  for(const batch of merged.values()){const mesh=new THREE.InstancedMesh(batch.geo,batch.m,batch.items.length);batch.items.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=!batch.m.transparent&&!batch.m.isMeshBasicMaterial;mesh.receiveShadow=!batch.m.isMeshBasicMaterial;batch.parent.add(mesh);mesh.computeBoundingSphere();}
  const sectionGeo=new THREE.PlaneGeometry(D,H),sectionMat=basic('#73d8e5',{transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false});geometries.add(sectionGeo);const sectionVisual=new THREE.Mesh(sectionGeo,sectionMat);sectionVisual.name='Movable architectural section';sectionVisual.rotation.y=Math.PI/2;sectionVisual.position.y=H/2;sectionVisual.visible=false;scene.add(sectionVisual);
  const lineGeo=new THREE.BufferGeometry().setFromPoints([v(0,0,-D/2),v(0,H,-D/2),v(0,H,D/2),v(0,0,D/2)]);geometries.add(lineGeo);const lineMat=new THREE.LineBasicMaterial({color:'#83e6ed',transparent:true,opacity:.7});materials.add(lineMat);const sectionEdge=new THREE.LineLoop(lineGeo,lineMat);sectionEdge.name='Section boundary';sectionEdge.visible=false;scene.add(sectionEdge);
  const entry={position:v(0,1.7,D/2-1.35),target:v(0,1.7,-2)},entryOutside={position:v(0,1.7,D/2+2.2),target:v(0,1.7,0)};
  const views={overview:{position:v(W*.64,H+9,D*.74),target:v(0,1.65,0)},workspace:type==='hotel'?{position:v(2.7,1.7,3.0),target:v(5.6,1.3,-.6)}:{position:v(type==='office'?2.4:0,1.7,3.5),target:v(type==='office'?6.5:type==='warehouse'?-8:5.8,1.5,-1)},...service.views};
  let disposed=false,lastKey='',lensActive=false;
  function update(time,dt,state={}){
    if(disposed)return;const period=['startup','busy','night'].includes(state.period)?state.period:'busy',night=period==='night',continuous=type==='datacentre'||type==='hotel',lens=state.lens||{},cut=THREE.MathUtils.clamp(Number(lens.cut)||0,0,1),reveal=!!state.reveal||!!lens.peel;
    const changedKey=[period,!!state.faultActive,state.scenario||'airflow',reveal,!!lens.enabled,Math.round(cut*1000),state.selected||''].join('|');
    if(changedKey!==lastKey){lastKey=changedKey;ceiling.visible=!reveal;occupants.visible=period==='busy';const lighting=night&&!continuous?.22:night&&type==='hotel'?.6:period==='startup'?.72:1;M.light.emissiveIntensity=lighting*1.5;M.screen.color.set(night&&!continuous?'#304b65':'#69bacd');hemi.intensity=night?1.25:1.85;key.intensity=night?1.45:2.35;lensActive=!!lens.enabled;sectionPlane.constant=W/2+.2-cut*(W+.4);for(const m of clipMaterials.values()){m.clippingPlanes=lensActive?[sectionPlane]:[];m.needsUpdate=true;}sectionVisual.visible=sectionEdge.visible=lensActive&&cut>.005&&cut<.995;sectionVisual.position.x=sectionEdge.position.x=sectionPlane.constant;scene.userData.shadowDirty=true;}
    service.update(time,dt,state);
  }
  function isPointVisible(point,object){let o=object,architectural=false;while(o){if(o.visible===false)return false;if(o.userData.architecture)architectural=true;o=o.parent;}return !lensActive||!architectural||sectionPlane.distanceToPoint(point)>=-.002;}
  update(0,0,{period:'busy',reveal:true});scene.updateMatrixWorld(true);
  scene.userData.engineeringRoutes=service.routes;scene.userData.modelBasis='Illustrative topology; dimensions are not design or code clearances.';
  return {scene,entry,entryOutside,dimensions:{width:W,depth:D,height:H},views,colliders,bounds:{minX:-W/2+.45,maxX:W/2-.45,minZ:-D/2+.55,maxZ:D/2-.55},targets,routes:service.routes,sectionPlane,isPointVisible,update,dispose(){if(disposed)return;disposed=true;scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.isLight&&o.shadow){o.shadow.map?.dispose();o.shadow.mapPass?.dispose();}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());scene.clear();},get type(){return type;}};
}
