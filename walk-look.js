// Desktop free look uses pointer lock where available, with hover-look fallback.
// Touch keeps a deliberate drag gesture so users can still tap destinations.
export function createWalkLook(canvas,{onMove,onChange,onError}){
 let enabled=false,paused=false,previous=null;
 let generation=0,pending=null,wantsLock=false,hadLock=false;
 const fine=()=>matchMedia('(pointer:fine)').matches;
 const locked=()=>document.pointerLockElement===canvas;
 function notify(){onChange({enabled,paused,locked:locked()});}
 function release(){hadLock=false;previous=null;if(locked())document.exitPointerLock();}
 function cancelRequest(){generation++;pending=null;wantsLock=false;}
 function fallback(token){
  // Promise rejections can arrive after Esc, an area change, or another resume.
  // They must never revive a paused session or cancel a newer request.
  if(token!==generation||pending!==token||!enabled||paused)return;
  pending=null;wantsLock=false;previous=null;notify();onError?.();
 }
 function resume(capture=true){
  const token=++generation;
  enabled=true;paused=false;previous=null;pending=null;
  wantsLock=!!(capture&&fine()&&canvas.requestPointerLock);
  if(!wantsLock){release();notify();return;}
  if(locked()){hadLock=true;notify();return;}
  pending=token;notify();
  try{const request=canvas.requestPointerLock();if(request?.catch)request.catch(()=>fallback(token));}
  catch{fallback(token);}
 }
 function pause(){cancelRequest();paused=true;release();notify();}
 function disable(){cancelRequest();enabled=false;paused=false;release();notify();}
 function move(dx,dy){if(enabled&&!paused)onMove(dx,dy);}
 document.addEventListener('mousemove',e=>{if(enabled&&!paused&&locked())move(e.movementX,e.movementY);});
 canvas.addEventListener('pointerenter',e=>{previous={x:e.clientX,y:e.clientY};});
 canvas.addEventListener('pointerleave',()=>{previous=null;});
 canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||locked()||!enabled||paused)return;if(previous){const dx=e.clientX-previous.x,dy=e.clientY-previous.y;if(Math.abs(dx)<200&&Math.abs(dy)<200)move(dx,dy);}previous={x:e.clientX,y:e.clientY};});
 document.addEventListener('pointerlockchange',()=>{
  previous=null;
  if(locked()){
   // A successful request can also complete after its intent was cancelled.
   if(!enabled||paused||!wantsLock){release();notify();return;}
   hadLock=true;pending=null;
  }else{
   const lostActiveLock=hadLock;hadLock=false;
   if(lostActiveLock&&enabled){cancelRequest();paused=true;}
  }
  notify();
 });
 document.addEventListener('pointerlockerror',()=>{if(pending!==null)fallback(pending);});
 window.addEventListener('blur',()=>{if(enabled)pause();});
 return{resume,pause,disable,move,get paused(){return paused;},get locked(){return locked();}};
}
