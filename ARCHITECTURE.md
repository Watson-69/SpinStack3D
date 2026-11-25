# Directory Overview


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

