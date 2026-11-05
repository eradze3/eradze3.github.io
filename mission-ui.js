import {MISSION_TYPES,MISSION_EVIDENCE,MISSION_DIAGNOSES} from './mission-engine.js';

/** The project-wall checkpoint. All simulation facts come from the mission engine. */
export function createMissionUI({host,mission,onEnter=()=>{},onWall=()=>{},onLab=()=>{},onSound=()=>{}}){
  if(!host||!mission)throw new TypeError('The mission board needs its host and mission.');
  host.classList.add('mission-board');host.setAttribute('aria-label','Connected engineering mission');
  host.innerHTML=`<div class="mission-board-heading"><span class="mission-kicker">V3 / CONNECT THE RESPONSE</span><span class="mission-stage"></span></div>
    <h2 class="mission-title"></h2><p class="mission-brief"></p>
    <ol class="mission-journey" aria-label="Mission progress"><li data-stage="inspect">Investigate</li><li data-stage="coordinate">Coordinate</li><li data-stage="register">Record</li></ol>
    <div class="mission-start"><label>Choose a building<select class="mission-type"><option value="office">Office</option><option value="warehouse">Warehouse</option><option value="datacentre">Data centre</option></select></label><button type="button" class="mission-primary" data-action="start">Start the investigation ↗</button></div>
    <div class="mission-active" hidden><ul class="mission-evidence" aria-label="Collected evidence"></ul><button type="button" class="mission-secondary" data-action="enter">Return to the building ↗</button>
      <section class="mission-diagnosis" aria-label="Choose a cause" hidden><h3>What explains the evidence?</h3><div class="mission-choices"></div></section>
      <form class="mission-coordinate" hidden><h3>Organize the response.</h3><p>Choose who leads, who verifies, and what closes the loop.</p>
        <label>Lead discipline<select name="owner" required><option value="">Assign an owner…</option><option value="mechanical">Mechanical team</option><option value="electrical">Electrical team</option><option value="architecture">Architectural team</option></select></label>
        <label>Verification partner<select name="verifier" required><option value="">Choose a partner…</option><option value="controls">Controls / BMS team</option><option value="commercial">Commercial team</option><option value="none">No partner needed</option></select></label>
        <label>Agreed next step<select name="action" required><option value="">Choose the sequence…</option><option value="verify-and-retest">Inspect, verify controls and re-test airflow</option><option value="clear-alarm">Clear the alarm and close the issue</option><option value="increase-speed">Increase fan speed immediately</option></select></label>
        <button class="mission-primary" type="submit">Review the response →</button>
      </form>
      <div class="mission-register" hidden><span class="mission-recovery">✓ SIMULATED RECOVERY</span><p>The model previews successful correction. The record keeps the work visible and assigns the next checks.</p><button type="button" class="mission-primary" data-action="lab">Send actions to the digital lab ↗</button><span class="mission-small">Adds three actions to the existing register. Export CSV in the lab to finish.</span></div>
      <div class="mission-complete" hidden><span class="mission-recovery">✓ MISSION COMPLETE</span><h3>From evidence to an owned response.</h3><p>You traced a symptom, checked the interfaces, agreed responsibilities and exported the follow-up.</p><button type="button" class="mission-secondary" data-action="lab">Open the action register ↗</button></div>
      <button type="button" class="mission-reset" data-action="reset">Reset this mission</button>
    </div>
    <p class="mission-feedback" role="status" aria-live="polite"></p><p class="mission-disclaimer">Illustrative investigation and recovery preview. The sequence is not a site operating procedure or a real project record.</p>`;
  const $=selector=>host.querySelector(selector),start=$('.mission-start'),active=$('.mission-active'),evidence=$('.mission-evidence'),form=$('.mission-coordinate'),typeSelect=$('.mission-type');
  for(const choice of MISSION_DIAGNOSES){const button=document.createElement('button');button.type='button';button.className='mission-choice';const b=document.createElement('strong'),small=document.createElement('span');b.textContent=choice.title;small.textContent=choice.detail;button.append(b,small);button.onclick=()=>{const result=mission.diagnose(choice.id);onSound(result.stage==='coordinate'?'success':'inspect');if(result.stage==='coordinate')onWall();};$('.mission-choices').append(button);}
  $('[data-action=start]').onclick=()=>{mission.start(typeSelect.value);onSound('transition');onEnter(mission.snapshot.type);};
  $('[data-action=enter]').onclick=()=>{onSound('transition');onEnter(mission.snapshot.type);};
  form.addEventListener('submit',event=>{event.preventDefault();const values=new FormData(form);const result=mission.coordinate({owner:values.get('owner'),verifier:values.get('verifier'),action:values.get('action')});onSound(result.stage==='register'?'success':'inspect');});
  for(const button of host.querySelectorAll('[data-action=lab]'))button.onclick=()=>{const s=mission.snapshot;onSound('transition');onLab({notes:s.notes,batchKey:s.batchKey,source:s.source});};
  $('[data-action=reset]').onclick=()=>{mission.reset();onSound('select');};
  let previousStage=null,previousRun=null;
  function refresh(){
    const s=mission.snapshot;host.dataset.stage=s.stage;typeSelect.value=s.type;
    $('.mission-title').textContent=s.active?s.title:'One issue. Three connected spaces.';
    $('.mission-brief').textContent=s.active?`Investigate the ${s.space}, agree the response here, then record the actions in the digital lab.`:'Step into a building, investigate a loss of airflow, then bring your evidence back to this coordination wall.';
    $('.mission-stage').textContent=({idle:'READY',inspect:'01 / INVESTIGATE',diagnose:'01 / EXPLAIN',coordinate:'02 / COORDINATE',register:'03 / RECORD',complete:'COMPLETE'})[s.stage];
    start.hidden=s.active;active.hidden=!s.active;
    const step=s.stage==='complete'?3:s.stage==='register'?2:s.stage==='coordinate'?1:0;
    host.querySelectorAll('.mission-journey li').forEach((li,index)=>{li.dataset.status=index<step?'done':index===step?'current':'next';});
    evidence.replaceChildren(...Object.entries(MISSION_EVIDENCE).map(([id,item])=>{const li=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('span'),seen=s.inspected.includes(id);li.dataset.seen=String(seen);title.textContent=(seen?'✓ ':'○ ')+item.title;detail.textContent=seen?item.detail:id==='panel'?'Optional: confirm upstream equipment status.':'Inspect this point inside the building.';li.append(title,detail);return li;}));
    $('.mission-diagnosis').hidden=!['inspect','diagnose'].includes(s.stage);
    $('.mission-choices').querySelectorAll('button').forEach(button=>button.disabled=!s.canDiagnose);
    form.hidden=s.stage!=='coordinate';$('.mission-register').hidden=s.stage!=='register';$('.mission-complete').hidden=s.stage!=='complete';
    if(s.run!==previousRun){form.reset();previousRun=s.run;}
    $('.mission-feedback').textContent=s.feedback.text;$('.mission-feedback').dataset.tone=s.feedback.tone;
    if(previousStage!==null&&s.stage!==previousStage&&s.stage==='coordinate')form.querySelector('select').focus({preventScroll:true});
    previousStage=s.stage;
  }
  const unsubscribe=mission.subscribe(refresh);refresh();
  return{refresh,destroy(){unsubscribe();host.replaceChildren();}};
}
