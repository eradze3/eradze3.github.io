# Giorgi Eradze — The Studio · V4

A personal portfolio built as an explorable Three.js studio. Walk or orbit around the room, step inside its building models, investigate MEP systems, try the digital lab, and visit the experience and leadership wall. A lightweight [quick profile](profile.html) presents Giorgi's background, experience, tools and contact details without loading the 3D scene.

This standalone static export is configured for GitHub Pages at https://eradze3.github.io/.

## New in V4

1. **Four building models:** office, warehouse, data centre and hotel, with matching interiors. The hotel distinguishes guestroom fan-coil recirculation, conditioned outdoor air, bathroom extract, hydronic connections, condensate and domestic water/waste services. Guest comfort and data-centre demand remain relevant at night.
2. **An engineering lens:** section the architecture, reveal ceiling services and follow a connected service system. Supply and return paths are distinct; the rendered section does not remove the services being inspected.
3. **Four investigations:** restricted airflow, a served AHU supply loss, conflicting BMS commands and a maintenance-access obstruction. Compare demand, indication and physical evidence before choosing a cause. A ventilation supply-loss scenario does not imply loss of all building power or independent room/rack cooling.
4. **Coordination with trade-offs:** agree an owner, verification partner and response at the project wall. Compare delivery approaches and acknowledge their programme, continuity and access implications before taking the actions to the digital lab.
5. **A sourced engineering notebook:** equipment notes explain airflow, controls, electrical status, hydronic connections and maintainability. Giorgi's own leadership principles appear separately: giving a capable team ownership and moving between the work and the wider view.
6. **A clearer blue studio:** refined surfaces, connected equipment details, inspection tools and performance-conscious geometry retain the interactive studio character.

The models, operating states and investigations are illustrative. They do not provide equipment sizing, compliance clearances, live telemetry or site operating instructions. Real client project case studies will be added separately.

## Continuing features

- **Connected MEP interaction:** trace the office rooftop AHU's electrical feeder, supply and return air, closed cooling-water loop and BMS connection.
- **Coordination challenge:** compare cable-tray routes around a fixed duct and an illustrative maintenance-access envelope. Geometry drives the checks, showing why clearing a clash alone is not enough.
- **Working digital lab:** turn coordination notes into an editable action register, assign owners and disciplines, review actions, mark completion, filter and export CSV. Workstation screens reflect the register's counts. LAYOUT OS and AI workflow previews remain labelled demonstrations.
- **Personal introduction:** explore Giorgi's profile and career, take the guided tour, open the quick profile, download the [CV](assets/giorgi-eradze-cv.pdf), or connect through LinkedIn.
- **Interactive sound:** optional synthesized inspection cues, success tones and quiet ambience respond to interactions. Sound starts off, can be muted, and stops when the tab is hidden. There is no voice narration or downloaded audio.
- **The Tbilisi window:** procedural 3D scenery provides depth as the viewpoint moves.

## Navigation and direct links

The studio supports `#studio`, `#model`, `#connections`, `#challenge`, `#lab`, `#experience`, `#about`, `#tour`, `#inside-office`, `#inside-warehouse`, `#inside-datacentre`, `#inside-hotel` and `#mission`.

Enter the [office](./#inside-office), [warehouse](./#inside-warehouse), [data centre](./#inside-datacentre) or [hotel](./#inside-hotel) directly, or open the [investigation board](./#mission). The [connection experience](./#connections), [coordination challenge](./#challenge), [lab](./#lab) and [guided tour](./#tour) also have direct links. The quick profile is at `profile.html`; the downloadable CV is at `assets/giorgi-eradze-cv.pdf`.

Desktop walk mode uses mouse look and WASD or arrow keys; touch uses drag-look and the direction pad. Escape releases mouse look, and the resume control restores it. Inspect equipment through markers or the inspection controls and return through the studio exit. Interior tool panels can be collapsed or hidden. Tour controls support pause, previous/next and return to exploration. Ambient motion can be paused, and reduced-motion preferences are respected. Enable Sound explicitly for cues and ambience.

## Local tool and privacy

The action-register tool uses deterministic labels and keyword rules, not an AI service. Investigation progress, notes and edited actions remain in the current tab's memory; the tool does not upload them or save them automatically. Reloading resets the demonstration. CSV export creates a local download. Review suggested fields before using the result for real work.

LAYOUT OS is in testing. The portfolio tool and scripted OS/AI previews are separate from that product and have no connection to a live product or AI service. Quality preferences may be stored locally in the browser. Optional Google Fonts are requested externally; LinkedIn and engineering references open through their links.

## Hosting and performance

Put these files directly in the repository root, with `index.html`, `.nojekyll`, `profile.html`, `assets/` and `vendor/` at that level. Publish the root through GitHub Pages. Relative asset and module links support both a domain root and a repository subpath. No build, package installation, backend or secret is required.

For a local preview, serve this directory over HTTP, for example with `python -m http.server 8000`, then open `http://localhost:8000/`. Opening `index.html` directly as a file can prevent module loading.

New visitors get automatic resolution adjustment with a 1080p ceiling. Saved fixed-quality preferences are preserved; navigation help offers other resolutions. Shared geometry and instancing limit draw calls, without bloom or other post-processing. Workstation canvases update when their content changes. Interiors load on demand, and their building resources are released on exit or type change. The studio pauses while an interior or another modal is open, so only the active scene renders. Hidden tabs stop rendering and sound. Actual frame rate depends on the device and chosen quality.

## Assets and credits

Three.js and OrbitControls retain their MIT license in `vendor/LICENSE-three.txt`. Material sources and licenses are recorded in `assets/materials/asset-credits.json`. The package includes wood and fabric colour maps, Giorgi's portrait and CV. Unused study images, heavy texture maps and rendering add-ons are omitted. Historical study attribution remains in `assets/tbilisi-night-credits.json`; the visible window uses procedural 3D geometry and clouds.

Engineering notes link to primary ASHRAE, manufacturer and CIBSE references. They explain concepts without claiming that these illustrative models replicate a certified design.
