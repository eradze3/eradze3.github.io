import {BUILDING_TYPES,SCENARIOS,getScenario} from './engineering-scenarios.js';

// Stable default exports retained for the original airflow experience.
export const MISSION_TYPES=BUILDING_TYPES;
export const MISSION_EVIDENCE=SCENARIOS.airflow.evidence;
export const MISSION_REQUIRED=SCENARIOS.airflow.required;
export const MISSION_DIAGNOSES=SCENARIOS.airflow.diagnoses;
const fresh=()=>({stage:'idle',type:'office',scenario:'airflow',run:0,inspected:[],faultActive:false,coordination:null,strategy:null,strategyAcknowledged:false,feedback:{tone:'quiet',text:''}});

/** Evidence and agreed ownership precede the simulated recovery preview. */
export function createMission(){
 let state=fresh(),sequence=0;
 const listeners=new Set();
 const config=()=>getScenario(state.scenario,state.type);
 function snapshot(){
  const scenario=config(),type=BUILDING_TYPES[state.type],canDiagnose=scenario.required.every(id=>state.inspected.includes(id));
  const strategyDetail=scenario.strategies.find(plan=>plan.id===state.strategy)||null;
  const batchKey=state.run?'mission-'+state.type+'-'+state.scenario+'-'+state.run:'';
  const notes=scenario.actions.map(([task,owner,discipline],i)=>{
   const description=task.replaceAll('{space}',type.space)+(i===2&&strategyDetail?.acceptable?'. Delivery plan: '+strategyDetail.record+'.':'');
   return description+' | owner: '+owner+' | discipline: '+discipline;
  }).join('\n');
  return Object.freeze({...state,title:scenario.title,name:type.name,space:type.space,scenarioName:scenario.name,summary:scenario.summary,stateSummary:scenario.stateSummary,context:scenario.context,
   inspected:Object.freeze([...state.inspected]),required:scenario.required,canDiagnose,
   evidence:Object.freeze(state.inspected.map(id=>Object.freeze({id,...scenario.evidence[id]}))),evidenceCatalog:scenario.evidence,diagnoses:scenario.diagnoses,
   strategies:scenario.strategies,strategyDetail,coordinationOptions:scenario.coordination,
   feedback:Object.freeze({...state.feedback}),coordination:state.coordination?Object.freeze({...state.coordination}):null,batchKey,notes,
   source:'Illustrative '+type.name.toLowerCase()+' / '+scenario.name.toLowerCase()+' mission',active:state.stage!=='idle',resolved:['register','complete'].includes(state.stage)});
 }
 function emit(){const value=snapshot();for(const listener of [...listeners])listener(value);return value;}
 function feedback(text,tone='review'){state.feedback={tone,text};return emit();}
 function start(type='office',scenario='airflow'){
  const selected=getScenario(scenario,type);
  state={...fresh(),type,scenario,run:++sequence,stage:'inspect',faultActive:true,feedback:{tone:'quiet',text:selected.initialFeedback}};return emit();
 }
 function inspect(id){
  const scenario=config();
  if(!Object.hasOwn(scenario.evidence,id)||!['inspect','diagnose'].includes(state.stage))return snapshot();
  if(!state.inspected.includes(id))state.inspected.push(id);
  state.stage=scenario.required.every(key=>state.inspected.includes(key))?'diagnose':'inspect';
  return feedback(scenario.evidence[id].detail,state.stage==='diagnose'?'ready':'quiet');
 }
 function diagnose(choice){
  if(!['inspect','diagnose'].includes(state.stage))return snapshot();
  const scenario=config();
  if(!scenario.required.every(id=>state.inspected.includes(id)))return feedback('Collect the required observations first. A symptom or command alone is not a diagnosis.');
  const selected=scenario.diagnoses.find(item=>item.id===choice);
  if(!selected)return feedback('Choose a cause supported by the inspected evidence.');
  if(choice!==scenario.correctDiagnosis)return feedback(selected.feedback);
  state.stage='coordinate';return feedback(selected.feedback+' Bring the finding to the project wall and agree the response.','success');
 }
 function chooseStrategy(id){
  if(state.stage!=='coordinate')return snapshot();
  const strategy=config().strategies.find(plan=>plan.id===id);
  if(!strategy)return feedback('Choose one of the illustrated delivery approaches.');
  state.strategy=id;state.strategyAcknowledged=false;
  return feedback(strategy.acceptable?'Review the programme, continuity and access implications, then acknowledge the planning conditions.':strategy.condition,strategy.acceptable?'quiet':'review');
 }
 function acknowledgeStrategy(acknowledged){
  if(state.stage!=='coordinate')return snapshot();
  const strategy=config().strategies.find(plan=>plan.id===state.strategy);
  if(!strategy?.acceptable){state.strategyAcknowledged=false;return feedback('Choose a defensible delivery approach before acknowledging its trade-offs.');}
  state.strategyAcknowledged=acknowledged===true;
  return feedback(state.strategyAcknowledged?'Planning conditions recorded for this illustration. Assign the technical owner, verification partner and follow-up.':'Review the conditions before committing to this illustrative plan.',state.strategyAcknowledged?'ready':'quiet');
 }
 function coordinate({owner,verifier,action}={}){
  if(state.stage!=='coordinate')return snapshot();
  const scenario=config(),required=scenario.coordination.correct,plan=scenario.strategies.find(item=>item.id===state.strategy);
  if(!plan?.acceptable||!state.strategyAcknowledged)return feedback('Choose a delivery approach and acknowledge its trade-offs before agreeing the response.');
  if(owner!==required.owner)return feedback(scenario.coordination.ownerReason);
  if(verifier!==required.verifier)return feedback(scenario.coordination.verifierReason);
  if(action!==required.action)return feedback(scenario.coordination.actionReason);
  state.coordination={owner,verifier,action,strategy:state.strategy};state.stage='register';state.faultActive=false;
  return feedback('The illustrative response is agreed. The model previews a successfully verified outcome; this does not execute work. Record the owners, plan and remaining checks in the lab.','success');
 }
 function markExported(batchKey){
  if(state.stage!=='register'||batchKey!==snapshot().batchKey)return snapshot();
  state.stage='complete';return feedback('Evidence, ownership and the delivery approach are connected. Your action register has been exported.','success');
 }
 return {start,inspect,diagnose,chooseStrategy,acknowledgeStrategy,coordinate,markExported,
  reset(){state=fresh();return emit();},
  subscribe(listener){if(typeof listener!=='function')throw new TypeError('A mission listener must be a function.');listeners.add(listener);return()=>listeners.delete(listener);},
  get snapshot(){return snapshot();}
 };
}
