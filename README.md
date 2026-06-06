# Emergent Choirforge — demo

This is a small playable demo prototype for the Emergent Choirforge concept.

How to run

- Open `index.html` in a modern browser (Chrome/Edge/Firefox). For full functionality (record/download) serve via a local HTTP server:

```bash
cd C:\Users\shuab\Documents\EmergentChoirforge
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Notes
- Built with Tone.js for quick audio prototyping.
- Contains simple macros, presets, a visualiser, and a record button.
- This is a starting point — the full Rack plugin or advanced synth would require deeper DSP and UI work.

Next steps
- Add formant/wavetable-based choir oscillator
- Implement step-sequencer and tempo-synced LFOs
- Improve visuals with WebGL/Three.js for biotechy look
- Add preset sharing and export

Embeddable widget
- `widget.html` is a lightweight embeddable page that reuses the same engine with a smaller UI.
- Embed example (host the folder and point the iframe to `widget.html`):

```html
<iframe src="https://your-host/emergent/widget.html?preset=BASE64" width="800" height="360"></iframe>
```

Preset sharing (implemented)
- Copy Preset Link: copies a URL with the current macro state encoded in the `preset` query parameter.
- Export/Import: download/upload a JSON file with the current preset state.

## Release Notes (v0.1)

- Prototype: Emergent Choirforge playable web demo using Tone.js + Three.js.
- Features implemented:
	- Formant-style choir voices (soprano/alto/tenor/bass) with humanize/blend.
	- Reese and metal engines, reverb, and drive chains.
	- Four macro controls: Sanctify/Corrupt, Gravity, Pulse, Swarm.
	- 16-step sequencer with per-step pitch and velocity, tempo-synced LFO (musical subdivisions).
	- Preset system: built-in presets, copy preset link, export/import JSON, URL-encoded presets.
	- Visuals: WebGL Three.js pulsing sphere reacting to audio (biotech starting point).
	- Recording: simple Record → Download (webm) via MediaStreamDestination.
	- Embeddable `widget.html` for iframe demos.

## Packaging & Local Serve

You can serve and package the demo locally. Two helper scripts are included for Windows PowerShell and a POSIX shell.

PowerShell (Windows)

```powershell
Set-Location 'C:\Users\shuab\Documents\EmergentChoirforge'
.\serve.ps1      # starts a local static server on port 8000
.\package.ps1    # creates emergent-choirforge.zip containing the demo files
```

POSIX (Linux/macOS / Git Bash)

```bash
./serve.sh        # starts a local static server on port 8000 (requires python or node)
./package.sh      # creates emergent-choirforge.zip via zip
```

After starting the server open:

```
http://localhost:8000
```

## GitHub Pages Deployment

This demo can be deployed automatically with GitHub Pages.

1. Create a GitHub repository and push this project.
2. Add the GitHub Actions workflow file at `.github/workflows/deploy.yml`.
3. Enable Pages to serve from the `gh-pages` branch in repository settings, or use the default GitHub Pages site URL.

Use the sample workflow included below to publish the demo whenever you push to `main`.

### Local deployment steps

```powershell
Set-Location 'C:\Users\shuab\Documents\EmergentChoirforge'
git init
git add .
git commit -m "Initial Emergent Choirforge demo"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

Once the repository is on GitHub, the workflow will deploy the site automatically.

The packaged ZIP file is created as `emergent-choirforge.zip` by `package.ps1` / `package.sh`.

The workflow deploys only the demo assets (`index.html`, `widget.html`, `css/`, `js/`) to the `gh-pages` branch, keeping the published site clean.

## Embed the widget

Host the folder and embed `widget.html` inside an iframe. You can include a `preset` parameter with a base64-encoded preset to load a specific state:

```html
<iframe src="https://your-host/emergent/widget.html?preset=BASE64" width="800" height="360"></iframe>
```

## Where to go next

- Improve choir realism with wavetable or sample-based formants.
- Enhance visuals (veins, tentacles, animated macro tendrils) with Three.js shaders.
- Add pattern chaining, per-step pitch lanes, and preset-pattern sharing links.
