# 3.5-Inch Hard Disk Drive (HDD) Architectural Reference & Dimensions

## 1. Industry Standard Reference Specifications
- **Standard**: SFF-8301 (Specification for 3.5" Form Factor Drives) & SFF-8323 (Location of Side and Bottom Mounting Holes).
- **Form Factor**: 3.5-inch Large Form Factor (LFF), standard half-height (1.0 inch).
- **Nominal Outer Envelope**:
  - **Width ($X$)**: $101.60\text{ mm} \pm 0.25\text{ mm}$ ($4.000\text{ in}$)
  - **Length / Depth ($Y$)**: $146.99\text{ mm} \pm 0.25\text{ mm}$ ($5.787\text{ in}$)
  - **Height / Thickness ($Z$)**: $25.40\text{ mm} \pm 0.50\text{ mm}$ ($1.000\text{ in}$)

---

## 2. Component Dimensions & Tolerances

### 2.1 Base Chassis Casting (`Base_Casting`)
- **Material**: Die-cast A380 / ADC12 Aluminium alloy, precision CNC machined.
- **Outer Dimensions**: $101.6\text{ mm} \times 147.0\text{ mm} \times 21.5\text{ mm}$.
- **Wall Thickness**: $1.8\text{ mm}$ minimum nominal, $3.2\text{ mm}$ at perimeter gasket landing.
- **Mounting Holes**:
  - Side: 6-32 UNC-2B threaded holes, 3 per side at standard spacing ($41.28\text{ mm}$ and $101.60\text{ mm}$ pitch from front datum).
  - Bottom: 4 mounting holes at $95.25\text{ mm} \times 101.60\text{ mm}$ rectangle.
- **Spindle Motor Well**: Circular recess $\varnothing 34.0\text{ mm}$, depth $4.2\text{ mm}$ with fluid dynamic bearing pocket.
- **VCM & Actuator Cavity**: Recessed well with integral steel alignment pins for magnet yoke.

### 2.2 Top Cover (`Top_Cover`)
- **Material**: Stamped 3003-H14 aluminium sheet ($1.20\text{ mm}$ gauge).
- **Perimeter Screws**: 6 perimeter clearance holes for M3 / Torx T8 fasteners.
- **Center Recess**: $0.8\text{ mm}$ stamped deep-draw stiffening depression.
- **Breather Filter Cavity**: $\varnothing 12.0\text{ mm}$ port with recessed seat for $0.2\,\mu\text{m}$ ePTFE microporous membrane.

### 2.3 Platters & Spindle Hub (`Platter_01`, `Platter_02`, `Platter_03`)
- **Count**: 3 platters (6 recording surfaces).
- **Outer Diameter**: $95.00\text{ mm} \pm 0.05\text{ mm}$ (standard 3.5" disk).
- **Inner Bore (Hub Hole)**: $25.00\text{ mm} \pm 0.02\text{ mm}$.
- **Thickness**: $1.27\text{ mm}$ ($0.050\text{ in}$).
- **Edge Bevel**: $0.25\text{ mm} \times 45^\circ$ circumferential bevel to prevent aerodynamic eddy shedding.
- **Substrate**: Mirror-polished Aluminium-Magnesium (Al-Mg) alloy substrate with perpendicular magnetic recording (PMR) CoCrPt:$\text{SiO}_2$ sputtered film and $2.5\text{ nm}$ Diamond-Like Carbon (DLC) overcoat.
- **Spacers**: Turned aluminum precision spacer rings ($\varnothing 32.0\text{ mm}$ OD, $\varnothing 25.0\text{ mm}$ ID, $2.4\text{ mm}$ height).
- **Platter Clamp**: Spring-steel top retention clamp disc secured with 6 countersunk screws.

### 2.4 Spindle Motor (`Spindle_Motor`)
- **Type**: 3-phase, 12-slot, 8-pole brushless DC (BLDC) motor with Fluid Dynamic Bearings (FDB).
- **Rotational Speed**: $7,200\text{ RPM}$ ($120\text{ Hz}$ fundamental mechanical frequency).
- **Rotor Hub**: Turned austenitic stainless steel hub, $\varnothing 25.0\text{ mm} \times 14.5\text{ mm}$ height.
- **Stator**: High-permeability silicon steel laminations with multi-strand enamelled copper wire coils.

### 2.5 Actuator E-Block Comb & Arms (`Actuator_Arm`)
- **Material**: Forged & CNC-machined Magnesium-Alloy (AZ91D / AM60B) or Al-7075.
- **Geometry**: Balanced rotary cantilever pivot design with 4 interleaved arm levels.
- **Arm Thickness**: $0.90\text{ mm}$ tapering to $0.45\text{ mm}$ at suspension attachment.
- **Pivot-to-Track Radius**: $48.5\text{ mm}$ nominal arc.
- **Balance Counterweight / Coil Mount**: Rear fork structure holding the trapezoidal voice coil.

### 2.6 Read/Write Slider Heads & Suspension (`Head_Stack`)
- **Suspension (Load Beam)**: Precision stamped 302 stainless steel flexures ($0.038\text{ mm}$ thickness).
- **Slider Type**: Femto-scale sliders ($0.85\text{ mm} \times 0.70\text{ mm} \times 0.23\text{ mm}$).
- **Recording Technology**: Perpendicular Magnetic Recording (PMR) writer with Tunneling Magnetoresistive (TMR) reader.
- **Fly Height**: $1.8\text{ nm}$ nominal dynamic flying height over air bearing surface (ABS).
- **Flex Ribbon Cable (FPC)**: Polyimide Kapton ribbon ($0.05\text{ mm}$) with copper traces and preamplifier IC.

### 2.7 Voice Coil Motor (`Voice_Coil_Motor`, `VCM_Magnets`)
- **Magnet Material**: High-coercivity Neodymium-Iron-Boron (NdFeB Grade N48H), nickel-copper-nickel electroplated.
- **Yoke Plates**: Top and bottom high-saturation low-carbon flux return plates ($3.0\text{ mm}$ thickness).
- **Voice Coil**: Free-standing bonded copper wire coil, trapezoidal sector profile ($2.2\text{ mm}$ thickness).

### 2.8 Parking Ramp & Crash Stop (`Ramp`)
- **Material**: Low-friction carbon-doped polyoxymethylene (POM / Delrin).
- **Position**: Located at outer edge of platters ($\varnothing 96.5\text{ mm}$ to $104.0\text{ mm}$).
- **Function**: Lift-tab parking ramp preventing head-to-disk contact during power-down and mechanical shock.

### 2.9 PCB Controller Board & Interfaces (`PCB`, `SATA_Connector`)
- **Dimensions**: Form-fitting $98.0\text{ mm} \times 82.0\text{ mm} \times 1.6\text{ mm}$ FR-4 glass-epoxy board.
- **Interface**: 22-pin unified Serial ATA (SATA 3.0, $6.0\text{ Gbps}$ / $600\text{ MB/s}$ signaling):
  - 7-pin differential data segment ($250\text{ mV}$ peak-to-peak).
  - 15-pin power segment ($+3.3\text{V}$, $+5\text{V}$, $+12\text{V}$, pre-charge ground pins).
- **Onboard Silicon**:
  - Main Controller ASIC / SoC: Dual ARM Cortex-R4 core with hardware ECC / LDPC engine ($17\text{ mm} \times 17\text{ mm}$ BGA).
  - DRAM Cache: $512\text{ MB}$ DDR3-1600 SDRAM ($9\text{ mm} \times 12\text{ mm}$ FBGA).
  - Motor & VCM Driver: Power-SOIC / QFN with exposed thermal pad.

---

## 3. Explode Offset Vectors (glTF `extras.explodeOffset`)

| Object Name | Subsystem | Exploded Offset Vector [X, Y, Z] (mm) | Description |
| :--- | :--- | :--- | :--- |
| `Torx_Screws` | Fasteners | `[0.0, 75.0, 0.0]` | 6 perimeter fasteners lifting upward |
| `Top_Cover` | Enclosure | `[0.0, 62.0, 0.0]` | Stamped aluminum lid & breather filter |
| `VCM_Magnet_Upper` | Actuation | `[0.0, 48.0, 0.0]` | Upper neodymium magnet & steel yoke |
| `Platter_Clamp` | Media | `[0.0, 42.0, 0.0]` | Spindle retention clamp & 6 hub screws |
| `Platter_01` | Media | `[0.0, 36.0, 0.0]` | Top PMR magnetic recording disk |
| `Platter_02` | Media | `[0.0, 28.0, 0.0]` | Middle PMR magnetic recording disk |
| `Platter_03` | Media | `[0.0, 20.0, 0.0]` | Bottom PMR magnetic recording disk |
| `Head_Stack` | Actuation | `[-35.0, 18.0, 12.0]` | Interleaved suspension arms & TMR heads |
| `Actuator_Arm` | Actuation | `[-30.0, 14.0, 10.0]` | E-block comb & voice coil |
| `Pivot_Bearing` | Actuation | `[-20.0, 24.0, 5.0]` | Cartridge bearing & retention post |
| `Spindle_Motor` | Media | `[0.0, 10.0, 0.0]` | FDB 7,200 RPM motor & stator core |
| `Ramp` | Actuation | `[18.0, 12.0, -15.0]` | Plastic head parking ramp & latch |
| `VCM_Magnet_Lower` | Actuation | `[-15.0, 4.0, 8.0]` | Lower neodymium magnet in casting pocket |
| `Base_Casting` | Enclosure | `[0.0, 0.0, 0.0]` | Main aluminum die-cast base frame |
| `PCB` | Electronics | `[0.0, -42.0, 0.0]` | Controller board with SoC & DRAM |
| `SATA_Connector` | Interface | `[0.0, -46.0, 45.0]` | 22-pin SATA 3.0 data & power connector |

---

## 4. Materials & PBR Calibrations
- **Cast Aluminium**: Metallic $1.0$, Roughness $0.42$, Normal noise for cast grain.
- **Machined Aluminium (Lid, Arms)**: Metallic $0.94$, Roughness $0.22$, Anisotropy $0.35$.
- **Magnetic Platters**: Metallic $0.98$, Roughness $0.04$, Clearcoat $0.80$, Radial brushed finish.
- **Neodymium Magnets**: Metallic $0.92$, Roughness $0.18$, Dark zinc/nickel passivate.
- **Copper Coils**: Metallic $0.90$, Roughness $0.28$, Copper hue `(0.88, 0.48, 0.12)`.
- **FR-4 PCB Mask**: Metallic $0.08$, Roughness $0.55$, Solder mask green `(0.04, 0.22, 0.16)`.
- **Kapton FPC Ribbon**: Metallic $0.20$, Roughness $0.30$, Amber translucent `(0.78, 0.42, 0.08)`.
- **Delrin / POM Ramp**: Metallic $0.04$, Roughness $0.65$, Pure engineered thermoplastic black/grey.
