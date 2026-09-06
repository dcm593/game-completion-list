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

## Data sync

Game data lives in a private Google Sheet and is baked into
`src/data/games.json` at build time. The site never talks to Google, so the
deployed page is fully static and the JSON is version-controlled.

### One-time setup

1. In the Google Cloud console, enable the **Google Sheets API**.
2. Create a **service account** (IAM & Admin → Service Accounts). No roles are
   needed — access is granted by the sheet, not by IAM.
3. Add a **JSON key** to it and download the file.
4. Open the sheet → **Share** → add the service account's
   `…@….iam.gserviceaccount.com` address as a **Viewer**. This is the step that
   actually grants access; skipping it produces a 403 even though auth succeeds.
5. Point `.env` at the key (both files are git-ignored):

   ```
   GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/service-account.json
   ```

   Or paste the JSON inline as `GOOGLE_SERVICE_ACCOUNT_KEY={...}`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run sync` | Reads the sheet, writes `src/data/games.json`, checks the parsed totals against the sheet's own totals row. |
| `npm run probe -- 18 30` | Dumps raw, unmasked cell data for the given 1-based rows. Used to work out how formatting encodes things. |

## Cover art

Landscape art is fetched from SteamGridDB at build time and committed under
`src/assets/covers/`, so the deployed page makes no third-party requests.

```
npm run covers              # resolve anything not already downloaded
npm run covers -- --dry     # report resolutions without downloading
npm run covers -- --force   # re-resolve everything
```

Add `STEAMGRIDDB=<key>` to `.env`. Every resolution prints the name SteamGridDB
actually matched, prefixed with `~` when it differs from the search term, so a
bad match is visible immediately.

Rows that aren't standalone games (DLC, chapter splits, mods, challenge modes)
are corrected in `src/data/cover-overrides.js`, which maps a sheet title to a
different search term, an exact SteamGridDB id, or a hand-supplied file in
`src/assets/covers/manual/`.

### Badge images

The platinum trophy and 100% badge come from the spreadsheet's own in-cell
images. Sheets does not expose those through the REST API, but an `.xlsx`
export is a zip and they sit in `xl/media/`; `xl/drawings/drawing1.xml` maps
each one to the legend row that gives it meaning.

They arrive far larger than they are drawn, so they are downscaled first:

```
node scripts/downscale-png.js <in.png> <out.png> 96
```

That script is a dependency-free box-filter resampler (Node's zlib does the
PNG half). 96px is 3x the size the badges are drawn at, so they stay sharp on
any display; the originals cost ~812KB for icons under a thousandth of the
page's pixels.
