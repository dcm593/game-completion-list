// Both typefaces are bundled rather than fetched from Google Fonts, so the
// page makes no third-party requests and no render-blocking cross-origin
// stylesheet stands between it and first paint. Each is one variable font
// split by script; the browser downloads only the subsets a page uses.
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./styles/index.css";
import { mount } from "./app.js";

mount();
