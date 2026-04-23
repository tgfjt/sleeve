<script lang="ts">
  import { app } from '../state.svelte';
  import { unlinkLayersFromMask } from '../lib/layer';

  function removeMask(id: number) {
    app.masks = app.masks.filter((m) => m.id !== id);
    app.layers = unlinkLayersFromMask(app.layers, id);
  }
</script>

{#if app.masks.length === 0}
  <p class="empty">No masks yet.</p>
{:else}
  <ul class="list">
    {#each app.masks as mask (mask.id)}
      <li class="item">
        <span class="swatch" aria-hidden="true"></span>
        <span class="name">{mask.name} · {(mask.score * 100).toFixed(0)}%</span>
        <button
          type="button"
          class="del"
          aria-label={`Delete ${mask.name}`}
          onclick={() => removeMask(mask.id)}>×</button
        >
      </li>
    {/each}
  </ul>
{/if}

<style>
  .empty {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    padding: 4px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    list-style: none;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--panel);
    border: 1px solid var(--line);
    font-family: var(--mono);
    font-size: 11px;
  }
  .item:hover {
    border-color: var(--accent);
  }
  .swatch {
    width: 24px;
    height: 24px;
    background: var(--accent);
    flex-shrink: 0;
  }
  .name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .del {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 16px;
    cursor: pointer;
    padding: 0 4px;
  }
  .del:hover {
    color: var(--accent);
  }
</style>
