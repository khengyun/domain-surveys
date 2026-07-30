# Domain Surveys

[![Check site](https://github.com/khengyun/domain-surveys/actions/workflows/check-site.yml/badge.svg)](https://github.com/khengyun/domain-surveys/actions/workflows/check-site.yml)
[![Deploy static site to GitHub Pages](https://github.com/khengyun/domain-surveys/actions/workflows/pages.yml/badge.svg)](https://github.com/khengyun/domain-surveys/actions/workflows/pages.yml)

🌐 **Website:** [khengyun.github.io/domain-surveys](https://khengyun.github.io/domain-surveys/)

A visual, folder-first home for living surveys about artificial intelligence.

The website is plain static HTML/CSS/JavaScript, so every survey gets a durable URL:

```text
https://khengyun.github.io/domain-surveys/<survey-name>/
```

## Structure

```text
domain-surveys/
├── index.html                 # survey index
├── assets/                    # shared styles and behavior
├── image-composition/         # one complete example survey
│   ├── index.html
│   └── assets/                # images and video owned by this survey
└── survey-template/           # copy this folder for a new survey
```

## Add a survey

1. Copy `survey-template/` to a lowercase, hyphenated folder, for example
   `vision-language-models/`.
2. Edit that folder's `index.html`.
3. Put images, diagrams, and videos in `<survey-name>/assets/`.
4. Add a card for the new survey to the root `index.html`.

Use relative paths (`../assets/styles.css`, `./assets/figure.png`) so the same files work on
localhost and GitHub Pages.

## Preview locally

No installation is required:

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>. The sample survey is at
<http://localhost:4173/image-composition/>.

## Publish

The repository includes a GitHub Pages workflow. In GitHub:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main`.

The workflow publishes the repository as a static site.

## Media

- Images and diagrams open in a full-screen, zoomable viewer.
- Visual nodes render native `.drawio` XML in an interactive diagrams.net viewer with pan,
  zoom, page, and layer controls.
- PNG, JPG, SVG, MP4, and WebM work without extra JavaScript.
- Editable draw.io exports use the double extension `*.drawio.svg`.
- Keep each asset beside the survey that owns it.
- Compress large media before committing; GitHub Pages is best for short demos and figures.

### Fill a visual node

The Image Composition survey contains one clickable visual node per taxonomy leaf. Each node
already points to an expected native draw.io filename, so the simplest workflow requires no HTML
change or image export:

1. Save the diagram as the filename shown in the empty dialog, for example
   `image-pasting.drawio`.
2. Add it to `image-composition/assets/`.
3. Click the node again; the dialog now renders the diagram with interactive controls.

To use another draw.io filename, update that node's `data-node-diagram` value in
`image-composition/index.html`.

### Update the main taxonomy

The native source is `image-composition/assets/image-composition-taxonomy.drawio`. After editing
it, regenerate the in-page SVG preview while keeping the source embedded:

```bash
drawio -x -f svg -e -t -b 0 --svg-theme light \
  -o image-composition/assets/image-composition-taxonomy.drawio.svg \
  image-composition/assets/image-composition-taxonomy.drawio
```
