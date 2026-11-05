import * as THREE from './vendor/three.module.js';

/** Illustrative table models. The original occupied office remains owned by project-model.js. */
export function createSectorModels(scene){
  const root=new THREE.Group();root.name='V4 building types';root.position.set(0,1.2,.8);root.userData.area='model';root.visible=false;scene.add(root);
  const boxGeometry=new THREE.BoxGeometry(1,1,1),cylinderGeometry=new THREE.CylinderGeometry(1,1,1,8),sphereGeometry=new THREE.SphereGeometry(1,6,4);
  const geometries=new Set([boxGeometry,cylinderGeometry,sphereGeometry]),materials=new Set(),models=new Map();
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),delta=new THREE.Vector3();
  let selected='office',disposed=false;
  function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.62,metalness:.22,...extra});materials.add(m);return m;}
  function build(type){
    const group=new THREE.Group();group.name=type==='hotel'?'Hotel / illustrative':type==='warehouse'?'Warehouse / illustrative':'Data centre / illustrative';group.userData.area='model';group.visible=false;root.add(group);
    const roof=new THREE.Group();roof.name='Revealable roof';group.add(roof);
    const M={base:material('#aec2cc',{roughness:.7}),edge:material('#d2e0e5',{roughness:.45}),steel:material('#536c7d',{metalness:.72,roughness:.36}),dark:material('#152a3b',{roughness:.55}),wall:material('#849eae',{roughness:.8}),wood:material('#a27e57',{roughness:.88}),box:material('#b7a17a',{roughness:.93}),cyan:material('#21c5dd',{emissive:'#079bb7',emissiveIntensity:.58}),yellow:material('#eac055',{emissive:'#b7831e',emissiveIntensity:.55}),blue:material('#468af6',{emissive:'#1e5ac2',emissiveIntensity:.65}),red:material('#de6656',{emissive:'#b52921',emissiveIntensity:.35}),bms:material('#66d8a3',{emissive:'#29b374',emissiveIntensity:.65}),alarm:material('#66d8a3',{emissive:'#29b374',emissiveIntensity:.65}),light:material('#d8edee',{emissive:'#a0d4e5',emissiveIntensity:.95}),roof:material('#b3c5ce',{transparent:true,opacity:.86,depthWrite:false,roughness:.54}),glass:material('#79c0d6',{transparent:true,opacity:.23,depthWrite:false,roughness:.2})};
    const batches=new Map();
    function add(geometry,mat,parent,position,scale,quaternion=null){
      const key=geometry.uuid+mat.uuid+parent.uuid;let batch=batches.get(key);if(!batch){batch={geometry,mat,parent,items:[]};batches.set(key,batch);}batch.items.push({position,scale,quaternion});
    }
    const box=(w,h,d,x,y,z,mat,parent=group,rotation=null)=>{let q=null;if(rotation)q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));add(boxGeometry,mat,parent,[x,y,z],[w,h,d],q);};
    function pipe(a,b,r,mat,parent=group){delta.fromArray(b).sub(new THREE.Vector3(...a));const len=delta.length(),q=new THREE.Quaternion().setFromUnitVectors(up,delta.normalize());add(cylinderGeometry,mat,parent,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[r,len,r],q);}
    function beam(a,b,w,mat,parent=group){delta.fromArray(b).sub(new THREE.Vector3(...a));const q=new THREE.Quaternion().setFromUnitVectors(up,delta.normalize());add(boxGeometry,mat,parent,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2],[w,new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)),w],q);}
    box(5.65,.1,3.75,0,-.04,0,M.steel);box(5.5,.07,3.6,0,.045,0,M.base);box(5.4,.04,.04,0,.095,1.73,M.edge);
    // A readable entrance remains a separate raycast target.
    const doorway=new THREE.Mesh(boxGeometry,M.cyan);doorway.name='Enter '+type;doorway.position.set(0,.36,1.66);doorway.scale.set(.62,.58,.035);doorway.userData.area='model';doorway.userData.enterInterior=true;doorway.userData.buildingType=type;group.add(doorway);
    box(.78,.035,.26,0,.12,1.63,M.edge);for(const x of [-.37,.37])box(.04,.72,.05,x,.44,1.65,M.steel);box(.78,.04,.06,0,.79,1.65,M.steel);
    const fanGroup=new THREE.Group();fanGroup.name='Rooftop fan rotors';group.add(fanGroup);const fans=[];
    const addFan=(x,y,z,r=.12)=>{const g=new THREE.Group();g.position.set(x,y,z);fanGroup.add(g);for(let i=0;i<3;i++){const blade=new THREE.Mesh(boxGeometry,M.dark);blade.position.x=r*.37;blade.scale.set(r*1.42,.025,r*.28);const pivot=new THREE.Group();pivot.rotation.y=i*Math.PI*2/3;pivot.add(blade);g.add(pivot);}fans.push(g);};
    if(type==='warehouse'){
      // Storage bays flank a clear central aisle. The front is a deliberate sectional opening.
      box(5.4,1.62,.065,0,.90,-1.67,M.wall);for(const x of [-2.67,2.67]){box(.055,1.62,3.34,x,.90,0,M.wall);box(.062,.25,2.85,x,1.45,0,M.glass);}
      for(const z of [-1.52,-.75,0,.75,1.52])for(const x of [-2.6,2.6])box(.075,1.75,.075,x,.95,z,M.steel);
      for(const z of [-1.48,-.50,.50,1.48]){
        beam([-2.63,1.76,z],[0,2.06,z],.055,M.steel);beam([0,2.06,z],[2.63,1.76,z],.055,M.steel);beam([-2.63,1.76,z],[2.63,1.76,z],.04,M.steel);
        for(let x=-2.2;x<2.2;x+=.75)beam([x,1.76,z],[x+.38,1.96-Math.abs(x)*.08,z],.025,M.steel);
      }
      for(const x of [-1.65,1.65])for(const z of [-1.08,0,1.08]){
        for(const dx of [-.46,.46])for(const dz of [-.34,.34])box(.035,1.42,.035,x+dx,.81,z+dz,M.blue);
        for(const y of [.18,.65,1.12]){
          box(1.0,.04,.76,x,y,z,M.yellow);box(.84,.045,.64,x,y+.045,z,M.wood);
          for(const dx of [-.21,.21])box(.35,.30,.52,x+dx,y+.22,z,M.box);
        }
      }
      // Striped loading apron and fork-lift shape distinguish the warehouse at table scale.
      for(const x of [-.46,.46])box(.035,.006,2.75,x,.087,0,M.yellow);
      box(.29,.22,.42,.92,.25,1.22,M.yellow);box(.24,.035,.23,.92,.37,1.17,M.dark);for(const x of [.77,1.07])for(const z of [1.05,1.4])add(cylinderGeometry,M.dark,group,[x,.13,z],[.065,.04,.065],new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2));
      box(.028,.55,.025,.8,.38,1.49,M.steel);box(.028,.55,.025,1.04,.38,1.49,M.steel);for(const x of [.81,1.03])box(.035,.022,.31,x,.13,1.65,M.steel);
      box(.2,.16,2.9,0,1.68,0,M.cyan);for(const z of [-1,0,1]){box(3.7,.10,.13,0,1.64,z,M.cyan);for(const x of [-1.2,1.2])box(.23,.025,.23,x,1.57,z,M.edge);}
      for(const x of [-.85,.85])for(const z of [-1.05,0,1.05])box(.38,.025,.07,x,1.74,z,M.light);
      pipe([-2.3,1.64,-1.5],[-2.3,1.64,1.5],.022,M.red);for(const z of [-.9,.0,.9]){pipe([-2.3,1.64,z],[2.3,1.64,z],.014,M.red);for(const x of [-1.6,1.6])pipe([x,1.64,z],[x,1.56,z],.018,M.red);}
      box(.11,.04,2.95,2.25,1.56,0,M.yellow);pipe([2.25,.2,-1.48],[2.25,1.57,-1.48],.025,M.yellow);box(.33,.46,.12,2.25,.5,-1.52,M.dark);box(.16,.12,.015,2.25,.55,-1.45,M.alarm);
      box(2.73,.045,3.44,-1.35,1.96,0,M.roof,roof,[0,0,.115]);box(2.73,.045,3.44,1.35,1.96,0,M.roof,roof,[0,0,-.115]);
      // Small roof plant remains fixed with the service connection visible through the reveal.
      box(.84,.25,.43,1.53,2.22,-1.02,M.edge);box(.69,.18,.035,1.53,2.23,-.79,M.steel);for(let x=1.25;x<1.85;x+=.09)box(.025,.17,.04,x,2.23,-.77,M.dark);addFan(1.53,2.36,-1.02,.14);
      pipe([1.53,2.1,-1.02],[1.53,1.68,-1.02],.065,M.cyan);box(1.53,.12,.14,.765,1.68,-1.02,M.cyan);
    }else if(type==='datacentre'){
      // A rack hall, protected entrance and separate cooling/service gallery.
      box(5.4,1.32,.06,0,.78,-1.67,M.wall);box(.05,1.32,3.34,-2.67,.78,0,M.wall);box(.05,1.32,3.34,2.67,.78,0,M.glass);
      for(const z of [-1.64,1.64])for(const x of [-2.62,-.42,2.62])box(.06,1.4,.06,x,.8,z,M.steel);
      // Raised floor tiles and blue cold aisles remain visible between the racks.
      for(let x=-2.4;x<2.55;x+=.4)for(let z=-1.4;z<1.55;z+=.4)box(.386,.035,.386,x,.13,z,M.base);
      for(const x of [-1.63,-.16,1.32])box(.35,.006,2.7,x,.153,0,M.blue);
      for(const x of [-2.08,-.61,.86])for(const z of [-1.11,-.37,.37,1.11]){
        box(.48,1.0,.60,x,.68,z,M.dark);box(.025,.93,.55,x+.253,.69,z,M.steel);box(.018,.93,.55,x-.25,.69,z,M.steel);
        for(let y=.28;y<1.12;y+=.1){box(.025,.045,.48,x+.27,y,z,M.dark);box(.012,.018,.025,x+.288,y,z+.2,M.bms);}
        box(.48,.035,.62,x,1.21,z,M.edge);
      }
      // Cooling gallery at the right side, physically distinct from the rack rows.
      for(const z of [-1.08,0,1.08]){box(.49,.98,.62,2.17,.67,z,M.edge);box(.035,.81,.53,1.90,.68,z,M.steel);for(let y=.30;y<1.1;y+=.10)box(.042,.023,.48,1.87,y,z,M.dark);}
      box(.23,.13,2.95,2.18,1.37,0,M.cyan);for(const z of [-1,0,1]){box(4.16,.10,.15,.12,1.34,z,M.cyan);for(const x of [-1.65,-.15,1.30])box(.31,.025,.24,x,1.27,z,M.edge);}
      pipe([2.5,.16,-1.45],[2.5,1.38,-1.45],.031,M.blue);pipe([2.5,1.38,-1.45],[2.5,1.38,1.45],.031,M.blue);pipe([2.40,.16,-1.45],[2.40,1.38,-1.45],.026,M.red);pipe([2.40,1.38,-1.45],[2.40,1.38,1.45],.026,M.red);
      for(const x of [-2.08,-.61,.86]){box(.14,.05,2.95,x,1.40,0,M.yellow);box(.08,.025,2.95,x+.19,1.40,0,M.bms);}
      for(const x of [-1.6,-.12,1.35])for(const z of [-1.05,0,1.05])box(.045,.025,.4,x,1.43,z,M.light);
      box(5.43,.055,3.4,0,1.51,0,M.roof,roof);for(const x of [-2.65,2.65])box(.06,.06,3.4,x,1.51,0,M.edge,roof);
      for(const x of [-1.55,-.10,1.35]){box(.91,.35,.68,x,1.72,-.82,M.edge);box(.82,.26,.035,x,1.75,-.46,M.steel);for(let dx=-.32;dx<.36;dx+=.085)box(.024,.24,.04,x+dx,1.75,-.43,M.dark);addFan(x,1.92,-.82,.14);}
      box(.42,.50,.11,-2.22,.43,1.57,M.dark);box(.29,.20,.015,-2.22,.50,1.635,M.alarm);box(.22,.035,.015,-2.22,.31,1.635,M.yellow);
    }

    if(type==='hotel'){
      const extract=material('#a08ec8',{emissive:'#60408d',emissiveIntensity:.22}),hot=material('#c98778',{emissive:'#6e3930',emissiveIntensity:.22}),waste=material('#6d7a80'),linen=material('#c9dadd',{roughness:.94});
      // Three occupied guest floors: central circulation, room entries and stacked wet cores.
      for(let floor=0;floor<3;floor++){
        const base=.12+floor*.86,top=base+.73;
        box(5.4,.07,3.35,0,base,0,M.base);box(.8,.014,3.2,0,base+.05,0,M.dark);
        box(5.4,.7,.05,0,base+.39,-1.65,M.wall);for(const side of [-1,1]){box(.045,.7,3.3,side*2.67,base+.39,0,M.glass);for(const zz of [-1.6,0,1.6])box(.04,.77,.04,side*2.65,base+.4,zz,M.steel);}
        for(const side of [-1,1])for(const zz of [-.8,.8]){
          const xx=side*1.68;
          // Clear occupied room volume, legible beds and furniture.
          box(.81,.12,.84,xx,base+.14,zz,M.wood);box(.79,.09,.81,xx,base+.245,zz,linen);box(.82,.055,.54,xx,base+.31,zz+.13,M.blue);box(.83,.42,.05,xx,base+.28,zz-.45,M.wood);
          for(const dx of [-.2,.2])box(.29,.055,.18,xx+dx,base+.32,zz-.25,linen);
          box(.35,.32,.24,side*2.3,base+.2,zz-.37,M.wood);box(.37,.02,.25,side*2.3,base+.38,zz-.37,M.edge);
          box(.55,.025,.28,side*2.25,base+.34,zz+.55,M.wood);for(const dx of [-.21,.21])box(.018,.3,.018,side*2.25+dx,base+.18,zz+.55,M.steel);
          // Corridor partition with a genuine open doorway at each room entry.
          for(const dz of [-.55,.55])box(.04,.7,.48,side*.51,base+.39,zz+dz,M.wall);box(.07,.09,.5,side*.51,base+.7,zz,M.wood);
          if(zz<0)box(2.1,.7,.045,side*1.58,base+.39,0,M.wall);
          // Bathroom alongside the corridor; shared wet-core positions stack vertically.
          box(.53,.018,.5,side*.91,base+.05,zz-.43,M.edge);box(.045,.55,.51,side*1.2,base+.31,zz-.43,M.glass);box(.19,.18,.25,side*.87,base+.15,zz-.48,linen);box(.23,.025,.18,side*.95,base+.3,zz-.18,linen);
          // FCU recirculates room air; outdoor-air and bathroom extract remain distinct.
          box(.42,.14,.25,side*.84,top-.03,zz,M.edge);box(.28,.018,.2,side*.82,top-.14,zz+.28,M.steel);box(.32,.085,.12,side*1.2,top-.03,zz,M.cyan);box(.2,.018,.2,side*1.35,top-.1,zz,M.edge);
          box(.75,.065,.07,side*.4,top+.07,zz,M.cyan);box(.14,.018,.16,side*.72,top+.02,zz+.13,M.edge);
          pipe([side*.84,top+.16,-1.45],[side*.84,top+.16,zz],.014,M.blue);pipe([side*.96,top+.18,-1.45],[side*.96,top+.18,zz],.014,hot);pipe([side*.84,top+.16,zz],[side*.84,top+.03,zz],.014,M.blue);pipe([side*.96,top+.18,zz],[side*.96,top+.03,zz],.014,hot);
          box(.11,.075,Math.abs(zz+1.45)+.12,side*.62,top+.11,(zz-1.45)/2,extract);box(.25,.065,.1,side*.76,top+.11,zz-.43,extract);box(.15,.02,.15,side*.9,top+.03,zz-.43,M.steel);
          pipe([side*.99,base+.25,-1.45],[side*.99,base+.25,zz-.43],.012,M.blue);pipe([side*1.05,base+.27,-1.45],[side*1.05,base+.27,zz-.43],.012,hot);pipe([side*1.1,base+.12,zz-.43],[side*1.1,base+.1,-1.45],.023,waste);
          box(.48,.018,.04,xx,top-.17,zz,M.light);
        }
        box(.18,.1,3.0,0,top+.07,0,M.cyan);box(.08,.065,3.0,-.18,top+.055,0,extract);box(.14,.018,.18,-.18,top-.025,.25,M.steel);box(.08,.035,3,-.3,top+.13,0,M.yellow);box(.035,.025,3,.3,top+.12,0,M.bms);
        for(const zz of [-1,0,1]){pipe([-2.3,top+.18,zz],[2.3,top+.18,zz],.01,M.red);for(const xx of [-1.7,1.7])pipe([xx,top+.18,zz],[xx,top+.05,zz],.012,M.red);}
        box(.35,.02,.045,0,base+.66,1.35,M.light);
      }
      // The risers link the repeated floor connections to roof plant and remote water sources.
      for(const side of [-1,1])for(const [offset,mat,radius]of [[.84,M.blue,.02],[.96,hot,.02],[.99,M.blue,.018],[1.05,hot,.018],[1.1,waste,.03]])pipe([side*offset,.14,-1.45],[side*offset,2.9,-1.45],radius,mat);
      box(.12,2.9,.12,0,1.55,-1.45,M.cyan);box(.08,2.9,.1,-.18,1.55,-1.45,extract);for(const side of [-1,1])box(.1,2.9,.1,side*.62,1.55,-1.45,extract);
      pipe([-.37,.16,-1.45],[-.37,2.85,-1.45],.023,M.red);box(.2,2.65,.045,-.3,1.48,-1.4,M.yellow);
      box(5.45,.065,3.4,0,2.76,0,M.roof,roof);for(const xx of [-2.67,2.67])box(.04,.16,3.4,xx,2.84,0,M.edge,roof);
      box(1.23,.38,.62,0,3.02,-.95,M.edge);box(.98,.28,.035,0,3.02,-.62,M.steel);for(let xx=-.42;xx<.5;xx+=.1)box(.02,.25,.04,xx,3.02,-.59,M.dark);addFan(.35,3.23,-.95,.14);box(.18,.17,.6,0,2.86,-1.2,M.cyan);box(.08,.12,.4,-.18,2.88,-1.3,extract);box(.14,.17,.23,-.4,3.02,-.55,M.cyan);box(.14,.17,.23,.4,3.02,-.55,extract);
      for(const side of [-1,1]){box(.26,.18,.28,side*.62,2.91,-1.45,extract);addFan(side*.62,3.02,-1.45,.09);}
      box(.3,.38,.08,-.33,.4,1.57,M.dark);box(.18,.14,.015,-.33,.47,1.62,M.alarm);
    }
    for(const b of batches.values()){
      const mesh=new THREE.InstancedMesh(b.geometry,b.mat,b.items.length);mesh.userData.area='model';mesh.name='Batched '+type+' details';mesh.receiveShadow=!b.mat.transparent;mesh.castShadow=false;
      for(let i=0;i<b.items.length;i++){const item=b.items[i];dummy.position.fromArray(item.position);dummy.scale.fromArray(item.scale);dummy.quaternion.copy(item.quaternion||new THREE.Quaternion());dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();b.parent.add(mesh);
    }
    // One instanced draw for the animated supply-air markers.
    const particleMaterial=new THREE.MeshBasicMaterial({color:'#bbf6ff',toneMapped:false});materials.add(particleMaterial);const particles=new THREE.InstancedMesh(sphereGeometry,particleMaterial,6);particles.name='Airflow markers';particles.userData.area='model';particles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);particles.frustumCulled=false;particles.visible=false;group.add(particles);
    const record={type,group,roof,M,particles,fans,phase:0,lastState:''};models.set(type,record);return record;
  }
  function setType(type){if(disposed)return;selected=['warehouse','datacentre','hotel'].includes(type)?type:'office';if(selected!=='office'&&!models.has(selected))build(selected);root.visible=selected!=='office';for(const [id,model]of models)model.group.visible=id===selected;}
  function update(time,dt,state={}){
    if(disposed||selected==='office')return;const model=models.get(selected);if(!model)return;
    const period=state.period||'startup',fault=!!state.faultActive,scenario=state.scenario||'airflow',powerLoss=fault&&scenario==='power',restricted=fault&&['airflow','controls'].includes(scenario),reveal=Math.max(0,Math.min(1,Number(state.reveal)||0)),motion=state.motion!==false;
    const demand=(selected==='datacentre'||selected==='hotel')?1:period==='night'?.18:period==='busy'?1:.62;
    model.roof.position.y=Math.min(1,Math.max(0,reveal))*.72;
    const key=[period,fault,scenario,Math.round(reveal*100)].join(':');if(key!==model.lastState){model.lastState=key;model.M.roof.opacity=.88-Math.min(1,reveal)*.78;model.M.light.emissiveIntensity=.14+demand*.85;model.M.alarm.color.set(fault?'#efaa56':'#66d8a3');model.M.alarm.emissive.set(fault?'#d77820':'#29b374');model.M.cyan.emissiveIntensity=powerLoss?.05:restricted?.25:.58;}
    if(motion){model.phase+=Math.max(0,dt||0)*demand*(restricted?.16:.55);if(!powerLoss)for(const fan of model.fans)fan.rotation.y+=Math.max(0,dt||0)*demand*5;}
    model.particles.visible=demand>.2&&!powerLoss;
    for(let i=0;i<6;i++){const z=-1.4+((model.phase+i/6)%1)*2.8;dummy.position.set(selected==='warehouse'||selected==='hotel'?0:2.18,selected==='hotel'?2.64:selected==='warehouse'?1.68:1.37,z);dummy.scale.setScalar(restricted?.024:.039);dummy.quaternion.identity();dummy.updateMatrix();model.particles.setMatrixAt(i,dummy.matrix);}model.particles.instanceMatrix.needsUpdate=true;
  }
  function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const model of models.values())model.group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const geo of geometries)geo.dispose();for(const mat of materials)mat.dispose();models.clear();}
  return {root,setType,update,dispose,get type(){return selected;}};
}
