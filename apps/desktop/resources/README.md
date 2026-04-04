# App Icon Resources

This directory contains icon files required by electron-builder.

- `icon.png` — 256×256 PNG (Linux, source for other formats)
- `icon.ico` — Windows ICO format
- `icon.icns` — macOS ICNS format (generate on macOS: `iconutil -c icns icon.iconset`)

## Regenerating Icons

Replace `icon.png` with your production design, then:
- Windows: electron-builder auto-converts from PNG
- macOS: Use `iconutil` or `png2icns` to create `.icns`
- Linux: electron-builder uses PNG directly
