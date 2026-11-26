# codet-render-farm

Parallel frame renderer for the Codet cartoon serial (Krakatau 1883), built on the
cartoon-short-kit engine (three.js in headless Chromium).

How it works:
- `project/web/` holds the current episode project (story.js = the episode).
- On every push to `project/**`, 10 GitHub Actions runners each render one slice
  of the frames with Playwright/Chromium (swiftshader).
- An assemble job collects all frames, zips them, and publishes the zip as the
  `latest-render` release. Encoding to mp4 happens locally with the audio mix.

To render a different episode: replace `project/web/story.js` (and cast files),
push, wait for the release.
