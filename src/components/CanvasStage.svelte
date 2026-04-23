<script lang="ts">
  import { app, hideLoader, setStatus, showLoader } from '../state.svelte';
  import { clientToNatural, naturalToRect } from '../lib/coords';
  import { hitTestLayer } from '../lib/hit';
  import { defaultSelectedIdx, outlineOffset, sortCandidatesByArea } from '../lib/mask';
  import {
    drawMaskOutline,
    drawMaskOverlay,
    drawSubjectForeground,
    renderTextLayer
  } from '../lib/render';

  let stage = $state<HTMLCanvasElement | undefined>();
  let dragging: { layerId: number; dx: number; dy: number; moved: boolean } | null = null;
  let justDragged = false;

  $effect(() => {
    if (!app.image || !stage) return;
    stage.width = app.naturalW;
    stage.height = app.naturalH;
    renderCanvas();
  });

  $effect(() => {
    // Subscribe to all observable bits that affect the canvas render.
    void app.layers.length;
    void app.masks.length;
    void app.pending.active;
    void app.pending.selectedIdx;
    app.layers.forEach((l) => {
      void l.x;
      void l.y;
      void l.text;
      void l.size;
      void l.color;
      void l.font;
      void l.opacity;
      void l.blur;
      void l.letterSpacing;
      void l.maskMode;
      void l.maskId;
    });
    if (app.image && stage) renderCanvas();
  });

  function renderCanvas() {
    if (!app.image || !stage) return;
    const ctx = stage.getContext('2d');
    if (!ctx) return;
    const W = app.naturalW;
    const H = app.naturalH;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(app.image, 0, 0, W, H);

    for (const layer of app.layers) {
      renderTextLayer(ctx, layer);
      if (layer.maskMode === 'behind' && layer.maskId != null) {
        const mask = app.masks.find((m) => m.id === layer.maskId);
        if (mask) drawSubjectForeground(ctx, app.image, mask, W, H);
      }
    }

    if (app.pending.active && app.pending.candidates.length > 0) {
      const cand = app.pending.candidates[app.pending.selectedIdx];
      if (cand) {
        drawMaskOverlay(ctx, cand.canvas, W, H, 'rgba(255, 77, 46, 0.45)');
        drawMaskOutline(ctx, cand.canvas, W, H, 'rgba(255, 77, 46, 1)', outlineOffset(W, H));
      }
    }
  }

  async function runSAM() {
    if (!app.sam || app.pending.points.length === 0) return;
    showLoader('Segmenting...');
    setStatus('loading', 'segmenting');
    try {
      const raw = await app.sam.segment(app.pending.points);
      const sorted = sortCandidatesByArea(raw);
      app.pending.candidates = sorted;
      app.pending.selectedIdx = defaultSelectedIdx(sorted.length, app.pending.selectedIdx);
      setStatus('ready', `${app.pending.points.length} point(s) · choose candidate`);
    } catch (err) {
      console.error(err);
      setStatus('error', 'segmentation failed');
    } finally {
      hideLoader();
    }
  }

  async function onClick(e: MouseEvent) {
    if (!app.image || !app.sam || !stage) return;
    if (justDragged) {
      justDragged = false;
      return;
    }
    const rect = stage.getBoundingClientRect();
    const natural = { width: app.naturalW, height: app.naturalH };
    const p = clientToNatural({ x: e.clientX, y: e.clientY }, rect, natural);
    const label: 0 | 1 = e.altKey ? 0 : 1;

    if (!app.pending.active || (!e.shiftKey && !e.altKey)) {
      app.pending = {
        active: true,
        points: [{ x: p.x, y: p.y, label: 1 }],
        candidates: [],
        selectedIdx: 0
      };
    } else {
      app.pending.points = [...app.pending.points, { x: p.x, y: p.y, label }];
    }
    await runSAM();
  }

  function onMouseDown(e: MouseEvent) {
    if (!app.image || app.pending.active || app.selectedLayerId == null || !stage) return;
    const layer = app.layers.find((l) => l.id === app.selectedLayerId);
    if (!layer) return;
    const rect = stage.getBoundingClientRect();
    const p = clientToNatural({ x: e.clientX, y: e.clientY }, rect, {
      width: app.naturalW,
      height: app.naturalH
    });
    const ctx = stage.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.font = `${layer.size}px "${layer.font}", sans-serif`;
    const firstLine = layer.text.split('\n')[0] || '';
    const textW = ctx.measureText(firstLine).width;
    const textH = layer.size * layer.text.split('\n').length;
    ctx.restore();
    if (hitTestLayer(p, { x: layer.x, y: layer.y }, { width: textW, height: textH })) {
      dragging = { layerId: layer.id, dx: layer.x - p.x, dy: layer.y - p.y, moved: false };
      e.preventDefault();
    }
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging || !app.image || !stage) return;
    const rect = stage.getBoundingClientRect();
    const p = clientToNatural({ x: e.clientX, y: e.clientY }, rect, {
      width: app.naturalW,
      height: app.naturalH
    });
    const idx = app.layers.findIndex((l) => l.id === dragging!.layerId);
    if (idx < 0) return;
    app.layers[idx] = {
      ...app.layers[idx],
      x: p.x + dragging.dx,
      y: p.y + dragging.dy
    };
    dragging.moved = true;
  }

  function onMouseUp() {
    if (dragging && dragging.moved) justDragged = true;
    dragging = null;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (app.selectedLayerId == null) return;
    // Skip when typing in inputs
    const target = e.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    const idx = app.layers.findIndex((l) => l.id === app.selectedLayerId);
    if (idx < 0) return;
    const step = e.shiftKey ? 20 : 5;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    if (dx || dy) {
      e.preventDefault();
      app.layers[idx] = {
        ...app.layers[idx],
        x: app.layers[idx].x + dx,
        y: app.layers[idx].y + dy
      };
    }
  }

  const clickMarkers = $derived.by(() => {
    if (!app.pending.active || !stage) return [];
    const rect = stage.getBoundingClientRect();
    if (!rect || rect.width === 0) return [];
    const natural = { width: app.naturalW, height: app.naturalH };
    return app.pending.points.map((pt, i) => {
      const dot = naturalToRect({ x: pt.x, y: pt.y }, natural, rect);
      return { key: `${i}-${pt.x}-${pt.y}`, label: pt.label, cx: dot.x, cy: dot.y };
    });
  });
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} onkeydown={onKeyDown} />

{#if !app.image}
  <div class="empty">
    <div class="big" aria-hidden="true">SLEEVE</div>
    <p>UPLOAD AN IMAGE TO START</p>
  </div>
{:else}
  <div class="frame">
    <div class="stage-container">
      <canvas
        id="stage"
        bind:this={stage}
        onclick={onClick}
        onmousedown={onMouseDown}
        tabindex="0"
        aria-label="Editor canvas. Click to start selection; arrow keys to nudge the selected text layer."
      ></canvas>
      {#each clickMarkers as m (m.key)}
        <span
          class="marker"
          class:neg={m.label === 0}
          style="left: {m.cx}px; top: {m.cy}px;"
          aria-hidden="true"
        ></span>
      {/each}
    </div>
  </div>
{/if}

<style>
  .empty {
    text-align: center;
    font-family: var(--mono);
    color: var(--text-dim);
    font-size: 12px;
    letter-spacing: 0.15em;
  }
  .big {
    font-family: var(--display);
    font-size: 64px;
    letter-spacing: 0.06em;
    color: var(--panel-hi);
    margin-bottom: 16px;
    line-height: 0.9;
  }
  .frame {
    position: relative;
    box-shadow:
      0 30px 80px rgba(0, 0, 0, 0.6),
      0 0 0 1px var(--line);
    max-width: 100%;
    max-height: 100%;
  }
  canvas {
    display: block;
    max-width: 100%;
    max-height: calc(100vh - 160px);
    cursor: crosshair;
  }
  canvas:focus-visible {
    outline: 2px solid var(--focus);
    outline-offset: 4px;
  }
  .stage-container {
    position: relative;
    display: inline-block;
  }
  .marker {
    position: absolute;
    width: 18px;
    height: 18px;
    border: 2px solid var(--accent);
    background: rgba(255, 77, 46, 0.4);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.8);
  }
  .marker.neg {
    border-color: var(--accent-3);
    background: rgba(77, 201, 255, 0.4);
  }
  .marker.neg::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 3px;
    right: 3px;
    height: 2px;
    background: #fff;
  }
</style>
