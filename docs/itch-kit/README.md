# Verified itch.io upload kit

This directory contains the versioned page inputs for the free Sunny Meadow Graphical Assets page. The generated upload directory is deliberately separate from the GitHub release bundle: itch.io receives the executable-free asset ZIP and a checksum for that ZIP, never the Godot importer.

Build and verify everything from source:

```bash
pnpm release:itch
```

The verified alpha.2 operator directory was written to `release/itch/v0.1.0-alpha.2/` before the GitHub release. Its itch.io page remains postponed; both published GitHub versions are immutable and must never be rebuilt from newer source.

- `uploads/` — the asset ZIP and itch-specific `SHA256SUMS`;
- `page/` — reviewed operator inputs for page fields and bilingual copy;
- `media/` — one 1260×1000 cover and five 1600×900 screenshots;
- `itch-upload-manifest.json` — SHA-256, byte length, role, and image dimensions for every other file.

`metadata.json` is an operator checklist, not an itch.io import file: map its fields manually and do not upload it. Paste `page.md` into itch.io's rich-text editor, then restore headings, lists, and links and preview the result. Select project kind `Downloadable`; mark the asset ZIP itself as `Graphical Assets`. If `SHA256SUMS` is uploaded separately, classify it as documentation/other rather than graphical content.

Keep visibility at `Draft`, choose itch.io's **$0 or Donate** pricing option, leave platforms empty, and use CC0-1.0 as the primary asset license while preserving the mixed-license scope explained in the page. The conservative generative-AI disclosure is `Yes` + `Text & Dialog` + `Code`; Graphics and Sound remain off. Publishing is a manual maintainer action after previewing the real page. Do not add an importer ZIP, executable platform flags, placeholder URL, or unverified metric.
