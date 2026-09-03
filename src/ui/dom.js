// Minimal DOM builder. The design's logic returns React-style style objects,
// and element.style takes the same camelCase keys, so they can be applied
// directly — no framework needed for what is ultimately a static page.

export function h(tag, props = {}, ...children) {
  return fill(document.createElement(tag), props, children);
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function s(tag, props = {}, ...children) {
  return fill(document.createElementNS(SVG_NS, tag), props, children, true);
}

function fill(el, props, children, isSvg = false) {
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "style") Object.assign(el.style, value);
    else if (key === "text") el.textContent = value;
    else if (key.startsWith("on")) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (isSvg) el.setAttributeNS(null, key, value);
    else el.setAttribute(key, value);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
}
