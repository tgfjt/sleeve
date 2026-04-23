<script lang="ts">
  import { app } from '../state.svelte';
  import { createTextLayer } from '../lib/layer';
  import TextLayerCard from './TextLayerCard.svelte';

  function addLayer() {
    if (!app.image) return;
    const id = app.nextLayerId++;
    const layer = createTextLayer({
      id,
      image: { width: app.naturalW, height: app.naturalH }
    });
    app.layers = [...app.layers, layer];
    app.selectedLayerId = id;
  }
</script>

<aside class="inspector" aria-label="Text layers">
  <section class="section">
    <h2 class="section-title">3. Text Layers</h2>
    <button type="button" class="add-btn" onclick={addLayer} disabled={!app.image}
      >+ Add Text Layer</button
    >
    <div class="list">
      {#if app.layers.length === 0}
        <p class="empty">No text layers yet.</p>
      {:else}
        {#each [...app.layers].reverse() as layer (layer.id)}
          <TextLayerCard {layer} />
        {/each}
      {/if}
    </div>
  </section>
</aside>

<style>
  .inspector {
    grid-area: inspect;
    background: var(--bg-2);
    border-left: 1px solid var(--line);
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
  .add-btn {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px dashed var(--line);
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    cursor: pointer;
    text-transform: uppercase;
    transition:
      border-color 0.15s,
      color 0.15s;
  }
  .add-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--text);
  }
  .add-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .list {
    margin-top: 10px;
  }
  .empty {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    padding: 6px;
  }
</style>
