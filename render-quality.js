// Resolution ceilings keep large/high-DPI screens from silently forcing 4K work.
export function qualityRatio(mode,width,height,dpr=1,maxTexture=8192){
 width=Math.max(1,width);height=Math.max(1,height);dpr=Math.max(.1,dpr);
 const pixels=width*height,hardware=Math.min(maxTexture/width,maxTexture/height);
 const budget=mode==='ultra'?3840*2160:mode==='qhd'?2560*1440:mode==='smooth'?1280*720:1920*1080;
 return Math.min(Math.sqrt(budget/pixels),hardware,mode==='ultra'?Infinity:dpr);
}
export function createQuality(renderer,onResize){
 const select=document.getElementById('render-quality'),output=document.getElementById('quality-resolution');
 let mode='fhd';try{mode=localStorage.getItem('studio-quality-v3')||'fhd';}catch{}
 if(!['fhd','qhd','ultra','auto','smooth'].includes(mode))mode='fhd';select.value=mode;
 let ratio=1,start=performance.now(),samples=[],last=start,lastChange=start;
 const target=()=>qualityRatio(mode,innerWidth,innerHeight,devicePixelRatio,renderer.capabilities.maxTextureSize);
 function describe(){const canvas=renderer.domElement;output.textContent=`Rendering ${canvas.width.toLocaleString()} × ${canvas.height.toLocaleString()} pixels`;}
 function apply(){ratio=target();renderer.setPixelRatio(ratio);onResize();describe();samples=[];lastChange=performance.now();}
 select.onchange=()=>{mode=select.value;try{localStorage.setItem('studio-quality-v3',mode);}catch{}apply();};
 addEventListener('resize',apply);apply();
 return()=>{if(mode!=='auto')return;const now=performance.now(),dt=now-last;last=now;if(document.hidden||now-start<3500||dt>250)return;samples.push(dt);if(samples.length<90||now-lastChange<4000)return;const average=samples.reduce((a,b)=>a+b,0)/samples.length;samples=[];
  const ceiling=target(),floor=ceiling*.55;
  if(average>27&&ratio>floor+.001){ratio=Math.max(floor,ratio*.85);renderer.setPixelRatio(ratio);onResize();describe();lastChange=now;}
  else if(average<18&&ratio<ceiling&&now-lastChange>8000){ratio=Math.min(ceiling,ratio*1.15);renderer.setPixelRatio(ratio);onResize();describe();lastChange=now;}
 };
}
