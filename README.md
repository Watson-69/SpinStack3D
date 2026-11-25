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

### Directory Overview

```text
├── index.html                  # Document entry & default theme attribute
├── components.json             # shadcn UI alias & Tailwind configuration
├── vite.config.ts              # Vite dev server (port 3000) & Rollup chunk splitting
├── tailwind.config.js          # Knockout CSS-variable theme & font extensions
├── public/
│   ├── draco/                  # Self-hosted Draco WASM/JS geometry decoders
│   └── models/
│       ├── hdd.glb             # Root Blender export target (102 KB Draco GLB)
│       └── hdd/
│           └── hdd_internals.glb  # Active runtime GLB loaded by HddModel
├── scripts/                    # Headless Chromium regression, bounds & layout checks
├── tools/blender/              # Blender `bpy` CAD scripts & `REFERENCE.md` spec
└── src/
    ├── App.tsx                 # Responsive layout shell & deferred lazy 3D Canvas
    ├── index.css               # Tri-theme CSS tokens, editorial utilities & keyframes
    ├── theme/
    │   └── knockoutTheme.ts    # Obsidian (dark), Alabaster (light), Signal Red tokens
    ├── store/
    │   └── useHddStore.ts      # Centralized simulation, explosion, selection & theme state
    ├── data/
    │   ├── hddParts.ts         # 11 HDD part schemas, coordinates, formulas & advisories
    │   └── cameraPresets.ts    # V01–V05 + Reset camera positions & targets
    ├── hooks/
    │   ├── useGlobalShortcuts.ts
    │   └── useResponsiveLayout.ts
    ├── lib/
    │   └── utils.ts            # Classname merge helper (cn)
    ├── utils/
    │   ├── clipboard.ts        # Clipboard copy helper with DOM fallback
    │   ├── formula.ts          # LaTeX-like equation to Unicode formatter
    │   ├── math.ts             # Clamping, easing & progress normalization
    │   ├── sound.ts            # Procedural spindle hum & seek click synthesizer
    │   └── viewerActions.ts    # Shared view/explode/audio action + toast dispatchers
    └── components/
        ├── canvas/
        │   ├── HddCanvas.tsx         # On-demand Canvas, studio Lightformers & Grid
        │   ├── HddModel.tsx          # glTF loader, stagger explosion & pointer picking
        │   ├── hddModelUtils.ts      # Material sync, highlight emissives & part resolution
        │   ├── hddTextures.ts        # Procedural 1024px top cover label texture
        │   ├── partRegistry.ts       # O(1) cached local anchors & Box3 world bounds
        │   ├── CalloutSystem.tsx     # Ref-driven SVG leader lines & FIG_01–FIG_11 badges
        │   ├── calloutLayout.ts      # Pure 2D collision-free callout gutter solver
        │   ├── CameraController.tsx  # Smooth camera preset & selected-part framing
        │   └── ExplodedGuides.tsx    # Vertical dashed disassembly datum lines
        └── ui/
            ├── Preloader.tsx         # GSAP curtain intro (`HARDDISK (01)`)
            ├── HeaderBar.tsx         # Masthead, DISASSEMBLE bar, toggles & theme swatches
            ├── Sidebar.tsx           # Collapsible chapter index (CH. 01–04) & search filter
            ├── FocusCard.tsx         # Right-hand engineering monograph container
            ├── inspector/            # AssemblyOverview & Principles/Specs/Advisory tabs
            ├── ViewportHud.tsx       # Viewport plate headers, hint & V01–V05 preset bar
            ├── ExplodeSlider.tsx     # Accessible ARIA slider decoupled from OrbitControls
            ├── LiquidGauge.tsx       # SVG fluid level meter for disassembly progress
            ├── CommandPalette.tsx    # Searchable commands, parts, views & themes (⌘K)
            ├── KeyboardShortcutsModal.tsx
            ├── Toast.tsx
            └── knockout-landing-page.tsx  # Integrated Knockout storefront UI reference
```

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
