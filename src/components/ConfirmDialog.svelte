<script lang="ts">
  import { app } from '../state.svelte';

  let dialog = $state<HTMLDialogElement | undefined>();

  $effect(() => {
    if (!dialog) return;
    if (app.dialog.kind === 'confirm') {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  });

  function cancel() {
    app.dialog = { kind: 'none' };
  }

  function confirm() {
    if (app.dialog.kind === 'confirm') app.dialog.onConfirm();
  }
</script>

<dialog bind:this={dialog} class="dialog" aria-labelledby="dlg-title" oncancel={cancel}>
  {#if app.dialog.kind === 'confirm'}
    <h2 id="dlg-title">{app.dialog.title}</h2>
    <p>{app.dialog.message}</p>
    <div class="actions">
      <button type="button" class="btn" onclick={cancel}>Cancel</button>
      <button type="button" class="btn primary" onclick={confirm}>Confirm</button>
    </div>
  {/if}
</dialog>

<style>
  .dialog {
    background: var(--bg-2);
    color: var(--text);
    border: 1px solid var(--line);
    padding: 20px;
    max-width: 400px;
    font-family: var(--ui);
  }
  .dialog::backdrop {
    background: rgba(0, 0, 0, 0.7);
  }
  .dialog h2 {
    font-family: var(--display);
    font-size: 20px;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  }
  .dialog p {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 16px;
  }
  .actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
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
  .btn.primary {
    background: var(--accent);
    color: #000;
    border-color: var(--accent);
    font-weight: 700;
  }
</style>
