# electrolab

Interactive 3D Electronics Laboratory & Virtual Circuit Workbench.

Designed for engineers, students, and hobbyists to design, simulate, and inspect electronic circuits with interactive 3D breadboards, real-time measurements, and realistic component physics.

## ✨ Features

- **Interactive 3D Canvas**: Real-time 3D breadboard, component placement, and wire routing powered by Three.js.
- **Circuit Simulation Engine**: Real-time electrical calculation with Ohm's law, Kirchhoff's laws, component tolerances, and fault states.
- **Virtual Instrumentation**: Multimeter, oscilloscope, and variable power supplies.
- **Component Library**: Resistors, capacitors, LEDs, diodes, potentiometers, ICs (555 Timer, Op-Amps, Logic Gates), and sensors.
- **Audio & Haptics**: Interactive sound synthesis and tactile feedback.
- **Cross-Platform**: Built for Web and Android with Capacitor.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Run Locally (Dev Server)
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Android Development
```bash
npm run android:sync
npm run android:build
npm run android:open
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **3D Graphics**: Three.js
- **Mobile Container**: Capacitor
- **Icons**: Lucide React
- **Linter**: Oxlint
