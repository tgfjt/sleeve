<script lang="ts">
  import { app } from '../state.svelte';
</script>

{#if app.loader.visible}
  <div class="loader" role="alert" aria-busy="true" aria-live="assertive">
    <div class="spinner" aria-hidden="true"></div>
    <p class="msg">{app.loader.message}</p>
  </div>
{/if}

<style>
  .loader {
    position: absolute;
    inset: 0;
    background: rgba(10, 10, 11, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 16px;
    z-index: 100;
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 2px solid var(--line);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .msg {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.15em;
    color: var(--text-dim);
    text-transform: uppercase;
  }
</style>
