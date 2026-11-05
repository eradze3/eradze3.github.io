/** One illustrative fault, carried from the building to its coordination response. */
export const MISSION_TYPES=Object.freeze({
  office:{name:'Office',space:'workspace',title:'The workspace needs air.'},
  warehouse:{name:'Warehouse',space:'packing zone',title:'The packing zone needs air.'},
  datacentre:{name:'Data centre',space:'equipment aisle',title:'The equipment aisle needs air.'}
});
export const MISSION_EVIDENCE=Object.freeze({
  diffuser:{title:'Air outlet',detail:'Air movement is low in the affected zone, while the upstream system is running.'},
  damper:{title:'Branch damper',detail:'The branch damper is visibly closed. Its blade is blocking the path to this zone.'},
  sensor:{title:'BMS demand',detail:'The zone is calling for airflow. The command and observed damper position do not agree.'},
  panel:{title:'Equipment status',detail:'The fan reports running and its electrical supply is healthy in this scenario.'}
});
export const MISSION_REQUIRED=Object.freeze(['diffuser','damper','sensor']);
export const MISSION_DIAGNOSES=Object.freeze([
  {id:'damper',title:'The branch damper is closed',detail:'The supply is available, but the local air path is restricted.'},
  {id:'power',title:'The fan has lost electrical power',detail:'Investigate the upstream equipment supply.'},
  {id:'occupancy',title:'The zone has no demand',detail:'Assume the controls intentionally stopped the airflow.'}
]);
const fresh=()=>({stage:'idle',type:'office',run:0,inspected:[],faultActive:false,coordination:null,feedback:{tone:'quiet',text:''}});

export function createMission(){
  let state=fresh(),sequence=0;
  const listeners=new Set();
  function snapshot(){
    const type=MISSION_TYPES[state.type],canDiagnose=MISSION_REQUIRED.every(id=>state.inspected.includes(id));
    const batchKey=state.run?`mission-${state.type}-${state.run}`:'';
    const notes=['Inspect and adjust the '+type.space+' branch damper using the agreed access and isolation procedure | owner: Mechanical team | discipline: HVAC',
      'Verify the BMS command, actuator response and actual damper position for the '+type.space+' | owner: Controls team | discipline: BMS',
      'Record the airflow re-test and coordinate multidisciplinary review before closing the '+type.space+' issue | owner: MEP coordinator | discipline: Coordination'].join('\n');
    return Object.freeze({...state,title:type.title,name:type.name,space:type.space,inspected:Object.freeze([...state.inspected]),required:MISSION_REQUIRED,canDiagnose,
      evidence:Object.freeze(state.inspected.map(id=>Object.freeze({id,...MISSION_EVIDENCE[id]}))),
      feedback:Object.freeze({...state.feedback}),coordination:state.coordination?Object.freeze({...state.coordination}):null,batchKey,notes,
      source:`Illustrative ${type.name.toLowerCase()} mission`,active:state.stage!=='idle',resolved:['register','complete'].includes(state.stage)});
  }
  function emit(){const value=snapshot();for(const listener of [...listeners])listener(value);return value;}
  function feedback(text,tone='review'){state.feedback={tone,text};return emit();}
  function start(type='office'){
    if(!Object.hasOwn(MISSION_TYPES,type))throw new RangeError('Choose office, warehouse or datacentre.');
    state={...fresh(),type,run:++sequence,stage:'inspect',faultActive:true,feedback:{tone:'quiet',text:'Inspect the air outlet, branch damper and BMS demand. Gather the evidence before choosing a cause.'}};return emit();
  }
  function inspect(id){
    if(!Object.hasOwn(MISSION_EVIDENCE,id)||!['inspect','diagnose'].includes(state.stage))return snapshot();
    if(!state.inspected.includes(id))state.inspected.push(id);
    state.stage=MISSION_REQUIRED.every(key=>state.inspected.includes(key))?'diagnose':'inspect';
    return feedback(MISSION_EVIDENCE[id].detail,state.stage==='diagnose'?'ready':'quiet');
  }
  function diagnose(choice){
    if(!['inspect','diagnose'].includes(state.stage))return snapshot();
    if(!MISSION_REQUIRED.every(id=>state.inspected.includes(id)))return feedback('Inspect the outlet, damper and BMS demand first. A symptom alone is not a diagnosis.');
    if(choice==='power')return feedback('The equipment status shows a running fan and a healthy supply. Compare that with the closed branch damper.');
    if(choice==='occupancy')return feedback('The BMS demand is active. Compare the requested airflow with the actual damper position.');
    if(choice!=='damper')return feedback('Choose a cause supported by the inspected evidence.');
    state.stage='coordinate';return feedback('The branch is restricted despite active demand. Take this finding to the project wall and organize the response.','success');
  }
  function coordinate({owner,verifier,action}={}){
    if(state.stage!=='coordinate')return snapshot();
    if(owner!=='mechanical')return feedback('Assign the physical damper and air-path work to the mechanical team. Other disciplines support this response.');
    if(verifier!=='controls')return feedback('Include the controls team to check the command, actuator response and position feedback.');
    if(action!=='verify-and-retest')return feedback('Agree an inspection, controls verification and airflow re-test. Clearing an alarm alone does not establish recovery.');
    state.coordination={owner,verifier,action};state.stage='register';state.faultActive=false;
    return feedback('Response agreed. The model now previews recovery after adjustment and re-test. Capture the follow-up actions in the lab.','success');
  }
  function markExported(batchKey){
    if(state.stage!=='register'||batchKey!==snapshot().batchKey)return snapshot();
    state.stage='complete';return feedback('Evidence, ownership and follow-up are connected. Your action register has been exported.','success');
  }
  return {start,inspect,diagnose,coordinate,markExported,
    reset(){state=fresh();return emit();},
    subscribe(listener){if(typeof listener!=='function')throw new TypeError('A mission listener must be a function.');listeners.add(listener);return()=>listeners.delete(listener);},
    get snapshot(){return snapshot();}
  };
}
