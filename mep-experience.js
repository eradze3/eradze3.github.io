import * as THREE from './vendor/three.module.js';
import {CHALLENGE_GEOMETRY} from './engineering-challenge.js';

/** Lightweight, illustrative MEP teaching overlays. Built once; no additional shadows. */
export function createMepExperience({root,roof,floors}) {
  const trace=new THREE.Group();trace.name='Connected AHU inspection';trace.userData.area='model';root.add(trace);
  const bay=new THREE.Group();bay.name='Illustrative ceiling coordination bay';bay.userData.area='model';root.add(bay);
  const boxGeometry=new THREE.BoxGeometry(1,1,1),pipeGeometry=new THREE.CylinderGeometry(1,1,1,7),dotGeometry=new THREE.SphereGeometry(1,6,4);
  const colors={electrical:'#ffcf53',hvac:'#4ce7f1',water:'#7bafff',bms:'#7cf6a7'};
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),quaternion=new THREE.Quaternion(),direction=new THREE.Vector3();
  const up=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(0,0,1),identity=new THREE.Quaternion();
  const world=new THREE.Vector3(),pulsePosition=new THREE.Vector3();
  const basic=color=>new THREE.MeshBasicMaterial({color,toneMapped:false});
  function instances(geometry,material,count,parent){const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.userData.area='model';mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;}
  function putBox(mesh,i,point,size){position.set(...point);scale.set(...size);matrix.compose(position,identity,scale);mesh.setMatrixAt(i,matrix);}
  function segment(mesh,i,a,b,width,height=null){position.copy(a).add(b).multiplyScalar(.5);direction.copy(b).sub(a);const length=direction.length();direction.multiplyScalar(1/Math.max(length,.0001));quaternion.setFromUnitVectors(height===null?up:forward,direction);scale.set(width,height===null?length:height,height===null?width:length);matrix.compose(position,quaternion,scale);mesh.setMatrixAt(i,matrix);}
  const routes=[];
  function route(id,count,radius){const material=basic(colors[id]);material.transparent=true;material.depthWrite=false;const mesh=instances(pipeGeometry,material,count,trace);mesh.name=`AHU ${id} connection`;mesh.userData.traceSystem=id;const item={id,mesh,radius:radius*1.2,points:[],lengths:[],length:0};routes.push(item);return item;}
  const power=route('electrical',6,.024),air=route('hvac',7,.034),supply=route('water',4,.023),returnWater=route('water',4,.023),control=route('bms',4,.018),returnAir=route('hvac',7,.029);
  returnAir.mesh.name='AHU return-air connection';returnAir.mesh.material.color.set('#8fb8c8');
  returnWater.mesh.material.color.set('#b29bff');
  function setRoute(item,coords){item.points=coords.map(v=>new THREE.Vector3(...v));item.lengths.length=0;item.length=0;for(let i=1;i<item.points.length;i++){const length=item.points[i].distanceTo(item.points[i-1]);item.lengths.push(length);item.length+=length;segment(item.mesh,i-1,item.points[i-1],item.points[i],item.radius);}item.mesh.count=item.points.length-1;item.mesh.instanceMatrix.needsUpdate=true;}

  // The cooling loop is a separate supply/return circuit. It never uses the domestic-water riser.
  const plant=new THREE.Group();plant.name='Illustrative closed cooling loop plant';root.add(plant);plant.userData.area='model';plant.userData.system='hvac';
  const plantMesh=instances(boxGeometry,new THREE.MeshStandardMaterial({color:'#9cbdce',roughness:.45,metalness:.35}),4,plant);
  putBox(plantMesh,0,[-.18,.28,-1.02],[.62,.36,.52]);putBox(plantMesh,1,[-.18,.48,-1.02],[.65,.04,.55]);putBox(plantMesh,2,[-.38,.12,-1.02],[.06,.14,.45]);putBox(plantMesh,3,[.02,.12,-1.02],[.06,.14,.45]);plantMesh.instanceMatrix.needsUpdate=true;
  const plantVent=instances(boxGeometry,basic('#3d627b'),5,plant);for(let i=0;i<5;i++)putBox(plantVent,i,[-.4+i*.11,.29,-.751],[.04,.25,.014]);plantVent.instanceMatrix.needsUpdate=true;

  const terminals=instances(boxGeometry,basic('#ffffff'),5,trace);
  const terminalColors=['#ffcf53','#4ce7f1','#7bafff','#b29bff','#7cf6a7'];terminalColors.forEach((c,i)=>terminals.setColorAt(i,new THREE.Color(c)));
  const ahuOutline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.3,.4,.63)),new THREE.LineBasicMaterial({color:'#a8f5ff',toneMapped:false}));ahuOutline.name='Selected AHU';ahuOutline.userData.area='model';ahuOutline.userData.mepTarget='ahu';trace.add(ahuOutline);
  const pulseMaterial=basic('#ffffff');pulseMaterial.transparent=true;pulseMaterial.depthTest=false;pulseMaterial.depthWrite=false;
  const pulses=instances(dotGeometry,pulseMaterial,18,trace);pulses.renderOrder=60;
  const pulseColors=new THREE.Color();routes.forEach((r,j)=>{pulseColors.set(r===returnWater?'#e0d5ff':r===returnAir?'#d3edf2':colors[r.id]);for(let i=0;i<3;i++)pulses.setColorAt(j*3+i,pulseColors);});

  // The challenge uses exactly the same bounds and routes as its pure geometry evaluator.
  const ductMaterial=new THREE.MeshStandardMaterial({color:'#46cbdc',emissive:'#126576',emissiveIntensity:.35,roughness:.4,metalness:.3});
  const duct=instances(boxGeometry,ductMaterial,1,bay);duct.name='Fixed ventilation duct';
  const envelopeMaterial=new THREE.MeshBasicMaterial({color:'#f6bd64',transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const envelope=new THREE.Mesh(boxGeometry,envelopeMaterial);envelope.name='Required service access envelope';envelope.userData.area='model';bay.add(envelope);
  const envelopeEdges=new THREE.LineSegments(new THREE.EdgesGeometry(boxGeometry),new THREE.LineBasicMaterial({color:'#ffc56f',transparent:true,opacity:.9,toneMapped:false}));envelope.add(envelopeEdges);
  const tray=instances(boxGeometry,basic('#ff8982'),12,bay);tray.name='Cable tray route';
  const trayEdges=instances(boxGeometry,basic('#fff2bd'),24,bay);trayEdges.name='Cable tray raised edges';
  const bayFrame=instances(boxGeometry,basic('#4b6a82'),8,bay);bayFrame.name='Coordination study boundary';
  const clashMarker=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),basic('#ff7770'));clashMarker.name='Constraint intersection';clashMarker.userData.area='model';bay.add(clashMarker);
  const tracePoint=new THREE.Vector3();
  const traceAnchor={position:new THREE.Vector3(6.9,8.3,8.5),target:new THREE.Vector3(.7,4.6,.35)};
  const challengeAnchor={position:new THREE.Vector3(4.1,6,6.7),target:new THREE.Vector3(.4,5,1.5)};
  let elapsed=0,lastRoof=NaN,lastFloor=NaN,lastRoute='',lastActive=null;

  function boundsDimensions(bounds){return {center:bounds.min.map((n,i)=>(n+bounds.max[i])*.5),size:bounds.min.map((n,i)=>bounds.max[i]-n)};}
  function setupBay(){
    const d=boundsDimensions(CHALLENGE_GEOMETRY.duct),a=boundsDimensions(CHALLENGE_GEOMETRY.access);
    putBox(duct,0,d.center,d.size);duct.instanceMatrix.needsUpdate=true;
    envelope.position.set(...a.center);envelope.scale.set(...a.size);
    // Boundary rails sit outside the route options and do not represent structural obstructions.
    const rails=[[[0,.18,-.68],[2.3,.012,.012]],[[0,.18,1.05],[2.3,.012,.012]],[[-1.15,.18,.185],[.012,.012,1.73]],[[1.15,.18,.185],[.012,.012,1.73]],
      [[-1.15,.7,-.68],[.012,1.04,.012]],[[1.15,.7,-.68],[.012,1.04,.012]],[[-1.15,.7,1.05],[.012,1.04,.012]],[[1.15,.7,1.05],[.012,1.04,.012]]];
    rails.forEach(([p,s],i)=>putBox(bayFrame,i,p,s));bayFrame.instanceMatrix.needsUpdate=true;
  }
  setupBay();

  function updateLayout(){
    const y=roof.position.y,f=floors[2].position.y;
    // Reveal easing asymptotically approaches its target. Ignore sub-pixel changes so
    // the settled studio does not keep rebuilding paths or uploading instance buffers.
    if(Math.abs(lastRoof-y)<.0001&&Math.abs(lastFloor-f)<.0001)return;
    lastRoof=y;lastFloor=f;plant.position.y=y;bay.position.set(.4,f+.5,.7);
    setRoute(power,[[1.95,.32,-1.2],[2.13,.32,-1.34],[2.13,y+.18,-1.34],[2.13,y+.18,-.65],[1.7,y+.18,-.65],[1.7,y+.25,-.74]]);
    setRoute(air,[[1.88,y+.25,-1.32],[2.41,y+.25,-1.32],[2.41,f+.89,-1.32],[1.9,f+.89,-1.32],[1.9,f+.89,-.4],[-.05,f+.89,-.4],[-.05,f+.89,.9],[-.05,f+.78,.9]]);
    setRoute(returnAir,[[-1.55,f+.775,-1.35],[-1.55,f+.86,-1.35],[1.88,f+.86,-1.35],[1.88,f+.86,-1.25],[1.88,y+.22,-1.25],[1.88,y+.22,-1.48],[1.02,y+.22,-1.48],[1.02,y+.22,-1.30]]);
    setRoute(supply,[[.13,y+.25,-.85],[.34,y+.25,-.85],[.34,y+.25,-.5],[.67,y+.25,-.5],[.67,y+.25,-.74]]);
    setRoute(returnWater,[[.67,y+.32,-.74],[.67,y+.32,-.6],[.24,y+.32,-.6],[.24,y+.32,-1.08],[.13,y+.32,-1.08]]);
    setRoute(control,[[2.05,y+.28,-.264],[2.05,y+.28,-.48],[1.94,y+.28,-.48],[1.94,y+.28,-.76],[1.84,y+.28,-.76]]);
    putBox(terminals,0,[1.95,.32,-1.2],[.12,.22,.12]);putBox(terminals,1,[-.05,f+.78,.9],[.19,.035,.19]);putBox(terminals,2,[.13,y+.25,-.85],[.06,.06,.06]);putBox(terminals,3,[.13,y+.32,-1.08],[.06,.06,.06]);putBox(terminals,4,[2.05,y+.28,-.264],[.13,.06,.03]);terminals.instanceMatrix.needsUpdate=true;
    ahuOutline.position.set(1.25,y+.28,-1.02);
    world.set(1.25,y+.67,-1.02);root.updateWorldMatrix(true,false);tracePoint.copy(world).applyMatrix4(root.matrixWorld);
  }
  function updateBayRoute(id){
    if(lastRoute===id)return;lastRoute=id;
    const coords=CHALLENGE_GEOMETRY.routes[id]||CHALLENGE_GEOMETRY.routes.existing;
    const points=coords.map(v=>new THREE.Vector3(...v));
    for(let i=1;i<points.length;i++){
      segment(tray,i-1,points[i-1],points[i],.09,.07);
      // Small light edges follow the selected tray; all options stay single-instanced draws.
      const a=points[i-1],b=points[i];segment(trayEdges,(i-1)*2,a,b,.014,.012);matrix.elements[13]+=.028;trayEdges.setMatrixAt((i-1)*2,matrix);
      segment(trayEdges,(i-1)*2+1,a,b,.014,.012);matrix.elements[13]-=.028;trayEdges.setMatrixAt((i-1)*2+1,matrix);
    }
    tray.count=points.length-1;trayEdges.count=(points.length-1)*2;tray.instanceMatrix.needsUpdate=true;trayEdges.instanceMatrix.needsUpdate=true;
    tray.userData.routeChoice=id;trayEdges.userData.routeChoice=id;tray.material.color.set(id==='bypass'?'#8cf1bb':id==='lower'?'#ffca71':'#ff8982');
    envelopeMaterial.color.set(id==='lower'?'#ff8070':'#f6bd64');envelopeEdges.material.color.copy(envelopeMaterial.color);
    clashMarker.visible=id!=='bypass';clashMarker.position.set(0,id==='lower'?.49:.81,0);
  }
  function pointAlong(item,phase,out){let distance=phase*item.length;for(let i=0;i<item.lengths.length;i++){const length=item.lengths[i];if(distance<=length||i===item.lengths.length-1)return out.lerpVectors(item.points[i],item.points[i+1],Math.min(1,distance/Math.max(.0001,length)));distance-=length;}return out.copy(item.points[0]);}
  function update(t,dt,state={}){
    const inModel=state.area===undefined||state.area==='model',tracing=inModel&&state.modelMode==='trace',challenging=inModel&&state.modelMode==='challenge';trace.visible=tracing;bay.visible=challenging;
    plant.visible=state.layer==='all'||!state.layer||state.layer==='hvac'||tracing;
    updateLayout();if(challenging)updateBayRoute(state.challengeRoute||'existing');
    if(!tracing)return;
    const active=state.traceSystem||'all',on=state.power!==false;
    if(active!==lastActive){
      lastActive=active;let count=0;
      for(const item of routes){
        const selected=active==='all'||active===item.id;
        item.mesh.material.color.set(item===returnWater?'#b29bff':item===returnAir?'#8fb8c8':colors[item.id]).multiplyScalar(selected?1:.12);
        item.mesh.material.opacity=selected?1:.32;item.mesh.material.depthTest=!selected;item.mesh.renderOrder=selected?50:2;
        if(selected){pulseColors.set(item===returnWater?'#e0d5ff':item===returnAir?'#d3edf2':colors[item.id]);for(let i=0;i<3;i++)pulses.setColorAt(count++,pulseColors);}
      }
      pulses.count=count;if(pulses.instanceColor)pulses.instanceColor.needsUpdate=true;
    }
    if(state.motion!==false&&on)elapsed+=Math.max(0,dt);
    pulses.visible=on;
    if(on){let count=0;for(let j=0;j<routes.length;j++){const item=routes[j];if(active!=='all'&&active!==item.id)continue;for(let i=0;i<3;i++){pointAlong(item,(elapsed*.16+i/3)%1,pulsePosition);scale.setScalar(.039);matrix.compose(pulsePosition,identity,scale);pulses.setMatrixAt(count++,matrix);}}pulses.instanceMatrix.needsUpdate=true;}
  }
  update(0,0,{});
  return {traceAnchor,challengeAnchor,tracePoint,update,trace,bay,plant,routes,pulses,duct,envelope,tray,debug:{geometry:CHALLENGE_GEOMETRY,maxTraceDraws:9,maxChallengeDraws:7,additionalShadowCasters:0}};
}
