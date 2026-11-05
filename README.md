# Giorgi Eradze — The Studio · V2

A personal portfolio built as an explorable Three.js studio. Walk or orbit around the room, inspect the occupied building and its MEP systems, explore the digital lab, and visit the experience and leadership wall.

This is a standalone static export, configured for GitHub Pages at https://eradze3.github.io/.

## V2 interactions

At the model table, select Connections to trace the rooftop AHU’s electrical feeder, supply air, closed cooling-water loop and BMS connection. Select Challenge to compare two cable-tray routes around a fixed duct and a maintenance-access envelope. The displayed route geometry drives the checks. The model and challenge remain illustrative; real client projects will be added separately.

The overlay meshes are instanced, add no shadow casters and avoid bloom or other post-processing. Ambient motion can be paused.

## Hosting

Put these files directly in the repository root, with `index.html`, `.nojekyll`, `assets/`, and `vendor/` at that level. Publish that root through GitHub Pages. Relative asset and module paths support both a domain root and a repository subpath. No build, package installation, backend, or secret is required.

For a local preview, serve this directory over HTTP, for example with `python -m http.server 8000`, then open `http://localhost:8000/`. Opening `index.html` directly as a file can prevent module loading.

New visitors get automatic resolution adjustment with a 1080p ceiling. Saved fixed-quality preferences are preserved. Navigation help offers other resolution settings. Desktop walk mode uses mouse look and WASD or arrow keys; touch uses drag-look and the direction pad. Escape releases mouse look. Resume exploring restores the previous position after entering an area.

## Assets and credits

Three.js and OrbitControls retain their MIT license in `vendor/LICENSE-three.txt`. Material sources and licenses are recorded in `assets/materials/asset-credits.json`. The live package contains the wood and fabric color maps; unused study images, heavy texture maps and rendering addons are omitted. Historical study attribution remains in `assets/tbilisi-night-credits.json`. Optional Google Fonts are loaded externally. The Tbilisi-inspired window is procedural 3D geometry and clouds.

The studio, models, diagrams, and product demonstrations are illustrative. LAYOUT OS is in testing; the workflow demonstrations do not connect to a live product or AI service.
