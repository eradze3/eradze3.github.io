/** A short personal introduction with a controllable, deterministic timeline. */
export const TOUR_STEPS = Object.freeze([
  {id:'intro',area:'studio',title:'Meet Giorgi Eradze.',caption:'Technical Director at Layout, based in Tbilisi. My work connects multidisciplinary MEP engineering, team leadership and digital tools.'},
  {id:'connections',area:'model',modelMode:'trace',traceSystem:'all',title:'See the complete MEP picture.',caption:'Electrical and ELV specialisms sit within a wider understanding of HVAC, plumbing and BMS. Follow the AHU connections through this illustrative model.'},
  {id:'challenge',area:'model',modelMode:'challenge',challengeRoute:'existing',title:'Look beyond the first clash.',caption:'A route can clear a duct and still block access. This coordination exercise explores why engineering decisions need the wider context.'},
  {id:'lab',area:'digital',digitalTab:'actions',title:'Turn information into action.',caption:'Digital work includes LAYOUT OS, currently in testing, and practical automation. Try the working notes-to-action-register tool in the digital lab.'},
  {id:'leadership',area:'wall',wallTopic:1,title:'Connect the people behind the work.',caption:'Giorgi’s approach brings disciplines, ownership and review together. Explore his background, download the CV, or start a conversation.'}
].map((step,index)=>Object.freeze({...step,index,duration:12})));

/** Pure timeline used by both the widget and regression tests. */
export function createTourSequence({onStep=()=>{},onFinish=()=>{},onExit=()=>{},reducedMotion=false}={}) {
  let active=false,paused=false,index=0,elapsed=0;
  const notifyStep=()=>onStep(TOUR_STEPS[index]);
  function stop(){active=false;paused=false;}
  function finish(){if(!active)return;stop();elapsed=TOUR_STEPS[index].duration;onFinish();}
  function next(){if(!active)return;if(index===TOUR_STEPS.length-1){finish();return;}index++;elapsed=0;notifyStep();}
  function previous(){if(!active||index===0)return;index--;elapsed=0;notifyStep();}
  return {
    start(){active=true;paused=!!reducedMotion;index=0;elapsed=0;notifyStep();},
    stop,
    next,
    previous,
    exit(){if(!active)return;stop();onExit();},
    pause(){if(active)paused=true;},
    resume(){if(active)paused=false;},
    tick(dt){
      if(!active||paused||!Number.isFinite(dt)||dt<=0)return;
      let remaining=dt;
      while(active&&remaining>0){
        const needed=TOUR_STEPS[index].duration-elapsed;
        if(remaining<needed){elapsed+=remaining;return;}
        remaining-=needed;next();
        // A callback may deliberately pause or stop the tour at a destination.
        if(paused)return;
      }
    },
    get active(){return active;},
    get paused(){return paused;},
    get index(){return index;},
    get elapsed(){return elapsed;},
    get progress(){return (index*12+elapsed)/60;},
    get remaining(){return Math.max(0,Math.ceil(60-(index*12+elapsed)));}
  };
}

export function createGuidedTour({host,onStep=()=>{},onFinish=()=>{},onExit=()=>{},reducedMotion=false}) {
  if(!host)throw new TypeError('The guided tour needs a host element.');
  host.classList.add('guided-tour');
  host.setAttribute('role','region');
  host.setAttribute('aria-label','Meet Giorgi in 60 seconds');
  host.innerHTML=`
    <header class="guided-tour-heading"><span>MEET GIORGI / 60 SECONDS</span><button type="button" class="guided-end" aria-label="End guided tour">End ×</button></header>
    <div class="guided-tour-story" aria-live="polite" aria-atomic="true"><span class="guided-step-count"></span><h2 class="guided-step-title"></h2><p class="guided-step-caption"></p></div>
    <div class="guided-progress-track" role="progressbar" aria-label="Tour progress" aria-valuemin="0" aria-valuemax="100"><span class="guided-progress-fill"></span></div>
    <div class="guided-tour-controls"><button type="button" class="guided-previous" aria-label="Previous tour step">← Back</button><button type="button" class="guided-pause">Pause</button><button type="button" class="guided-next" aria-label="Next tour step">Next →</button><span class="guided-time" aria-hidden="true"></span></div>`;
  const find=selector=>host.querySelector(selector);
  const title=find('.guided-step-title'),caption=find('.guided-step-caption'),counter=find('.guided-step-count');
  const previous=find('.guided-previous'),pause=find('.guided-pause'),next=find('.guided-next'),end=find('.guided-end');
  const track=find('.guided-progress-track'),fill=find('.guided-progress-fill'),time=find('.guided-time');
  let lastProgress=-1,renderElapsed=0,sequence;
  function renderProgress(force=false){
    const percent=Math.round(sequence.progress*1000)/10;
    if(force||percent!==lastProgress){fill.style.transform=`scaleX(${sequence.progress})`;track.setAttribute('aria-valuenow',String(Math.round(percent)));time.textContent=sequence.paused?'Paused':`${sequence.remaining}s`;lastProgress=percent;}
  }
  function renderControls(){
    host.hidden=!sequence.active;host.dataset.paused=String(sequence.paused);
    previous.disabled=sequence.index===0;
    pause.textContent=sequence.paused?'Play ▷':'Pause Ⅱ';pause.setAttribute('aria-label',sequence.paused?'Play guided tour':'Pause guided tour');
    next.textContent=sequence.index===TOUR_STEPS.length-1?'Finish ↗':'Next →';next.setAttribute('aria-label',sequence.index===TOUR_STEPS.length-1?'Finish guided tour':'Next tour step');
    renderProgress(true);
  }
  sequence=createTourSequence({
    reducedMotion,
    onStep(step){counter.textContent=`0${step.index+1} / 05`;title.textContent=step.title;caption.textContent=step.caption;renderControls();onStep(step);},
    onFinish(){host.hidden=true;onFinish();},
    onExit(){host.hidden=true;onExit();}
  });
  previous.onclick=()=>{sequence.previous();renderControls();};
  next.onclick=()=>{sequence.next();renderControls();};
  pause.onclick=()=>{if(sequence.paused)sequence.resume();else sequence.pause();renderControls();};
  end.onclick=()=>{sequence.exit();renderControls();};
  host.hidden=true;
  return {
    start(){renderElapsed=0;lastProgress=-1;sequence.start();renderControls();},
    stop(){sequence.stop();host.hidden=true;},
    pause(){sequence.pause();renderControls();},
    resume(){sequence.resume();renderControls();},
    next(){sequence.next();renderControls();},
    previous(){sequence.previous();renderControls();},
    tick(dt){if(!sequence.active)return;sequence.tick(dt);renderElapsed+=Math.max(0,Number.isFinite(dt)?dt:0);if(renderElapsed>=.1){renderElapsed=0;renderProgress();}},
    get active(){return sequence.active;},
    get paused(){return sequence.paused;},
    get index(){return sequence.index;}
  };
}
