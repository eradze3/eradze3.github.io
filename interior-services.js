import * as THREE from './vendor/three.module.js';
const v=(...n)=>new THREE.Vector3(...n);

/** Connected, illustrative service topology. Geometry is sized for legibility, not design use. */
export function createInteriorServices(c){
 const {scene,root,box,beam,cyl,solid,label,block,M,mat,basic,materials,geometries,W,D,H,type}=c;
 const y=type==='warehouse'?4.35:type==='datacentre'?3.25:2.92,plantZ=-D/2+1.15;
 const systems={},routes=[],targets=[],dynamic=new THREE.Group();dynamic.name='Operating equipment';root.add(dynamic);
 const styles={air:['#64c4d4','#188ca1'],water:['#4a9ee4','#2268ba'],power:['#e7ba56','#9f721c'],controls:['#75d8ae','#278a68'],fire:['#cb6863','#7b2424']};
 function group(system){const g=new THREE.Group();g.name=system+' services';g.userData.batchRoot=true;g.userData.system=system;root.add(g);return g;}
 for(const [id,[color,emissive]]of Object.entries(styles)){systems[id]={group:group(id),m:mat(color,{metalness:.6,roughness:.34,emissive,emissiveIntensity:.3,transparent:true})};}
 const returnMat=mat('#71a0bd',{metalness:.55,roughness:.4,emissive:'#254c72',emissiveIntensity:.2,transparent:true}),waterReturn=mat('#8d82ce',{metalness:.6,roughness:.36,emissive:'#514884',emissiveIntensity:.3,transparent:true}),extractMat=mat('#b195c7',{metalness:.5,roughness:.4,emissive:'#6b467d',emissiveIntensity:.2,transparent:true});
 const damperMat=mat('#a9cbd0',{metalness:.72,roughness:.3,emissive:'#285b67',emissiveIntensity:.3,transparent:true});damperMat.name='Air-system damper blade';
 const serviceMaterials={air:[systems.air.m,returnMat,extractMat,damperMat],water:[systems.water.m,waterReturn],power:[systems.power.m],controls:[systems.controls.m],fire:[systems.fire.m]};
 const ventilationReturn=type==='hotel'?extractMat:returnMat;
 const hardware=mat('#a9c1cb',{metalness:.77,roughness:.28});
 function ductSegment(a,b,w=.48,h=.28,m=systems.air.m,parent=systems.air.group){const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];box(Math.abs(dx)||w,Math.abs(dy)||h,Math.abs(dz)||w,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,m,parent);}
 function duct(id,points,{w=.48,h=.28,m=systems.air.m,system='air'}={}){routes.push({id,system,points:points.map(p=>[...p])});for(let i=1;i<points.length;i++)ductSegment(points[i-1],points[i],w,h,m,systems[system].group);}
 function pipe(id,points,{r=.045,m=systems.water.m,system='water'}={}){routes.push({id,system,points:points.map(p=>[...p])});for(let i=1;i<points.length;i++)beam(points[i-1],points[i],r,m,systems[system].group);for(const p of points) c.instance(c.sphereGeo,m,[r*1.13,r*1.13,r*1.13],p,[0,0,0],systems[system].group);}
 function target(id,title,p,description,system,tag,focus){const g=new THREE.Group();g.name=title;g.userData.inspectId=id;g.userData.system=system;dynamic.add(g);const info={id,title,position:v(...p),description,system,tag,focus:focus||{position:v(p[0]+.45,Math.min(1.9,p[1]+.2),p[2]+2.2),target:v(...p)}};targets.push(info);return g;}
 function grille(x,yy,z,side=.7,m=M.white,parent=systems.air.group){box(side,.075,side,x,yy,z,m,parent);for(let k=-3;k<=3;k++)box(side*.8,.012,.025,x,yy-.044,z+k*side/9,M.grille,parent);}
 // Ventilation AHU in a service bay. Supply and return have individual casing ports.
 const ax=-3.3,az=plantZ,ap=[ax+1.3,1.64,az-.27],rp=[ax+1.3,1.36,az+.27];
 box(2.6,.14,1.32,ax,.18,az,M.frame);box(2.55,1.6,1.28,ax,1.03,az,M.white);
 for(const x of [ax-1.19,ax-.42,ax+.4,ax+1.18])box(.035,1.47,.035,x,1.06,az+.655,M.frame);
 for(const x of [ax-.8,ax,ax+.8]){box(.025,.22,.04,x,1.08,az+.69,hardware);box(.64,.018,.015,x,1.55,az+.66,M.frame);}
 block(ax,az,2.75,1.5);label(type==='hotel'?'OA AHU / SEPARATE SUPPLY · EXHAUST':'VENTILATION AHU / FILTER · COIL · FAN',ax,2.05,az+.67,3.4);
 const fanPivot=new THREE.Group();fanPivot.position.set(ax+.8,1.03,az+.67);dynamic.add(fanPivot);
 const rotorGeo=new THREE.CylinderGeometry(.24,.24,.035,16);rotorGeo.rotateX(Math.PI/2);geometries.add(rotorGeo);const rotor=new THREE.Mesh(rotorGeo,M.dark);fanPivot.add(rotor);for(let i=0;i<4;i++){const blade=solid(.06,.37,.025,0,0,.035,hardware,fanPivot);blade.rotation.z=i*Math.PI/2;}
 duct('ahu-supply',[ap,[.7,ap[1],az-.27],[.7,y,az-.27],[.7,y,D/2-1]],{w:.55,h:.32});
 duct('ahu-return',[[-.7,y,D/2-1],[-.7,y,az+.27],[-.7,rp[1],az+.27],rp],{w:.55,h:.32,m:ventilationReturn});
 if(type==='hotel'){
   // Separate outdoor supply and exhaust boundary ports; no FCU return connects to this AHU.
   duct('outdoor-intake',[[ax-.85,1.45,-D/2-.2],[ax-.85,1.45,az-.63]],{w:.4,h:.3});
   duct('outdoor-exhaust',[[ax+.4,1.05,az-.63],[ax+.4,1.05,-D/2-.2]],{w:.4,h:.3,m:extractMat});
   label('OA IN / EXHAUST OUT · BOUNDARY PORTS',ax,2.32,az+.67,3.6);
   label('INTAKE / DISCHARGE SITING NOT MODELLED',ax,2.55,az+.67,3.6);
   const route=routes.find(r=>r.id==='ahu-return');route.role='General exhaust through a separate AHU air path; not FCU recirculation';
 }
 // Connected local branch. The central damper housing deliberately exposes its blade.
 const terminalX=type==='hotel'?3.0:2.7,branchZ=type==='hotel'?2.95:-.05,damperX=1.9;
 duct('branch-inlet',[[.7,y,branchZ],[damperX-.25,y,branchZ]],{w:.46,h:.36});
 duct('branch-outlet',[[damperX+.25,y,branchZ],[terminalX,y,branchZ],[terminalX,y-.37,branchZ]],{w:.46,h:.36});
 routes.push({id:'damper-link',system:'air',points:[[damperX-.25,y,branchZ],[damperX+.25,y,branchZ]],equipment:'VD-01'});
 const damper=target('damper','Motorized branch damper',[damperX,y,branchZ],'A local ventilation damper connects the main supply duct to the served terminal. Compare the blade position, command and downstream response.','air','VD-01',{position:v(.2,1.85,branchZ+2.5),target:v(damperX,y,branchZ)});
 for(const yy of [-.2,.2])solid(.5,.025,.5,damperX,y+yy,branchZ,hardware,damper);for(const zz of [-.25,.25])solid(.5,.4,.025,damperX,y,branchZ+zz,hardware,damper);
 const blade=solid(.025,.36,.45,damperX,y,branchZ,damperMat,damper);blade.name='VD-01 air damper blade';const actuator=solid(.2,.16,.18,damperX,y+.29,branchZ,M.dark,damper);solid(.035,.16,.035,damperX,y+.22,branchZ,hardware,damper);
 const diffuser=target('diffuser',type==='hotel'?'Outdoor-air terminal':'Supply-air terminal',[terminalX,y-.42,branchZ],'The duct drops into this terminal. Local delivered airflow is checked separately from the AHU fan-running indication.','air',type==='hotel'?'OA-T01':'SA-T01',{position:v(terminalX-.8,1.7,branchZ+2.1),target:v(terminalX,y-.4,branchZ)});
 solid(.73,.09,.73,terminalX,y-.42,branchZ,M.white,diffuser);for(let k=-3;k<=3;k++)solid(.61,.014,.028,terminalX,y-.474,branchZ+k*.086,M.grille,diffuser);
 // Other zones have explicitly connected supply and return terminals, never isolated duct ornaments.
 for(const zz of [-D/2+3,D/2-2.5]){if(Math.abs(zz-branchZ)<1)continue;for(const side of [-1,1]){const xx=side*(type==='hotel'?4.4:W/2-3.3),start=side>0?.7:-.7,m=side>0?systems.air.m:ventilationReturn;duct((side>0?'supply-':'return-')+zz,[[start,y,zz],[xx,y,zz],[xx,y-.38,zz]],{m,w:.36,h:.23});grille(xx,y-.42,zz,.65);}}
 // Return from the served zone is independent of the supply terminal.
 const returnX=type==='hotel'?-.9:-2.7;duct('zone-return',[[returnX,y-.42,branchZ-1.1],[returnX,y,branchZ-1.1],[-.7,y,branchZ-1.1]],{m:ventilationReturn,w:.4,h:.25});grille(returnX,y-.46,branchZ-1.1,.7);
 // Duct flanges and trapeze supports: shared instances keep the draw count stable.
 for(let zz=plantZ+1;zz<D/2-1;zz+=2){for(const xx of [-.7,.7]){box(.61,.025,.035,xx,y+.18,zz,hardware,systems.air.group);box(.61,.025,.035,xx,y-.18,zz,hardware,systems.air.group);for(const sx of [-.31,.31])box(.025,.36,.035,xx+sx,y,zz,hardware,systems.air.group);}beam([-1.12,y-.26,zz],[-1.12,H-.1,zz],.012,hardware,systems.air.group);beam([1.12,y-.26,zz],[1.12,H-.1,zz],.012,hardware,systems.air.group);box(2.35,.035,.04,0,y-.27,zz,hardware,systems.air.group);}
 // Water supply and return risers connect to the actual AHU coil; their colours are intentionally distinct.
 const riserX=W/2-.8,riserZ=plantZ;
 pipe('chw-supply',[[riserX,.1,riserZ],[riserX,y+.25,riserZ],[ax-1.38,y+.25,riserZ],[ax-1.38,1.45,riserZ],[ax-1.25,1.45,riserZ]],{});
 pipe('chw-return',[[ax-1.25,1.18,riserZ+.22],[ax-1.52,1.18,riserZ+.22],[ax-1.52,y+.48,riserZ+.22],[riserX-.23,y+.48,riserZ+.22],[riserX-.23,.1,riserZ+.22]],{m:waterReturn});
 label('CHW S / R · TO REMOTE PLANT',riserX-.55,2.05,riserZ+.15,2.1);
 for(const yy of [1.45,1.18]){box(.12,.12,.12,ax-1.35,yy,riserZ+(yy===1.18?.22:0),hardware,systems.water.group);beam([ax-1.35,yy,riserZ+(yy===1.18?.22:0)],[ax-1.35,yy+.11,riserZ+(yy===1.18?.22:0)],.018,systems.water.m,systems.water.group);}
 // Local distribution board and cable containment terminate at the fan isolator / controls enclosure.
 const panelX=-1.25,panelZ=-D/2+.25;
 const panel=target('panel','Ventilation status & feeder',[panelX,1.5,panelZ],'The status display distinguishes the ventilation feeder, fan proof and command. Unrelated building loads remain separate in these scenarios.','power','DB-V / AHU-01',{position:v(.15,1.7,panelZ+2.9),target:v(panelX,1.45,panelZ)});
 solid(.8,1.25,.18,panelX,1.18,panelZ,M.dark,panel);solid(.63,.38,.02,panelX,1.48,panelZ+.105,M.screen,panel);const lampMat=mat('#68d8ad',{emissive:'#25805d',emissiveIntensity:.75});solid(.09,.09,.025,panelX+.22,1.03,panelZ+.12,lampMat,panel);
 pipe('fan-power',[[panelX,1.8,panelZ],[panelX,y+.2,panelZ],[ax+.8,y+.2,panelZ],[ax+.8,y+.2,az],[ax+.8,1.75,az]],{r:.035,m:systems.power.m,system:'power'});
 box(.2,.055,D-2,-1.65,y+.2,0,systems.power.m,systems.power.group);for(let zz=plantZ;zz<D/2-1;zz+=.45)box(.2,.02,.035,-1.65,y+.24,zz,hardware,systems.power.group);
 // Sensor fixed to a small wall return, with real routing back to the controls panel.
 const sx=type==='hotel'?1.72:-2.12,sz=type==='hotel'?2.1:1.6;
 box(.14,2.65,.7,sx-.1,1.325,sz,M.wall,c.architecture);block(sx-.1,sz,.14,.7);
 const sensor=target('sensor','Zone demand & controls',[sx,1.45,sz+.38],'A wall-mounted zone device reports demand. Compare the supervisory command, position feedback and observed air response; demand is not proof of flow.','controls','BMS-Z01',{position:v(sx+.7,1.65,sz+2.3),target:v(sx,1.45,sz+.38)});
 solid(.23,.32,.065,sx,1.45,sz+.38,M.white,sensor);solid(.16,.14,.01,sx,1.49,sz+.418,M.screen,sensor);
 pipe('bms-trunk',[[panelX,1.8,panelZ+.18],[panelX,y+.42,panelZ+.18],[1.4,y+.42,panelZ+.18],[1.4,y+.42,branchZ],[damperX,y+.42,branchZ],[damperX,y+.33,branchZ]],{r:.018,m:systems.controls.m,system:'controls'});
 pipe('bms-zone-trunk',[[1.4,y+.42,branchZ],[1.4,y+.42,D/2-1]],{r:.018,m:systems.controls.m,system:'controls'});
 pipe('zone-device',[[1.4,y+.42,sz+.4],[sx,y+.42,sz+.4],[sx,1.6,sz+.4]],{r:.014,m:systems.controls.m,system:'controls'});
 // Fire branch includes a riser and individual heads; no suppression performance is implied.
 pipe('fire-main',[[-W/2+.7,.1,plantZ],[-W/2+.7,y+.42,plantZ],[-W/2+.7,y+.42,D/2-1]],{r:.035,m:systems.fire.m,system:'fire'});
 for(const zz of [-D/2+3,1,D/2-2]){pipe('sprinkler-'+zz,[[-W/2+.7,y+.42,zz],[W/2-2,y+.42,zz]],{r:.022,m:systems.fire.m,system:'fire'});for(const xx of [-W/2+3,0,W/2-3]){beam([xx,y+.42,zz],[xx,y+.12,zz],.018,systems.fire.m,systems.fire.group);cyl(.045,.025,xx,y+.1,zz,hardware,systems.fire.group);}}
 // Maintenance area is a visual reservation, not a claimed code clearance.
 const accessZ=az+1.65,access=target('access','AHU service access',[ax,.12,accessZ],'Keep the manufacturer’s filter, coil and fan access envelope available. The outline is illustrative and is not a prescribed clearance.','air','ACCESS-01',{position:v(-.3,1.8,az+4),target:v(ax,.7,accessZ)});
 const accessMat=basic('#86d3d9',{transparent:true,opacity:.13,depthWrite:false});const accessVolume=solid(2.85,1.8,1.4,ax,.92,accessZ,accessMat,access);accessVolume.castShadow=false;
 for(const xx of [ax-1.43,ax+1.43])solid(.025,.008,1.4,xx,.015,accessZ,systems.air.m,access);for(const zz of [accessZ-.7,accessZ+.7])solid(2.85,.008,.025,ax,.015,zz,systems.air.m,access);
 const cart=new THREE.Group();cart.name='Access obstruction';cart.userData.inspectId='access';dynamic.add(cart);solid(1.65,.08,.75,ax,.17,accessZ,M.frame,cart);solid(1.45,.7,.68,ax,.56,accessZ,M.parcel,cart);solid(.055,.9,.055,ax+.8,.56,accessZ+.28,M.frame,cart);const cartCollider={minX:ax-.9,maxX:ax+.9,minZ:accessZ-.48,maxZ:accessZ+.48};
 label('FILTER / COIL ACCESS',ax,.28,accessZ+.72,2.7);
 let fcuFlow=null,coolingFlow=null;
 if(type==='datacentre'){
   // Independent rack-cooling circuit. Ventilation feeder loss does not stop this illustrative loop.
   for(const xx of [-9.7,9.7]){
     pipe('rack-coil-supply-'+xx,[[riserX,y+.25,plantZ],[xx,y+.25,plantZ],[xx,y+.25,-5.75],[xx,1.45,-5.75]],{});
     pipe('rack-coil-return-'+xx,[[xx,1.18,-5.75],[xx+.15,1.18,-5.75],[xx+.15,y+.48,-5.75],[xx+.15,y+.48,plantZ+.22],[riserX-.23,y+.48,plantZ+.22]],{m:waterReturn});
     label('RACK COOLING / SEPARATE CIRCUIT',xx,2.95,-5.75,2.6);
   }
   const coolGeo=new THREE.SphereGeometry(.04,5,3);geometries.add(coolGeo);coolingFlow=new THREE.InstancedMesh(coolGeo,basic('#6ca8ed'),16);coolingFlow.name='Independent cold aisle airflow';dynamic.add(coolingFlow);
 }
 if(type==='hotel'){
   // Independent room FCU recirculation, with a separate outdoor-air terminal and bath extract.
   const fx=4.2,fz=3.1,fy=y-.07;const fcu=target('fcu','Guestroom fan-coil unit',[fx,fy,fz],'Room air recirculates through this fan coil. Chilled-water supply and return serve its coil; the outdoor-air terminal, bathroom extract and condensate drain remain separate.','air','FCU-101',{position:v(3.0,1.75,4.6),target:v(fx,fy,fz)});solid(1.2,.42,.85,fx,fy,fz,M.white,fcu);for(const xx of [fx-.48,fx+.48])box(.025,.43,.85,xx,fy,fz,hardware,systems.air.group);
   duct('fcu-room-supply',[[fx,fy,fz-.43],[fx,fy,1.3],[5.3,fy,1.3],[5.3,y-.42,1.3]],{w:.32,h:.2});grille(5.3,y-.47,1.3,.6);
   duct('fcu-room-return',[[4.2,y-.45,4.0],[4.2,fy,4.0],[4.2,fy,3.53]],{m:returnMat,w:.4,h:.23});grille(4.2,y-.49,4.0,.7);label('FCU-101 · ROOM RECIRCULATION',4.2,2.39,3.55,2.4);
   pipe('fcu-chw-supply',[[riserX,y+.25,riserZ],[riserX,y+.25,fz],[4.8,y+.25,fz],[4.8,fy,fz]],{});
   pipe('fcu-chw-return',[[4.8,fy,fz+.22],[4.8,y+.48,fz+.22],[riserX-.23,y+.48,fz+.22],[riserX-.23,y+.48,riserZ+.22]],{m:waterReturn});
   const drain=mat('#7d9b87',{roughness:.68,transparent:true,emissive:'#395849',emissiveIntensity:.15});drain.name='Condensate drainage';serviceMaterials.water.push(drain);pipe('fcu-condensate',[[fx+.4,fy-.24,fz],[6.9,fy-.29,fz],[6.9,fy-.4,-4.7],[7.65,fy-.42,-4.7],[7.65,.25,-4.7]],{r:.025,m:drain});cyl(.075,.055,7.65,.16,-4.7,hardware,systems.water.group);pipe('condensate-drain-interface',[[7.65,.13,-4.7],[7.65,.03,-4.7]],{r:.035,m:drain});
   duct('bath-extract',[[6.8,y-.44,-4.55],[6.8,y+.12,-4.55],[7.85,y+.12,-4.55],[7.85,H+.2,-4.55]],{w:.24,h:.2,m:extractMat});grille(6.8,y-.48,-4.55,.45);label('BATH EXTRACT → SHAFT',6.5,2.2,-5.82,2.5);
   const hot=mat('#bb776f',{emissive:'#773b35',emissiveIntensity:.15,transparent:true}),soil=mat('#6b747d',{emissive:'#39434a',emissiveIntensity:.15,transparent:true});hot.name='Domestic hot water';soil.name='Sanitary drainage';serviceMaterials.water.push(hot,soil);
   for(const [id,xx,m,yy]of [['domestic-cold',7.35,systems.water.m,.75],['domestic-hot',7.5,hot,.9]]){pipe(id,[[xx,.1,-5.2],[xx,H+.2,-5.2]],{r:.025,m});pipe(id+'-branch',[[xx,yy,-5.2],[5.7,yy,-5.2]],{r:.025,m});}
   pipe('sanitary-stack',[[7.75,-.1,-5.2],[7.75,H+.2,-5.2]],{r:.065,m:soil});pipe('basin-waste',[[5.7,.64,-5.2],[5.7,.3,-5.2],[7.75,.24,-5.2]],{r:.03,m:soil});pipe('wc-waste',[[6.85,.2,-5.3],[7.75,.18,-5.3],[7.75,.18,-5.2]],{r:.055,m:soil});
   const wetcore=target('wetcore','Ensuite wet-service core',[7.75,1.55,-6.78],'The core groups domestic cold and hot water with a separate sanitary stack and bath-extract riser. The FCU condensate route is distinct from the hydronic return.','water','WS-101',{position:v(6.55,1.75,-3.7),target:v(7.75,1.55,-6.78)});solid(.7,1.0,.035,7.75,1.55,-6.78,M.white,wetcore);solid(.025,.17,.035,7.95,1.55,-6.75,hardware,wetcore);
   label('CW / HW / WASTE · WET CORE',6.8,2.45,-6.8,3.1);
   const smallFlowGeo=new THREE.SphereGeometry(.035,5,3);geometries.add(smallFlowGeo);fcuFlow=new THREE.InstancedMesh(smallFlowGeo,basic('#77e9e6'),6);fcuFlow.name='FCU room recirculation';dynamic.add(fcuFlow);
 }
 const flowGeo=new THREE.SphereGeometry(.04,5,3);geometries.add(flowGeo);const flowMat=basic('#99edf3'),airflow=new THREE.InstancedMesh(flowGeo,flowMat,18);airflow.name='Air movement indication';airflow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);airflow.frustumCulled=false;dynamic.add(airflow);
 const ringGeo=new THREE.TorusGeometry(.28,.012,5,32);geometries.add(ringGeo);const ring=new THREE.Mesh(ringGeo,basic('#b3f7fb',{transparent:true,opacity:.9}));ring.name='Equipment focus ring';dynamic.add(ring);ring.visible=false;
 const dummy=new THREE.Object3D();let phase=0,independentPhase=0,last='',lastLens='',lastOperating='';
 function update(time,dt,state={}){
   const fault=!!state.faultActive,scenario=state.scenario||'airflow',period=state.period||'busy',continuous=type==='hotel'||type==='datacentre',demand=continuous||period!=='night';
   const powerLoss=fault&&scenario==='power',restricted=fault&&['airflow','controls'].includes(scenario),accessBlocked=fault&&scenario==='access',running=demand&&!powerLoss;
   const key=[period,fault,scenario,state.selected].join('|');if(key!==last){last=key;blade.rotation.z=restricted?0:Math.PI/2;cart.visible=accessBlocked;const colliderIndex=c.colliders.indexOf(cartCollider);if(accessBlocked&&colliderIndex<0)c.colliders.push(cartCollider);else if(!accessBlocked&&colliderIndex>=0)c.colliders.splice(colliderIndex,1);accessVolume.visible=accessBlocked||state.selected==='access';accessMat.color.set(accessBlocked?'#efb56c':'#86d3d9');lampMat.color.set(powerLoss?'#d67b6d':fault?'#e8be74':'#68d8ad');lampMat.emissive.set(powerLoss?'#872d25':fault?'#986925':'#25805d');flowMat.color.set(restricted?'#e8c37a':'#99edf3');const item=targets.find(t=>t.id===state.selected);ring.visible=!!item;if(item){ring.position.copy(item.position);ring.rotation.set(['diffuser','damper','access'].includes(item.id)?Math.PI/2:0,0,0);}scene.userData.shadowDirty=true;}
   const lens=state.lens||{},chosen=lens.system||'all';if(chosen!==lastLens){lastLens=chosen;for(const [id,mats]of Object.entries(serviceMaterials))for(const material of mats){const dim=chosen!=='all'&&chosen!==id&&!(chosen==='water'&&id==='fire');material.opacity=dim?.17:1;material.depthWrite=!dim;material.emissiveIntensity=dim?.02:chosen==='all'?.3:.72;material.needsUpdate=true;}scene.userData.shadowDirty=true;}
   const step=state.motion===false?0:Math.min(.1,Math.max(0,Number(dt)||0));phase+=step*(restricted?.14:1);independentPhase+=step;if(running)fanPivot.rotation.z+=step*7;
   airflow.visible=running;for(let i=0;i<18;i++){const t=((i<9?independentPhase:phase)*.42+i/18)%1;if(i<9)dummy.position.set(.7,y,plantZ+.7+t*(D/2-1-plantZ-.7));else if(t<.45)dummy.position.set(.7+t/.45*(terminalX-.7),y,branchZ);else dummy.position.set(terminalX,y-.42-(t-.45)/.55*1.4,branchZ);dummy.rotation.set(0,0,0);dummy.scale.setScalar(restricted&&i>=9?.6:1);dummy.updateMatrix();airflow.setMatrixAt(i,dummy.matrix);}airflow.instanceMatrix.needsUpdate=true;
   if(fcuFlow){fcuFlow.visible=true;for(let i=0;i<6;i++){const t=(independentPhase*.38+i/6)%1;dummy.position.set(5.3,y-.5-t*1.5,1.3);dummy.scale.setScalar(1);dummy.updateMatrix();fcuFlow.setMatrixAt(i,dummy.matrix);}fcuFlow.instanceMatrix.needsUpdate=true;}
   if(coolingFlow){coolingFlow.visible=true;for(let i=0;i<16;i++){const t=(independentPhase*.18+i/16)%1;dummy.position.set(i%2?-5.8:5.8,.08+t*1.4,-5.2+Math.floor(i/2)*1.35);dummy.scale.setScalar(.8);dummy.updateMatrix();coolingFlow.setMatrixAt(i,dummy.matrix);}coolingFlow.instanceMatrix.needsUpdate=true;}
   const operatingKey=[period,fault,scenario].join('|');if(operatingKey!==lastOperating){lastOperating=operatingKey;scene.userData.operating={period,faultActive:fault,scenario,fanRunning:running,localAirflow:running?(restricted?'restricted':'available'):powerLoss?'unavailable':'standby',occupied:continuous||period==='busy',demand,command:restricted&&scenario==='controls'?'conflicting':demand?'run':'setback',accessBlocked,feederAvailable:!powerLoss,roomFCURunning:type==='hotel',rackCoolingRunning:type==='datacentre'};}
 }
 const first=targets.find(t=>t.id==='diffuser');
 return {targets,routes,update,serviceY:y,views:{services:targets.find(t=>t.id==='damper').focus,controls:targets.find(t=>t.id==='panel').focus,access:targets.find(t=>t.id==='access').focus},terminal:first.position,systemGroups:systems};
}
