export function exportFilename(now: Date = new Date()): string {
  return `sleeve_${now.getTime()}.png`;
}
