import React from 'react';

export const PRESETS = [
  { id: 'precision', label: 'Precision', desc: 'Tâm 4 nhánh' },
  { id: 'orbit', label: 'Orbit', desc: 'Vòng ngắm' },
  { id: 'tactical', label: 'Tactical', desc: 'Chiến thuật' },
  { id: 'dot', label: 'Minimal', desc: 'Chấm tâm' },
  { id: 'star', label: 'Stellar', desc: 'Tám hướng' },
];

export const COLORS = ['#31F2EC','#B58AFF','#FF5D86','#FFD56A','#80FF8E','#FFFFFF'];

export default function Reticle({ type = 'precision', color = '#31F2EC', size = 98, opacity = 1, line = 2.5, glow = true }) {
  const strokeProps = { stroke: color, strokeWidth: line, strokeLinecap: 'round', fill: 'none' };
  const base = {
    precision: <>
      <path d="M50 13 V34 M50 66 V87 M13 50 H34 M66 50 H87" {...strokeProps} />
      <circle cx="50" cy="50" r="3.7" fill={color} />
    </>,
    orbit: <>
      <circle cx="50" cy="50" r="25" {...strokeProps} />
      <circle cx="50" cy="50" r="33" stroke={color} strokeWidth="1" fill="none" strokeDasharray="8 13" opacity=".5" />
      <path d="M50 10V19 M50 81V90 M10 50H19 M81 50H90" {...strokeProps}/>
      <circle cx="50" cy="50" r="3.5" fill={color} />
    </>,
    tactical: <>
      <path d="M22 37 V22 H37 M63 22 H78 V37 M78 63 V78 H63 M37 78 H22 V63" {...strokeProps}/>
      <path d="M50 29V41 M50 59V71 M29 50H41 M59 50H71" {...strokeProps}/>
      <circle cx="50" cy="50" r="2.5" fill={color}/>
    </>,
    dot: <>
      <circle cx="50" cy="50" r="6" fill={color}/>
      <circle cx="50" cy="50" r="18" stroke={color} strokeWidth="1.2" fill="none" opacity=".4"/>
    </>,
    star: <>
      <path d="M50 12V36 M50 64V88 M12 50H36 M64 50H88 M23 23L40 40 M60 60L77 77 M77 23L60 40 M40 60L23 77" {...strokeProps}/>
      <circle cx="50" cy="50" r="3" fill={color}/>
    </>,
  };
  return (
    <svg role="img" aria-label={`Tâm ngắm ${type}`} viewBox="0 0 100 100"
      style={{ width: size, height: size, opacity, overflow: 'visible', filter: glow ? `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 11px ${color}70)` : 'none' }}>
      {base[type] || base.precision}
    </svg>
  );
}
