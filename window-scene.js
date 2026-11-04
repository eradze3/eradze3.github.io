import * as THREE from './vendor/three.module.js';

/** A small, real-depth interpretation of Mtatsminda at blue hour.
 * The aperture writes stencil after the interior, so the exterior can never
 * spill around the open-sided studio. No image is used as a substitute for depth.
 */
export function createWindowScene(scene) {
  const root=new THREE.Group();root.name='Tbilisi window / depth exterior';scene.add(root);
  const stencil={stencilWrite:true,stencilRef:1,stencilFunc:THREE.EqualStencilFunc,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp,stencilZPass:THREE.KeepStencilOp};
  const material=(color,extra={})=>new THREE.MeshBasicMaterial({color,fog:false,toneMapped:false,...stencil,...extra});
  function add(geometry,mat,name,order=52){const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;mesh.renderOrder=order;mesh.castShadow=mesh.receiveShadow=false;root.add(mesh);return mesh;}
  function instances(geometry,mat,count,name,order=54){const mesh=new THREE.InstancedMesh(geometry,mat,count);mesh.name=name;mesh.renderOrder=order;mesh.castShadow=mesh.receiveShadow=false;root.add(mesh);return mesh;}
  const aperture=add(new THREE.PlaneGeometry(6,5.4),new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false,depthTest:true,fog:false,stencilWrite:true,stencilRef:1,stencilFunc:THREE.AlwaysStencilFunc,stencilFail:THREE.KeepStencilOp,stencilZFail:THREE.KeepStencilOp,stencilZPass:THREE.ReplaceStencilOp}),'Window stencil aperture',50);
  aperture.position.set(1,3.7,-7.72);

  // Bake seamless cloud detail once. Three inexpensive texture samples replace
  // per-pixel fractal noise; the distant terrain still supplies the real depth.
  const noiseSize=256,noiseData=new Uint8Array(noiseSize*noiseSize);
  function hash(x,y,period){x=((x%period)+period)%period;y=((y%period)+period)%period;const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
  function smoothNoise(x,y,period){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy,period),hash(ix+1,iy,period),u),THREE.MathUtils.lerp(hash(ix,iy+1,period),hash(ix+1,iy+1,period),u),v);}
  for(let y=0;y<noiseSize;y++)for(let x=0;x<noiseSize;x++){let value=0,amplitude=.53;for(let octave=0;octave<5;octave++){const frequency=4*(2**octave);value+=amplitude*smoothNoise(x/noiseSize*frequency,y/noiseSize*frequency,frequency);amplitude*=.5;}noiseData[y*noiseSize+x]=Math.round(value*255);}
  const cloudNoise=new THREE.DataTexture(noiseData,noiseSize,noiseSize,THREE.RedFormat);cloudNoise.wrapS=cloudNoise.wrapT=THREE.RepeatWrapping;cloudNoise.magFilter=THREE.LinearFilter;cloudNoise.minFilter=THREE.LinearMipmapLinearFilter;cloudNoise.generateMipmaps=true;cloudNoise.needsUpdate=true;
  const skyMaterial=new THREE.ShaderMaterial({
    ...stencil,depthTest:true,depthWrite:false,toneMapped:false,fog:false,
    uniforms:{time:{value:0},cloudNoise:{value:cloudNoise},low:{value:new THREE.Color('#244d79')},high:{value:new THREE.Color('#0c203d')},cloud:{value:new THREE.Color('#617c9e')}},
    vertexShader:`varying vec2 worldXY;
      void main(){vec4 world=modelMatrix*vec4(position,1.);worldXY=world.xy;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform float time;uniform sampler2D cloudNoise;uniform vec3 low;uniform vec3 high;uniform vec3 cloud;varying vec2 worldXY;
      void main(){vec2 p=worldXY*vec2(.010,.022);float broad=texture2D(cloudNoise,p+vec2(time*.00013,0.)).r;float detail=texture2D(cloudNoise,p*1.93+vec2(time*.00021,.23)).r;float wisps=texture2D(cloudNoise,p*3.7+vec2(time*.00029,.61)).r;float density=broad*.63+detail*.25+wisps*.12;float horizon=clamp((worldXY.y+18.)/33.,0.,1.);vec3 color=mix(low,high,smoothstep(0.,1.,horizon));float cover=smoothstep(.36,.67,density);color=mix(color,cloud,cover*.78);gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`
  });
  const sky=add(new THREE.PlaneGeometry(1200,600),skyMaterial,'Blue-hour moving clouds',51);sky.position.set(-20,80,-210);

  const ridge=(x,phase=0)=>-14.9+10.9/(1+Math.exp(-(x+48)/13))+Math.sin(x*.052+phase)*.75+Math.sin(x*.17+phase)*.24;
  // Six strips create genuinely three-dimensional slopes; silhouettes at different
  // depths shift relative to the tower and city as visitors walk around the studio.
  function hill(name,z,baseColor,offset,phase,depth){
    const positions=[],colors=[],indices=[],nx=76,nz=6;
    const base=new THREE.Color(baseColor),shade=new THREE.Color();
    for(let row=0;row<=nz;row++)for(let col=0;col<=nx;col++){
      const x=-210+col/nx*350,t=row/nz;
      const y=ridge(x,phase)+offset-Math.pow(t,1.25)*31+Math.sin(x*.07+t*5)*t*.6;
      positions.push(x,y,z+t*depth);
      shade.copy(base).multiplyScalar(1-t*.26+Math.sin(x*.11+t*7)*.035);colors.push(shade.r,shade.g,shade.b);
      if(row<nz&&col<nx){const a=row*(nx+1)+col;indices.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeBoundingSphere();
    return add(geo,material('#ffffff',{vertexColors:true,side:THREE.DoubleSide}),name);
  }
  hill('Distant Caucasus-blue ridge',-132,'#233b56',-3,1.5,9);
  hill('Mtatsminda / tower ridge',-94,'#172e43',0,0,12);
  hill('Near wooded hillside',-64,'#0e2233',-7.5,2.4,15);

  // The slender tripod and stacked observation decks are geometry, not a cutout.
  const towerX=-22.5,towerZ=-94,towerBase=ridge(towerX)+.02,towerTop=towerBase+7.4;
  const towerMaterial=material('#7c96b1'),deckMaterial=material('#9ab0c3'),darkMaterial=material('#30465b');
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
  const struts=[];
  function beam(a,b,r){struts.push({a:new THREE.Vector3(...a),b:new THREE.Vector3(...b),r});}
  for(let leg=0;leg<3;leg++){
    const angle=leg*Math.PI*2/3;
    beam([towerX+Math.cos(angle)*.48,towerBase,towerZ+Math.sin(angle)*.48],[towerX+Math.cos(angle)*.11,towerBase+5.5,towerZ+Math.sin(angle)*.11],.047);
    for(let level=0;level<5;level++){
      const a=level/5,b=(level+1)/5,ra=.48*(1-a)+.11*a,rb=.48*(1-b)+.11*b,next=angle+Math.PI*2/3;
      beam([towerX+Math.cos(angle)*ra,towerBase+a*5.5,towerZ+Math.sin(angle)*ra],[towerX+Math.cos(next)*rb,towerBase+b*5.5,towerZ+Math.sin(next)*rb],.016);
    }
  }
  beam([towerX,towerBase+4.9,towerZ],[towerX,towerTop,towerZ],.027);
  const truss=instances(new THREE.CylinderGeometry(1,1,1,6),towerMaterial,struts.length,'TV tower / steel tripod');
  struts.forEach(({a,b,r},i)=>{dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());dummy.scale.set(r,a.distanceTo(b),r);dummy.updateMatrix();truss.setMatrixAt(i,dummy.matrix);});
  truss.instanceMatrix.needsUpdate=true;
  const decks=instances(new THREE.CylinderGeometry(1,1,1,20),deckMaterial,3,'TV tower / stacked transmission decks');
  [[4.15,.64,.15],[4.52,.49,.12],[5.24,.33,.12]].forEach(([height,radius,thickness],i)=>{dummy.position.set(towerX,towerBase+height,towerZ);dummy.quaternion.identity();dummy.scale.set(radius,thickness,radius);dummy.updateMatrix();decks.setMatrixAt(i,dummy.matrix);});
  const deckCore=add(new THREE.CylinderGeometry(.28,.35,.47,16),darkMaterial,'TV tower / enclosed observation floor',54);deckCore.position.set(towerX,towerBase+4.36,towerZ);
  const beaconMaterial=material('#ff7057');
  const beacons=instances(new THREE.SphereGeometry(1,8,5),beaconMaterial,3,'TV tower / aviation beacons',55);
  [3.87,5.6,7.4].forEach((h,i)=>{dummy.position.set(towerX,towerBase+h,towerZ+.075);dummy.scale.setScalar(i===2?.075:.055);dummy.quaternion.identity();dummy.updateMatrix();beacons.setMatrixAt(i,dummy.matrix);});

  // The low city lies in front of the hill. Building and window instances keep
  // the scene inexpensive while their separate depths supply visible parallax.
  let seed=91471;const random=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  const buildingData=[];
  for(let i=0;i<52;i++){
    const x=-59+random()*92,z=-29-random()*30,w=.65+random()*1.25,d=.6+random()*1.2,h=2.1+random()*3.4;
    buildingData.push({x,z,w,d,h,ground:-7.1-random()*.7});
  }
  const buildings=instances(new THREE.BoxGeometry(1,1,1),material('#ffffff'),buildingData.length,'Tbilisi / clustered city volumes');
  const litWindows=[],unlit=new THREE.Color(),litBase=new THREE.Color();
  buildingData.forEach((b,i)=>{
    dummy.position.set(b.x,b.ground+b.h/2,b.z);dummy.scale.set(b.w,b.h,b.d);dummy.quaternion.identity();dummy.updateMatrix();buildings.setMatrixAt(i,dummy.matrix);unlit.set('#172b3c').multiplyScalar(.75+random()*.5);buildings.setColorAt(i,unlit);
    for(let row=0;row<Math.floor(b.h/.47);row++)for(let col=0;col<Math.max(1,Math.floor(b.w/.35));col++)if(random()>.43){litBase.set(random()>.65?'#a1bfd3':'#e0b27b').multiplyScalar(.65+random()*.45);litWindows.push({x:b.x-b.w*.33+col*.33,y:b.ground+.34+row*.46,z:b.z+b.d*.5+.012,color:litBase.clone(),phase:random()*6.28});}
  });
  const lights=instances(new THREE.PlaneGeometry(.095,.14),material('#ffffff'),litWindows.length,'Tbilisi / small lit windows',55);
  litWindows.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.setScalar(1);dummy.quaternion.identity();dummy.updateMatrix();lights.setMatrixAt(i,dummy.matrix);lights.setColorAt(i,p.color);});
  // A few distant lights follow the hill's lower contours, behind the city roofs.
  const hillsideLights=instances(new THREE.PlaneGeometry(.07,.065),material('#9baec0'),90,'Mtatsminda / distant hillside lights',55);
  for(let i=0;i<90;i++){const x=-73+random()*93,z=-66-random()*19;dummy.position.set(x,ridge(x)-7-random()*4,z);dummy.scale.setScalar(.5+random()*.7);dummy.quaternion.identity();dummy.updateMatrix();hillsideLights.setMatrixAt(i,dummy.matrix);}

  let elapsed=0,lastLights=-1;
  function update(_t,dt,state={}){
    if(state.motion===false)return;
    elapsed+=Math.max(0,Math.min(.1,Number(dt)||0));skyMaterial.uniforms.time.value=elapsed;
    const pulse=.68+.32*Math.pow(.5+.5*Math.sin(elapsed*2.1),5);beaconMaterial.color.set('#ff7057').multiplyScalar(pulse);
    // Slow restrained variation, updated at 5 Hz; never flashes whole buildings.
    if(elapsed-lastLights>.2){litWindows.forEach((p,i)=>{unlit.copy(p.color).multiplyScalar(.95+.05*Math.sin(elapsed*.23+p.phase));lights.setColorAt(i,unlit);});lights.instanceColor.needsUpdate=true;lastLights=elapsed;}
  }
  root.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=o.receiveShadow=false;}});
  const metadata={kind:'stencil-clipped 3D artistic Tbilisi exterior',aperture:{center:[1,3.7,-7.72],size:[6,5.4]},depths:{sky:-210,hills:[-132,-94,-64],city:[-59,-29],tower:towerZ},tower:{base:[towerX,towerBase,towerZ],top:[towerX,towerTop,towerZ]},cloudTextureSize:noiseSize,cloudSamplesPerFragment:3,drawables:root.children.length,cityBuildings:buildingData.length,litWindows:litWindows.length};
  return {root,aperture,metadata,update,get elapsed(){return elapsed;}};
}
