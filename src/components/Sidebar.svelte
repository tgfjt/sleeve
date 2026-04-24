<script lang="ts">
  import { app, hideLoader, setStatus, showLoader } from '../state.svelte';
  import { resolveSamBackend } from '../lib/sam';
  import CandidatePicker from './CandidatePicker.svelte';
  import MaskList from './MaskList.svelte';

  async function loadProductionSam() {
    const mod = await import('../lib/sam-worker');
    return mod.createWorkerSamBackend();
  }

  let dragOver = $state(false);

  async function loadImage(file: File) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();

    app.image = img;
    app.imageURL = url;
    app.naturalW = img.naturalWidth;
    app.naturalH = img.naturalHeight;

    if (!app.sam) {
      showLoader('Loading SAM model (first time only, ~80MB)...');
      setStatus('loading', 'loading model');
      app.sam = await resolveSamBackend(loadProductionSam);
    }
    showLoader('Preparing image...');
    setStatus('loading', 'preparing image');
    await app.sam.prepareImage(file);
    hideLoader();
    setStatus('ready', 'ready · click on the image');
  }

  function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    if (f) void loadImage(f);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    dragOver = true;
  }
  function onDragLeave() {
    dragOver = false;
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f && f.type.startsWith('image/')) void loadImage(f);
  }
</script>

<aside class="sidebar" aria-label="Source image and selection">
  <section class="section" aria-labelledby="sec-image">
    <h2 id="sec-image" class="section-title">1. Image</h2>
    <label
      class="upload-zone"
      class:drag={dragOver}
      ondragover={onDragOver}
      ondragleave={onDragLeave}
      ondrop={onDrop}
    >
      <input type="file" accept="image/*" onchange={onFileChange} />
      <span>DROP IMAGE</span>
      <span class="sub">or click to browse</span>
    </label>
  </section>

  <section class="section" aria-labelledby="sec-select">
    <h2 id="sec-select" class="section-title">2. Select Object</h2>
    <p class="hint">
      画像をクリック → SAMが候補を3つ提示<br />
      Shift+クリック: 範囲に追加<br />
      Alt+クリック: 範囲から削る
    </p>
    <CandidatePicker />
  </section>

  <section class="section" aria-labelledby="sec-masks">
    <h2 id="sec-masks" class="section-title">Saved Masks</h2>
    <MaskList />
  </section>
</aside>

<style>
  .sidebar {
    grid-area: side;
    background: var(--bg-2);
    border-right: 1px solid var(--line);
    overflow-y: auto;
    padding: 18px;
  }
  .section {
    margin-bottom: 22px;
  }
  .section-title {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 400;
  }
  .section-title::before {
    content: '';
    width: 6px;
    height: 6px;
    background: var(--accent);
  }
  .upload-zone {
    border: 1.5px dashed var(--line);
    padding: 28px 14px;
    text-align: center;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background 0.2s,
      color 0.2s;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-dim);
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: center;
  }
  .upload-zone:hover,
  .upload-zone.drag,
  .upload-zone:focus-within {
    border-color: var(--accent);
    color: var(--text);
    background: var(--panel);
  }
  .upload-zone input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .upload-zone .sub {
    color: var(--text-dim);
    font-size: 10px;
  }
  .hint {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    line-height: 1.5;
    padding: 8px;
    background: var(--panel);
    border-left: 2px solid var(--accent-3);
  }
</style>
