export function createMeter(renderer){
 const enabled=new URLSearchParams(location.search).has('perf');if(!enabled)return()=>{};
 const output=document.createElement('output');output.id='perf-meter';output.style.cssText='position:fixed;z-index:999;top:100px;left:40px;padding:10px 14px;background:#071724e8;color:#b8ecff;font:12px monospace;border:1px solid #6bb9d4;border-radius:7px;pointer-events:none';document.body.append(output);
 renderer.info.autoReset=false;let start=performance.now(),last=start,shown=start,samples=[];
 return()=>{const now=performance.now(),dt=now-last;last=now;if(now-start>3000&&dt<500&&!document.hidden)samples.push(dt);if(samples.length>360)samples.shift();if(now-shown>1000){shown=now;const avg=samples.reduce((a,b)=>a+b,0)/(samples.length||1),sorted=[...samples].sort((a,b)=>a-b),p95=sorted[Math.floor(sorted.length*.95)]||0;output.textContent=samples.length?`${(1000/avg).toFixed(1)} FPS · ${avg.toFixed(1)} ms avg / ${p95.toFixed(1)} p95 · ${renderer.info.render.calls} draws · DPR ${renderer.getPixelRatio().toFixed(2)}`:'Measuring…';}renderer.info.reset();};
}
