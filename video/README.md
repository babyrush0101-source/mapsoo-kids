# Mapsoo Worldsmith 75-second release video

This independent Remotion project renders the silent, bilingual release video for `v0.1.0-alpha.1`. The render command passes `--muted` so the MP4 contains no hidden or placeholder audio track.

The video uses only the six locally verified release visuals in `docs/media/v0.1.0-alpha.1/itch/`, plus captions stored as structured JSON. It does not fetch remote media, use image-model output, claim an unpublished demo URL, or pretend that the Godot CLI verification card is an editor screenshot.

## Commands

```powershell
pnpm install
pnpm lint
pnpm render:sample
pnpm render
pnpm verify:source
pnpm verify:rendered
pnpm verify:output
```

`render:sample` renders the middle of the pack-contents scene at 43 seconds. Scene-boundary frames intentionally cross-fade through the dark background and are not representative layout checks.

The full composition is exactly 75 seconds at 1920×1080 and 30 fps. Generated files are written to `video/out/` and ignored by Git. `verify:rendered` checks that temporary output; `verify:output` checks the reviewed MP4 committed to the versioned release media directory.

The closing frame currently displays only the public GitHub repository. Replace or extend it only after release, Pages, or itch.io URLs are publicly accessible and verified anonymously.

The project-authored video source follows the repository's MIT license. Remotion and all other dependencies remain governed by their own licenses; maintainers are responsible for checking the applicable Remotion license before organizational or commercial rendering.
