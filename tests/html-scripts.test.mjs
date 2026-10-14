import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inlineScripts } from '../scripts/html-scripts.mjs';

test('CSP script extraction follows HTML parsing rules', () => {
  const html = `<!-- <script>comment</script> -->
    <script data-label="a>b">first()</script >
    <SCRIPT data-src="example">second()</SCRIPT>
    <script SRC="/external.js">ignored()</script>
    <textarea><script>notScript()</script></textarea>
    <script>line1\r\nline2</script>`;
  assert.deepEqual(inlineScripts(html), ['first()', 'second()', 'line1\nline2']);
});
