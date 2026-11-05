import {CHALLENGE, TRACE_SYSTEMS, evaluateRoute} from './engineering-challenge.js';

// UI updates happen on deliberate interactions, never in the render loop.
export function createModelExperienceUI({state,onChange,onFocus}) {
  const host=document.getElementById('model-experience');
  host.innerHTML=`
    <div class="model-modes" role="group" aria-label="Model experience">
      <button data-model-mode="explore">Explore</button><button data-model-mode="trace">Connections</button><button data-model-mode="challenge">Challenge</button>
    </div>
    <div id="experience-intro">
      <p class="experience-lead">A building is a network of decisions. Follow a connection, or make one yourself.</p>
      <button class="experience-card" data-start="trace"><span class="card-icon">↗</span><span><strong>Follow the system</strong><small>One AHU. Four connected systems.</small></span><span>→</span></button>
      <button class="experience-card" data-start="challenge"><span class="card-icon">⌁</span><span><strong>Resolve a coordination clash</strong><small>Two routes. One important trade-off.</small></span><span>→</span></button>
      <div class="divider"></div>
    </div>
    <section id="trace-experience" hidden aria-label="Connected MEP inspection">
      <div class="equipment-heading"><span class="equipment-tag">AHU–01</span><button class="text-button" id="trace-focus">Refocus model ↗</button></div>
      <h2>One unit. A connected building.</h2>
      <p>Follow what powers, supplies and controls the rooftop air-handling unit. Select a connection to see its route.</p>
      <div id="trace-systems" class="trace-systems" role="group" aria-label="Trace a connection"></div>
      <div class="trace-detail" aria-live="polite"><span id="trace-kicker" class="eyebrow"></span><h3 id="trace-headline"></h3><p id="trace-description"></p><ol id="trace-steps" class="connection-steps"></ol><p id="trace-detail-copy" class="trace-small"></p></div>
      <p class="note">Highlighted connections remain visible through the structure. This is an illustrative model, not a construction design.</p>
    </section>
    <section id="challenge-experience" hidden aria-label="Engineering coordination challenge">
      <div class="equipment-heading"><span class="equipment-tag">COORDINATION / 01</span><button class="text-button" id="challenge-focus">Refocus bay ↗</button></div>
      <h2 id="challenge-title"></h2><p id="challenge-intro"></p>
      <div class="challenge-legend"><span><i style="--dot:#4cdeec"></i>Fixed duct</span><span><i style="--dot:#ffca66"></i>Cable tray</span><span><i style="--dot:#ffc56f"></i>Access space</span></div>
      <details class="challenge-brief"><summary>Check the constraints</summary><ul id="challenge-constraints"></ul></details>
      <div class="decision-heading"><span class="eyebrow">PREVIEW A ROUTE</span><button id="challenge-original" class="text-button">Show original</button></div>
      <div id="challenge-choices" class="challenge-choices" role="group" aria-label="Choose a cable tray route"></div>
      <p class="preview-status" id="challenge-preview" role="status">The red crossing shows the original clash.</p>
      <button id="challenge-submit" class="primary" disabled>Preview a route to continue</button>
      <div id="challenge-feedback" class="challenge-feedback" aria-live="polite" hidden><span id="challenge-verdict" class="eyebrow"></span><h3 id="challenge-result-title"></h3><ul id="challenge-checks"></ul><p id="challenge-explanation"></p><p id="challenge-next-step"></p><button id="challenge-retry" class="outline">Compare the other route →</button></div>
      <p id="challenge-note" class="note"></p>
    </section>`;
  const $=id=>document.getElementById(id);
  let reviewed=null;
  for(const [id,item] of Object.entries(TRACE_SYSTEMS)){
    const button=document.createElement('button');button.dataset.traceSystem=id;button.style.setProperty('--trace-color',item.color);button.innerHTML='<i></i><span></span>';button.querySelector('span').textContent=item.label;
    button.onclick=()=>selectTrace(id);$('trace-systems').append(button);
  }
  $('challenge-title').textContent=CHALLENGE.title;
  $('challenge-intro').textContent=CHALLENGE.intro;
  $('challenge-note').textContent=CHALLENGE.note;
  for(const constraint of CHALLENGE.constraints){const li=document.createElement('li'),b=document.createElement('strong'),p=document.createElement('span');b.textContent=constraint.label;p.textContent=constraint.detail;li.append(b,p);$('challenge-constraints').append(li);}
  for(const choice of CHALLENGE.choices){const button=document.createElement('button');button.className='route-choice';button.dataset.route=choice.id;const top=document.createElement('strong'),description=document.createElement('span');top.textContent=choice.title;description.textContent=choice.summary;button.append(top,description);button.onclick=()=>selectRoute(choice.id);$('challenge-choices').append(button);}
  host.querySelectorAll('[data-model-mode]').forEach(button=>button.onclick=()=>setMode(button.dataset.modelMode));
  host.querySelectorAll('[data-start]').forEach(button=>button.onclick=()=>setMode(button.dataset.start));
  $('trace-focus').onclick=()=>onFocus('trace');$('challenge-focus').onclick=()=>onFocus('challenge');
  $('challenge-original').onclick=()=>selectRoute('existing');
  $('challenge-submit').onclick=()=>{reviewed=state.challengeRoute;refreshChallenge();$('challenge-feedback').scrollIntoView({block:'nearest',behavior:'auto'});};
  $('challenge-retry').onclick=()=>selectRoute(state.challengeRoute==='bypass'?'lower':'bypass');
  function selectTrace(id){if(!TRACE_SYSTEMS[id])return;state.traceSystem=id;refreshTrace();onChange({focus:false});}
  function selectRoute(id){if(!['existing','lower','bypass'].includes(id))return;state.challengeRoute=id;reviewed=null;refreshChallenge();onChange({focus:false});}
  function setMode(mode,{focus=true}={}){if(!['explore','trace','challenge'].includes(mode))return;state.modelMode=mode;refresh();onChange({focus});$('panel-scroll').scrollTop=0;}
  function refreshTrace(){const item=TRACE_SYSTEMS[state.traceSystem]||TRACE_SYSTEMS.all;host.querySelectorAll('[data-trace-system]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.traceSystem===state.traceSystem)));$('trace-kicker').textContent=item.label;$('trace-headline').textContent=item.title;$('trace-description').textContent=item.description;$('trace-detail-copy').textContent=item.detail||'';$('trace-steps').replaceChildren(...item.steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));$('trace-experience').style.setProperty('--trace-color',item.color);}
  function refreshChallenge(){const route=state.challengeRoute;host.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===route)));$('challenge-submit').disabled=route==='existing';$('challenge-submit').textContent=route==='existing'?'Preview a route to continue':'Review this route →';$('challenge-preview').textContent=route==='existing'?'The red crossing shows the original clash.':`Previewing ${CHALLENGE.choices.find(c=>c.id===route).title}. Inspect the bay, then review your choice.`;$('challenge-feedback').hidden=reviewed!==route;if(reviewed!==route)return;const result=evaluateRoute(route);$('challenge-feedback').dataset.accepted=String(result.accepted);$('challenge-verdict').textContent=result.accepted?'CONSTRAINTS SATISFIED':'ONE CONSTRAINT STILL NEEDS ATTENTION';$('challenge-result-title').textContent=result.verdict;$('challenge-explanation').textContent=result.explanation;$('challenge-next-step').textContent=result.nextStep;$('challenge-checks').replaceChildren(...result.checks.map(check=>{const li=document.createElement('li');li.dataset.passed=String(check.passed);li.textContent=`${check.passed?'✓':'×'} ${check.label}`;li.title=check.detail;return li;}));}
  function refresh(){$('panel').dataset.experience=state.area==='model'?state.modelMode:'explore';host.querySelectorAll('[data-model-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modelMode===state.modelMode)));$('experience-intro').hidden=state.modelMode!=='explore';$('model-controls').hidden=state.modelMode!=='explore';$('trace-experience').hidden=state.modelMode!=='trace';$('challenge-experience').hidden=state.modelMode!=='challenge';refreshTrace();refreshChallenge();}
  refresh();
  return {setMode,selectTrace,selectRoute,refresh};
}
