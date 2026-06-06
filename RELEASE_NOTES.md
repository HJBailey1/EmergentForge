# Emergent Choirforge — Release Notes v0.1

Date: 2026-06-04

Summary
- Initial playable web prototype demonstrating the Emergent Choirforge concept.

Highlights
- Formant-style choir voices with soprano/alto/tenor/bass presets.
- Reese (D&B) and metal synth layers, distortion and reverb.
- 16-step sequencer with per-step pitch and velocity editing.
- Tempo-synced LFO with musical subdivision rates and target routing.
- Preset sharing: URL-encoded presets, copy link, export/import JSON.
- Embeddable `widget.html` for iframe demos.
- Three.js pulsing sphere visual reacting to audio levels.
- GitHub Pages deployment workflow for automated publishing.

Files of interest
- `index.html` — full demo UI
- `widget.html` — compact embeddable widget
- `js/app.js` — synth engine, sequencer, presets, visuals
- `css/style.css` — styles
- `README.md` — run and embed instructions
- `serve.ps1`, `serve.sh`, `package.ps1`, `package.sh` — helpers for serve/package

Notes
- This is a prototype for iteration and sharing; future work includes wavetable/sampled formants, improved visuals, and expanded preset/pattern sharing.