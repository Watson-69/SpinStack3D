# SpinStack 3D — Enterprise HDD Architecture Explorer

Interactive WebGL CAD and electromechanical dissection viewer for a 3.5-inch (SFF-8301) enterprise PMR hard disk drive. Inspect all 11 internal and external subsystems in real time, scrub vertically staggered exploded assemblies, trigger 7,200 RPM spindle rotation and actuator seek acoustics, switch between Obsidian / Alabaster / Signal Red editorial themes, and explore technical monographs covering physical principles, specifications, and field service advisories.

---

## Tech Stack & Architecture

- **Frontend Framework:** React 18, TypeScript 5.6 (`strict`, `noUnusedLocals`, `noUnusedParameters`), Vite 5
- **3D Rendering & Geometry:** Three.js, `@react-three/fiber`, `@react-three/drei`, Draco glTF decoder (`/draco/`)
- **State Management:** Zustand (`useHddStore` with URL query-parameter hydration)
- **Motion & Typography:** GSAP + `@gsap/react` (curtain intro), bundled `@fontsource-variable/manrope` & `@fontsource/jetbrains-mono`
- **Styling & Icons:** Tailwind CSS v3, `clsx` + `tailwind-merge` (`cn` utility), Lucide React
- **Procedural Audio & CAD:** Native Web Audio API synthesizer (`HddSoundSystem`), Blender 5.x `bpy` CAD generation & validation scripts


---

## Prerequisites & Installation

- **Node.js:** v18+ (verified on v24.x) and **npm**
- **Google Chrome (Optional):** Required only if running headless CDP browser verification scripts in `scripts/`
- **Blender 5.x (Optional):** Required only if regenerating `.glb` CAD meshes via `scripts/generate_hdd_model.py` or `tools/blender/`

```bash
npm install
```

---

## Environment Variables

This application runs completely client-side and requires **no `.env` file or secret keys** to build or run.

If you customize local browser test tooling, you may optionally configure standard OS temporary paths (no secrets belong in `VITE_*` client bundles):

```env
# Optional: custom Vite port or test Chromium temporary profile path
PORT=3000
TEMP=./tmp
```

---

## Usage / Running the Project

### Local Development & Production Build

```bash
# Start Vite dev server (http://localhost:3000)
npm run dev

# Type-check and build production bundle to dist/
npx tsc --noEmit && npm run build

# Preview production bundle locally
npm run preview
```

### Verification Scripts

Run checks against a built `dist/` bundle:

```bash
# Verify 3D click selection, J/K chapter stepping & closed/exploded callout counts
node scripts/test_interactive_clicks.js

# Verify layout geometry across 10 desktop/tablet viewports (requires Chrome installed)
node scripts/diagnose_layout.js

# Inspect glTF nodes and bounding coordinates
node scripts/inspect_glb.js
node scripts/diagnose_exploded.js
```

### Keyboard Shortcuts & URL Parameters

- **Shortcuts:** `J` / `K` step chapters, `E` toggle exploded view, `F` / `R` refit camera, `S` toggle 7,200 RPM spindle, `X` toggle X-Ray casing, `L` toggle callout pins, `1`–`5` switch camera presets, `/` focus filter, `⌘K` / `Ctrl+K` Command Palette, `?` shortcuts modal, `M` mute audio.
- **Query Flags:** `?skipPreloader=1` (or `?skipIntro=1`), `?theme=dark|light|signal`, `?selected=<part_id>`, `?exploded=1`, `?explodeVal=0.45`, `?xray=1`, `?preset=isometric|platter_macro|vcm_actuator|pcb_underside|exploded_blueprint`.

---

## License

Proprietary / All Rights Reserved.
