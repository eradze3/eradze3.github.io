/** Quiet, synthesized interaction sounds. No recording, media download or autoplay. */
export function createInteractiveAudio({onStateChange=()=>{}}={}) {
  let context=null,master=null,ambient=null,enabled=false,volume=.36,disposed=false,manuallySuspended=false,revision=0;
  let ambience={active:false,period:'startup',faultActive:false,type:'office'};
  const voices=new Set(),lastPlayed=new Map();
  const hidden=()=>typeof document!=='undefined'&&document.hidden;
  const available=()=>typeof window!=='undefined'&&!!(window.AudioContext||window.webkitAudioContext);
  const signal=()=>onStateChange({enabled,volume,available:available(),suspended:!context||context.state!=='running'});
  function ramp(param,value,seconds=.12){if(!context)return;const t=context.currentTime;param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(value,t+seconds);}
  function stopAmbient(){if(!ambient)return;for(const source of ambient.sources){try{source.stop();}catch{}source.disconnect();}for(const node of ambient.nodes)node.disconnect();ambient=null;}
  function stopVoices(){for(const voice of [...voices]){try{voice.osc.stop();}catch{}voice.osc.disconnect();voice.gain.disconnect();voices.delete(voice);}}
  function ensureContext(){
    if(context)return true;if(disposed||!available())return false;
    try{const AudioContext=window.AudioContext||window.webkitAudioContext;context=new AudioContext({latencyHint:'interactive'});master=context.createGain();master.gain.value=0;master.connect(context.destination);context.onstatechange=signal;return true;}catch{context=null;master=null;return false;}
  }
  function updateAmbience(){
    if(!context||!enabled||hidden()||manuallySuspended||!ambience.active){stopAmbient();return;}
    if(!ambient){
      const hum=context.createOscillator(),overtone=context.createOscillator(),noise=context.createBufferSource();
      const humGain=context.createGain(),overtoneGain=context.createGain(),noiseGain=context.createGain(),filter=context.createBiquadFilter();
      hum.type='sine';overtone.type='sine';humGain.gain.value=0;overtoneGain.gain.value=0;noiseGain.gain.value=0;
      const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);let seed=9173,last=0;
      for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;last=(last+.025*((seed/2147483647)*2-1))/1.025;data[i]=last*3;}
      noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=650;filter.Q.value=.35;
      hum.connect(humGain).connect(master);overtone.connect(overtoneGain).connect(master);noise.connect(filter).connect(noiseGain).connect(master);
      ambient={sources:[hum,overtone,noise],nodes:[humGain,overtoneGain,noiseGain,filter],hum,overtone,humGain,overtoneGain,noiseGain,filter};
      hum.start();overtone.start();noise.start();
    }
    const server=ambience.type==='datacentre',night=ambience.period==='night',busy=ambience.period==='busy';
    const demand=server?1:night?.24:busy?1:.62;
    ramp(ambient.hum.frequency,server?86:ambience.type==='warehouse'?58:64,.5);
    ramp(ambient.overtone.frequency,server?172:128,.5);
    ramp(ambient.filter.frequency,server?840:busy?620:400,.5);
    // A closed branch does not silence the upstream fan: its hum remains present.
    ramp(ambient.humGain.gain,.025*demand,.4);ramp(ambient.overtoneGain.gain,(server?.010:.005)*demand,.4);
    ramp(ambient.noiseGain.gain,(ambience.faultActive?.025:.055)*demand,.4);
  }
  async function setEnabled(value){
    if(disposed)return false;const version=++revision;enabled=!!value;manuallySuspended=false;
    if(!enabled){stopAmbient();stopVoices();if(context){ramp(master.gain,0,.035);try{await context.suspend();}catch{}}signal();return false;}
    if(!ensureContext()){enabled=false;signal();return false;}
    if(!hidden()){try{await context.resume();if(version!==revision||disposed)return enabled;if(hidden()||manuallySuspended){await context.suspend();return enabled;}ramp(master.gain,volume,.06);updateAmbience();}catch{if(version===revision)enabled=false;}}
    signal();return enabled;
  }
  function tone(frequency,start,duration,level=.12,type='sine',endFrequency=null){
    if(voices.size>=8)return;const osc=context.createOscillator(),gain=context.createGain(),t=context.currentTime+start;
    osc.type=type;osc.frequency.setValueAtTime(frequency,t);if(endFrequency)osc.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(level,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain).connect(master);const voice={osc,gain};voices.add(voice);osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(voice);};osc.start(t);osc.stop(t+duration+.015);
  }
  function play(kind='select'){
    if(disposed||!enabled||hidden()||manuallySuspended||!context||context.state!=='running')return false;
    const t=context.currentTime,minGap=kind==='step'?.26:kind==='select'?.075:kind==='fault'?1.2:.16;
    if(t-(lastPlayed.get(kind)??-Infinity)<minGap)return false;lastPlayed.set(kind,t);
    switch(kind){
      case 'enter':tone(220,0,.32,.10);tone(330,.06,.28,.07);tone(440,.13,.25,.045);break;
      case 'inspect':tone(392,0,.12,.09);tone(523.25,.055,.15,.055);break;
      case 'fault':tone(293.66,0,.22,.085);tone(220,.15,.24,.07);break;
      case 'success':tone(329.63,0,.2,.085);tone(440,.09,.22,.07);tone(659.25,.18,.30,.055);break;
      case 'export':tone(440,0,.12,.075);tone(587.33,.07,.18,.065);break;
      case 'step':tone(100,0,.065,.04,'triangle',65);break;
      default:tone(720,0,.055,.065,'sine',430);
    }
    return true;
  }
  function setAmbience(next={}){ambience={...ambience,...next};updateAmbience();}
  function setVolume(value){const n=Number(value);if(!Number.isFinite(n))return;volume=Math.max(0,Math.min(1,n));if(context&&enabled)ramp(master.gain,volume,.08);signal();}
  async function suspend(){revision++;manuallySuspended=true;stopAmbient();stopVoices();if(context)try{await context.suspend();}catch{}signal();}
  async function resume(){const version=++revision;manuallySuspended=false;if(!enabled||hidden()||disposed||!context)return;try{await context.resume();if(version!==revision||disposed)return;if(hidden()||!enabled){await context.suspend();return;}ramp(master.gain,volume,.08);updateAmbience();}catch{}signal();}
  async function visibilityChanged(){if(!context)return;if(hidden()){stopAmbient();stopVoices();try{await context.suspend();}catch{}}else if(enabled&&!manuallySuspended){try{await context.resume();updateAmbience();}catch{}}signal();}
  if(typeof document!=='undefined')document.addEventListener('visibilitychange',visibilityChanged);
  function dispose(){if(disposed)return;revision++;disposed=true;enabled=false;stopAmbient();stopVoices();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibilityChanged);if(context){context.onstatechange=null;context.close().catch(()=>{});}context=null;master=null;}
  return {setEnabled,play,setAmbience,setVolume,suspend,resume,dispose,get enabled(){return enabled;},get volume(){return volume;},get available(){return available();}};
}
