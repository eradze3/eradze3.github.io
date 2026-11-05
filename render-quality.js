// Pixel budgets preserve aspect ratio on wide and high-DPI displays.
export function qualityRatio(mode,width,height,dpr=1,maxTexture=8192){
 width=Math.max(1,width);height=Math.max(1,height);dpr=Math.max(.1,dpr);
 const pixels=width*height,hardware=Math.min(maxTexture/width,maxTexture/height);
 const budget=mode==='ultra'?3840*2160:mode==='qhd'?2560*1440:mode==='smooth'?1280*720:1920*1080;
 return Math.min(Math.sqrt(budget/pixels),hardware,mode==='ultra'?Infinity:dpr);
}
// Constant-memory frame sampling. Long pauses and shader warm-up do not count
// as slow rendering. Upshifts need more sustained headroom than downshifts.
export function createAdaptiveQuality(ceiling,now=0){
 let ratio=ceiling,last=now,lastChange=now,warmUntil=now+2500;
 let count=0,total=0,slow=0,windowStart=now,fastWindows=0;
 function clear(at){count=0;total=0;slow=0;windowStart=at;}
 function resume(at){last=at;warmUntil=at+750;fastWindows=0;clear(at);}
 return {
  get ratio(){return ratio;},
  get ceiling(){return ceiling;},
  reset(nextCeiling,at,{preserveScale=false}={}){
   const scale=preserveScale?ratio/ceiling:1;
   ceiling=nextCeiling;ratio=ceiling*Math.max(.55,Math.min(1,scale));
   lastChange=at;resume(at);return ratio;
  },
  resume,
  sample(at,hidden=false){
   const dt=at-last;last=at;
   if(hidden||dt>250||dt<=0){resume(at);return null;}
   if(at<warmUntil)return null;
   count++;total+=dt;if(dt>25)slow++;
   if(count<60||at-windowStart<1800)return null;
   const mean=total/count,slowFraction=slow/count;
   clear(at);
   const floor=ceiling*.55;
   if(mean>19.5||slowFraction>.3){
    fastWindows=0;
    if(at-lastChange>=3500&&ratio>floor+.001){
     ratio=Math.max(floor,ratio*.85);lastChange=at;return ratio;
    }
   }else if(mean<16.5&&slowFraction<.08){
    fastWindows++;
    if(fastWindows>=3&&at-lastChange>=10000&&ratio<ceiling-.001){
     ratio=Math.min(ceiling,ratio*1.1);lastChange=at;fastWindows=0;return ratio;
    }
   }else fastWindows=0;
   return null;
  }
 };
}

export function createQuality(renderer,onResize){
 const select=document.getElementById('render-quality'),output=document.getElementById('quality-resolution');
 const valid=['fhd','qhd','ultra','auto','smooth'];
 // V1 wrote this key only when a visitor explicitly chose a quality setting.
 // Preserve that choice; new visitors receive the adaptive 1080p preset.
 let mode='auto';try{const saved=localStorage.getItem('studio-quality-v3');if(valid.includes(saved))mode=saved;}catch{}
 select.value=mode;
 const target=()=>qualityRatio(mode,innerWidth,innerHeight,devicePixelRatio,renderer.capabilities.maxTextureSize);
 const adaptive=createAdaptiveQuality(target(),performance.now());
 function apply(ratio){
  renderer.setPixelRatio(ratio);onResize();
  const canvas=renderer.domElement;
  output.textContent=`Rendering ${canvas.width.toLocaleString()} × ${canvas.height.toLocaleString()} pixels${mode==='auto'?' · automatic':''}`;
 }
 select.onchange=()=>{
  mode=valid.includes(select.value)?select.value:'auto';select.value=mode;
  try{localStorage.setItem('studio-quality-v3',mode);}catch{}
  apply(adaptive.reset(target(),performance.now()));
 };
 addEventListener('resize',()=>apply(adaptive.reset(target(),performance.now(),{preserveScale:mode==='auto'})));
 document.addEventListener('visibilitychange',()=>adaptive.resume(performance.now()));
 apply(adaptive.ratio);
 return()=>{
  if(mode!=='auto')return;
  const ratio=adaptive.sample(performance.now(),document.hidden);
  if(ratio!==null)apply(ratio);
 };
}
