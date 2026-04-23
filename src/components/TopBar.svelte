<script lang="ts">
  import { app, resetAll } from '../state.svelte';
  import { exportFilename } from '../lib/export';

  function requestReset() {
    app.dialog = {
      kind: 'confirm',
      title: 'Reset everything?',
      message: 'This clears all masks and text layers. The uploaded image stays.',
      onConfirm: () => {
        resetAll();
        app.dialog = { kind: 'none' };
      }
    };
  }

  function exportPNG() {
    const canvas = document.getElementById('stage') as HTMLCanvasElement | null;
    if (!canvas || !app.image) return;
    const link = document.createElement('a');
    link.download = exportFilename();
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
</script>

<header class="topbar" aria-label="SLEEVE toolbar">
  <div class="brand">
    <span aria-hidden="true" class="brand-mark"></span>
    <span class="brand-name">SLEEVE</span>
    <span class="sub">v0.1 / COVER MAKER</span>
  </div>
  <div class="actions">
    <button type="button" class="btn" onclick={requestReset}>Reset</button>
    <button type="button" class="btn primary" onclick={exportPNG} disabled={!app.image}
      >Export PNG</button
    >
  </div>
</header>

<style>
  .topbar {
    grid-area: top;
    background: var(--bg-2);
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 24px;
  }
  .brand {
    font-family: var(--display);
    font-size: 22px;
    letter-spacing: 0.08em;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .brand-mark {
    width: 14px;
    height: 14px;
    background: var(--accent);
    display: inline-block;
    transform: skewX(-20deg);
  }
  .sub {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.15em;
    margin-left: 4px;
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: 10px;
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
    transition:
      background 0.15s,
      border-color 0.15s;
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
  .btn.primary:hover:not(:disabled) {
    background: var(--accent-2);
    border-color: var(--accent-2);
  }
  .btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
