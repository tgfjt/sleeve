<script lang="ts">
  type Props = { bitmap: ImageBitmap; size?: number };
  const { bitmap, size = 120 }: Props = $props();

  let canvas = $state<HTMLCanvasElement | undefined>();

  // drawImage the bitmap onto a small canvas. Cheaper than round-tripping
  // through toDataURL + CSS background, which showed up in DevTools
  // profiling as 80-160ms per candidate on full-resolution masks.
  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    const scale = Math.max(size / bitmap.width, size / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  });
</script>

<canvas bind:this={canvas} {...{ width: size, height: size }} class="thumb-canvas"></canvas>

<style>
  .thumb-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
