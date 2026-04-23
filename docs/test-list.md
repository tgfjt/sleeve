# Test list — refactor from reference/index.html

Reference: `reference/index.html` (1245 lines, inline ES module).
t_wada 流にこのリストを上から潰す。各項目の `[ ]` は commit 1 cycle (Red → Green → Refactor) で落とす想定。

## Unit (Vitest — `tests/unit/`)

### `src/lib/coords.ts`

- [ ] `clientToNatural({clientX, clientY}, rect, {naturalW, naturalH})` returns natural-image coords (reference: index.html:618-620)
  - ratio は `rect.width` / `rect.height` に対する比率
- [ ] `naturalToClient(...)` (overlay マーカー配置に必要; reference:1210-1214)
- [ ] 端点 (0, 0) と (W, H) で識変換が恒等

### `src/lib/layer.ts`

- [ ] `createTextLayer({id, naturalW, naturalH})` returns default layer (reference:840-853)
  - size = round(H * 0.28)
  - x = W/2, y = H/2, font='Anton', color='#ff4d2e', opacity=1, blur=0, letterSpacing=0, maskMode='none'
- [ ] `linkLayerToMask(layer, maskId, mode)` sets maskId + maskMode; mode='none' clears both
- [ ] `unlinkLayersFromMask(layers, maskId)` resets layers referencing deleted mask (reference:1193-1195)
- [ ] Layer ordering: `layers` is bottom-up; reverse for UI list (reference:875)

### `src/lib/mask.ts`

- [ ] `sortCandidatesByArea(candidates)` — ascending area → [S, M, L] (reference:736)
- [ ] `outlineOffset(W, H)` = max(2, round(min(W, H) * 0.003)) (reference:1081)
- [ ] `defaultSelectedIdx(candidates, prevIdx)` — keep prev if valid, else `length-1` (largest) (reference:740-742)

### `src/lib/text.ts`

- [ ] `measureLetterSpaced({text, letterSpacing, measure})` returns total width = Σ widths + ls * (n-1) (reference:1118)
- [ ] Single-char strings: width = widths[0], no letter-spacing contribution
- [ ] Empty string: 0
- [ ] `lineLayout({size, lineCount, y})` returns lineHeight = size * 1.05, startY centered (reference:1108-1109)

### `src/lib/hit.ts`

- [ ] `hitTestLayer(point, layer, measuredWidth)` — within textW/2+30 and textH/2+30 (reference:1150)

### `src/lib/escape.ts`

- [ ] `escapeHtml(s)` — `&<>"'` mapped (reference:1013-1015)
- [ ] Non-string input coerced via String()
- [ ] Idempotency note: applied twice, `&amp;` → `&amp;amp;` (documents current behavior; callers must not double-escape)

### `src/lib/export.ts`

- [ ] `exportFilename(now: Date)` → `sleeve_<timestamp>.png` (reference:1223)

## Integration / E2E (Playwright — `tests/e2e/`)

SAM モデルは `window.__SLEEVE_SAM_STUB__` 経由でスタブ注入 (Phase 2 で `src/lib/sam.ts` に fabricable な interface を用意)。80MB のモデルダウンロードを CI で回さない。

- [ ] Upload fixture JPG → canvas frame visible, `img-info` shows dims
- [ ] Click on canvas (with SAM stub returning 3 fixed masks) → candidate picker shows 3 thumbs (S/M/L)
- [ ] Pick candidate M → overlay tint reflects selected mask
- [ ] Confirm → Saved Masks list increments
- [ ] Add text layer → appears in inspector
- [ ] Text edit updates layer label live
- [ ] Depth = `behind Mask 1` → re-render keeps subject-above-text composite
- [ ] Export PNG triggers download with matching filename pattern
- [ ] Keyboard: candidate picker is `role="radiogroup"`, arrow keys switch (Phase 4)
- [ ] Keyboard: arrow keys nudge selected text layer (Phase 4)
- [ ] No `alert()` / `confirm()` dialogs surfaced (Phase 4)

## Non-functional checks

- [ ] `pnpm build` outputs with `base: '/sleeve/'` (verified in Phase 0)
- [ ] Service worker registers at `/sleeve/` scope, sets COOP/COEP (Phase 5)
- [ ] `crossOriginIsolated === true` after SW activates (Phase 5)
- [ ] GitHub Pages deploy passes via Actions (Phase 6)

## Out of scope for this PR

- SlimSAM → SAM3 / mobile-SAM への差し替え
- 書き出し解像度の選択肢 (現状: 元画像サイズ PNG のみ)
- Undo / Redo
