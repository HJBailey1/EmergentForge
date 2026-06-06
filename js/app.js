document.addEventListener('DOMContentLoaded', async () => {
  const ctx = Tone;

  // Basic routing
  const master = new Tone.Gain(0.9).toDestination();
  const analyser = new Tone.Analyser('waveform', 512);
  master.connect(analyser);

  // Choir engine: formant-style multi-voice choir with humanize and blend
  const choirVoices = 4;
  const choirChorus = new Tone.Chorus(0.5, 2.5, 0.4).start();
  const choirFilter = new Tone.Filter(800, 'lowpass');
  choirChorus.connect(choirFilter);
  choirFilter.connect(master);

  // formant presets (rough soprano/alto/tenor/bass formant centers)
  const formants = {
    soprano: [900, 2500, 3200],
    alto: [700, 1800, 2600],
    tenor: [500, 1400, 2400],
    bass: [150, 500, 900]
  };

  function createChoirVoice(type, mode='formant', wavetable='saw', sampleUrl=null){
    // returns an object with either synth/f1-f3 for formant/wavetable, or player for sample
    if (mode === 'wavetable'){
      // simple partial sets for common wavetables
      const partialsMap = {
        saw: [1, 0.5, 0.33, 0.25, 0.2, 0.166, 0.14, 0.125],
        square: [0,1,0,1/3,0,1/5,0,1/7],
        triangle: [0,0,1/9,0,1/25,0,1/49,0]
      };
      const partials = partialsMap[wavetable] || partialsMap['saw'];
      const synth = new Tone.Synth({
        oscillator: { partials: partials },
        envelope: { attack: 0.08, decay: 0.25, sustain: 0.8, release: 1.6 }
      });
      synth.chain(choirChorus);
      return { synth };
    }
    if (mode === 'sample' && sampleUrl){
      const player = new Tone.Player(sampleUrl, () => {}).toDestination();
      player.chain(choirChorus);
      return { player };
    }
    // default: formant bank
    const synth = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.12, decay: 0.3, sustain: 0.75, release: 1.5 }
    });
    // small formant bank: three bandpass filters in series
    const f1 = new Tone.Filter(formants[type][0], 'bandpass', -6);
    const f2 = new Tone.Filter(formants[type][1], 'bandpass', -6);
    const f3 = new Tone.Filter(formants[type][2], 'bandpass', -6);
    synth.chain(f1, f2, f3, choirChorus);
    return { synth, f1, f2, f3 };
  }

  let choirType = 'soprano';
  let choirMode = 'formant';
  let wavetableType = 'saw';
  let sampleUrl = null;
  const choirVoicesArr = [];
  function rebuildChoirVoices(){
    // dispose old voices
    while (choirVoicesArr.length) {
      const v = choirVoicesArr.pop();
      if (v.synth && v.synth.dispose) try{ v.synth.dispose(); }catch(e){}
      if (v.player && v.player.dispose) try{ v.player.dispose(); }catch(e){}
      if (v.f1 && v.f1.dispose) try{ v.f1.dispose(); }catch(e){}
      if (v.f2 && v.f2.dispose) try{ v.f2.dispose(); }catch(e){}
      if (v.f3 && v.f3.dispose) try{ v.f3.dispose(); }catch(e){}
    }
    for (let i=0;i<choirVoices;i++){
      choirVoicesArr.push(createChoirVoice(choirType, choirMode, wavetableType, sampleUrl));
    }
  }
  rebuildChoirVoices();

  const choir = {
    triggerAttackRelease(notes, dur, time){
      // notes can be array - trigger each voice on each note (poly-ish)
      notes = Array.isArray(notes) ? notes : [notes];
      for (let idx=0; idx<choirVoicesArr.length; idx++){
        const voice = choirVoicesArr[idx];
        const note = notes[idx % notes.length];
        // slight humanize detune per voice
        const detune = (Math.random()-0.5) * 8 * (1 + (typeof choirBlend === 'number' ? choirBlend : 0) * 2); // cents
        if (voice.synth){
          try{ voice.synth.detune.value = detune; } catch(e){}
          voice.synth.triggerAttackRelease(note, dur, time);
        } else if (voice.player){
          // sample playback (not pitch-shifted)
          try{ voice.player.start(time); voice.player.stop(time + Tone.Time(dur).toSeconds()); } catch(e){}
        }
      }
    },
    set release(val){ choirVoicesArr.forEach(v=>{ if (v.synth && v.synth.envelope) v.synth.envelope.release = val; }); },
    set volumeVal(v){ choirVoicesArr.forEach(vo=>{ if (vo.synth) vo.synth.volume.value = v; if (vo.player && vo.player.volume) vo.player.volume.value = v; }); }
  };

  // Techno / reese engine
  const reese = new Tone.PolySynth(2, Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.5 }
  });
  const reeseFilter = new Tone.Filter(1200, 'lowpass');
  const reeseDrive = new Tone.Distortion(0.2);
  reese.chain(reeseDrive, reeseFilter, master);

  // Metal power-chord oscillator (simple stacked detuned voices)
  const metal = new Tone.PolySynth(3, Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.6, release: 0.6 }
  });
  const metalDrive = new Tone.Distortion(0.6);
  const metalFilter = new Tone.Filter(1400, 'highpass');
  metal.chain(metalDrive, metalFilter, master);

  // reverb space
  const reverb = new Tone.Reverb({ decay: 3.6, wet: 0.25 }).toDestination();
  master.connect(reverb);

  // simple transport pattern (chords + bass movement)
  const chordSeq = new Tone.Loop(time => {
    const now = Tone.now();
    choir.triggerAttackRelease(['C4','E4','G4'], '2n', now);
    reese.triggerAttackRelease(['C2'], '2n', now + 0.5);
  }, '2n');

  // 16-step sequencer (per-step state: on, pitch, velocity)
  const steps = Array.from({length:16}, (_,i)=>({ on:false, pitch:'C2', vel:0.9 }));
  const sequencerEl = document.getElementById('sequencer');
  for (let i = 0; i < 16; i++){
    const btn = document.createElement('button');
    btn.className = 'step';
    btn.dataset.index = i;
    btn.style.padding = '6px 8px';
    btn.style.borderRadius = '6px';
    btn.style.background = '#0f1620';
    btn.style.color = '#9aa6b2';
    const label = document.createElement('div'); label.className='label'; label.textContent = steps[i].pitch;
    btn.appendChild(label);
    btn.addEventListener('click', ()=>{
      steps[i].on = !steps[i].on;
      btn.classList.toggle('active', steps[i].on);
      btn.style.opacity = steps[i].vel;
      label.textContent = steps[i].pitch;
    });
    btn.addEventListener('dblclick', ()=>{
      const p = prompt('Pitch (e.g. C2, D#2):', steps[i].pitch);
      if (p) steps[i].pitch = p;
      const v = prompt('Velocity 0..1 (e.g. 0.8):', String(steps[i].vel));
      const vv = parseFloat(v);
      if (!isNaN(vv)) steps[i].vel = Math.max(0, Math.min(1, vv));
      label.textContent = steps[i].pitch;
      btn.style.opacity = steps[i].vel;
    });
    sequencerEl.appendChild(btn);
  }

  // Sequence: calls every 16th note and triggers reese when active
  const seq = new Tone.Sequence((time, idx) => {
    // highlight UI
    const children = sequencerEl.children;
    for (let i = 0; i < children.length; i++) children[i].style.boxShadow = '';
    if (children[idx]) children[idx].style.boxShadow = '0 0 8px rgba(94,186,255,0.8)';
    const s = steps[idx];
    if (s && s.on) {
      reese.triggerAttackRelease([s.pitch], '16n', time, s.vel);
    }
  }, Array.from({length:16}, (_,i)=>i), '16n');

  // BPM control
  const bpmInput = document.getElementById('bpmInput');
  bpmInput.addEventListener('change', ()=> { Tone.Transport.bpm.value = parseFloat(bpmInput.value); });
  Tone.Transport.bpm.value = parseFloat(bpmInput.value);

  // Tempo-synced LFO (LFO A)
  let lfoA = new Tone.LFO('4n', 300, 1500).start();
  let lfoAConnection = null;
  const lfoATarget = document.getElementById('lfoATarget');
  const lfoARate = document.getElementById('lfoARate');
  const lfoADepth = document.getElementById('lfoADepth');

  function connectLFOA(){
    // disconnect existing
    try{ lfoA.disconnect(); } catch(e){}
    const target = lfoATarget.value;
    const depth = parseFloat(lfoADepth.value);
    if (target === 'choir'){
      // map depth to frequency range
      const base = 600;
      const range = 1200 * depth + 200;
      lfoA = new Tone.LFO(lfoARate.value, base - range, base + range).start();
      lfoA.connect(choirFilter.frequency);
    } else if (target === 'reese'){
      const base = 1000; const range = 1500 * depth + 100;
      lfoA = new Tone.LFO(lfoARate.value, base - range, base + range).start();
      lfoA.connect(reeseFilter.frequency);
    } else if (target === 'reverb'){
      const base = 0.25; const range = 0.6 * depth;
      lfoA = new Tone.LFO(lfoARate.value, Math.max(0, base - range), Math.min(1, base + range)).start();
      lfoA.connect(reverb.wet);
    }
  }
  [lfoATarget, lfoARate, lfoADepth].forEach(el => el.addEventListener('input', connectLFOA));
  connectLFOA();

  // Visualiser
  // Visual: Three.js pulsing sphere that reacts to audio
  const canvas = document.getElementById('vis');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.z = 3;
  const light = new THREE.PointLight(0x7fffd4, 1.2);
  light.position.set(5,5,5);
  scene.add(light);
  const ambient = new THREE.AmbientLight(0x203040, 0.6); scene.add(ambient);
  const geometry = new THREE.SphereGeometry(0.9, 64, 64);
  // animated emissive material (shader-like) for organic look
  const material = new THREE.MeshStandardMaterial({ color:0x3ee6c3, emissive:0x00333a, metalness:0.2, roughness:0.4 });
  const sphere = new THREE.Mesh(geometry, material); scene.add(sphere);

  // add several tentacles attached around the sphere
  const tentacles = [];
  const tentacleCount = 7;
  for (let i=0;i<tentacleCount;i++){
    const tg = new THREE.CylinderGeometry(0.06, 0.02, 1.2, 10, 6, true);
    const tm = new THREE.MeshStandardMaterial({ color:0x2ee6b0, emissive:0x001a12, metalness:0.1, roughness:0.6 });
    const mesh = new THREE.Mesh(tg, tm);
    const angle = (i/ tentacleCount) * Math.PI*2;
    const x = Math.cos(angle) * 1.05;
    const z = Math.sin(angle) * 1.05;
    mesh.position.set(x, -0.6, z);
    mesh.rotation.x = Math.PI/2;
    mesh.rotation.z = -angle;
    mesh.scale.set(1,1,1);
    scene.add(mesh);
    tentacles.push({ mesh, angle, idx:i });
  }

  function renderVis(){
    requestAnimationFrame(renderVis);
    const data = analyser.getValue();
    // compute RMS-ish level
    let sum = 0; for (let i=0;i<data.length;i++){ sum += data[i]*data[i]; }
    const rms = Math.sqrt(sum / data.length);
    const scale = 1 + Math.max(0, rms) * 6;
    sphere.scale.setScalar(0.6 + scale);
    // animate tentacles using time-based sin waves
    const tnow = Tone.now();
    tentacles.forEach((t, i)=>{
      const sway = Math.sin(tnow * (0.8 + i*0.05) + t.angle*2) * 0.6 * (0.5 + rms*6);
      t.mesh.rotation.y = sway;
      t.mesh.position.y = -0.6 - Math.abs(Math.sin(tnow * 0.7 + i)) * 0.15 * (0.5 + rms*2);
      t.mesh.scale.y = 0.9 + 0.8 * (0.3 + rms*1.2);
    });
    // color shift based on choirType
    if (choirType === 'soprano') material.color.setHex(0x5b7cff);
    else if (choirType === 'alto') material.color.setHex(0x3ee6c3);
    else if (choirType === 'tenor') material.color.setHex(0xffd27a);
    else material.color.setHex(0xff6b6b);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.render(scene, camera);
  }
  renderVis();

  // Presets
  const presets = {
    'Cathedral Lift': { choirFilter:800, reverb:3.6, reverbWet:0.35, reeseDrive:0.05, metalDrive:0.12 },
    'Graveyard Rave': { choirFilter:1200, reverb:1.1, reverbWet:0.22, reeseDrive:0.45, metalDrive:0.35 },
    'Orbital Mass': { choirFilter:600, reverb:4.6, reverbWet:0.5, reeseDrive:0.1, metalDrive:0.05 },
    'Iron Choir': { choirFilter:700, reverb:2.0, reverbWet:0.25, reeseDrive:0.05, metalDrive:0.9 }
  };

  // UI wiring
  const presetSelect = document.getElementById('presetSelect');
  Object.keys(presets).forEach(p => { const opt = document.createElement('option'); opt.value = p; opt.textContent = p; presetSelect.appendChild(opt); });

  function applyPreset(name){
    const p = presets[name];
    choirFilter.frequency.value = p.choirFilter;
    reverb.decay = p.reverb; reverb.wet.value = p.reverbWet;
    reeseDrive.distortion = p.reeseDrive;
    metalDrive.distortion = p.metalDrive;
  }
  presetSelect.addEventListener('change', e => applyPreset(e.target.value));
  applyPreset(Object.keys(presets)[0]);

  // Choir voice type and blend
  const choirVoiceType = document.getElementById('choirVoiceType');
  const choirBlendEl = document.getElementById('choirBlend');
  let choirBlend = parseFloat(choirBlendEl.value || 0.7);
  choirVoiceType.addEventListener('change', ()=>{
    choirType = choirVoiceType.value;
    choirVoicesArr.forEach(v=>{
      if (v.f1) v.f1.frequency.value = formants[choirType][0];
      if (v.f2) v.f2.frequency.value = formants[choirType][1];
      if (v.f3) v.f3.frequency.value = formants[choirType][2];
    });
  });
  choirBlendEl.addEventListener('input', ()=>{ choirBlend = parseFloat(choirBlendEl.value); });
  // choir mode / wavetable / sample UI
  const choirModeEl = document.getElementById('choirMode');
  const wavetableTypeEl = document.getElementById('wavetableType');
  const sampleUrlEl = document.getElementById('sampleUrl');
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  choirModeEl.addEventListener('change', ()=>{ choirMode = choirModeEl.value; rebuildChoirVoices(); });
  wavetableTypeEl.addEventListener('change', ()=>{ wavetableType = wavetableTypeEl.value; if (choirMode==='wavetable') rebuildChoirVoices(); });
  loadSampleBtn.addEventListener('click', ()=>{ const url = sampleUrlEl.value.trim(); if (!url) { alert('Enter sample URL'); return; } sampleUrl = url; choirMode = 'sample'; choirModeEl.value = 'sample'; rebuildChoirVoices(); alert('Sample set (note: sample playback is not pitch-shifted in this prototype)'); });

  // Macros
  const macroSanctify = document.getElementById('macroSanctify');
  const macroGravity = document.getElementById('macroGravity');
  const macroPulse = document.getElementById('macroPulse');
  const macroSwarm = document.getElementById('macroSwarm');

  function updateMacros(){
    const s = parseFloat(macroSanctify.value); // 0..1
    choirFilter.frequency.value = 300 + (1500 * (1 - s));
    choirChorus.depth = 0.4 + s*0.8;
    reeseDrive.distortion = 0.6 * (1 - s);
    metalDrive.distortion = 0.2 + s*1.2;

    const g = parseFloat(macroGravity.value);
    choir.release = 1.2 + g*3.0;
    reese.envelope.release = 0.1 + (1-g)*0.8;

    const sw = parseFloat(macroSwarm.value);
    choir.volumeVal = -6 - sw*6;
    reese.volume.value = -8 + sw*4;

    // Pulse affects LFO rates (not implemented as separate LFOs here but could modulate filter)
    const p = parseFloat(macroPulse.value);
    reeseFilter.frequency.value = 800 + p*1200;
  }
  [macroSanctify,macroGravity,macroPulse,macroSwarm].forEach(el=>el.addEventListener('input',updateMacros));
  updateMacros();

  // Pattern save/load/export/import
  const savePatternBtn = document.getElementById('savePatternBtn');
  const loadPatternBtn = document.getElementById('loadPatternBtn');
  const exportPatternBtn = document.getElementById('exportPatternBtn');
  const importPatternBtn = document.getElementById('importPatternBtn');
  const importPatternInput = document.getElementById('importPatternInput');

  function savePattern(name){
    const list = JSON.parse(localStorage.getItem('emergent:patterns') || '{}');
    list[name] = steps;
    localStorage.setItem('emergent:patterns', JSON.stringify(list));
  }
  function loadPatternByName(name){
    const list = JSON.parse(localStorage.getItem('emergent:patterns') || '{}');
    if (!list[name]) return false;
    for (let i=0;i<16;i++){ steps[i] = list[name][i]; const btn = sequencerEl.children[i]; btn.classList.toggle('active', steps[i].on); btn.querySelector('.label').textContent = steps[i].pitch; btn.style.opacity = steps[i].vel; }
    return true;
  }

  savePatternBtn.addEventListener('click', ()=>{
    const name = prompt('Pattern name to save:'); if (!name) return; savePattern(name); alert('Saved pattern '+name);
  });
  loadPatternBtn.addEventListener('click', ()=>{
    const list = JSON.parse(localStorage.getItem('emergent:patterns') || '{}');
    const names = Object.keys(list);
    if (!names.length){ alert('No saved patterns'); return; }
    const sel = prompt('Available patterns:\n' + names.join('\n') + '\n\nType name to load:'); if (!sel) return; if (!loadPatternByName(sel)) alert('Pattern not found');
  });

  exportPatternBtn.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(steps, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'emergent-pattern.json'; a.click();
  });
  importPatternBtn.addEventListener('click', ()=> importPatternInput.click());
  importPatternInput.addEventListener('change', e=>{ const f = e.target.files[0]; if (!f) return; const r=new FileReader(); r.onload = ev=>{ try{ const obj=JSON.parse(ev.target.result); if (Array.isArray(obj) && obj.length===16){ for (let i=0;i<16;i++){ steps[i]=obj[i]; const btn=sequencerEl.children[i]; btn.classList.toggle('active', steps[i].on); btn.querySelector('.label').textContent = steps[i].pitch; btn.style.opacity = steps[i].vel; } } else alert('Invalid pattern'); } catch(err){ alert('Invalid JSON'); } }; r.readAsText(f); });

  // Play/Stop
  const playBtn = document.getElementById('playBtn');
  const stopBtn = document.getElementById('stopBtn');
  playBtn.addEventListener('click', async () => {
    await Tone.start();
    chordSeq.start(0);
    seq.start(0);
    Tone.Transport.start();
  });
  stopBtn.addEventListener('click', ()=> { chordSeq.stop(); Tone.Transport.stop(); });
  stopBtn.addEventListener('click', ()=> { seq.stop(); });

  // Simple record using MediaStreamDestination
  const recordBtn = document.getElementById('recordBtn');
  let mediaRecorder, chunks = [];
  recordBtn.addEventListener('click', async ()=>{
    if (!mediaRecorder || mediaRecorder.state === 'inactive'){
      const dest = Tone.context.createMediaStreamDestination();
      Tone.getDestination().connect(dest);
      mediaRecorder = new MediaRecorder(dest.stream);
      mediaRecorder.ondataavailable = ev => chunks.push(ev.data);
      mediaRecorder.onstop = ()=>{
        const blob = new Blob(chunks, { type: 'audio/webm' });
        chunks = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'emergent-loop.webm'; a.click();
      };
      mediaRecorder.start();
      recordBtn.textContent = 'Stop & Download';
    } else { mediaRecorder.stop(); recordBtn.textContent = 'Record'; }
  });

  // Preset sharing: export/import and copy link
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const exportPresetBtn = document.getElementById('exportPresetBtn');
  const importPresetBtn = document.getElementById('importPresetBtn');
  const importPresetInput = document.getElementById('importPresetInput');

  function getCurrentState(){
    return {
      macroSanctify: parseFloat(macroSanctify.value),
      macroGravity: parseFloat(macroGravity.value),
      macroPulse: parseFloat(macroPulse.value),
      macroSwarm: parseFloat(macroSwarm.value),
      preset: presetSelect.value
    };
  }

  function applyState(obj){
    if (obj.preset && presets[obj.preset]) presetSelect.value = obj.preset;
    if (typeof obj.macroSanctify === 'number') macroSanctify.value = obj.macroSanctify;
    if (typeof obj.macroGravity === 'number') macroGravity.value = obj.macroGravity;
    if (typeof obj.macroPulse === 'number') macroPulse.value = obj.macroPulse;
    if (typeof obj.macroSwarm === 'number') macroSwarm.value = obj.macroSwarm;
    updateMacros();
    if (obj.preset && presets[obj.preset]) applyPreset(obj.preset);
  }

  function makeShareLink(){
    const state = getCurrentState();
    const json = JSON.stringify(state);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = new URL(window.location.href);
    url.searchParams.set('preset', b64);
    return url.toString();
  }

  copyLinkBtn.addEventListener('click', async ()=>{
    const link = makeShareLink();
    try { await navigator.clipboard.writeText(link); copyLinkBtn.textContent = 'Link Copied'; setTimeout(()=>copyLinkBtn.textContent='Copy Preset Link',1500);} catch(e){ alert('Copy failed. Link:\n'+link); }
  });

  exportPresetBtn.addEventListener('click', ()=>{
    const state = getCurrentState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'emergent-preset.json'; a.click();
  });

  importPresetBtn.addEventListener('click', ()=> importPresetInput.click());
  importPresetInput.addEventListener('change', e=>{
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev=>{ try{ const obj = JSON.parse(ev.target.result); applyState(obj); } catch(err){ alert('Invalid preset file'); } };
    reader.readAsText(f);
  });

  // On load: check for preset in URL
  (function(){
    const p = new URLSearchParams(window.location.search).get('preset');
    if (!p) return;
    try{
      const json = decodeURIComponent(escape(atob(p)));
      const obj = JSON.parse(json);
      applyState(obj);
    } catch(e){ console.warn('Failed to apply preset from URL', e); }
  })();

});
