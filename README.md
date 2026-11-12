# Rahmat Sharify portfolio

Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run locally
Open `index.html` in a browser, or serve the folder: `python3 -m http.server` then visit http://localhost:8000
Google Fonts load when online; offline the site falls back to system fonts.

## Edit
- Text, CV facts, client blurbs, contact and social links: `assets/data/content.js`
- Colours and spacing: tokens at the top of `css/styles.css`
- Images and categories: regenerate with `build_assets.py` from the original folders (writes `assets/img` and `assets/data/portfolio.js`)

See `ASSET_MAP.md` for the folder-to-section mapping.
