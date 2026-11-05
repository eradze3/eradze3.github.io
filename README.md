# Giorgi Eradze — The Studio · V3

A personal portfolio built as an explorable Three.js studio. Walk or orbit around the room, step inside its building models, investigate MEP systems, try the digital lab, and visit the experience and leadership wall. A lightweight [quick profile](profile.html) also presents Giorgi's background, experience, tools and contact details without loading the 3D scene.

This standalone static export is configured for GitHub Pages at https://eradze3.github.io/.

## New in V3

1. **Step inside the model:** enter an office, warehouse or data centre at room scale. Explore occupied areas, reveal ceiling services, inspect equipment and use walk mode or preset viewpoints.
2. **A building through the day:** switch between startup, busy hours and night to see lighting, airflow and controls respond. The data centre keeps cooling and monitoring active at night. These are illustrative operating scenarios, not live building data or calculated design results.
3. **A connected engineering investigation:** collect evidence of an airflow fault, identify its cause, coordinate the response and verification at the project wall, then carry the resulting actions into the digital lab and export a register.
4. **Interactive sound:** optional synthesized clicks, inspection cues, success tones and quiet ventilation or server ambience respond to interactions. Sound starts off, has volume and mute controls, and stops when the tab is hidden. There is no voice narration or downloaded audio.
5. **Three actual model types:** switch the studio table between an office, a warehouse with storage and long-span structure, and a data centre with visible racks and cooling. Each connects to its matching interior.

Real client project case studies will be added separately. The models, interiors and investigations are illustrative.

## Continuing from V2

- **Connected MEP interaction:** trace the rooftop AHU's electrical feeder, supply air, closed cooling-water loop and BMS connection, with explanations tied to the office model.
- **Coordination challenge:** compare cable-tray routes around a fixed duct and a maintenance-access envelope. The displayed geometry drives the checks, showing why clearing a clash alone is not enough.
- **Working digital lab:** turn coordination notes into an editable action register, assign owners and disciplines, review actions, mark completion, filter the register and export CSV. The physical workstation screens reflect the register's real counts. LAYOUT OS and AI workflow previews remain clearly labelled demonstrations.
- **Personal introduction:** explore Giorgi's profile and career, take the 60-second guided tour, open the quick profile, download the [CV](assets/giorgi-eradze-cv.pdf), or connect through LinkedIn.
- **The blue studio:** crisp material contrast, restrained selection accents, direct links, a procedural Tbilisi-inspired window and adaptive rendering.

## Navigation and direct links

The studio supports `#studio`, `#model`, `#connections`, `#challenge`, `#lab`, `#experience`, `#about`, `#tour`, `#inside-office`, `#inside-warehouse`, `#inside-datacentre` and `#mission`.

Enter the [office](./#inside-office), [warehouse](./#inside-warehouse) or [data centre](./#inside-datacentre) directly, or open the [investigation board](./#mission). The [connection experience](./#connections), [coordination challenge](./#challenge), [lab](./#lab) and [guided tour](./#tour) also have direct links. The quick profile is at `profile.html`; the downloadable CV is at `assets/giorgi-eradze-cv.pdf`.

Desktop walk mode uses mouse look and WASD or arrow keys; touch uses drag-look and the direction pad. Escape releases mouse look, and the resume control restores it. In an interior, inspect equipment through the markers or the inspection controls, and return using the studio exit. Tour controls allow visitors to pause, step backward or forward, and return to exploration. Ambient motion can be paused, and reduced-motion preferences are respected. Enable Sound explicitly if you want interaction cues and ambience.

## Local tool and privacy

The action-register tool uses deterministic labels and keyword rules, not an AI service. Investigation progress, notes and edited actions remain in the current tab's memory; the tool does not upload them or save them automatically. Reloading the page resets the demonstration. CSV export creates a local download. Review the suggested fields before using the result for real work.

LAYOUT OS is in testing. The portfolio tool and the scripted OS/AI previews are separate from that product and have no connection to a live product or AI service. Quality preferences may be stored locally in the browser. Optional Google Fonts are requested externally, and LinkedIn opens only through its links.

## Hosting and performance

Put these files directly in the repository root, with `index.html`, `.nojekyll`, `profile.html`, `assets/` and `vendor/` at that level. Publish the root through GitHub Pages. Relative asset, module and directory links support both a domain root and a repository subpath. No build, package installation, backend or secret is required.

For a local preview, serve this directory over HTTP, for example with `python -m http.server 8000`, then open `http://localhost:8000/`. Opening `index.html` directly as a file can prevent module loading.

New visitors get automatic resolution adjustment with a 1080p ceiling. Saved fixed-quality preferences are preserved, and navigation help offers other resolution settings. The MEP overlay and sector models use instancing, add no shadow casters, and avoid bloom or other post-processing. Workstation canvases update only when their content changes. Interiors load on demand; their building resources are released on exit or a type change. The studio pauses while an interior or another modal is open, so only the active scene renders. Hidden tabs stop rendering and sound. Actual frame rate depends on the device and chosen quality.

## Assets and credits

Three.js and OrbitControls retain their MIT license in `vendor/LICENSE-three.txt`. Material sources and licenses are recorded in `assets/materials/asset-credits.json`. The package includes the wood and fabric colour maps, Giorgi's portrait and the CV. Unused study images, heavy texture maps and rendering add-ons are omitted. Historical study attribution remains in `assets/tbilisi-night-credits.json`; the visible window uses procedural 3D geometry and clouds.

The studio, models, interiors and engineering challenges are illustrative experiences, not real client project case studies or an engineering design approval tool.
