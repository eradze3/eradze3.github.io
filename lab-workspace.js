export const LAB_SAMPLE_NOTES = `Check AHU-01 electrical load before confirming the feeder | owner: Electrical team | discipline: Electrical | due: 2026-11-12
Review the supply duct route against the reserved access zone | owner: Mechanical team | discipline: HVAC | due: 2026-11-13
Confirm the AHU command and status points | owner: Controls team | discipline: BMS
Agree the cable-tray bypass with the affected disciplines | discipline: Coordination`;

export const LAB_DISCIPLINES=['Unassigned','Electrical','ELV','HVAC','Plumbing','Fire protection','BMS','Coordination'];
const clean=value=>String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim();
function disciplineOf(value,task=''){
  const supplied=clean(value).toLowerCase();
  const aliases={electrical:'Electrical',power:'Electrical',elv:'ELV',hvac:'HVAC',mechanical:'HVAC',plumbing:'Plumbing',water:'Plumbing',fire:'Fire protection','fire protection':'Fire protection',bms:'BMS',controls:'BMS',coordination:'Coordination',mep:'Coordination'};
  if(supplied)return aliases[supplied]||'Unassigned';
  if(/\b(BMS|control points|point list|command and status)\b/i.test(task))return 'BMS';
  if(/\b(ELV|data cabling|access control)\b/i.test(task))return 'ELV';
  if(/\b(electrical|feeder|switchboard|lighting|cable tray|cable-tray)\b/i.test(task))return 'Electrical';
  if(/\b(duct|airflow|ventilation|HVAC)\b/i.test(task))return 'HVAC';
  if(/\b(plumbing|drainage|domestic water)\b/i.test(task))return 'Plumbing';
  if(/\b(sprinkler|fire protection)\b/i.test(task))return 'Fire protection';
  return 'Unassigned';
}
function validISODate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T00:00:00Z');
  return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===value;
}

/** A deterministic label parser. It makes no AI or engineering judgement. */
export function parseMeetingNotes(notes){
  if(typeof notes!=='string')throw new TypeError('Enter the notes as text.');
  if(notes.length>12000)throw new RangeError('Keep the notes under 12,000 characters.');
  const lines=notes.split(/\r?\n/).map(clean).filter(Boolean);
  if(lines.length>50)throw new RangeError('Use up to 50 actions, one per line.');
  const rows=[];
  for(const raw of lines){
    let task=raw.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/,'');
    const meta={};
    task=task.replace(/(?:^|[|;]\s*|\s+)(owner|assigned to|discipline|system|due|deadline)\s*:\s*([^|;]*?)(?=\s+(?:owner|assigned to|discipline|system|due|deadline)\s*:|[|;]|$)/gi,(_match,key,value)=>{meta[key.toLowerCase()]=clean(value);return '';});
    const bracket=task.match(/^\[([^\]]+)\]\s*/);if(bracket){meta.discipline=meta.discipline||bracket[1];task=task.slice(bracket[0].length);}
    task=clean(task.replace(/^[|;\s]+|[|;\s]+$/g,'').replace(/\s+[|;]\s*$/,''));
    if(!task)continue;
    if(task.length>500)throw new RangeError('Keep each action under 500 characters. Split longer notes into separate actions.');
    const dueHint=clean(meta.due||meta.deadline),due=validISODate(dueHint)?dueHint:'';
    rows.push({id:`action-${rows.length+1}`,task,owner:clean(meta.owner||meta['assigned to']),discipline:disciplineOf(meta.discipline||meta.system,task),due,dueHint:due?'':dueHint,reviewed:false,complete:false});
  }
  return rows;
}

// Spreadsheet apps can evaluate quoted cells as formulas, so protect leading operators too.
function csvCell(value){let text=String(value??'').replace(/\u0000/g,'');if(/^[\s\uFEFF\u200B]*[=+\-@]/u.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function toCSV(rows){
  const data=[['Action','Owner','Discipline','Due date','Unresolved due note','Review','Status','Source'],...rows.map(r=>[r.task,r.owner,r.discipline,r.due,r.dueHint,r.reviewed?'Reviewed':'Needs review',r.complete?'Done':'Open',r.source?.label||'Notes / manual entry'])];
  return data.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}

/** Imports are additive and idempotent. Missing rows can be restored without replacing edits. */
export function mergeImportedActions(currentRows,text,{key,source='Illustrative mission',nextId=1}={}){
  if(!/^[a-z\d][a-z\d._:-]{0,99}$/i.test(String(key||'')))throw new TypeError('Use a valid source key for these actions.');
  const parsed=parseMeetingNotes(text);if(!parsed.length)throw new RangeError('The import has no actions to add.');
  const signature=JSON.stringify(parsed.map(({task,owner,discipline,due,dueHint})=>({task,owner,discipline,due,dueHint})));
  const existing=currentRows.filter(row=>row.source?.key===key);
  if(existing.some(row=>row.source.signature!==signature))throw new RangeError('This source already has a different set of actions. Use a new source key.');
  const present=new Set(existing.map(row=>row.source.index)),missing=parsed.map((row,index)=>({row,index})).filter(item=>!present.has(item.index));
  if(currentRows.length+missing.length>50)throw new RangeError('The register can hold 50 actions. Remove some actions before adding this mission.');
  let serial=Math.max(1,Number.isInteger(nextId)?nextId:1);const ids=new Set(currentRows.map(row=>row.id));
  const label=clean(source).slice(0,100)||'Illustrative mission';
  const added=missing.map(({row,index})=>{while(ids.has(`action-${serial}`))serial++;const id=`action-${serial++}`;ids.add(id);return {...row,id,source:{key,label,index,total:parsed.length,signature}};});
  return {rows:[...currentRows,...added],added:added.length,nextId:serial,key};
}
export function getExportedBatchKeys(rows){
  const groups=new Map();for(const row of rows){const source=row.source;if(!source)continue;if(!groups.has(source.key))groups.set(source.key,[]);groups.get(source.key).push(row);}
  return [...groups.entries()].filter(([_key,items])=>{const source=items[0].source;return items.length===source.total&&new Set(items.map(row=>row.source.index)).size===source.total&&items.every(row=>row.task.trim()&&row.source.signature===source.signature);}).map(([key])=>key);
}

export function createLabWorkspace({onSummary=()=>{},onClose=()=>{},onExport=()=>{}}={}){
  const dialog=document.createElement('dialog');dialog.id='lab-workspace';dialog.className='lab-workspace';dialog.setAttribute('aria-labelledby','lab-workspace-title');
  dialog.innerHTML=`<div class="lab-shell">
    <header class="lab-header"><div><span class="lab-eyebrow">DIGITAL LAB / WORKING AUTOMATION</span><h2 id="lab-workspace-title">Notes become next steps.</h2><p>A small working tool for turning coordination notes into an action register.</p></div><button class="lab-close" type="button" aria-label="Close working digital lab">×</button></header>
    <div class="lab-summary" aria-label="Action register summary"><div><strong id="lab-total">0</strong><span>actions</span></div><div><strong id="lab-reviewed">0</strong><span>reviewed</span></div><div><strong id="lab-open">0</strong><span>still open</span></div><span class="lab-local-label"><i></i> Runs in your browser</span></div>
    <div class="lab-columns"><section class="lab-input-panel" aria-labelledby="lab-input-title"><div class="lab-step-heading"><span>01</span><h3 id="lab-input-title">Start with the notes</h3></div><p class="lab-help">One action per line. Add <code>owner:</code>, <code>discipline:</code> or <code>due: YYYY-MM-DD</code> after a <code>|</code>. Missing fields stay visible for review.</p><label class="lab-field-label" for="lab-notes">Coordination notes</label><textarea id="lab-notes" maxlength="12000" spellcheck="false" aria-describedby="lab-input-help"></textarea><div class="lab-note-meta"><span id="lab-source-label">Illustrative sample · no client data</span><output id="lab-character-count"></output></div><button id="lab-build" class="lab-primary" type="button">Build action register <span>→</span></button><button id="lab-reset" class="lab-secondary" type="button">Reset to sample notes</button><p id="lab-input-help" class="lab-small">Building replaces the current register with actions from these notes. The rules read labels and suggest a discipline from keywords; they do not perform AI analysis.</p><p class="lab-privacy">Your notes stay in this tab’s memory. Nothing is uploaded or saved automatically.</p><div id="lab-input-error" role="alert" hidden></div></section>
    <section class="lab-register-panel" aria-labelledby="lab-register-title"><div class="lab-register-heading"><div class="lab-step-heading"><span>02</span><h3 id="lab-register-title">Review the actions</h3></div><button id="lab-add" class="lab-small-button" type="button">+ Add action</button></div><p class="lab-help">Edit the details, confirm ownership, and mark actions reviewed or done.</p><p class="lab-import-status" id="lab-import-status"></p><div class="lab-register-toolbar"><div class="lab-filters" role="group" aria-label="Filter actions"><button type="button" data-lab-filter="all" aria-pressed="true">All</button><button type="button" data-lab-filter="review" aria-pressed="false">Needs review</button><button type="button" data-lab-filter="done" aria-pressed="false">Done</button></div><button id="lab-export" class="lab-export" type="button">Export CSV ↗</button></div><div id="lab-actions" class="lab-actions"></div><div id="lab-empty" class="lab-empty" hidden></div><p id="lab-feedback" class="lab-feedback" role="status" aria-live="polite"></p></section></div>
    <footer class="lab-footer"><span>Standalone demonstration · not connected to LAYOUT OS</span><button type="button" id="lab-return">Return to the studio →</button></footer>
  </div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id),notes=$('lab-notes'),list=$('lab-actions');
  let rows=parseMeetingNotes(LAB_SAMPLE_NOTES),nextId=rows.length+1,filter='all',returnFocus=null;
  notes.value=LAB_SAMPLE_NOTES;
  function announce(message){$('lab-feedback').textContent=message;}
  function counts(){return{total:rows.length,reviewed:rows.filter(r=>r.reviewed).length,open:rows.filter(r=>!r.complete).length,completed:rows.filter(r=>r.complete).length};}
  function summary(){const c=counts();$('lab-total').textContent=c.total;$('lab-reviewed').textContent=c.reviewed;$('lab-open').textContent=c.open;$('lab-export').disabled=!rows.length;$('lab-add').disabled=rows.length>=50;onSummary(c);}
  function flags(row){const missing=[];if(!row.task.trim())missing.push('Add an action');if(!row.owner.trim())missing.push('Owner needed');if(row.discipline==='Unassigned')missing.push('Discipline needed');if(row.dueHint)missing.push('Confirm due date: '+row.dueHint);if(!row.reviewed)missing.push('Needs review');return missing;}
  function syncRow(row,card){card.dataset.complete=String(row.complete);card.querySelector('[data-review]').checked=row.reviewed;card.querySelector('[data-complete]').checked=row.complete;card.querySelector('.lab-row-flags').textContent=flags(row).join(' · ')||(row.complete?'Action completed':'Reviewed and ready');}
  function change(row,card,key,value,input){
    const leavingDone=filter==='done'&&row.complete;
    const selection=input.type==='text'?{start:input.selectionStart,end:input.selectionEnd}:null;
    row[key]=value;if(key==='due')row.dueHint='';const countsChanged=row.reviewed||row.complete;row.reviewed=false;row.complete=false;
    if(leavingDone){
      // A changed action is open again. Show All so the editor can keep typing
      // without leaving an unfinished row under the Done filter.
      filter='all';render();
      const replacement=list.querySelector(`[data-action="${row.id}"] [data-field="${key}"]`);
      replacement?.focus();
      if(selection&&replacement)replacement.setSelectionRange(selection.start,selection.end);
      announce('Editing reopened this action. Showing all actions so you can finish your changes.');
    }else syncRow(row,card);
    if(countsChanged)summary();
  }
  function field(row,card,label,key,type='text'){
    const wrap=document.createElement('label');wrap.className='lab-row-field';const name=document.createElement('span');name.textContent=label;let input;
    if(key==='discipline'){input=document.createElement('select');for(const value of LAB_DISCIPLINES){const option=document.createElement('option');option.value=option.textContent=value;input.append(option);}}
    else{input=document.createElement('input');input.type=type;if(type==='text')input.maxLength=key==='task'?500:100;}
    input.value=row[key];input.dataset.field=key;input.setAttribute('aria-label',`${label} for action ${rows.indexOf(row)+1}`);input.addEventListener('input',()=>change(row,card,key,input.value,input));wrap.append(name,input);return wrap;
  }
  function render(){
    list.replaceChildren();dialog.querySelectorAll('[data-lab-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.labFilter===filter)));
    const visible=rows.filter(r=>filter==='all'||filter==='review'&&!r.reviewed||filter==='done'&&r.complete);
    for(const row of visible){
      const card=document.createElement('article');card.className='lab-action';card.dataset.action=row.id;
      const top=document.createElement('div');top.className='lab-action-top';const number=document.createElement('span');number.textContent=String(rows.indexOf(row)+1).padStart(2,'0');number.className='lab-action-number';const remove=document.createElement('button');remove.type='button';remove.className='lab-remove';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove action ${rows.indexOf(row)+1}`);remove.onclick=()=>{rows=rows.filter(r=>r!==row);render();summary();announce('Action removed.');};top.append(number,remove);card.append(top);
      if(row.source){const source=document.createElement('span');source.className='lab-action-source';source.textContent=row.source.label;card.append(source);}
      card.append(field(row,card,'Action','task'));
      const fields=document.createElement('div');fields.className='lab-row-fields';fields.append(field(row,card,'Owner','owner'),field(row,card,'Discipline','discipline'),field(row,card,'Due date','due','date'));card.append(fields);
      const flagsElement=document.createElement('p');flagsElement.className='lab-row-flags';card.append(flagsElement);
      const status=document.createElement('div');status.className='lab-row-status';
      for(const [key,label,attr]of [['reviewed','Reviewed','review'],['complete','Done','complete']]){const wrap=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.dataset[attr]='';input.setAttribute('aria-label',`${label} action ${rows.indexOf(row)+1}`);input.onchange=()=>{if(input.checked&&!row.task.trim()){input.checked=false;announce('Add action text before marking it '+label.toLowerCase()+'.');return;}row[key]=input.checked;syncRow(row,card);summary();if(filter!=='all')render();};wrap.append(input,document.createTextNode(label));status.append(wrap);}
      card.append(status);list.append(card);syncRow(row,card);
    }
    $('lab-empty').hidden=visible.length>0;$('lab-empty').textContent=rows.length?filter==='done'?'No completed actions yet. Mark an action Done when it is finished.':'Every action has been reviewed. Switch to All to keep working.':'Your action register is empty. Add notes on the left and build the register, or add an action yourself.';
  }
  function showError(text){$('lab-input-error').textContent=text;$('lab-input-error').hidden=!text;}
  function build(){updateCounter();try{const parsed=parseMeetingNotes(notes.value);if(!parsed.length){showError('Add at least one action, one per line. Your current register has been kept.');notes.focus();return;}rows=parsed;nextId=rows.length+1;filter='all';$('lab-import-status').textContent='';showError('');render();summary();announce(`${rows.length} draft action${rows.length===1?'':'s'} created. Review the suggested fields before use.`);}catch(error){showError(error.message);}}
  function appendNotes(text,{source='Illustrative mission',key}={}){
    const merged=mergeImportedActions(rows,text,{source,key,nextId});rows=merged.rows;nextId=merged.nextId;filter='all';showError('');render();summary();
    $('lab-import-status').textContent=`${clean(source).slice(0,100)} added to this register. Existing actions and the notes editor have been kept.`;
    announce(merged.added?`${merged.added} mission actions added. Review them, then export the register.`:'These mission actions are already in the register. Existing edits have been kept.');
    return {added:merged.added,total:rows.length,key};
  }
  function close(){if(dialog.open)dialog.close();}
  function updateCounter(){$('lab-character-count').textContent=notes.value.length.toLocaleString()+' / 12,000';$('lab-source-label').textContent=notes.value===LAB_SAMPLE_NOTES?'Illustrative sample · no client data':'Your notes · kept in this tab';}
  notes.addEventListener('input',()=>{updateCounter();showError('');});
  $('lab-build').onclick=build;
  $('lab-reset').onclick=()=>{notes.value=LAB_SAMPLE_NOTES;updateCounter();build();announce('Sample notes and draft actions restored.');};
  $('lab-add').onclick=()=>{if(rows.length>=50)return;rows.push({id:`action-${nextId++}`,task:'',owner:'',discipline:'Unassigned',due:'',dueHint:'',reviewed:false,complete:false});filter='all';render();summary();list.lastElementChild.querySelector('input').focus();announce('New action added.');};
  dialog.querySelectorAll('[data-lab-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.labFilter;render();});
  $('lab-export').onclick=()=>{if(!rows.length)return;if(rows.some(row=>!row.task.trim())){announce('Add text to each action or remove the empty action before exporting.');return;}const blob=new Blob(['\uFEFF'+toCSV(rows)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='coordination-action-register.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('CSV exported with review, completion status and action sources.');onExport({...counts(),batchKeys:getExportedBatchKeys(rows)});};
  dialog.querySelector('.lab-close').onclick=close;$('lab-return').onclick=close;
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();});
  dialog.addEventListener('close',()=>{onClose();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  updateCounter();render();summary();
  return {open(){if(dialog.open)return;returnFocus=document.activeElement;dialog.showModal();$('lab-build').focus({preventScroll:true});},close,appendNotes,get isOpen(){return dialog.open;}};
}
