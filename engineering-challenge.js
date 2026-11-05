/** V2 coordination exercise. Coordinates are illustrative model units, not design dimensions. */
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

// The renderer and evaluator share these exact paths and volumes. Tray half extents
// also expand the collision bounds, so a clear centreline alone does not pass.
export const CHALLENGE_GEOMETRY = freeze({
  duct: {min: [-.28, .72, -.55], max: [.28, .90, .55]},
  access: {min: [-.28, .30, -.55], max: [.28, .62, .55]},
  trayHalfWidth: .045,
  trayHalfHeight: .035,
  routes: {
    existing: [[-1, .81, 0], [1, .81, 0]],
    lower: [[-1, .81, 0], [-.65, .81, 0], [-.65, .49, 0], [.65, .49, 0], [.65, .81, 0], [1, .81, 0]],
    bypass: [[-1, .81, 0], [-.52, .81, 0], [-.52, .81, .82], [.52, .81, .82], [.52, .81, 0], [1, .81, 0]]
  }
});

export const CHALLENGE = freeze({
  id: 'ceiling-coordination',
  title: 'Clear the clash. Keep the access.',
  intro: 'A cable tray crosses a fixed ventilation duct. Compare two routes and decide which one works with the space reserved for maintenance.',
  brief: 'The duct stays. The tray must reach the same two connection points. The amber volume below the duct is reserved for service access.',
  constraints: [
    {id: 'connections', label: 'Keep both connections', detail: 'The tray must still connect the two marked endpoints.'},
    {id: 'duct', label: 'Clear the fixed duct', detail: 'The complete tray must pass outside the cyan duct.'},
    {id: 'access', label: 'Preserve service access', detail: 'Keep the amber maintenance volume clear, including the tray width and depth.'}
  ],
  choices: [
    {id: 'lower', title: 'A · Lower the tray', summary: 'Drop below the duct, then rise to the original connection.'},
    {id: 'bypass', title: 'B · Route around it', summary: 'Keep the level and take a longer route around the duct.'}
  ],
  note: 'Illustrative coordination exercise. It checks these three constraints only; a real design also needs discipline review, supports, bend radii and project requirements.',
  decisionPrompt: 'Which route would you take forward for coordination review?'
});

const nearlyEqual = (a, b) => a.every((n, i) => Math.abs(n - b[i]) < 1e-9);
const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));
const lengthOf = points => points.slice(1).reduce((sum, p, i) => sum + distance(points[i], p), 0);

function segmentIntersectsBox(a, b, bounds) {
  // Slab intersection works for each continuous segment, including vertical drops.
  // Touching a bound counts as an obstruction, rather than zero-clearance success.
  const half = [CHALLENGE_GEOMETRY.trayHalfWidth, CHALLENGE_GEOMETRY.trayHalfHeight, CHALLENGE_GEOMETRY.trayHalfWidth];
  let entry = 0, exit = 1;
  for (let axis = 0; axis < 3; axis++) {
    const min = bounds.min[axis] - half[axis], max = bounds.max[axis] + half[axis];
    const delta = b[axis] - a[axis];
    if (Math.abs(delta) < 1e-12) {
      if (a[axis] < min || a[axis] > max) return false;
    } else {
      const t1 = (min - a[axis]) / delta, t2 = (max - a[axis]) / delta;
      entry = Math.max(entry, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (entry > exit) return false;
    }
  }
  return true;
}

/** Evaluate an actual path; exported so geometry/path changes can be regression-tested. */
export function inspectPath(points) {
  if (!Array.isArray(points) || points.length < 2 || !points.every(p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite))) {
    throw new TypeError('A route needs at least two finite [x, y, z] points.');
  }
  const original = CHALLENGE_GEOMETRY.routes.existing;
  const hits = bounds => points.slice(1).some((point, i) => segmentIntersectsBox(points[i], point, bounds));
  return {
    connections: nearlyEqual(points[0], original[0]) && nearlyEqual(points.at(-1), original.at(-1)),
    ductClear: !hits(CHALLENGE_GEOMETRY.duct),
    accessClear: !hits(CHALLENGE_GEOMETRY.access),
    length: lengthOf(points)
  };
}

/** The verdict is derived from shared geometry, rather than a hard-coded winning ID. */
export function evaluateRoute(id) {
  const points = CHALLENGE_GEOMETRY.routes[id];
  if (!points) throw new RangeError(`Unknown coordination route: ${id}`);
  const result = inspectPath(points);
  const accepted = result.connections && result.ductClear && result.accessClear;
  const explanations = {
    existing: 'The tray passes through the duct. The connection points work, but the route cannot stay as drawn.',
    lower: 'Lowering clears the duct, but the tray now occupies the reserved maintenance space. Clearing one clash has created an access problem.',
    bypass: 'The lateral route clears both the duct and its access space while keeping the endpoints. It is longer, so supports and bends would be coordinated before approval.'
  };
  return {
    id,
    title: CHALLENGE.choices.find(choice => choice.id === id)?.title || 'Original route',
    accepted,
    verdict: accepted ? 'Ready for coordination review' : 'Needs another route',
    checks: [
      {id: 'connections', label: 'Both connections retained', passed: result.connections, detail: result.connections ? 'The start and end positions are unchanged.' : 'A connection point has moved.'},
      {id: 'duct', label: 'Fixed duct clear', passed: result.ductClear, detail: result.ductClear ? 'The tray clears the cyan duct.' : 'The tray intersects the cyan duct.'},
      {id: 'access', label: 'Service access clear', passed: result.accessClear, detail: result.accessClear ? 'The amber access volume remains clear.' : 'The tray enters the amber access volume.'}
    ],
    explanation: explanations[id],
    nextStep: accepted ? 'Carry this option into a multidisciplinary review.' : 'Compare the other option, then choose again.',
    length: result.length,
    extraLength: result.length - lengthOf(CHALLENGE_GEOMETRY.routes.existing)
  };
}

export const TRACE_SYSTEMS = freeze({
  all: {
    label: 'All connections', color: '#a1e5ed', title: 'One AHU. Four connected systems.',
    description: 'Follow the services that let this air-handling unit do its job. Each connection has a different role; the building needs them to work together.',
    steps: ['Electrical supply', 'Air distribution', 'Cooling-water loop', 'BMS control'],
    detail: 'Select a connection to follow its route through the model. The cooling-water circuit is separate from domestic plumbing.'
  },
  electrical: {
    label: 'Electrical', color: '#ffcb3f', title: 'Power reaches the equipment.',
    description: 'Follow the electrical feeder up the riser to the AHU. Power supplies its fans and associated equipment.',
    steps: ['Distribution', 'Electrical riser', 'AHU supply'],
    detail: 'An operational AHU needs the electrical and mechanical interfaces coordinated together.'
  },
  hvac: {
    label: 'Air', color: '#1dd1e6', title: 'Air reaches the occupied space.',
    description: 'Follow the supply-air path from the AHU into the vertical duct, then along the upper-floor branch to a diffuser.',
    steps: ['Air-handling unit', 'Vertical duct', 'Floor branch', 'Room diffuser'],
    detail: 'This view traces one supply-air path. Return air and other ventilation components are outside this simplified connection view.'
  },
  water: {
    label: 'Cooling water', color: '#579dff', title: 'A loop carries cooling to the coil.',
    description: 'Trace the supply and return between the cooling plant and the AHU coil. Both legs belong to the same hydronic circuit.',
    steps: ['Cooling plant', 'Supply to coil', 'Return to plant'],
    detail: 'This is cooling water for HVAC, separate from the building’s domestic-water and fire-protection systems.'
  },
  bms: {
    label: 'BMS', color: '#50ee88', title: 'Control and feedback complete the connection.',
    description: 'Follow the signal connection between the controller and the AHU. Commands, equipment status and feedback support coordinated operation.',
    steps: ['BMS controller', 'AHU control interface', 'Status feedback'],
    detail: 'Animated pulses explain the connection. They are illustrative signals, not live sensor readings.'
  }
});
