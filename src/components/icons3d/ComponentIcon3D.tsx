import React, { useState, useRef, useCallback } from 'react';
import { ComponentType } from '../../types/circuit';

interface ComponentIcon3DProps {
  type: ComponentType;
  className?: string;
  size?: number;
  interactive?: boolean;
  glow?: boolean;
}

/**
 * Ultra-High-Definition 3D Isometric Component Icon System.
 * Features:
 * - True Isometric 3D Volumetric Projections
 * - Raytraced Specular Shading & Normal Depth Gradients
 * - Interactive Gyroscopic 3D Parallax Tilt with Dynamic Specular Glare
 * - Tactile Micro-Interactions & Ambient Occlusion Drop Shadows
 */
export const ComponentIcon3D: React.FC<ComponentIcon3DProps> = ({
  type,
  className = '',
  size = 40,
  interactive = true,
  glow = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number; glareX: number; glareY: number }>({
    x: 0,
    y: 0,
    glareX: 50,
    glareY: 50,
  });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Calculate rotation (-16 to +16 deg)
    const rotY = (x - 0.5) * 28;
    const rotX = -(y - 0.5) * 28;

    setTilt({
      x: rotX,
      y: rotY,
      glareX: x * 100,
      glareY: y * 100,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  }, []);

  const s = size;

  const renderSvg = () => {
    switch (type) {
      case 'battery':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="batFront" x1="14" y1="26" x2="50" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1e293b" />
                <stop offset="0.5" stopColor="#0f172a" />
                <stop offset="1" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="batTop" x1="14" y1="18" x2="50" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#475569" />
                <stop offset="0.5" stopColor="#334155" />
                <stop offset="1" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="batGold" x1="14" y1="36" x2="50" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.3" stopColor="#eab308" />
                <stop offset="0.7" stopColor="#ca8a04" />
                <stop offset="1" stopColor="#854d0e" />
              </linearGradient>
              <linearGradient id="batChrome" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#ffffff" />
                <stop offset="0.5" stopColor="#cbd5e1" />
                <stop offset="1" stopColor="#64748b" />
              </linearGradient>
            </defs>
            {/* Ambient Contact Shadow */}
            <ellipse cx="32" cy="58" rx="20" ry="4.5" fill="rgba(0,0,0,0.6)" filter="blur(3px)" />
            {/* 3D Extruded Battery Body */}
            {/* Front Face */}
            <path
              d="M14 26 L50 26 L50 54 C50 56.2 48.2 58 46 58 L18 58 C15.8 58 14 56.2 14 54 Z"
              fill="url(#batFront)"
              stroke="#334155"
              strokeWidth="1.2"
            />
            {/* Isometric Top Cap */}
            <path
              d="M14 26 L22 18 L58 18 L50 26 Z"
              fill="url(#batTop)"
              stroke="#64748b"
              strokeWidth="1.2"
            />
            {/* Isometric Right Side */}
            <path
              d="M50 26 L58 18 L58 46 L50 54 Z"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="1"
            />
            {/* Gold Brand Belt */}
            <path d="M14 36 L50 36 L50 44 L14 44 Z" fill="url(#batGold)" />
            <path d="M50 36 L58 28 L58 36 L50 44 Z" fill="#92400e" />
            <text x="32" y="42" fill="#0f172a" fontSize="7" fontWeight="900" fontFamily="monospace" textAnchor="middle">
              9V PRO
            </text>
            {/* Specular Edge Sheen */}
            <line x1="16" y1="27" x2="48" y2="27" stroke="#94a3b8" strokeWidth="1" opacity="0.7" />
            {/* + Snap Hexagonal Terminal */}
            <path
              d="M24 16 L29 13 L34 16 L34 20 L29 23 L24 20 Z"
              fill="url(#batChrome)"
              stroke="#94a3b8"
              strokeWidth="0.8"
            />
            <circle cx="29" cy="18" r="2.2" fill="#334155" />
            {/* - Cup Terminal */}
            <ellipse cx="44" cy="20" rx="3.8" ry="2.6" fill="url(#batChrome)" stroke="#64748b" strokeWidth="0.8" />
            <ellipse cx="44" cy="20" rx="2" ry="1.4" fill="#0f172a" />
          </svg>
        );

      case 'ac_source':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="acBody" x1="10" y1="20" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1e293b" />
                <stop offset="0.6" stopColor="#0f172a" />
                <stop offset="1" stopColor="#020617" />
              </linearGradient>
              <linearGradient id="acScreen" x1="14" y1="24" x2="42" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#022c22" />
                <stop offset="1" stopColor="#064e3b" />
              </linearGradient>
              <radialGradient id="acKnob" cx="49" cy="36" r="6" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f8fafc" />
                <stop offset="0.5" stopColor="#94a3b8" />
                <stop offset="1" stopColor="#475569" />
              </radialGradient>
            </defs>
            <ellipse cx="32" cy="58" rx="22" ry="4" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* Front Panel */}
            <rect x="10" y="20" width="44" height="34" rx="4" fill="url(#acBody)" stroke="#0284c7" strokeWidth="1.5" />
            {/* Top Isometric Bevel */}
            <path d="M10 20 L18 14 L58 14 L54 20 Z" fill="#334155" stroke="#38bdf8" strokeWidth="1" />
            {/* Side Bevel */}
            <path d="M54 20 L58 14 L58 48 L54 54 Z" fill="#090d16" stroke="#1e293b" strokeWidth="1" />
            {/* Glowing Oscilloscope LCD Screen */}
            <rect x="14" y="24" width="28" height="18" rx="2.5" fill="url(#acScreen)" stroke="#10b981" strokeWidth="1" />
            {/* Neon Green Sine Wave */}
            <path
              d="M16 33 C 20 26, 23 40, 28 33 C 33 26, 36 40, 40 33"
              stroke="#34d399"
              strokeWidth="2.2"
              strokeLinecap="round"
              filter="drop-shadow(0 0 4px #10b981)"
            />
            {/* 3D Knurled Rotary Knob */}
            <circle cx="48" cy="33" r="5" fill="url(#acKnob)" stroke="#334155" strokeWidth="1" />
            <line x1="48" y1="30" x2="48" y2="33" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
            {/* BNC Sockets */}
            <circle cx="20" cy="48" r="2.8" fill="#cbd5e1" stroke="#0284c7" strokeWidth="1" />
            <circle cx="20" cy="48" r="1.2" fill="#ef4444" />
            <circle cx="34" cy="48" r="2.8" fill="#cbd5e1" stroke="#0284c7" strokeWidth="1" />
            <circle cx="34" cy="48" r="1.2" fill="#0f172a" />
          </svg>
        );

      case 'resistor':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="resBody" x1="18" y1="24" x2="46" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fed7aa" />
                <stop offset="0.3" stopColor="#fdba74" />
                <stop offset="0.7" stopColor="#fb923c" />
                <stop offset="1" stopColor="#c2410c" />
              </linearGradient>
              <linearGradient id="resLead" x1="4" y1="28" x2="60" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#cbd5e1" />
                <stop offset="0.5" stopColor="#f8fafc" />
                <stop offset="1" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="42" rx="22" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(2.5px)" />
            {/* Axial Leads */}
            <path d="M6 32 L18 32 M46 32 L58 32" stroke="url(#resLead)" strokeWidth="3.2" strokeLinecap="round" />
            {/* Resistor Bone Cylinder */}
            <rect x="18" y="24" width="28" height="16" rx="6" fill="url(#resBody)" stroke="#ea580c" strokeWidth="1" />
            {/* Specular Cylindrical Highlight */}
            <line x1="20" y1="26" x2="44" y2="26" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            {/* 4-Band IEC Standard Color Rings */}
            {/* Band 1: Brown (1) */}
            <rect x="22" y="24" width="3" height="16" fill="#78350f" />
            {/* Band 2: Black (0) */}
            <rect x="28" y="24" width="3" height="16" fill="#0f172a" />
            {/* Band 3: Red (x100 = 1k) */}
            <rect x="34" y="24" width="3" height="16" fill="#dc2626" />
            {/* Band 4: Gold (5% Tolerance) */}
            <rect x="40" y="24" width="2.5" height="16" fill="#eab308" />
          </svg>
        );

      case 'capacitor':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="capCan" x1="20" y1="14" x2="44" y2="14" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0284c7" />
                <stop offset="0.2" stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#0284c7" />
                <stop offset="0.8" stopColor="#0369a1" />
                <stop offset="1" stopColor="#082f49" />
              </linearGradient>
              <linearGradient id="capTopAluminum" x1="20" y1="12" x2="44" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f8fafc" />
                <stop offset="0.5" stopColor="#cbd5e1" />
                <stop offset="1" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="56" rx="14" ry="4" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* Leads */}
            <line x1="27" y1="48" x2="27" y2="58" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            <line x1="37" y1="48" x2="37" y2="58" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            {/* Aluminum Can Body */}
            <rect x="20" y="16" width="24" height="34" rx="4" fill="url(#capCan)" stroke="#075985" strokeWidth="1" />
            {/* Aluminum Vent Top */}
            <ellipse cx="32" cy="16" rx="12" ry="5" fill="url(#capTopAluminum)" stroke="#64748b" strokeWidth="1" />
            {/* K-Cross Safety Vent Lines */}
            <path d="M29 15 L35 17 M35 15 L29 17" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
            {/* Negative Polarity Stripe */}
            <rect x="36" y="17" width="6" height="33" fill="#f8fafc" />
            <text x="39" y="32" fill="#0f172a" fontSize="10" fontWeight="bold" textAnchor="middle">
              -
            </text>
            <text x="39" y="44" fill="#0f172a" fontSize="10" fontWeight="bold" textAnchor="middle">
              -
            </text>
          </svg>
        );

      case 'inductor':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="indCopper" x1="0" y1="20" x2="0" y2="44" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.25" stopColor="#ea580c" />
                <stop offset="0.65" stopColor="#c2410c" />
                <stop offset="1" stopColor="#7c2d12" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="46" rx="22" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(2.5px)" />
            {/* Leads */}
            <path d="M6 32 L16 32 M48 32 L58 32" stroke="#cbd5e1" strokeWidth="3.2" strokeLinecap="round" />
            {/* Ferrite Core */}
            <rect x="16" y="28" width="32" height="8" rx="3" fill="#334155" />
            {/* 3D Copper Wound Rings */}
            {[18, 24, 30, 36, 42].map((x, i) => (
              <path
                key={i}
                d={`M${x - 2} 22 C ${x + 4} 20, ${x + 4} 44, ${x - 2} 42`}
                stroke="url(#indCopper)"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            ))}
          </svg>
        );

      case 'led':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="ledRadialGlow" cx="32" cy="24" r="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ef4444" stopOpacity="0.8" />
                <stop offset="0.6" stopColor="#ef4444" stopOpacity="0.2" />
                <stop offset="1" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="ledLens3D" x1="18" y1="10" x2="46" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fca5a5" />
                <stop offset="0.25" stopColor="#ef4444" />
                <stop offset="0.75" stopColor="#dc2626" />
                <stop offset="1" stopColor="#991b1b" />
              </linearGradient>
            </defs>
            {/* Neon Aura Glow */}
            {glow && <circle cx="32" cy="24" r="24" fill="url(#ledRadialGlow)" />}
            <ellipse cx="32" cy="56" rx="14" ry="3.5" fill="rgba(0,0,0,0.5)" filter="blur(2.5px)" />
            {/* Wire Leads */}
            <line x1="28" y1="44" x2="28" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="36" y1="44" x2="36" y2="53" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            {/* Internal Anode / Cathode Flag Anvil */}
            <path d="M28 32 L36 28 M30 38 L30 32" stroke="#fecaca" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            {/* LED Epoxy Dome */}
            <path
              d="M20 40 C 20 18, 44 18, 44 40 L 45 42 H 19 Z"
              fill="url(#ledLens3D)"
              stroke="#f87171"
              strokeWidth="1.2"
            />
            {/* Flanged Rim Collar */}
            <rect x="17" y="42" width="30" height="4" rx="1.5" fill="#b91c1c" stroke="#991b1b" strokeWidth="1" />
            {/* Specular Curved Highlight */}
            <path d="M25 18 C 30 14, 36 15, 39 19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
          </svg>
        );

      case 'diode':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="diodeBody3D" x1="16" y1="22" x2="16" y2="42" gradientUnits="userSpaceOnUse">
                <stop stopColor="#334155" />
                <stop offset="0.3" stopColor="#475569" />
                <stop offset="0.6" stopColor="#1e293b" />
                <stop offset="1" stopColor="#0f172a" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="44" rx="22" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(2.5px)" />
            {/* Leads */}
            <line x1="6" y1="32" x2="16" y2="32" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            <line x1="48" y1="32" x2="58" y2="32" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            {/* Cylindrical DO-41 Body */}
            <rect x="16" y="24" width="32" height="16" rx="4" fill="url(#diodeBody3D)" stroke="#64748b" strokeWidth="1" />
            {/* Cathode Silver Polarity Ring */}
            <rect x="40" y="24" width="5.5" height="16" fill="#f8fafc" />
            {/* Specular Ridge */}
            <line x1="18" y1="26" x2="46" y2="26" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          </svg>
        );

      case 'switch':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="switchBat" x1="32" y1="32" x2="44" y2="14" gradientUnits="userSpaceOnUse">
                <stop stopColor="#94a3b8" />
                <stop offset="0.4" stopColor="#ffffff" />
                <stop offset="1" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="54" rx="18" ry="4" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* Heavy Base Box */}
            <rect x="14" y="24" width="36" height="26" rx="5" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            {/* Threaded Collar & Hex Nut */}
            <ellipse cx="32" cy="30" rx="11" ry="5.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.2" />
            <ellipse cx="32" cy="28" rx="8" ry="4" fill="#94a3b8" />
            {/* Chrome Toggle Bat Lever */}
            <path
              d="M32 28 L43 12"
              stroke="url(#switchBat)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="drop-shadow(0 4px 5px rgba(0,0,0,0.5))"
            />
            {/* Spherical Bat Tip */}
            <circle cx="44" cy="11" r="4.2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
          </svg>
        );

      case 'pushbutton':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="pbDome" cx="32" cy="28" r="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f87171" />
                <stop offset="0.5" stopColor="#dc2626" />
                <stop offset="1" stopColor="#991b1b" />
              </radialGradient>
            </defs>
            <ellipse cx="32" cy="54" rx="18" ry="4.5" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* 4 Gull-wing Solder Pins */}
            <path d="M8 26 L14 26 M8 44 L14 44 M50 26 L56 26 M50 44 L56 44" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
            {/* Thermoplastic Body */}
            <rect x="14" y="18" width="36" height="34" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            {/* Metallic Corner Rivets */}
            <circle cx="18" cy="22" r="1.5" fill="#94a3b8" />
            <circle cx="46" cy="22" r="1.5" fill="#94a3b8" />
            <circle cx="18" cy="48" r="1.5" fill="#94a3b8" />
            <circle cx="46" cy="48" r="1.5" fill="#94a3b8" />
            {/* Tactile Cherry-Red Dome */}
            <circle cx="32" cy="35" r="11" fill="url(#pbDome)" stroke="#b91c1c" strokeWidth="1.2" />
            {/* Tactile Highlight Ring */}
            <ellipse cx="30" cy="31" rx="5" ry="2.5" fill="#fecaca" opacity="0.75" />
          </svg>
        );

      case 'relay':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="relayCase" x1="12" y1="14" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="rgba(56, 189, 248, 0.45)" />
                <stop offset="0.5" stopColor="rgba(14, 165, 233, 0.25)" />
                <stop offset="1" stopColor="rgba(15, 23, 42, 0.85)" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="56" rx="20" ry="4" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* PCB Pins */}
            <line x1="20" y1="50" x2="20" y2="58" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="44" y1="50" x2="44" y2="58" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
            {/* Translucent Sugar-Cube Case */}
            <rect x="12" y="16" width="40" height="36" rx="5" fill="url(#relayCase)" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Internal Miniature Copper Coil */}
            <rect x="18" y="24" width="14" height="22" rx="3" fill="#c2410c" stroke="#ea580c" strokeWidth="1" />
            {/* Magnetic Armature & Contacts */}
            <path d="M34 26 L42 35 M42 35 L45 35" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="44" cy="35" r="2.5" fill="#22c55e" />
          </svg>
        );

      case 'potentiometer':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="potBodyGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0284c7" />
                <stop offset="0.5" stopColor="#0369a1" />
                <stop offset="1" stopColor="#075985" />
              </linearGradient>
              <radialGradient id="potShaft" cx="32" cy="30" r="14" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f8fafc" />
                <stop offset="0.4" stopColor="#cbd5e1" />
                <stop offset="0.8" stopColor="#94a3b8" />
                <stop offset="1" stopColor="#475569" />
              </radialGradient>
            </defs>
            <ellipse cx="32" cy="56" rx="20" ry="4.5" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* 3 Solder Lugs */}
            <line x1="22" y1="48" x2="22" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="32" y1="50" x2="32" y2="60" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="42" y1="48" x2="42" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            {/* Base Body */}
            <circle cx="32" cy="32" r="20" fill="url(#potBodyGrad)" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Knurled Aluminum Rotor */}
            <circle cx="32" cy="31" r="13" fill="url(#potShaft)" stroke="#475569" strokeWidth="1.2" />
            {/* Position Pointer Slot */}
            <line x1="32" y1="19" x2="32" y2="28" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            <circle cx="32" cy="31" r="3.5" fill="#334155" />
          </svg>
        );

      case 'ldr':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="32" cy="54" rx="18" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
            {/* Wire Leads */}
            <line x1="26" y1="46" x2="26" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="38" y1="46" x2="38" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            {/* Ceramic Disc */}
            <circle cx="32" cy="32" r="18" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
            {/* Serpentine CdS Photo-track */}
            <path
              d="M22 24 H42 M22 28 H42 M22 32 H42 M22 36 H42 M22 40 H42"
              stroke="#78350f"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Glossy Protective Resin Reflection */}
            <circle cx="32" cy="32" r="16.5" stroke="#fef3c7" strokeWidth="1" opacity="0.6" />
          </svg>
        );

      case 'transistor_npn':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="32" cy="56" rx="16" ry="4" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* 3 Staggered Leads (E, B, C) */}
            <line x1="24" y1="38" x2="24" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="32" y1="40" x2="32" y2="60" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="40" y1="38" x2="40" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            {/* TO-92 Semi-Cylinder Epoxy Body */}
            <path
              d="M18 18 C 18 38, 46 38, 46 18 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Beveled Flat Front Face */}
            <path d="M19 19 H45" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" />
            <text x="32" y="30" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              2N3904
            </text>
          </svg>
        );

      case 'buzzer':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="buzzerRadial" cx="32" cy="28" r="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#475569" />
                <stop offset="0.6" stopColor="#1e293b" />
                <stop offset="1" stopColor="#020617" />
              </radialGradient>
            </defs>
            <ellipse cx="32" cy="56" rx="20" ry="4.5" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* Leads */}
            <line x1="26" y1="48" x2="26" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="38" y1="48" x2="38" y2="58" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
            {/* Cylindrical Piezo Canister */}
            <circle cx="32" cy="32" r="20" fill="url(#buzzerRadial)" stroke="#475569" strokeWidth="1.5" />
            {/* Central Acoustic Chamber Hole */}
            <circle cx="32" cy="32" r="8" fill="#020617" stroke="#000000" strokeWidth="1.5" />
            <circle cx="32" cy="32" r="4" fill="#1e293b" />
            {/* Polarity Sign */}
            <text x="18" y="32" fill="#ef4444" fontSize="12" fontWeight="bold">
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
        const label = isTimer ? 'NE555' : type.replace('gate_', '').toUpperCase();
        const glowColor =
          type === 'gate_and'
            ? '#06b6d4'
            : type === 'gate_or'
            ? '#a855f7'
            : type === 'gate_not'
            ? '#f59e0b'
            : type === 'gate_xor'
            ? '#10b981'
            : '#38bdf8';

        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ic3DGrad" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#334155" />
                <stop offset="0.4" stopColor="#1e293b" />
                <stop offset="1" stopColor="#090d16" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="54" rx="22" ry="4.5" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
            {/* 8/14 DIP Metal Pins Extending Horizontally */}
            <path
              d="M6 20 H16 M6 28 H16 M6 36 H16 M6 44 H16 M48 20 H58 M48 28 H58 M48 36 H58 M48 44 H58"
              stroke="#cbd5e1"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            {/* Molded Epoxy DIP Body */}
            <rect x="16" y="14" width="32" height="36" rx="4" fill="url(#ic3DGrad)" stroke="#475569" strokeWidth="1.5" />
            {/* Pin 1 Index Notch */}
            <path d="M28 14 C 28 18, 36 18, 36 14" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <circle cx="22" cy="20" r="1.8" fill="#64748b" />
            {/* Silkscreen Text / Logic Badge */}
            <text
              x="32"
              y="34"
              fill={glowColor}
              fontSize="8.5"
              fontWeight="900"
              fontFamily="monospace"
              textAnchor="middle"
              filter={`drop-shadow(0 0 3px ${glowColor})`}
            >
              {label}
            </text>
          </svg>
        );
      }

      case 'ground':
        return (
          <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gndCopper" x1="32" y1="12" x2="32" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.5" stopColor="#22c55e" />
                <stop offset="1" stopColor="#15803d" />
              </linearGradient>
            </defs>
            <ellipse cx="32" cy="54" rx="18" ry="4" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
            {/* Vertical Chassis Post */}
            <line x1="32" y1="12" x2="32" y2="26" stroke="url(#gndCopper)" strokeWidth="4.5" strokeLinecap="round" />
            {/* 3D Tiered Ground Plane Discs */}
            <ellipse cx="32" cy="28" rx="18" ry="4" fill="#22c55e" stroke="#16a34a" strokeWidth="1.5" />
            <ellipse cx="32" cy="36" rx="12" ry="3" fill="#16a34a" stroke="#15803d" strokeWidth="1.2" />
            <ellipse cx="32" cy="44" rx="6" ry="2" fill="#15803d" stroke="#166534" strokeWidth="1" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseEnter={interactive ? handleMouseEnter : undefined}
      onMouseLeave={interactive ? handleMouseLeave : undefined}
      style={{
        transform:
          interactive && isHovered
            ? `perspective(400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.1, 1.1, 1.1)`
            : 'perspective(400px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered
          ? 'transform 0.08s ease-out'
          : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transformStyle: 'preserve-3d',
      }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      {/* 3D Rendered Svg */}
      <div className="relative z-10 transition-transform duration-200">
        {renderSvg()}
      </div>

      {/* Dynamic Specular Glare Layer */}
      {interactive && isHovered && (
        <div
          className="absolute inset-0 z-20 pointer-events-none rounded-xl overflow-hidden opacity-60 mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`,
          }}
        />
      )}
    </div>
  );
};
