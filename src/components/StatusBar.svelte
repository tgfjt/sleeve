<script lang="ts">
  import { app } from '../state.svelte';
</script>

<footer class="status" role="status" aria-live="polite">
  <span>
    <span
      class="dot"
      class:ready={app.status.kind === 'ready'}
      class:loading={app.status.kind === 'loading'}
      class:error={app.status.kind === 'error'}
      aria-hidden="true"
    ></span>
    <span>{app.status.text}</span>
  </span>
  {#if app.image}
    <span aria-label={`Image dimensions: ${app.naturalW} by ${app.naturalH} pixels`}
      >{app.naturalW} × {app.naturalH}</span
    >
  {/if}
  <span class="spacer"></span>
  <span>MODEL: slimsam-77-uniform (Xenova)</span>
</footer>

<style>
  .status {
    grid-area: status;
    background: var(--bg-2);
    border-top: 1px solid var(--line);
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 0.1em;
    gap: 20px;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--text-dim);
    margin-right: 6px;
    display: inline-block;
  }
  .dot.ready {
    background: #6aff6a;
  }
  .dot.loading {
    background: var(--accent-2);
    animation: pulse 1s infinite;
  }
  .dot.error {
    background: var(--accent);
  }
  @keyframes pulse {
    50% {
      opacity: 0.3;
    }
  }
  .spacer {
    margin-left: auto;
  }
</style>
