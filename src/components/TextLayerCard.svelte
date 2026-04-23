<script lang="ts">
  import { app } from '../state.svelte';
  import { linkLayerToMask, type TextLayer } from '../lib/layer';

  type Props = { layer: TextLayer };
  const { layer }: Props = $props();

  const selected = $derived(app.selectedLayerId === layer.id);

  const FONTS = ['Anton', 'Bebas Neue', 'Archivo Black', 'Syne', 'JetBrains Mono'];

  function toggleSelect() {
    app.selectedLayerId = selected ? null : layer.id;
  }

  function remove(e: Event) {
    e.stopPropagation();
    app.layers = app.layers.filter((l) => l.id !== layer.id);
    if (app.selectedLayerId === layer.id) app.selectedLayerId = null;
  }

  function onDelKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') remove(e);
  }

  function update<K extends keyof TextLayer>(prop: K, value: TextLayer[K]) {
    const idx = app.layers.findIndex((l) => l.id === layer.id);
    if (idx < 0) return;
    app.layers[idx] = { ...app.layers[idx], [prop]: value };
  }

  function setMaskLink(mode: 'none' | 'behind' | 'infront', maskId?: number) {
    const idx = app.layers.findIndex((l) => l.id === layer.id);
    if (idx < 0) return;
    app.layers[idx] = linkLayerToMask(
      app.layers[idx],
      mode === 'none' ? { mode: 'none' } : { mode, maskId: maskId! }
    );
  }
</script>

<article class="card" class:selected aria-current={selected ? 'true' : undefined}>
  <button type="button" class="header" onclick={toggleSelect}>
    <span class="grip" aria-hidden="true">≡</span>
    <span class="label">{layer.text || '(empty)'}</span>
    <span
      class="del"
      role="button"
      tabindex="0"
      aria-label={`Delete layer: ${layer.text || 'empty'}`}
      onclick={remove}
      onkeydown={onDelKeyDown}>×</span
    >
  </button>

  {#if selected}
    <div class="body">
      <div class="field">
        <label for={`text-${layer.id}`}>Text</label>
        <textarea
          id={`text-${layer.id}`}
          value={layer.text}
          oninput={(e) => update('text', (e.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
      </div>

      <div class="row">
        <div class="field">
          <label for={`font-${layer.id}`}>Font</label>
          <select
            id={`font-${layer.id}`}
            value={layer.font}
            onchange={(e) => update('font', (e.currentTarget as HTMLSelectElement).value)}
          >
            {#each FONTS as font (font)}
              <option value={font}>{font}</option>
            {/each}
          </select>
        </div>
        <div class="field">
          <label for={`color-${layer.id}`}>Color</label>
          <input
            id={`color-${layer.id}`}
            type="color"
            value={layer.color}
            oninput={(e) => update('color', (e.currentTarget as HTMLInputElement).value)}
          />
        </div>
      </div>

      <div class="field">
        <label for={`size-${layer.id}`}>Size <span class="val">{layer.size}px</span></label>
        <input
          id={`size-${layer.id}`}
          type="range"
          min="20"
          max={Math.max(200, app.naturalH)}
          value={layer.size}
          oninput={(e) => update('size', parseInt((e.currentTarget as HTMLInputElement).value))}
        />
      </div>

      <div class="field">
        <label for={`ls-${layer.id}`}
          >Letter Spacing <span class="val">{layer.letterSpacing}</span></label
        >
        <input
          id={`ls-${layer.id}`}
          type="range"
          min="-20"
          max="60"
          value={layer.letterSpacing}
          oninput={(e) =>
            update('letterSpacing', parseInt((e.currentTarget as HTMLInputElement).value))}
        />
      </div>

      <div class="field">
        <label for={`op-${layer.id}`}
          >Opacity <span class="val">{Math.round(layer.opacity * 100)}%</span></label
        >
        <input
          id={`op-${layer.id}`}
          type="range"
          min="0"
          max="100"
          value={Math.round(layer.opacity * 100)}
          oninput={(e) =>
            update('opacity', parseInt((e.currentTarget as HTMLInputElement).value) / 100)}
        />
      </div>

      <div class="field">
        <label for={`blur-${layer.id}`}>Blur <span class="val">{layer.blur}px</span></label>
        <input
          id={`blur-${layer.id}`}
          type="range"
          min="0"
          max="30"
          value={layer.blur}
          oninput={(e) => update('blur', parseInt((e.currentTarget as HTMLInputElement).value))}
        />
      </div>

      <fieldset class="depth">
        <legend>Depth (relative to mask)</legend>
        <button
          type="button"
          class="chip"
          class:active={layer.maskMode === 'none'}
          onclick={() => setMaskLink('none')}>— none</button
        >
        {#each app.masks as mask (mask.id)}
          <button
            type="button"
            class="chip"
            class:active={layer.maskMode === 'behind' && layer.maskId === mask.id}
            onclick={() => setMaskLink('behind', mask.id)}
          >
            ◯ behind {mask.name}
          </button>
          <button
            type="button"
            class="chip"
            class:active={layer.maskMode === 'infront' && layer.maskId === mask.id}
            onclick={() => setMaskLink('infront', mask.id)}
          >
            ● front {mask.name}
          </button>
        {/each}
      </fieldset>
      <p class="hint">Drag on canvas, or use arrow keys (Shift = larger step).</p>
    </div>
  {/if}
</article>

<style>
  .card {
    border: 1px solid var(--line);
    margin-bottom: 8px;
    background: var(--panel);
    transition: border-color 0.15s;
  }
  .card.selected {
    border-color: var(--accent);
  }
  .header {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    gap: 8px;
    cursor: pointer;
    font-family: var(--mono);
    font-size: 11px;
    width: 100%;
    background: transparent;
    color: var(--text);
    border: none;
    text-align: left;
  }
  .grip {
    color: var(--text-dim);
    font-size: 10px;
  }
  .label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .del {
    color: var(--text-dim);
    cursor: pointer;
    font-size: 14px;
    padding: 0 4px;
  }
  .del:hover {
    color: var(--accent);
  }
  .body {
    padding: 12px 10px;
    border-top: 1px solid var(--line);
  }
  .field {
    margin-bottom: 12px;
  }
  .field label {
    display: block;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 5px;
  }
  .field .val {
    float: right;
    color: var(--text);
  }
  .field select,
  .field textarea {
    width: 100%;
    background: var(--bg);
    border: 1px solid var(--line);
    color: var(--text);
    padding: 7px 9px;
    font-family: var(--mono);
    font-size: 12px;
    outline: none;
  }
  .field textarea {
    resize: vertical;
    min-height: 44px;
    font-family: var(--display);
    font-size: 16px;
  }
  .field input[type='color'] {
    width: 100%;
    height: 32px;
    background: var(--bg);
    border: 1px solid var(--line);
    cursor: pointer;
  }
  .field input[type='range'] {
    width: 100%;
    accent-color: var(--accent);
  }
  .row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .depth {
    border: none;
    padding: 0;
    margin: 0 0 8px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .depth legend {
    display: block;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.15em;
    color: var(--text-dim);
    text-transform: uppercase;
    margin-bottom: 5px;
    width: 100%;
  }
  .chip {
    padding: 5px 9px;
    font-family: var(--mono);
    font-size: 10px;
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--line);
    cursor: pointer;
  }
  .chip.active {
    background: var(--accent-3);
    color: #000;
    border-color: var(--accent-3);
  }
  .hint {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-dim);
    padding: 8px;
    background: var(--bg);
    border-left: 2px solid var(--accent-3);
  }
</style>
