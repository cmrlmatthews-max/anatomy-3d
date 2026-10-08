# Anatomy 3D

An interactive 3D model of the right arm for iPhone. It shows 198 parts: 32 bones, 63 muscles (with tendons), 49 nerves, 33 arteries, and 21 veins. Each part has a study card.

## Files

| File | Purpose |
|---|---|
| `index.html` | The app (all code inside) |
| `arm.glb` | The 3D model (664 KB, compressed) |
| `anatomy.json` | Study cards and glossary |
| `manifest.json` | Home Screen settings |
| `sw.js` | Cache for fast repeat visits and offline use |
| `icon-180.png` | iPhone Home Screen icon |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Icons for other devices |

## Put it on GitHub Pages

This repository publishes from the `main` branch, root folder.

1. Open `https://cmrlmatthews-max.github.io/anatomy-3d/` in Safari on iPhone.
2. Wait until the arm model appears.
3. Tap Share, then tap "Add to Home Screen."

All paths are relative, so any folder name works.

## Update the app

**Caution:** The cache keeps old files. If you change any file, change `VERSION` in `sw.js` (for example, `'v2'` to `'v3'`). If you do not, the iPhone keeps the old version.

## Requirements

- iOS 16.4 or later.
- An internet connection on the first visit. The app loads three.js from cdn.jsdelivr.net. After the first visit, the app works offline.

## Credits

- 3D models: [Z-Anatomy](https://github.com/LluisV/Z-Anatomy) (CC BY-SA 4.0), from BodyParts3D © DBCLS (CC BY-SA 2.1 JP).
- For study only. Not for clinical use.
