# Giorgi Eradze — The Studio · V2

A personal portfolio built as an explorable Three.js studio. Walk or orbit around the room, inspect the building and its MEP systems, try the digital lab, and visit the experience and leadership wall. A lightweight [quick profile](profile.html) also presents Giorgi's background, experience, tools and contact details without loading the 3D scene.

This standalone static export is configured for GitHub Pages at https://eradze3.github.io/.

## V2 features

V2 includes the five additions numbered 2–6 in the portfolio plan. Real client project case studies will be added separately; the current studio model is illustrative.

2. **Connected MEP interaction:** trace the rooftop AHU's electrical feeder, supply air, closed cooling-water loop and BMS connection, with system explanations tied to the 3D model.
3. **Engineering challenge:** compare cable-tray routes around a fixed duct and a maintenance-access envelope. The displayed route geometry drives the checks, showing why clearing a clash alone is not enough.
4. **Working digital lab:** turn coordination notes into an editable action register, assign owners and disciplines, review actions, mark completion, filter the register and export CSV. The physical workstation screens reflect the register's real counts. LAYOUT OS and AI workflow previews remain clearly labelled demonstrations.
5. **Personal introduction:** explore Giorgi's profile and career, use the 60-second guided tour with pause, previous and next controls, open the quick profile, download the [CV](assets/giorgi-eradze-cv.pdf), or connect through LinkedIn.
6. **Visual and navigation polish:** retain the blue studio with sharper material contrast, restrained hover and selection accents, direct links to experiences, a procedural Tbilisi-inspired window and adaptive rendering for smooth interaction.

## Navigation and direct links

The studio supports `#studio`, `#model`, `#connections`, `#challenge`, `#lab`, `#experience`, `#about` and `#tour`. For example, [the connection experience](./#connections), [the challenge](./#challenge), [the lab](./#lab) and [the guided tour](./#tour) open directly. The quick profile is at `profile.html`; the downloadable CV is at `assets/giorgi-eradze-cv.pdf`.

Desktop walk mode uses mouse look and WASD or arrow keys; touch uses drag-look and the direction pad. Escape releases mouse look. Resume exploring restores the previous position after entering an area. Tour controls allow visitors to pause, step backward or forward, and return to exploration. Ambient motion can also be paused, and reduced-motion preferences are respected.

## Local tool and privacy

The action-register tool uses deterministic labels and keyword rules, not an AI service. Notes and edited actions remain in the current tab's memory; the tool does not upload them or save them automatically. Reloading the page resets the demonstration. CSV export creates a local download. Review the suggested fields before using the result for real work.

LAYOUT OS is in testing. The portfolio tool and the scripted OS/AI previews are separate from that product and have no connection to a live product or AI service. Quality preferences may be stored locally in the browser. Optional Google Fonts are requested externally, and LinkedIn opens only through its links.

## Hosting and performance

Put these files directly in the repository root, with `index.html`, `.nojekyll`, `profile.html`, `assets/` and `vendor/` at that level. Publish the root through GitHub Pages. Relative asset, module and directory links support both a domain root and a repository subpath. No build, package installation, backend or secret is required.

For a local preview, serve this directory over HTTP, for example with `python -m http.server 8000`, then open `http://localhost:8000/`. Opening `index.html` directly as a file can prevent module loading.

New visitors get automatic resolution adjustment with a 1080p ceiling. Saved fixed-quality preferences are preserved, and navigation help offers other resolution settings. The MEP overlay meshes are instanced, add no shadow casters, and avoid bloom or other post-processing. Workstation canvases update only when their content changes. Rendering pauses while the tab is hidden or a modal is open. Actual frame rate depends on the device and chosen quality.

## Assets and credits

Three.js and OrbitControls retain their MIT license in `vendor/LICENSE-three.txt`. Material sources and licenses are recorded in `assets/materials/asset-credits.json`. The package includes the wood and fabric colour maps, Giorgi's portrait and the CV. Unused study images, heavy texture maps and rendering add-ons are omitted. Historical study attribution remains in `assets/tbilisi-night-credits.json`; the visible window uses procedural 3D geometry and clouds.

The studio, model and engineering challenge are illustrative experiences, not real client project case studies or an engineering design approval tool.
