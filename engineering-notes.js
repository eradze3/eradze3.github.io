// Neutral review prompts, not personal quotations or project-specific design criteria.
const sources={
  air:{title:'ASHRAE · Air handling and distribution',url:'https://handbook.ashrae.org/handbooks/S20/IP/s20_ch04/s20_ch04_ip.aspx'},
  damper:{title:'Trane · Damper control diagnostics',url:'https://support.trane.com/hc/en-us/articles/41116338832525-IntelliPak-Symbio-800-Damper-Control-Related-Diagnostics'},
  airflow:{title:'Siemens · Airflow proof',url:'https://support.industry.siemens.com/cs/attachments/109787178/45023.pdf'},
  access:{title:'Daikin · Horizontal fan coil installation and maintenance',url:'https://tahoeweb.daikinapplied.com/api/general/DownloadDocumentByName/media/IM%201152-9%20%28Online%29.pdf/'},
  fcu:{title:'CIBSE · Fan coils and room conditioning',url:'https://www.cibsejournal.com/cpd/modules/2016-10-fan/'},
  outdoor:{title:'Trane · Dedicated outdoor air systems',url:'https://www.trane.com/commercial/north-america/us/en/about-us/newsroom/glossary/dedicated-outdoor-air-system.html'},
  hotel:{title:'CIBSE · Hotel services case study',url:'https://www.cibsejournal.com/case-studies/from-boardoom-to-boutique-converting-80s-offices-into-a-stylish-hotel/'},
  waste:{title:'Wavin · Soil, waste and drainage stacks',url:'https://blog.wavin.com/en-gb/connecting-soil-and-waste-pipes-to-below-ground-drainage'}
};
const note=(title,body,checks,source)=>Object.freeze({title,body,checks:Object.freeze(checks),source:Object.freeze({...sources[source]}),attribution:'Engineering review note',illustrative:true});
const common={
  diffuser:note('Follow air all the way to the space.','A connected supply route needs a defined return or extract path. Room use, occupancy and the air-distribution arrangement inform the design; a coloured duct alone cannot establish performance.',[
    'Trace the supply connection to the terminal.',
    'Identify the separate return or extract route.',
    'Check the occupied zone, rather than only the plant status.'
  ],'air'),
  damper:note('Command, feedback and position are different evidence.','An actuator command describes an intended action. Feedback and the physical blade position help show whether that action happened. The scenario distinguishes a mechanical restriction from a control-command conflict.',[
    'Compare the requested state with the reported position.',
    'Relate the observation to the local airflow symptom.',
    'Keep mechanical and controls responsibilities connected.'
  ],'damper'),
  sensor:note('A demand signal is part of the explanation.','Room demand, control command and actual response belong to the same sequence. A displayed demand does not by itself prove that the terminal is delivering air.',[
    'Read the scenario evidence before selecting a cause.',
    'Distinguish a command conflict from a stuck component.',
    'Use an agreed sequence and independent observations.'
  ],'damper'),
  panel:note('Running status is not delivered airflow.','Equipment status and airflow proof answer different questions. A running upstream fan can coexist with a restricted downstream branch; loss of the fan supply is a different condition.',[
    'Keep the supply, fan-status and airflow indications distinct.',
    'Check which zones share the affected equipment.',
    'Treat the displayed status as a simulated observation.'
  ],'airflow'),
  access:note('Space for installation is not enough.','A maintainable arrangement also considers access to filters, valves, fans and drain connections. The highlighted envelope is a coordination allowance, not a universal clearance requirement.',[
    'Check the selected manufacturer’s access requirements.',
    'Allow a practical inspection and replacement route.',
    'Coordinate the ceiling opening with adjacent services.'
  ],'access'),
  return:note('Show where the air goes next.','Supply and return paths form an air-distribution system. Extract serves a different purpose and must be identified separately where the design calls for discharge outdoors.',[
    'Read the flow direction and service label together.',
    'Preserve the intended path when changing the layout.'
  ],'air'),
  hydronic:note('Keep the water circuit closed.','A hydronic coil has supply and return connections. Condensate drainage is a separate route and should not be shown as another connection to the heating or cooling loop.',[
    'Follow both water connections to the coil.',
    'Keep valves and drain provisions accessible.',
    'Review the equipment-specific piping arrangement.'
  ],'access'),
  fcu:note('Separate room conditioning from ventilation.','A fan coil can recirculate and condition room air. A separate outdoor-air system provides ventilation in this illustrative arrangement. The two functions remain visible even when they serve the same room.',[
    'Identify the room-air return and conditioned-air outlet.',
    'Locate the separate outdoor-air connection.',
    'Coordinate fan, coil, filter and condensate access.'
  ],'fcu'),
  wetcore:note('Give wastewater a continuous route.','Soil and waste branches discharge to a stack and onward to drainage. The stack’s ventilation and the fixtures’ trap arrangements are part of the design, alongside hot- and cold-water distribution.',[
    'Distinguish supply pipes from discharge pipes.',
    'Keep the stack continuous between floors.',
    'Coordinate access and acoustic treatment with the room layout.'
  ],'waste')
};
const hotel={
  diffuser:note('Three air paths, three functions.','This hotel concept separates outdoor-air supply, fan-coil room recirculation and bathroom extract. They should not appear as one shared air loop.',[
    'Outdoor air reaches the guestroom.',
    'The FCU returns room air for conditioning.',
    'Bathroom extract connects to its own exhaust route.'
  ],'hotel'),
  sensor:note('A hotel room is an occupied zone at night.','The hotel scenario retains guestroom ventilation and local comfort control through the night. Occupancy-based operation depends on the agreed design; it is not a whole-building shutdown.',[
    'Distinguish room occupancy from time of day.',
    'Keep the local comfort system and ventilation roles clear.',
    'Show a reviewed control response rather than assumed savings.'
  ],'hotel'),
  outdoor:note('Ventilation has its own path.','The dedicated outdoor-air system conditions ventilation air separately from local room heating and cooling. The model uses distinct routes so that these functions can be inspected independently.',[
    'Follow the outdoor-air route to the guestroom.',
    'Keep it distinct from FCU recirculation and bathroom extract.'
  ],'outdoor')
};

export const ENGINEERING_NOTE_IDS=Object.freeze(['diffuser','damper','sensor','panel','access','return','hydronic','fcu','wetcore']);
// Giorgi supplied these principles in this conversation; separate from sourced technical notes.
export const LEADERSHIP_PRINCIPLES=Object.freeze([
  Object.freeze({title:'Ownership when the path is known',body:'When a team already knows how to solve a problem, my role is to give them ownership. Leadership becomes essential when the challenge is unfamiliar—and then I work alongside the team to find a way forward.'}),
  Object.freeze({title:'The dance floor and the balcony',body:'A leader needs both perspectives: the dance floor and the balcony. Join the team in the work, then step back to see the wider pattern—who is in rhythm, where coordination is breaking down, and who needs support.'})
]);
export function getEngineeringNotes(type='office',id='diffuser'){
  const aliases={ahu:'panel',electrical:'panel',controls:'sensor',water:'hydronic',plumbing:'wetcore',drain:'wetcore',coil:'fcu',exhaust:'return',clearance:'access'};
  const key=aliases[id]||id;
  return (type==='hotel'&&hotel[key])||common[key]||common.diffuser;
}
