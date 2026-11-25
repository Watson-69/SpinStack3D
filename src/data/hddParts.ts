export type SubsystemType = 
  | 'Mechanical Enclosure' 
  | 'Magnetic Media' 
  | 'Electromechanical Actuation' 
  | 'Control Electronics';

export type LogicalSectionType = 
  | 'Platters & Head Stack'
  | 'Electromechanical Actuation'
  | 'Control & Interfaces'
  | 'Mechanical Enclosure';

export interface HddPartSpec {
  label: string;
  value: string;
  unit?: string;
}

export interface FailureMode {
  title: string;
  symptom: string;
  rootCause: string;
  smartAttribute?: string;
  prevention: string;
}

export type PartVisibilityCategory = 'enclosure' | 'internal' | 'underside';

export interface HddPartData {
  id: string;
  name: string;
  subsystem: SubsystemType;
  section: LogicalSectionType;
  visibilityCategory: PartVisibilityCategory;
  shortSubtitle: string;
  compactTag: string;
  accentColor: string;
  indexNumber: string;
  summary: string;
  gutterSide: 'left' | 'right';
  
  // 3D Anchor & Animation coordinates
  anchorPoint: [number, number, number]; // [x, y, z] in scene units
  explodedOffset: [number, number, number];
  staggerWindow: [number, number];
  cameraTargetOffset: [number, number, number];
  cameraPositionOffset: [number, number, number];
  
  // Technical details
  physicalPrinciples: {
    title: string;
    description: string;
    formula?: string;
    keyPoints: string[];
  };
  specifications: HddPartSpec[];
  failureModes: FailureMode[];
}

export const HDD_PARTS: HddPartData[] = [
  // SECTION 1: PLATTERS & HEAD STACK
  {
    id: 'platters',
    name: 'Magnetic Platters & Spacer Rings',
    subsystem: 'Magnetic Media',
    section: 'Platters & Head Stack',
    visibilityCategory: 'internal',
    shortSubtitle: '3-Disk PMR CoCrPt:SiO2 Media / 1.4 Tb/in²',
    compactTag: '3 DISKS ⋅ 1.4 TB/IN²',
    accentColor: '#00f0ff',
    indexNumber: '04',
    summary: 'Triple stacked mirror-polished aluminum-magnesium substrate disks coated with perpendicular magnetic recording (PMR) granular media layers.',
    gutterSide: 'right',
    anchorPoint: [0.0, 0.014, -0.514],
    explodedOffset: [0, 1.20, 0],
    staggerWindow: [0.24, 0.82],
    cameraTargetOffset: [0.0, 0.35, -0.514],
    cameraPositionOffset: [2.5, 2.8, 3.2],
    physicalPrinciples: {
      title: 'Perpendicular Magnetic Recording (PMR) & Thermal Stability',
      description: 'Data bits are stored as vertical magnetic domains in an ultra-thin CoCrPt:SiO₂ granular film sputtered over a soft magnetic underlayer (SML). By aligning magnetic dipoles perpendicular to the platter surface, demagnetizing fields are reduced, enabling areal bit densities exceeding 1.2 Terabits/sq.in.',
      formula: 'K_u V \\ge 60 k_B T \\quad (Superparamagnetic~Criterion)',
      keyPoints: [
        'Triple platter stack provides 6 recording surfaces yielding high areal capacity.',
        'Sub-nanometer surface roughness (Ra < 0.1 nm) achieved via double-sided CMP.',
        'Precision aluminum spacer rings guarantee exact axial clearance for interleaved heads.'
      ]
    },
    specifications: [
      { label: 'Outer Diameter', value: '95.0', unit: 'mm' },
      { label: 'Substrate Material', value: 'Al-Mg 5086 Alloy / Borosilicate Glass' },
      { label: 'Areal Bit Density', value: '1.25 - 1.45', unit: 'Tb/in²' },
      { label: 'DLC Carbon Cap', value: '2.0', unit: 'nm' },
      { label: 'Lubricant Film', value: '1.2', unit: 'nm PFPE' },
      { label: 'Disk Count', value: '3 Disks (6 Surfaces)' }
    ],
    failureModes: [
      {
        title: 'Platter Scoring & Abrasive Wear',
        symptom: 'Metallic grinding tone, immediate offline uncorrectable sectors, permanent data loss.',
        rootCause: 'Head crash dragging shattered slider ceramic across spinning track rings.',
        smartAttribute: 'SMART 05 / C5 (Reallocated / Current Pending Sectors)',
        prevention: 'Ramp-load mechanisms that park sliders completely off-disk before rotational deceleration.'
      }
    ]
  },
  {
    id: 'spindle_motor',
    name: 'Spindle Motor & FDB Bearing',
    subsystem: 'Magnetic Media',
    section: 'Platters & Head Stack',
    visibilityCategory: 'internal',
    shortSubtitle: '7,200 RPM Brushless DC / Fluid Dynamic Bearing',
    compactTag: '7,200 RPM ⋅ FDB',
    accentColor: '#00f0ff',
    indexNumber: '05',
    summary: 'Brushless 3-phase DC in-hub motor guided by a non-contact fluid dynamic bearing with herringbone hydrodynamic groove pumping.',
    gutterSide: 'right',
    anchorPoint: [0.0, -0.029, -0.514],
    explodedOffset: [0, 0.34, 0],
    staggerWindow: [0.18, 0.70],
    cameraTargetOffset: [0.0, 0.15, -0.514],
    cameraPositionOffset: [2.8, 2.4, 2.8],
    physicalPrinciples: {
      title: 'Hydrodynamic Fluid Pumping & Sub-Nanometer Runout',
      description: 'The rotating motor shaft is suspended entirely within a microscopic film of synthetic ester oil (~2–5 μm gap). Laser-etched herringbone grooves pump oil dynamically, centering the rotor with non-repeatable runout (NRRO) under 0.5 nm.',
      formula: '\\nabla \\cdot \\left( \\frac{h^3}{\\mu} \\nabla P \\right) = 6 U \\frac{\\partial h}{\\partial x} \\quad (Reynolds~Bearing~Equation)',
      keyPoints: [
        'Electronic brushless 3-phase stator driven by sensorless 120° commutation.',
        'Zero metal-to-metal contact during steady-state rotation ensures ultra-low acoustic whine (~20 dBA).',
        'Dynamic balancing clamp eliminates platter axial vibration.'
      ]
    },
    specifications: [
      { label: 'Rotational Speed', value: '7,200 ± 0.1%', unit: 'RPM' },
      { label: 'Angular Velocity', value: '753.98', unit: 'rad/s' },
      { label: 'Bearing Type', value: 'Dual-Herringbone Fluid Dynamic Bearing (FDB)' },
      { label: 'Non-Repeatable Runout', value: '< 0.5', unit: 'nm' },
      { label: 'Spin-Up Time', value: '6.8 - 9.2', unit: 'seconds' }
    ],
    failureModes: [
      {
        title: 'FDB Oil Desiccation & Bearing Seizure',
        symptom: 'Drive fails to spin up, emits rhythmic buzzing, draws max current.',
        rootCause: 'Extended operation at high temperatures drying out miniature oil seals.',
        smartAttribute: 'SMART 0A (Spin Retry Count)',
        prevention: 'Active chassis airflow cooling in high-density drive enclosures.'
      }
    ]
  },
  {
    id: 'rw_heads',
    name: 'Read/Write Slider Heads',
    subsystem: 'Electromechanical Actuation',
    section: 'Platters & Head Stack',
    visibilityCategory: 'internal',
    shortSubtitle: 'Femto Sliders / 3.8nm TMR Magnetic Sensor',
    compactTag: '16 HEADS ⋅ 3.2 NM',
    accentColor: '#f59e0b',
    indexNumber: '07',
    summary: 'Femto-scale AlTiC ceramic aerodynamic slider heads equipped with tunneling magnetoresistive (TMR) readers and micro-actuators.',
    gutterSide: 'right',
    anchorPoint: [0.286, 0.014, 0.0],
    explodedOffset: [-0.85, 0.57, 0.28],
    staggerWindow: [0.32, 0.86],
    cameraTargetOffset: [0.20, 0.25, 0.0],
    cameraPositionOffset: [-1.2, 2.2, 2.4],
    physicalPrinciples: {
      title: 'Hydrodynamic Air Bearing & Spin-Tunneling Magnetoresistance',
      description: 'The slider head does not touch the platter; viscous air drag from the disk spinning at 120 km/h generates aerodynamic lift, holding the head at ~3.5–5 nm flying height. The read sensor relies on quantum-mechanical spin-dependent tunneling across a 1 nm MgO barrier.',
      formula: 'R(H) = R_0 + \\Delta R \\cdot \\cos(\\theta), \\quad \\text{TMR Ratio} > 100\\%',
      keyPoints: [
        'Dual-stage PZT piezoelectric micro-actuators provide sub-nanometer track positioning.',
        'Thermal Fly-height Control (TFC) heater coils expand the head dynamically during read/write.',
        'Inductive CoFe write pole produces focused 2.4 Tesla recording fields.'
      ]
    },
    specifications: [
      { label: 'Slider Dimensions', value: '0.85 × 0.70 × 0.23', unit: 'mm' },
      { label: 'Flying Height', value: '3.5 - 5.0', unit: 'nm' },
      { label: 'Reader Type', value: 'Tunneling Magnetoresistive (TMR / MgO barrier)' },
      { label: 'Writer Type', value: 'Perpendicular Magnetic Inductive CoFe' },
      { label: 'Micro-Actuator Res.', value: '0.1', unit: 'nm' }
    ],
    failureModes: [
      {
        title: 'Head Crash / Surface Collision',
        symptom: 'Audible clicking/screaping, I/O timeouts, drive drops offline.',
        rootCause: 'Particulate obstruction or external shock exceeding air bearing lift stiffness.',
        smartAttribute: 'SMART 01 / 07 / BB (Read Error Rate / Shock)',
        prevention: 'Active drop sensor accelerometers triggering emergency retract within 10 ms.'
      }
    ]
  },

  // SECTION 2: ELECTROMECHANICAL ACTUATION
  {
    id: 'actuator_arm',
    name: 'Actuator E-Block Arm',
    subsystem: 'Electromechanical Actuation',
    section: 'Electromechanical Actuation',
    visibilityCategory: 'internal',
    shortSubtitle: 'Forged Magnesium Comb / 40G Acceleration',
    compactTag: 'MAGNESIUM ⋅ 40G',
    accentColor: '#f59e0b',
    indexNumber: '06',
    summary: 'Ultra-lightweight CNC-milled magnesium E-block comb featuring hollowed truss arms that interleave between the stacked platters.',
    gutterSide: 'left',
    anchorPoint: [-0.514, 0.014, 0.514],
    explodedOffset: [-0.63, 0.46, 0.23],
    staggerWindow: [0.28, 0.78],
    cameraTargetOffset: [-0.51, 0.25, 0.51],
    cameraPositionOffset: [-2.4, 2.6, 3.2],
    physicalPrinciples: {
      title: 'Inertia Minimization & High-Bandwidth Settling',
      description: 'The actuator arm accelerates across the 35mm recording stroke at up to 40 Gs, settling onto a 50 nm track within 4 milliseconds. Hollow triangular truss cutouts minimize rotational moment of inertia (J) while pushing bending resonance above 5 kHz.',
      formula: 'J = \\int r^2 dm, \\quad \\alpha = \\frac{\\tau_{VCM}}{J} \\approx 10^4 \\text{ rad/s}^2',
      keyPoints: [
        'E-block shape provides 4 arm tines supporting 6 read/write suspension assemblies.',
        'Kapton flexible ribbon traces bonded along arm edges prevent mechanical torque bias.',
        'Balanced center-of-mass aligned through pivot axis eliminates gravitational bias.'
      ]
    },
    specifications: [
      { label: 'Material', value: 'Forged Magnesium-Aluminum AZ31B' },
      { label: 'Tine Count', value: '4 Tines (6 Head Suspensions)' },
      { label: 'Moment of Inertia', value: '1.25 × 10⁻⁶', unit: 'kg·m²' },
      { label: 'Bending Resonance', value: '5.2', unit: 'kHz' },
      { label: 'Average Seek Time', value: '4.16', unit: 'ms' }
    ],
    failureModes: [
      {
        title: 'Arm Flexure Bending / Warp',
        symptom: 'Continuous seek error rate spikes, loud clicking as heads miss servo wedges.',
        rootCause: 'Severe non-operating shock (dropping drive during transport).',
        smartAttribute: 'SMART 07 (Seek Error Rate)',
        prevention: 'Ramp-load latch mechanisms and shock-isolated carrier trays.'
      }
    ]
  },
  {
    id: 'voice_coil_motor',
    name: 'Voice Coil Motor (VCM)',
    subsystem: 'Electromechanical Actuation',
    section: 'Electromechanical Actuation',
    visibilityCategory: 'internal',
    shortSubtitle: 'Lorentz Force Actuator / Sintered NdFeB N48H',
    compactTag: 'NdFeB N52 ⋅ LORENTZ',
    accentColor: '#f59e0b',
    indexNumber: '08',
    summary: 'High-speed rotary electromagnetic galvanometer comprising a flat copper voice coil between sintered NdFeB permanent magnets.',
    gutterSide: 'left',
    anchorPoint: [-0.956, 0.029, 0.858],
    explodedOffset: [-0.80, 0.46, 0.23],
    staggerWindow: [0.20, 0.68],
    cameraTargetOffset: [-0.95, 0.15, 0.85],
    cameraPositionOffset: [-3.2, 2.2, 2.2],
    physicalPrinciples: {
      title: 'Lorentz Force Electromagnetic Propulsion',
      description: 'Current flowing through the flat trapezoidal copper coil interacts with the 1.2 Tesla magnetic field established by paired neodymium-iron-boron (NdFeB) magnets, generating bidirectional torque proportional to coil current without gears.',
      formula: '\\vec{F} = I (\\vec{L} \\times \\vec{B}), \\quad \\tau = \\vec{r} \\times \\vec{F}',
      keyPoints: [
        'Top and bottom steel flux-return yokes channel magnetic flux exclusively across the air gap.',
        'Peak seek current can hit 2.4 Amperes, accelerating heads at over 40 Gs.',
        'Closed-loop servo control reads pre-recorded servo track wedges 20,000 times/second.'
      ]
    },
    specifications: [
      { label: 'Magnet Material', value: 'Sintered NdFeB N48H' },
      { label: 'Air Gap Magnetic Flux', value: '1.20', unit: 'Tesla' },
      { label: 'Coil Resistance', value: '8.4', unit: 'Ohms' },
      { label: 'Peak Actuator Current', value: '2.4', unit: 'A' },
      { label: 'Yoke Material', value: 'Low-Carbon Annealed Steel 1008' }
    ],
    failureModes: [
      {
        title: 'Voice Coil Thermal Overheating',
        symptom: 'Coil insulation burnout, actuator stalls against crash stop.',
        rootCause: 'Repetitive sustained random 4K IOPS in unventilated server bay.',
        smartAttribute: 'SMART 07 (Seek Error Rate)',
        prevention: 'Current-limiting driver firmware and thermal throttling.'
      }
    ]
  },
  {
    id: 'pivot_bearing',
    name: 'Pivot Bearing & Flex Cable',
    subsystem: 'Electromechanical Actuation',
    section: 'Electromechanical Actuation',
    visibilityCategory: 'internal',
    shortSubtitle: 'ABEC-7 Miniature Bearings / Kapton FPC Ribbon',
    compactTag: 'DUAL BALL ⋅ FPC',
    accentColor: '#f59e0b',
    indexNumber: '09',
    summary: 'Dual pre-loaded angular contact miniature ball-bearing cartridge paired with an amber Kapton flexible printed circuit (FPC).',
    gutterSide: 'left',
    anchorPoint: [-0.629, 0.029, 0.629],
    explodedOffset: [-0.51, 0.68, 0.14],
    staggerWindow: [0.15, 0.62],
    cameraTargetOffset: [-0.62, 0.20, 0.62],
    cameraPositionOffset: [-2.2, 2.0, 2.5],
    physicalPrinciples: {
      title: 'Zero-Play Pivot Kinematics & Neutral S-Loop Bias',
      description: 'The pivot shaft holds the actuator arm with minimal friction and zero radial play via two pre-loaded ABEC-7 ball bearings. The polyimide flexible printed circuit (FPC) carries the preamplifier chip, curved into an S-bend loop to minimize spring bias torque.',
      formula: '\\tau_{spring} = -k_\\theta \\cdot \\Delta \\theta \\approx 0 \\quad (S-Loop~Neutral~Bias)',
      keyPoints: [
        'Preamp IC mounted on flex ribbon within 15mm of heads to amplify weak TMR signals.',
        'Grounding contact spring provides continuous ESD path from arm to chassis.',
        'Radial runout under 0.08 μm maintains track alignment.'
      ]
    },
    specifications: [
      { label: 'Bearing Type', value: 'Dual Pre-Loaded Angular Contact' },
      { label: 'Precision Rating', value: 'ABEC-7 / ISO Class 4' },
      { label: 'Radial Runout', value: '< 0.08', unit: 'μm' },
      { label: 'Flex Cable', value: 'Kapton Polyimide / RA Copper' },
      { label: 'Preamp Bandwidth', value: 'DC to 2.5', unit: 'GHz' }
    ],
    failureModes: [
      {
        title: 'Bearing Brinelling (Race Denting)',
        symptom: 'Periodic sticking during sweep, micro-jog calibration failures.',
        rootCause: 'Severe mechanical shipping shock causing balls to indent bearing race.',
        smartAttribute: 'SMART BF / 07 (Shock / Seek Error)',
        prevention: 'Standardized foam packaging and ASTM D5276 drop validation.'
      }
    ]
  },

  // SECTION 3: CONTROL & INTERFACES
  {
    id: 'pcb_board',
    name: 'PCB Controller Board',
    subsystem: 'Control Electronics',
    section: 'Control & Interfaces',
    visibilityCategory: 'underside',
    shortSubtitle: 'ARM Cortex-R SoC / 512MB DDR3 / LDPC Engine',
    compactTag: 'ARM SOC ⋅ DRAM',
    accentColor: '#10b981',
    indexNumber: '10',
    summary: 'High-density multi-layer matte dark-teal circuit board hosting the main SoC controller, DRAM buffer, VCM driver, and flash firmware ROM.',
    gutterSide: 'right',
    anchorPoint: [0.0, -0.329, 0.714],
    explodedOffset: [0, -1.20, 0],
    staggerWindow: [0.12, 0.58],
    cameraTargetOffset: [0, -0.8, 0.7],
    cameraPositionOffset: [3.2, -2.5, 3.8],
    physicalPrinciples: {
      title: 'Digital Signal Processing (DSP) & High-Speed LDPC Channel',
      description: 'Analog pulses from heads are decoded into binary data by a Low-Density Parity-Check (LDPC) read channel processor operating at 3.0 Gbps. A dedicated motor driver IC synthesizes 3-phase PWM waveforms for the spindle and generates bipolar current drives for the VCM.',
      formula: '\\text{BER}_{raw} \\approx 10^{-4} \\xrightarrow{\\text{LDPC}} \\text{BER}_{corrected} < 10^{-15}',
      keyPoints: [
        'Main SoC incorporates ARM Cortex-R real-time processor cores running hard real-time OS.',
        'High-speed DDR3/DDR4 DRAM cache buffer absorbs burst read/write queues.',
        'TVS diodes guard 5V and 12V rails against power supply voltage transients.'
      ]
    },
    specifications: [
      { label: 'PCB Layers', value: '6-Layer FR4 High-Tg' },
      { label: 'Controller SoC', value: 'Dual-Core ARM Cortex-R5 @ 600MHz' },
      { label: 'DRAM Cache', value: '512', unit: 'MB DDR3-1600' },
      { label: 'Firmware Flash', value: '8', unit: 'MB SPI Flash' },
      { label: 'Power Input Rails', value: '+5V (±5%), +12V (±10%)' }
    ],
    failureModes: [
      {
        title: 'TVS Diode Surge Clamping Short',
        symptom: 'Drive completely dead, zero current drawn or trips PSU short protection.',
        rootCause: '12V rail voltage surge tripped sacrificial TVS diode into continuous short to ground.',
        smartAttribute: 'None (Hard Electrical Dead)',
        prevention: 'Quality enterprise-grade power distribution units.'
      }
    ]
  },
  {
    id: 'sata_connector',
    name: 'SATA Data & Power Interface',
    subsystem: 'Control Electronics',
    section: 'Control & Interfaces',
    visibilityCategory: 'underside',
    shortSubtitle: 'SATA 3.0 6Gb/s / 250mV Differential Signaling',
    compactTag: 'SFF-8482 ⋅ 600 MB/S',
    accentColor: '#10b981',
    indexNumber: '11',
    summary: 'Standard L-keyed 7-pin SATA 6Gb/s differential signal port and 15-pin power connector with gold-plated spring contacts.',
    gutterSide: 'right',
    anchorPoint: [0.629, -0.243, 2.043],
    explodedOffset: [0, -1.37, 1.20],
    staggerWindow: [0.08, 0.52],
    cameraTargetOffset: [0.6, -0.6, 1.8],
    cameraPositionOffset: [3.8, -1.2, 2.5],
    physicalPrinciples: {
      title: 'Low-Voltage Differential Signaling (LVDS) & 8b/10b Modulation',
      description: 'SATA Revision 3.0 transfers data over two shielded twisted pairs using 250 mV differential voltages clocked at 6.0 GHz. Data is encoded with 8b/10b modulation to guarantee DC electrical balance and frequent transitions for clock recovery.',
      formula: 'V_{diff} = V_{TX+} - V_{TX-} = \\pm 250 \\text{ mV}, \\quad \\text{Throughput} = 600 \\text{ MB/s}',
      keyPoints: [
        'Gold plating (30 micro-inches) over nickel barrier prevents contact fretting.',
        'Staggered power pins provide hot-swap capability by grounding chassis first.',
        'Supports Native Command Queuing (NCQ) up to 32 commands.'
      ]
    },
    specifications: [
      { label: 'Interface Standard', value: 'Serial ATA Revision 3.0 (6Gb/s)' },
      { label: 'Peak Data Rate', value: '600', unit: 'MB/s' },
      { label: 'Signal Differential', value: '250', unit: 'mV p-p' },
      { label: 'Signal Pins', value: '7 Pins' },
      { label: 'Power Pins', value: '15 Pins (Staggered Hot-Plug)' },
      { label: 'Gold Plating Depth', value: '30', unit: 'μ-inch' }
    ],
    failureModes: [
      {
        title: 'CRC Cable Transmission Degradation',
        symptom: 'System freezes during file transfers, link drops to 3Gb/s or 1.5Gb/s.',
        rootCause: 'Bent or loose SATA cable, oxidized connector contacts, or EMI.',
        smartAttribute: 'SMART C7 (UltraDMA CRC Error Count)',
        prevention: 'Latching SATA cables with gold contacts (< 1 meter length).'
      }
    ]
  },

  // SECTION 4: MECHANICAL ENCLOSURE
  {
    id: 'mounting_screws',
    name: 'Torx Fastening Screws',
    subsystem: 'Mechanical Enclosure',
    section: 'Mechanical Enclosure',
    visibilityCategory: 'enclosure',
    shortSubtitle: '6 Perimeter Torx T8 / Calibrated 0.70 N·m Torque',
    compactTag: 'T8 TORX ⋅ NITRILE',
    accentColor: '#94a3b8',
    indexNumber: '01',
    summary: 'Six perimeter Torx T8/T6 tamper-evident machine screws securing the cast cover to the chassis with precision torque control.',
    gutterSide: 'left',
    anchorPoint: [0.0, 0.303, 0.0],
    explodedOffset: [0, 3.28, 0],
    staggerWindow: [0.0, 0.38],
    cameraTargetOffset: [0, 1.2, 0],
    cameraPositionOffset: [2.5, 3.8, 3.5],
    physicalPrinciples: {
      title: 'Controlled Clamp Preload & Uniform Gasket Deflection',
      description: 'The cover screws maintain a uniform compressive load across the perimeter elastomeric gasket. Insufficient torque invites particulate contamination or moisture ingress, while overtightening warps the cast chassis.',
      formula: 'T = K \\cdot D \\cdot F_p \\quad (Torque~Preload~Equation)',
      keyPoints: [
        'Assembly torque of 0.70 ± 0.05 N·m ensures uniform gasket deflection.',
        'Torx (star) drive geometry prevents cam-out during automated assembly.',
        'Threads feature micro-encapsulated thread-locker compound.'
      ]
    },
    specifications: [
      { label: 'Fastener Type', value: 'ISO 10664 Torx T8 / T6' },
      { label: 'Material', value: 'Zinc-Plated High-Tensile Carbon Steel' },
      { label: 'Torque Spec', value: '0.70 ± 0.05', unit: 'N·m' },
      { label: 'Thread Pitch', value: 'M2.5 × 0.45' },
      { label: 'Perimeter Count', value: '6 Top + 1 Under Hidden Label' }
    ],
    failureModes: [
      {
        title: 'Chassis Torsion from Non-Uniform Torque',
        symptom: 'Massive seek latency degradation, track following failure (Off-Track Error).',
        rootCause: 'Torquing screws in non-cross pattern during cleanroom service.',
        smartAttribute: 'SMART 01 / 07 (Read / Seek Error Rate)',
        prevention: 'Automated star-pattern torque sequencing with DC screwdrivers.'
      }
    ]
  },
  {
    id: 'top_cover',
    name: 'Top Cover & Breather Filter',
    subsystem: 'Mechanical Enclosure',
    section: 'Mechanical Enclosure',
    visibilityCategory: 'enclosure',
    shortSubtitle: 'Aluminum 5052-H32 / 0.3μm ePTFE Breather Port',
    compactTag: 'STAMPED AL ⋅ 0.3μM',
    accentColor: '#38bdf8',
    indexNumber: '02',
    summary: 'Cold-stamped brushed aluminum-alloy acoustic shielding lid fitted with a high-efficiency sub-micron HEPA breather filter port.',
    gutterSide: 'left',
    anchorPoint: [0.0, 0.274, 0.0],
    explodedOffset: [0, 2.68, 0],
    staggerWindow: [0.08, 0.48],
    cameraTargetOffset: [0, 0.8, 0],
    cameraPositionOffset: [3.2, 3.5, 4.0],
    physicalPrinciples: {
      title: 'Barometric Equalization & Acoustic Dampening',
      description: 'Hard disk drives operating in air cannot be hermetically sealed; pressure differentials would bow the cover and destroy flying heights. The breather filter employs expanded PTFE membrane and activated carbon to allow pressure equalization while capturing 99.997% of particles > 0.3 μm.',
      formula: '\\Delta P = P_{internal} - P_{ambient} \\approx 0 \\quad (via~Diffusive~Filter)',
      keyPoints: [
        'Activated carbon bed scrubs corrosive volatile organic compounds (VOCs).',
        'Tortuous serpentine channel prevents rapid moisture penetration.',
        'Stamped ribs increase structural flexural rigidity and dampen 500 Hz–4 kHz noise.'
      ]
    },
    specifications: [
      { label: 'Cover Material', value: 'Aluminum Alloy 5052-H32' },
      { label: 'Wall Thickness', value: '1.20', unit: 'mm' },
      { label: 'Filter Rating', value: '0.3 μm ePTFE + Carbon' },
      { label: 'Gasket Seal', value: 'Continuous Ribbed Fluorosilicone' },
      { label: 'Max Altitude', value: '3,048', unit: 'meters' }
    ],
    failureModes: [
      {
        title: 'Breather Port Obstruction / Ingress',
        symptom: 'Rapid catastrophic head crash across all heads within minutes of spin-up.',
        rootCause: 'Exposure to solvent vapors exceeding carbon filter adsorption capacity.',
        smartAttribute: 'SMART 01 / 07 / BB (Multiple Failure Spikes)',
        prevention: 'Never place tape obstruction over breather holes.'
      }
    ]
  },
  {
    id: 'chassis',
    name: 'Die-Cast Base Chassis',
    subsystem: 'Mechanical Enclosure',
    section: 'Mechanical Enclosure',
    visibilityCategory: 'enclosure',
    shortSubtitle: 'Die-Cast A380 Aluminum / CNC Diamond-Turned Cavity',
    compactTag: 'DIE-CAST AL-ADC12',
    accentColor: '#64748b',
    indexNumber: '03',
    summary: 'Precision CNC-machined die-cast A380 aluminum alloy monolithic casting providing dimensional reference datums for all rotating parts.',
    gutterSide: 'right',
    anchorPoint: [0.0, 0.0, 0.0],
    explodedOffset: [0, 0, 0],
    staggerWindow: [0.0, 0.1],
    cameraTargetOffset: [0, 0, 0],
    cameraPositionOffset: [4.0, 3.0, 4.5],
    physicalPrinciples: {
      title: 'Structural Rigidity & Modal Resonance Control',
      description: 'The base casting serves as the dimensional anchor for the entire drive. Any thermal expansion or micro-bending creates runout between the spindle axis and the head stack pivot bearing, resulting in track misregistration (TMR).',
      formula: 'f_n = \\frac{1}{2\\pi} \\sqrt{\\frac{k_{chassis}}{m_{eff}}} > 1.8 \\text{ kHz}',
      keyPoints: [
        'Die-cast in high-silicon aluminum alloy (A380) for low thermal porosity.',
        'Internally CNC diamond-turned platter cavity minimizes aerodynamic windage.',
        'External bottom and side 6-32 UNC mounting holes dissipate heat directly into drive bays.'
      ]
    },
    specifications: [
      { label: 'Form Factor', value: 'Standard 3.5-inch LFF' },
      { label: 'Dimensions', value: '147.0 × 101.6 × 26.1', unit: 'mm' },
      { label: 'Alloy Composition', value: 'Die-Cast Aluminum A380' },
      { label: 'Machining Tolerance', value: '± 0.005', unit: 'mm (5 μm)' },
      { label: 'Operating Shock', value: '70 G (2 ms half-sine)' }
    ],
    failureModes: [
      {
        title: 'Thermal Expansion Runout',
        symptom: 'High seek error rate during temperature transition gradients > 15°C/hr.',
        rootCause: 'CTE mismatch between casting and steel bearing cartridges.',
        smartAttribute: 'SMART C2 / 07 (Temperature / Seek Error)',
        prevention: 'Active thermal compensation routines executed by servo microcode.'
      }
    ]
  }
];

export const LOGICAL_SECTIONS: LogicalSectionType[] = [
  'Platters & Head Stack',
  'Electromechanical Actuation',
  'Control & Interfaces',
  'Mechanical Enclosure'
];

export const SECTION_CHAPTERS: Readonly<Record<LogicalSectionType, { code: string; title: string }>> = {
  'Platters & Head Stack': { code: 'CH. 01', title: 'PLATTERS & HEAD STACK' },
  'Electromechanical Actuation': { code: 'CH. 02', title: 'ELECTROMECHANICAL ACTUATION' },
  'Control & Interfaces': { code: 'CH. 03', title: 'CONTROL & INTERFACES' },
  'Mechanical Enclosure': { code: 'CH. 04', title: 'MECHANICAL ENCLOSURE' },
};

export const HDD_PARTS_BY_ID: ReadonlyMap<string, HddPartData> = new Map(
  HDD_PARTS.map((part) => [part.id, part])
);

export const HDD_PART_INDEX_BY_ID: ReadonlyMap<string, number> = new Map(
  HDD_PARTS.map((part, idx) => [part.id, idx])
);

export function getPartById(id: string | null | undefined): HddPartData | undefined {
  return id ? HDD_PARTS_BY_ID.get(id) : undefined;
}

export function isInternalPartId(id: string | null | undefined): boolean {
  return getPartById(id)?.visibilityCategory === 'internal';
}

export function isEnclosurePartId(id: string | null | undefined): boolean {
  return getPartById(id)?.visibilityCategory === 'enclosure';
}

export function getPartStaggerWindow(id: string): [number, number] {
  return HDD_PARTS_BY_ID.get(id)?.staggerWindow ?? [0.1, 0.8];
}
