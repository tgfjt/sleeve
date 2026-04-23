<script lang="ts">
  import TopBar from './components/TopBar.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import CanvasStage from './components/CanvasStage.svelte';
  import Inspector from './components/Inspector.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import LoaderOverlay from './components/LoaderOverlay.svelte';
  import ConfirmDialog from './components/ConfirmDialog.svelte';
</script>

<div class="app">
  <TopBar />
  <Sidebar />
  <main class="canvas-wrap" aria-label="Editor canvas">
    <CanvasStage />
    <LoaderOverlay />
  </main>
  <Inspector />
  <StatusBar />
</div>

<ConfirmDialog />

<style>
  .app {
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    grid-template-rows: 52px 1fr 28px;
    grid-template-areas:
      'top top top'
      'side canvas inspect'
      'status status status';
    height: 100vh;
    gap: 0;
  }
  .canvas-wrap {
    grid-area: canvas;
    background: radial-gradient(circle at 50% 50%, #1a1a22 0%, var(--bg) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    padding: 30px;
  }
</style>
