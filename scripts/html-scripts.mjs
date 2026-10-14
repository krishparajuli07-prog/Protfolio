import { parse } from 'parse5';

// Parse HTML like a browser, including quoted '>' characters and unusual end tags.
// Text nodes use the HTML parser's newline normalization, as CSP hashing requires.
export function inlineScripts(html) {
  const scripts = [];
  function visit(node) {
    if (node.tagName === 'script' && !node.attrs.some(({ name }) => name === 'src')) {
      scripts.push((node.childNodes ?? []).map((child) => child.value ?? '').join(''));
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  }
  visit(parse(html));
  return scripts;
}
