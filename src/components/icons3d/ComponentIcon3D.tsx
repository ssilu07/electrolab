import React from 'react';
import { ComponentType } from '../../types/circuit';

interface ComponentIcon3DProps {
  type: ComponentType;
  className?: string;
  size?: number;
}

export const ComponentIcon3D: React.FC<ComponentIcon3DProps> = ({
  type,
  className = '',
  size = 40,
}) => {
  const s = size;

  switch (type) {
    case 'battery':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          {/* 3D Drop Shadow */}
          <rect x="8" y="16" width="32" height="26" rx="4" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* Main 9V Body with metallic charcoal gradient */}
          <defs>
            <linearGradient id="batBody" x1="8" y1="12" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#334155" />
              <stop offset="0.4" stopColor="#1e293b" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="goldBand" x1="8" y1="20" x2="40" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.3" stopColor="#eab308" />
              <stop offset="0.7" stopColor="#ca8a04" />
              <stop offset="1" stopColor="#854d0e" />
            </linearGradient>
            <linearGradient id="chromeSnap" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f8fafc" />
              <stop offset="0.5" stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <rect x="8" y="12" width="32" height="28" rx="4" fill="url(#batBody)" stroke="#475569" strokeWidth="1.2" />
          {/* Specular Edge Highlight */}
          <path d="M10 13 H38" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          {/* Gold Stripe */}
          <rect x="8.5" y="22" width="31" height="8" fill="url(#goldBand)" />
          <text x="24" y="28" fill="#0f172a" fontSize="6.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">
            9V DC
          </text>
          {/* + Snap Terminal (Hexagonal / Beveled) */}
          <rect x="13" y="7" width="8" height="5" rx="1.5" fill="url(#chromeSnap)" stroke="#94a3b8" strokeWidth="0.8" />
          <circle cx="17" cy="9.5" r="1.5" fill="#475569" />
          {/* - Snap Terminal (Cylindrical Cup) */}
          <rect x="27" y="6" width="9" height="6" rx="2" fill="url(#chromeSnap)" stroke="#94a3b8" strokeWidth="0.8" />
          <circle cx="31.5" cy="9" r="2.2" fill="#1e293b" />
        </svg>
      );

    case 'ac_source':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <rect x="6" y="14" width="36" height="26" rx="5" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* Benchtop Chassis */}
          <defs>
            <linearGradient id="chassisGrad" x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e293b" />
              <stop offset="0.5" stopColor="#0f172a" />
              <stop offset="1" stopColor="#030712" />
            </linearGradient>
            <linearGradient id="screenGrad" x1="10" y1="14" x2="38" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#022c22" />
              <stop offset="1" stopColor="#064e3b" />
            </linearGradient>
          </defs>
          <rect x="6" y="10" width="36" height="28" rx="5" fill="url(#chassisGrad)" stroke="#0284c7" strokeWidth="1.5" />
          {/* Screen with animated glow */}
          <rect x="10" y="14" width="28" height="14" rx="2" fill="url(#screenGrad)" stroke="#10b981" strokeWidth="0.8" />
          {/* Glowing Sine Wave */}
          <path
            d="M12 21 C 16 15, 18 27, 24 21 C 30 15, 32 27, 36 21"
            stroke="#34d399"
            strokeWidth="2"
            strokeLinecap="round"
            filter="drop-shadow(0 0 2px #10b981)"
          />
          {/* BNC Sockets */}
          <circle cx="15" cy="33" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <circle cx="15" cy="33" r="1.2" fill="#ef4444" />
          <circle cx="33" cy="33" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
          <circle cx="33" cy="33" r="1.2" fill="#0f172a" />
        </svg>
      );

    case 'resistor':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          {/* Shadow */}
          <ellipse cx="24" cy="27" rx="18" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(2px)" />
          {/* Axial Leads */}
          <defs>
            <linearGradient id="leadGrad" x1="0" y1="24" x2="48" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#cbd5e1" />
              <stop offset="0.5" stopColor="#f8fafc" />
              <stop offset="1" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="resBody" x1="12" y1="18" x2="12" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.25" stopColor="#fde047" />
              <stop offset="0.75" stopColor="#eab308" />
              <stop offset="1" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <path d="M4 24 H12 M36 24 H44" stroke="url(#leadGrad)" strokeWidth="3" strokeLinecap="round" />
          {/* Ceramic Body */}
          <rect x="12" y="18" width="24" height="12" rx="4.5" fill="url(#resBody)" stroke="#b45309" strokeWidth="1" />
          {/* Specular Highlight along cylinder */}
          <line x1="13" y1="20" x2="35" y2="20" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          {/* 3D Color Bands */}
          <rect x="16" y="18" width="3" height="12" fill="#ea580c" /> {/* Orange */}
          <rect x="21" y="18" width="3" height="12" fill="#ea580c" /> {/* Orange */}
          <rect x="26" y="18" width="3" height="12" fill="#78350f" /> {/* Brown */}
          <rect x="31" y="18" width="2.5" height="12" fill="#d97706" /> {/* Gold */}
        </svg>
      );

    case 'potentiometer':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <circle cx="24" cy="26" r="16" fill="rgba(0,0,0,0.4)" filter="blur(2px)" />
          {/* Blue Body */}
          <defs>
            <linearGradient id="potBody" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" />
              <stop offset="0.6" stopColor="#0369a1" />
              <stop offset="1" stopColor="#075985" />
            </linearGradient>
            <radialGradient id="potKnob" cx="24" cy="22" r="11" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f8fafc" />
              <stop offset="0.4" stopColor="#cbd5e1" />
              <stop offset="0.8" stopColor="#94a3b8" />
              <stop offset="1" stopColor="#64748b" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="16" fill="url(#potBody)" stroke="#38bdf8" strokeWidth="1.2" />
          {/* Fluted Knob */}
          <circle cx="24" cy="23" r="10.5" fill="url(#potKnob)" stroke="#475569" strokeWidth="1" />
          {/* Indicator notch */}
          <line x1="24" y1="13.5" x2="24" y2="20" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="24" cy="23" r="3" fill="#334155" />
        </svg>
      );

    case 'capacitor':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <ellipse cx="24" cy="38" rx="10" ry="3" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* Leads */}
          <line x1="20" y1="36" x2="20" y2="44" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="36" x2="28" y2="44" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          {/* Cylindrical Canister */}
          <defs>
            <linearGradient id="capCylinder" x1="14" y1="8" x2="34" y2="8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e293b" />
              <stop offset="0.25" stopColor="#334155" />
              <stop offset="0.5" stopColor="#475569" />
              <stop offset="0.85" stopColor="#1e293b" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="capTop" x1="14" y1="8" x2="34" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#cbd5e1" />
              <stop offset="0.5" stopColor="#f8fafc" />
              <stop offset="1" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect x="14" y="10" width="20" height="26" rx="3" fill="url(#capCylinder)" stroke="#0f172a" strokeWidth="1" />
          {/* Top Aluminum Vent */}
          <ellipse cx="24" cy="11" rx="9" ry="3.5" fill="url(#capTop)" stroke="#64748b" strokeWidth="0.8" />
          {/* K-Cross Safety Vent */}
          <path d="M22 10 L26 12 M26 10 L22 12" stroke="#64748b" strokeWidth="0.8" strokeLinecap="round" />
          {/* Negative Polarity Stripe */}
          <rect x="28" y="11" width="4.5" height="25" fill="#f8fafc" />
          <text x="30.2" y="22" fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">
            -
          </text>
        </svg>
      );

    case 'inductor':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <ellipse cx="24" cy="27" rx="16" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(2px)" />
          {/* Core */}
          <rect x="10" y="21" width="28" height="6" rx="2" fill="#334155" />
          {/* Leads */}
          <line x1="4" y1="24" x2="10" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="38" y1="24" x2="44" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          {/* Copper Wound Rings */}
          <defs>
            <linearGradient id="copperWire" x1="0" y1="16" x2="0" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.3" stopColor="#ea580c" />
              <stop offset="0.7" stopColor="#c2410c" />
              <stop offset="1" stopColor="#7c2d12" />
            </linearGradient>
          </defs>
          {[13, 18, 23, 28, 33].map((x, i) => (
            <path
              key={i}
              d={`M${x - 2} 18 C ${x + 2} 16, ${x + 2} 32, ${x - 2} 30`}
              stroke="url(#copperWire)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          ))}
        </svg>
      );

    case 'led':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          {/* Emissive Aura Glow */}
          <circle cx="24" cy="20" r="16" fill="url(#ledGlow)" opacity="0.4" />
          <defs>
            <radialGradient id="ledGlow" cx="24" cy="20" r="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ef4444" />
              <stop offset="1" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="ledLens" x1="14" y1="8" x2="34" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fca5a5" />
              <stop offset="0.25" stopColor="#ef4444" />
              <stop offset="0.75" stopColor="#dc2626" />
              <stop offset="1" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          {/* Leads */}
          <line x1="21" y1="32" x2="21" y2="44" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="27" y1="32" x2="27" y2="40" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          {/* LED Optical Dome */}
          <path
            d="M15 28 C 15 15, 33 15, 33 28 L 34 30 H 14 Z"
            fill="url(#ledLens)"
            stroke="#f87171"
            strokeWidth="1.2"
          />
          {/* Flange Collar */}
          <rect x="13" y="30" width="22" height="3" rx="1" fill="#b91c1c" stroke="#991b1b" strokeWidth="0.8" />
          {/* Glossy Curved Highlight */}
          <path d="M19 14 C 23 11, 27 12, 29 15" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </svg>
      );

    case 'diode':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <ellipse cx="24" cy="27" rx="16" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(2px)" />
          <line x1="4" y1="24" x2="13" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="35" y1="24" x2="44" y2="24" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          {/* Cylindrical DO-41 Body */}
          <defs>
            <linearGradient id="diodeBody" x1="13" y1="18" x2="13" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#334155" />
              <stop offset="0.5" stopColor="#1e293b" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect x="13" y="18" width="22" height="12" rx="3.5" fill="url(#diodeBody)" stroke="#475569" strokeWidth="1" />
          {/* Cathode Silver Band */}
          <rect x="30" y="18" width="4" height="12" fill="#cbd5e1" />
          <line x1="14" y1="20" x2="33" y2="20" stroke="#94a3b8" strokeWidth="1" opacity="0.6" />
        </svg>
      );

    case 'switch':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <rect x="10" y="16" width="28" height="20" rx="4" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* Base */}
          <rect x="10" y="16" width="28" height="18" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
          {/* Hex Bushing Nut */}
          <ellipse cx="24" cy="22" rx="8" ry="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
          {/* Chrome Toggle Lever */}
          <path
            d="M24 22 L31 11"
            stroke="url(#chromeLever)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.4))"
          />
          <defs>
            <linearGradient id="chromeLever" x1="24" y1="22" x2="31" y2="11" gradientUnits="userSpaceOnUse">
              <stop stopColor="#94a3b8" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="1" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="10" r="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      );

    case 'pushbutton':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <rect x="10" y="14" width="28" height="26" rx="5" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* Square Bezel */}
          <rect x="10" y="12" width="28" height="26" rx="5" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
          {/* Tactile Cherry-Red Dome Button */}
          <defs>
            <radialGradient id="btnDome" cx="24" cy="22" r="9" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f87171" />
              <stop offset="0.6" stopColor="#dc2626" />
              <stop offset="1" stopColor="#991b1b" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="8.5" fill="url(#btnDome)" stroke="#b91c1c" strokeWidth="1" />
          <ellipse cx="23" cy="21" rx="4" ry="2" fill="#fecaca" opacity="0.7" />
        </svg>
      );

    case 'relay':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <rect x="8" y="12" width="32" height="28" rx="4" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* Acrylic Transparent Case */}
          <defs>
            <linearGradient id="acrylicGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(56, 189, 248, 0.35)" />
              <stop offset="1" stopColor="rgba(15, 23, 42, 0.85)" />
            </linearGradient>
          </defs>
          <rect x="8" y="10" width="32" height="28" rx="4" fill="url(#acrylicGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Internal Copper Coil */}
          <rect x="12" y="15" width="10" height="18" rx="2" fill="#c2410c" stroke="#ea580c" strokeWidth="1" />
          {/* Armature Spring & Contact */}
          <path d="M26 16 L33 24 M33 24 L35 24" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="24" r="2" fill="#22c55e" />
        </svg>
      );

    case 'ldr':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <circle cx="24" cy="26" r="14" fill="rgba(0,0,0,0.4)" filter="blur(2px)" />
          {/* Ceramic Disc */}
          <circle cx="24" cy="24" r="14" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          {/* Serpentine CdS Photo-track */}
          <path
            d="M17 18 H31 M17 21 H31 M17 24 H31 M17 27 H31 M17 30 H31"
            stroke="#78350f"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="24" cy="24" r="13" stroke="#fef3c7" strokeWidth="0.8" opacity="0.6" />
        </svg>
      );

    case 'transistor_npn':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <path d="M14 14 C 14 28, 34 28, 34 14 Z" fill="rgba(0,0,0,0.4)" filter="blur(2px)" />
          {/* Leads */}
          <line x1="19" y1="28" x2="19" y2="42" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="28" x2="24" y2="42" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="29" y1="28" x2="29" y2="42" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          {/* TO-92 Molded Plastic Half-Cylinder */}
          <path
            d="M14 14 C 14 30, 34 30, 34 14 Z"
            fill="#1e293b"
            stroke="#475569"
            strokeWidth="1.2"
          />
          <path d="M15 15 H33" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
          <text x="24" y="24" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">
            NPN
          </text>
        </svg>
      );

    case 'buzzer':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <circle cx="24" cy="27" r="16" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* Matte Black Piezo Canister */}
          <defs>
            <radialGradient id="buzzerBody" cx="24" cy="22" r="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#334155" />
              <stop offset="0.6" stopColor="#1e293b" />
              <stop offset="1" stopColor="#0f172a" />
            </radialGradient>
          </defs>
          <circle cx="24" cy="24" r="16" fill="url(#buzzerBody)" stroke="#475569" strokeWidth="1.2" />
          {/* Central Sound Aperture */}
          <circle cx="24" cy="24" r="6" fill="#020617" stroke="#000000" strokeWidth="1.2" />
          <circle cx="24" cy="24" r="3" fill="#1e293b" />
          <text x="14" y="24" fill="#ef4444" fontSize="10" fontWeight="bold">
            +
          </text>
        </svg>
      );

    case 'timer_555':
    case 'gate_and':
    case 'gate_or':
    case 'gate_not':
    case 'gate_xor': {
      const isTimer = type === 'timer_555';
      const label = isTimer ? '555' : type.replace('gate_', '').toUpperCase();
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <rect x="12" y="10" width="24" height="28" rx="3" fill="rgba(0,0,0,0.5)" filter="blur(2px)" />
          {/* DIP Metal Pins extending left and right */}
          <path
            d="M6 15 H12 M6 21 H12 M6 27 H12 M6 33 H12 M36 15 H42 M36 21 H42 M36 27 H42 M36 33 H42"
            stroke="#cbd5e1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Epoxy DIP Body */}
          <defs>
            <linearGradient id="icGrad" x1="12" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop stopColor="#334155" />
              <stop offset="0.4" stopColor="#1e293b" />
              <stop offset="1" stopColor="#090d16" />
            </linearGradient>
          </defs>
          <rect x="12" y="10" width="24" height="28" rx="2.5" fill="url(#icGrad)" stroke="#475569" strokeWidth="1.2" />
          {/* Pin 1 Index Notch */}
          <path d="M22 10 C 22 13, 26 13, 26 10" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          <circle cx="16" cy="14" r="1.2" fill="#64748b" />
          {/* Laser-etched Silk screen */}
          <text
            x="24"
            y="26"
            fill="#cbd5e1"
            fontSize="7"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {label}
          </text>
        </svg>
      );
    }

    case 'ground':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`drop-shadow-md transition-transform duration-200 ${className}`}
        >
          <line x1="24" y1="8" x2="24" y2="20" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="20" x2="36" y2="20" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="16" y1="26" x2="32" y2="26" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
          <line x1="20" y1="32" x2="28" y2="32" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="23" y1="38" x2="25" y2="38" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return null;
  }
};
