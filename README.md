# wisp-landing

Static landing page for [Wisp](https://github.com/sulemaanhamza/wisp). No build
step, no framework, no dependencies — just three HTML files, one CSS file,
and one small JS file.

## Files

```
index.html     Hero, how it works, features, shortcuts, privacy, install, FAQ
privacy.html   Privacy policy
terms.html     Terms of service
styles.css     All styling; light / dark / system theme tokens at the top
script.js      Theme cycle, download link, copy buttons, scroll reveal, hero demo
assets/        icon.png (and favicon / apple-touch sizes), og.png for link previews
```

## Preview locally

Open `index.html` directly in a browser, or serve the folder:

```sh
cd ~/Development/wisp-landing
python3 -m http.server 8080
# visit http://localhost:8080
```

The Download button uses `fetch` against GitHub's API to resolve the latest
release's `.zip` URL. `file://` works but the `fetch` may be CORS-blocked in
some browsers — the button falls back to the `/releases/latest` page, which
still works.

## Deploy

Static host of choice — GitHub Pages, Netlify, Vercel, Cloudflare Pages, an S3
bucket. The whole folder is the deploy target. No environment variables, no
secrets.

**GitHub Pages**: push this folder to a repo, enable Pages on the default
branch root.

**Netlify / Vercel / Cloudflare**: drag-and-drop, or point at a Git repo and
let it deploy on push. Build command: none. Publish directory: `.`.

**S3 + CloudFront**: sync the folder, configure CloudFront to serve
`index.html` as the default root object.

## Customizing

- Update the **last-updated date** on `privacy.html` and `terms.html` whenever
  the policy text meaningfully changes.
- Theme variables live at the top of `styles.css` (`:root` and
  `html[data-theme="light"]`) — change one variable to recolor the whole page.
- The hero is an HTML/CSS copy of the Wisp panel, in the app's own colours.
  `index.html` holds its finished state (what visitors without script, or with
  Reduce Motion, see); `script.js` plays it typed out once when it scrolls
  into view. Change both together.
- `assets/og.png` is the image shown when the page is shared. It's a 1200×630
  picture of the hero; redo it if the hero changes.
- The Download button text is in `index.html` (search for "Download for macOS").

## What's intentionally absent

- No analytics, no cookies, no consent banner — keeps the page in spirit with
  Wisp itself.
- No build tooling. If you can read HTML and CSS, you can change anything.
- No CDN font load. Charter is preinstalled on macOS; on other systems the
  serif stack falls back to Georgia.
