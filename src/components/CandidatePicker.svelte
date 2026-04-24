<script lang="ts">
  import { app } from '../state.svelte';

  const labels = ['S', 'M', 'L'];

  function confirmPending() {
    if (!app.pending.active || app.pending.candidates.length === 0) return;
    const chosen = app.pending.candidates[app.pending.selectedIdx];
    const id = app.nextMaskId++;
    app.masks = [
      ...app.masks,
      { id, name: `Mask ${id}`, canvas: chosen.canvas, score: chosen.score }
    ];
    cancelPending();
  }

  function cancelPending() {
    app.pending = { active: false, points: [], candidates: [], selectedIdx: 0 };
  }

  function choose(idx: number) {
    app.pending.selectedIdx = idx;
  }

  function onKeyDown(e: KeyboardEvent, idx: number) {
    const total = app.pending.candidates.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      choose((idx + 1) % total);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      choose((idx - 1 + total) % total);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(idx);
    }
  }

  // ImageBitmap doesn't expose toDataURL directly; draw to a tiny canvas
  // once per bitmap and cache the resulting data URL so re-renders don't
  // re-encode.
  const thumbURLs = new WeakMap<ImageBitmap, string>();
  function thumbStyle(cand: { canvas: ImageBitmap }): string {
    let url = thumbURLs.get(cand.canvas);
    if (!url) {
      const c = document.createElement('canvas');
      c.width = cand.canvas.width;
      c.height = cand.canvas.height;
      c.getContext('2d')!.drawImage(cand.canvas, 0, 0);
      url = c.toDataURL();
      thumbURLs.set(cand.canvas, url);
    }
    return `background-image: url(${url})`;
  }
</script>

{#if app.pending.active && app.pending.candidates.length > 0}
  <div class="picker">
    <div class="picker-label" id="cand-label">Candidates (arrow keys to switch)</div>
    <div class="thumbs" role="radiogroup" aria-labelledby="cand-label">
      {#each app.pending.candidates as cand, idx (idx)}
        <button
          type="button"
          role="radio"
          aria-checked={idx === app.pending.selectedIdx}
          tabindex={idx === app.pending.selectedIdx ? 0 : -1}
          class="thumb"
          class:active={idx === app.pending.selectedIdx}
          aria-label={`${labels[idx] ?? idx + 1} mask, ${(cand.score * 100).toFixed(0)}% score`}
          onclick={() => choose(idx)}
          onkeydown={(e) => onKeyDown(e, idx)}
        >
          <span class="size-label" aria-hidden="true">{labels[idx] ?? idx + 1}</span>
          <span class="badge" aria-hidden="true">{(cand.score * 100).toFixed(0)}%</span>
          <span class="thumb-bg" aria-hidden="true" style={thumbStyle(cand)}></span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<div class="actions">
  <button type="button" class="btn" disabled={!app.pending.active} onclick={cancelPending}
    >Cancel</button
  >
  <button
    type="button"
    class="btn primary"
    disabled={!app.pending.active || app.pending.candidates.length === 0}
    onclick={confirmPending}
  >
    Confirm ✓
  </button>
</div>

<style>
  .picker {
    margin-top: 12px;
  }
  .picker-label {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin-bottom: 6px;
  }
  .thumbs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 4px;
  }
  .thumb {
    position: relative;
    aspect-ratio: 1;
    background: var(--bg);
    border: 1.5px solid var(--line);
    cursor: pointer;
    overflow: hidden;
    padding: 0;
  }
  .thumb:hover {
    border-color: var(--accent-2);
  }
  .thumb.active {
    border-color: var(--accent);
  }
  .thumb-bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
  }
  .badge {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-family: var(--mono);
    font-size: 8px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    padding: 1px 4px;
    letter-spacing: 0.05em;
    z-index: 1;
  }
  .size-label {
    position: absolute;
    top: 2px;
    left: 2px;
    font-family: var(--mono);
    font-size: 8px;
    color: var(--text-dim);
    background: rgba(0, 0, 0, 0.6);
    padding: 1px 4px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    z-index: 1;
  }
  .actions {
    margin-top: 10px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .btn {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 8px 14px;
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--line);
    cursor: pointer;
  }
  .btn:hover:not(:disabled) {
    background: var(--panel-hi);
    border-color: var(--accent);
  }
  .btn.primary {
    background: var(--accent);
    color: #000;
    border-color: var(--accent);
    font-weight: 700;
  }
  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
