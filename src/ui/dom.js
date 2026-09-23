// Minimal DOM builder. Styling lives in the stylesheet; `class` names the
// rules an element takes, and `style` is kept for what only the data knows -
// a platform colour, a bar's width, a dot's position.

export function h(tag, props = {}, ...children) {
  return fill(document.createElement(tag), props, children);
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function s(tag, props = {}, ...children) {
  return fill(document.createElementNS(SVG_NS, tag), props, children, true);
}

// Joins the truthy class names, so conditional ones can be written inline:
// cx("chip", active && "is-active").
export const cx = (...names) => names.filter(Boolean).join(" ");

function fill(el, props, children, isSvg = false) {
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "style") setStyle(el, value);
    else if (key === "text") el.textContent = value;
    else if (key.startsWith("on")) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (isSvg) el.setAttributeNS(null, key, value);
    else el.setAttribute(key, value);
  }
  append(el, children);
  return el;
}

// Custom properties ("--pc") have no camelCase key on element.style, so they
// go through setProperty; everything else can be assigned directly.
function setStyle(el, style) {
  for (const [key, value] of Object.entries(style)) {
    if (value == null) continue;
    if (key.startsWith("--")) el.style.setProperty(key, value);
    else el.style[key] = value;
  }
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
