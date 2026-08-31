# Odin Webpack Template

A starter webpack template following [The Odin Project's webpack lesson](https://www.theodinproject.com/lessons/javascript-webpack). Use it as a base for any TOP project that needs bundling. CSS support is included out of the box.

## Using this as a template

If this repo is set up as a GitHub template, click **Use this template** to start a new project. Otherwise, copy the folder and run `npm install`.

## Setup

```bash
npm install
```

## Scripts

| Command         | What it does                                                        |
| --------------- | ------------------------------------------------------------------- |
| `npm run build` | Bundles `src/` into `dist/` (development mode, source maps).         |
| `npm run dev`   | Starts the dev server with live reload at http://localhost:8080.    |
| `npm run deploy`| Pushes the `dist/` folder to a `gh-pages` branch (build first).     |

## Project structure

```
.
├── dist/               # Bundled output (generated, git-ignored)
├── src/
│   ├── index.js        # Entry point — import JS, CSS, and assets here
│   ├── template.html   # HTML template (script tag injected automatically)
│   └── styles.css      # Global styles
├── webpack.config.js
└── package.json
```

## How it works

- **Entry/output** — `src/index.js` is the entry; everything bundles to `dist/main.js`. `output.clean` empties `dist/` on every build.
- **HTML** — `HtmlWebpackPlugin` uses `src/template.html` and injects the bundle script tag for you, so don't add a `<script>` tag manually.
- **CSS** — import stylesheets from JS with `import "./styles.css";`. The `style-loader`/`css-loader` chain runs (order matters: `css-loader` is listed last because Webpack applies loaders right-to-left).
- **Images** — import assets in JS (`import img from "./img.png";`) or reference them in HTML; they're handled as `asset/resource` and emitted with hashed filenames.

## Notes

- This package uses ES modules (`"type": "module"` in `package.json`), matching the modern config style TOP teaches (`export default`, `import.meta.dirname`).
- Restart the dev server after editing `webpack.config.js`.
