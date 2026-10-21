# Anatomy 3D

An interactive 3D model of the full human body for iPhone. It shows 2,387 parts in 1,370 structures: bones, joints and ligaments, muscles with tendons, nerves, brain and spinal cord, arteries, veins, the heart, and organs. Each structure has a study card.

## Tools

- **Tap** a structure to isolate it. Its name shows on a small banner above the model. Tap the banner to open the study card, which slides in from the right. Tap empty space (or the banner's X) to restore the body. A selected pale part (bone, cartilage, ligament, tendon) turns blue so it stands out.
- **Side menu** (left) holds Layers, Peel, Explode and Section. On iPad and desktop it is always open. On iPhone, tap "Layers & tools" to open it.
- **Three zones** on iPad and desktop: with the study card open, the menu, the model and the card each take one third of the screen. The model slides sideways (no zoom) to stay centered in its zone. On iPhone, the menu and the card are drawers, and opening one closes the other.
- The 3D view has no text labels.
- **Layers** is a list with a check mark for each system that shows. **Peel** hides systems from the outside in.
- **Explode** is a layer stack, like an exploded axonometric. The skeleton, joints, nerves, vessels, brain and spinal cord stay in place. Organs, deep muscle, middle muscle and superficial muscle lift off sideways, one slot each. At 100% no two layers overlap. Hidden or empty layers take no slot. Reset frames the whole stack and keeps the skeleton at the center.
- **Rotation pivot.** The view rotates around the center of the body in the current region. When the explode is open, the pivot is the center of the parts that stay in place (the skeleton). Two-finger pan starts only after the fingers move together about 28 px, so a pinch-zoom does not move the pivot. Tap **Center** to put the pivot back on the body. Tap the **Focus** button on the name banner to rotate around the selected structure.
- **Section** cuts one thin slice (5 mm) through the body on one of the three body planes (axial, coronal, sagittal). The cut faces are filled solid, in a darker shade of each part's color. Everything between you and the cut is removed, like a plan cut. Whatever lies beyond the slice stays as a faint ghost. The key figure shows where the cut is. The slider range follows the region picker. Tap a cut face to select that part.
- **Scan view** shows the slice exactly straight on, flat (no perspective), so sizes and distances are true at every depth, like a CT image. It uses the radiology orientation: axial is seen from the feet (the patient's right on the screen's left, the front at the top), coronal from the front, and sagittal from the patient's left (the front on the screen's left). Letters at the screen edges show the directions (R, L, A, P, S, I). Rotation is locked: drag to pan, pinch or scroll to zoom, and tap Reset to fit the slice. The ghost is hidden, so only the slice shows. Turn Scan view off to return to the same 3D view.

## Files

| File | Purpose |
|---|---|
| `index.html` | The app (all code inside) |
| `models/*.glb` | The 3D models, one per body system (6.8 MB total, compressed) |
| `data/parts.json` | Part list: side, region, layer, explode data |
| `data/cards.json` | Study cards and glossary |
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
