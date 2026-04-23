import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/lib/escape';

describe('escapeHtml', () => {
  it('escapes all five HTML special chars', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('passes through safe text', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('coerces non-string input via String()', () => {
    expect(escapeHtml(42 as unknown as string)).toBe('42');
  });

  it('is not idempotent by design (matches reference)', () => {
    // Documented quirk: double-escape replays & → &amp; again
    expect(escapeHtml(escapeHtml('&'))).toBe('&amp;amp;');
  });
});
