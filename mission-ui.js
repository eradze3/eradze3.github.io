import {BUILDING_TYPES,SCENARIOS,getScenario} from './engineering-scenarios.js';

const PERSPECTIVES={
 airflow:{team:'Compare the local blade position and air response with the ventilation request. The physical restriction is known; its cause and verification still need accountable technical owners.',balcony:'Consider the other zones served by this equipment, the access window and who verifies delivery. A local correction can still have coordination and continuity implications.'},
 power:{team:'Separate the request to run from simulated supply availability, fan status and air delivery. Let the responsible technical disciplines establish the cause and verification scope.',balcony:'Identify which service is affected and which other loads remain independent. Coordinate operations, permitted access and verified recovery without assuming spare capacity.'},
 controls:{team:'Follow the supervisory request, local override and observed blade position as separate facts. Work with controls and mechanical owners where the sequence or intent is unclear.',balcony:'Ask who owns the sequence, why the override exists, and how changes are handed over. A technically possible command needs an agreed purpose and multidisciplinary verification.'},
 access:{team:'Look at the physical access and component-removal space with the people who will maintain the equipment. An unobstructed drawing alone does not establish usable access.',balcony:'Connect the mechanical requirement with architecture, storage and operations. Agree who maintains the clear space after the coordination issue is closed.'}
};

/** The project wall turns evidence into ownership and a conditional delivery plan. */
export function createMissionUI({host,mission,onEnter=()=>{},onWall=()=>{},onLab=()=>{},onSound=()=>{}}){
 if(!host||!mission)throw new TypeError('The mission board needs its host and mission.');
 host.classList.add('mission-board');host.setAttribute('aria-label','Connected engineering mission');
 host.innerHTML=`<div class="mission-board-heading"><span class="mission-kicker">V4 / ENGINEERING & LEADERSHIP</span><span class="mission-stage"></span></div>
  <h2 class="mission-title"></h2><p class="mission-brief"></p>
  <ol class="mission-journey" aria-label="Mission progress"><li data-stage="inspect">Investigate</li><li data-stage="coordinate">Coordinate</li><li data-stage="register">Record</li></ol>
  <div class="mission-start"><label for="mission-building">Choose a building</label><select id="mission-building" class="mission-type"></select><label for="mission-scenario">Choose an investigation</label><select id="mission-scenario" class="mission-scenario"></select><p class="mission-preview"></p><button type="button" class="mission-primary" data-action="start">Start the investigation ↗</button></div>
  <div class="mission-active" hidden>
   <details class="mission-evidence-details"><summary class="mission-evidence-summary">Collected evidence</summary><ul class="mission-evidence" aria-label="Collected evidence"></ul></details>
   <button type="button" class="mission-secondary" data-action="enter">Return to the building ↗</button>
   <section class="mission-diagnosis" aria-label="Choose a cause" hidden><h3>What explains the evidence?</h3><div class="mission-choices"></div></section>
   <section class="mission-leadership" aria-label="Leadership perspective and delivery trade-offs" hidden>
    <span class="mission-small">A TECHNICAL FINDING BECOMES A TEAM RESPONSE</span><h3>Lead from two perspectives.</h3>
    <div class="mission-perspectives" role="group" aria-label="Leadership perspective"><button type="button" data-perspective="team" aria-pressed="true">With the team</button><button type="button" data-perspective="balcony" aria-pressed="false">From the balcony</button></div>
    <p class="mission-perspective-copy"></p><p class="mission-context"></p>
    <h3>Choose a delivery approach.</h3><p>Both planned and staged approaches can be reasonable. Each carries conditions that need an owner.</p>
    <div class="mission-strategies" role="group" aria-label="Delivery approach"></div>
    <div class="mission-tradeoffs" hidden><h4 class="mission-plan-title"></h4><dl><dt>Programme</dt><dd data-tradeoff="programme"></dd><dt>Continuity</dt><dd data-tradeoff="continuity"></dd><dt>Access</dt><dd data-tradeoff="access"></dd></dl><p class="mission-plan-condition"></p><label class="mission-ack"><input type="checkbox" id="mission-acknowledge"><span>I have considered these conditions for this illustrative plan.</span></label></div>
   </section>
   <form class="mission-coordinate" hidden><h3>Assign the technical response.</h3><p>Keep the discipline owner, verification partner and agreed follow-up explicit.</p>
    <label for="mission-owner">Lead discipline</label><select id="mission-owner" name="owner" required></select>
    <label for="mission-verifier">Verification partner</label><select id="mission-verifier" name="verifier" required></select>
    <label for="mission-action">Agreed next step</label><select id="mission-action" name="action" required></select>
    <button class="mission-primary" type="submit">Review the response →</button>
   </form>
   <div class="mission-register" hidden><span class="mission-recovery">✓ SIMULATED VERIFIED OUTCOME</span><p>The model previews a successful outcome after the agreed work and verification. The action register retains the owners, selected delivery plan and remaining checks.</p><p class="mission-agreed-plan"></p><button type="button" class="mission-primary" data-action="lab">Send actions to the digital lab ↗</button><span class="mission-small">Adds three actions to your existing register. Review them and export CSV to finish.</span></div>
   <div class="mission-complete" hidden><span class="mission-recovery">✓ MISSION COMPLETE</span><h3>Evidence. Ownership. Follow-through.</h3><p>You examined the interfaces, considered delivery conditions and exported an owned response.</p><button type="button" class="mission-secondary" data-action="lab">Open the action register ↗</button></div>
   <button type="button" class="mission-reset" data-action="reset">Choose another investigation</button>
  </div>
  <p class="mission-feedback" role="status" aria-live="polite"></p><p class="mission-disclaimer">Illustrative scenarios and recovery previews. No live equipment commands, electrical authorization or site operating procedure.</p>`;
 const $=selector=>host.querySelector(selector),start=$('.mission-start'),active=$('.mission-active'),evidence=$('.mission-evidence'),form=$('.mission-coordinate'),typeSelect=$('.mission-type'),scenarioSelect=$('.mission-scenario');
 const fillSelect=(select,entries,placeholder='')=>{select.replaceChildren();if(placeholder){const option=document.createElement('option');option.value='';option.textContent=placeholder;select.append(option);}for(const entry of entries){const option=document.createElement('option');option.value=entry.id;option.textContent=entry.title;select.append(option);}};
 fillSelect(typeSelect,Object.entries(BUILDING_TYPES).map(([id,type])=>({id,title:type.name})));fillSelect(scenarioSelect,Object.values(SCENARIOS).map(s=>({id:s.id,title:s.name})));
 function preview(){const s=getScenario(scenarioSelect.value,typeSelect.value);$('.mission-preview').textContent=s.summary;}
 typeSelect.onchange=preview;scenarioSelect.onchange=preview;preview();
 let previousStage=null,previousRun=null,previousKey=null,perspective='team';
 function setPerspective(value){perspective=value;host.querySelectorAll('[data-perspective]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.perspective===perspective)));$('.mission-perspective-copy').textContent=PERSPECTIVES[mission.snapshot.scenario][perspective];onSound('select');}
 host.querySelectorAll('[data-perspective]').forEach(button=>button.onclick=()=>setPerspective(button.dataset.perspective));
 function renderScenario(s){
  const options=s.coordinationOptions;
  fillSelect(form.querySelector('[name=owner]'),options.owners,'Assign an owner…');fillSelect(form.querySelector('[name=verifier]'),options.verifiers,'Choose a partner…');fillSelect(form.querySelector('[name=action]'),options.actions,'Choose the sequence…');
  $('.mission-choices').replaceChildren(...s.diagnoses.map(choice=>{const button=document.createElement('button');button.type='button';button.className='mission-choice';button.dataset.diagnosis=choice.id;const strong=document.createElement('strong'),small=document.createElement('span');strong.textContent=choice.title;small.textContent=choice.detail;button.append(strong,small);button.onclick=()=>{const result=mission.diagnose(choice.id);onSound(result.stage==='coordinate'?'success':'inspect');if(result.stage==='coordinate')onWall();};return button;}));
  $('.mission-strategies').replaceChildren(...s.strategies.map(plan=>{const button=document.createElement('button');button.type='button';button.className='mission-strategy';button.dataset.strategy=plan.id;const strong=document.createElement('strong'),small=document.createElement('span');strong.textContent=plan.title;small.textContent=plan.summary;button.append(strong,small);button.onclick=()=>{mission.chooseStrategy(plan.id);onSound(plan.acceptable?'select':'fault');};return button;}));
 }
 $('[data-action=start]').onclick=()=>{mission.start(typeSelect.value,scenarioSelect.value);onSound('transition');onEnter(mission.snapshot.type);};
 $('[data-action=enter]').onclick=()=>{onSound('transition');onEnter(mission.snapshot.type);};
 $('#mission-acknowledge').onchange=event=>mission.acknowledgeStrategy(event.target.checked);
 form.addEventListener('submit',event=>{event.preventDefault();const values=new FormData(form);const result=mission.coordinate({owner:values.get('owner'),verifier:values.get('verifier'),action:values.get('action')});onSound(result.stage==='register'?'success':'inspect');});
 for(const button of host.querySelectorAll('[data-action=lab]'))button.onclick=()=>{const s=mission.snapshot;onSound('transition');onLab({notes:s.notes,batchKey:s.batchKey,source:s.source});};
 $('[data-action=reset]').onclick=()=>{mission.reset();onSound('select');};
 function refresh(){
  const s=mission.snapshot;host.dataset.stage=s.stage;host.dataset.scenario=s.scenario;
  if(s.active){typeSelect.value=s.type;scenarioSelect.value=s.scenario;}
  $('.mission-title').textContent=s.active?s.title:'One finding. A coordinated response.';
  $('.mission-brief').textContent=s.active?s.scenarioName+' · '+s.name+' / '+s.space:'Enter a building, examine the evidence and return here to connect technical ownership with a delivery plan.';
  $('.mission-stage').textContent=({idle:'READY',inspect:'01 / INVESTIGATE',diagnose:'01 / EXPLAIN',coordinate:'02 / COORDINATE',register:'03 / RECORD',complete:'COMPLETE'})[s.stage];
  start.hidden=s.active;active.hidden=!s.active;if(!s.active)preview();
  const step=s.stage==='complete'?3:s.stage==='register'?2:s.stage==='coordinate'?1:0;
  host.querySelectorAll('.mission-journey li').forEach((li,index)=>{li.dataset.status=index<step?'done':index===step?'current':'next';});
  const key=s.type+'/'+s.scenario+'/'+s.run;if(previousKey!==key){renderScenario(s);previousKey=key;perspective='team';}
  evidence.replaceChildren(...Object.entries(s.evidenceCatalog).map(([id,item])=>{const li=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('span'),seen=s.inspected.includes(id);li.dataset.seen=String(seen);title.textContent=(seen?'✓ ':'○ ')+item.title+(s.required.includes(id)?'':' · optional');detail.textContent=seen?item.kind+': '+item.detail:'Inspect this point inside the building.';li.append(title,detail);return li;}));
  $('.mission-evidence-summary').textContent='Evidence · '+s.inspected.filter(id=>s.required.includes(id)).length+' / '+s.required.length+' required observations';
  $('.mission-diagnosis').hidden=!['inspect','diagnose'].includes(s.stage);$('.mission-choices').querySelectorAll('button').forEach(button=>button.disabled=!s.canDiagnose);
  form.hidden=s.stage!=='coordinate';$('.mission-leadership').hidden=s.stage!=='coordinate';$('.mission-register').hidden=s.stage!=='register';$('.mission-complete').hidden=s.stage!=='complete';
  $('.mission-context').textContent=s.context;
  host.querySelectorAll('[data-perspective]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.perspective===perspective)));$('.mission-perspective-copy').textContent=PERSPECTIVES[s.scenario][perspective];
  host.querySelectorAll('[data-strategy]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.strategy===s.strategy)));
  const plan=s.strategyDetail;$('.mission-tradeoffs').hidden=!plan;
  if(plan){$('.mission-plan-title').textContent=plan.title;for(const field of ['programme','continuity','access'])host.querySelector('[data-tradeoff='+field+']').textContent=plan[field];$('.mission-plan-condition').textContent=plan.condition;$('.mission-ack').hidden=!plan.acceptable;}
  $('#mission-acknowledge').checked=s.strategyAcknowledged;$('.mission-agreed-plan').textContent=plan?'Delivery approach: '+plan.title:'';
  if(s.run!==previousRun){form.reset();previousRun=s.run;}
  if(s.stage!==previousStage){$('.mission-evidence-details').open=['inspect','diagnose'].includes(s.stage);previousStage=s.stage;}
  $('.mission-feedback').textContent=s.feedback.text;$('.mission-feedback').dataset.tone=s.feedback.tone;
 }
 const unsubscribe=mission.subscribe(refresh);refresh();
 return{refresh,destroy(){unsubscribe();host.replaceChildren();}};
}
