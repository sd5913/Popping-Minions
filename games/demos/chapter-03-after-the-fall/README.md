# Chapter 03 — After the Fall

This folder contains the static website build supplied for the Clock City / Long Avenue scene. It is a standalone Chapter 03 build, not a replacement for the four-chapter Open Wild game.

**Live preview:** [Play Chapter 03 on Trae](https://37lon8zeql9dzaanakv.traesite.cn/)

## Contents

- `index.html` and `assets/` — built page and JavaScript/CSS bundles
- `models/clock-city.glb` — runtime scene model
- `images/` — scene images
- `mediapipe/` and `draco/` — hand-tracking and model-decoding runtime files

## Run locally

Serve this directory as the web root so its root-relative asset URLs resolve correctly:

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Camera controls require browser permission and work on `localhost` or HTTPS.

This is a prebuilt static snapshot. Its asset URLs assume a site-root deployment; do not publish it under a GitHub Pages subdirectory without first configuring its asset base paths.
