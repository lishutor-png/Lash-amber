import React, { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onVectorChange: (vx: number, vy: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onVectorChange }) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const maxRadius = 38;

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    const clamped = Math.min(maxRadius, dist);
    const angle = Math.atan2(dy, dx);
    const ox = dist > 2 ? Math.cos(angle) * clamped : 0;
    const oy = dist > 2 ? Math.sin(angle) * clamped : 0;

    setKnobOffset({ x: ox, y: oy });

    if (dist < 6) {
      onVectorChange(0, 0);
    } else {
      onVectorChange(ox / maxRadius, oy / maxRadius);
    }
  };

  const resetStick = () => {
    pointerIdRef.current = null;
    setActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onVectorChange(0, 0);
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={(e) => {
        e.preventDefault();
        pointerIdRef.current = e.pointerId;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setActive(true);
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        resetStick();
      }}
      onPointerCancel={(e) => {
        if (pointerIdRef.current !== e.pointerId) return;
        resetStick();
      }}
      role="application"
      aria-label="Joystick pergerakan karakter"
      className={`relative w-28 h-28 rounded-full border transition-colors touch-none select-none flex items-center justify-center ${
        active
          ? 'bg-[#14171A]/75 border-[#C89B3C]/80'
          : 'bg-[#14171A]/55 border-[#5A626A]/50'
      }`}
    >
      {/* Directional ticks */}
      <div className="absolute inset-2 rounded-full border border-[#5A626A]/25 pointer-events-none" />
      <span className="absolute top-1.5 text-[9px] text-[#7D858E] font-mono-num pointer-events-none">
        ▲
      </span>
      <span className="absolute bottom-1.5 text-[9px] text-[#7D858E] font-mono-num pointer-events-none">
        ▼
      </span>
      <span className="absolute left-2 text-[9px] text-[#7D858E] font-mono-num pointer-events-none">
        ◀
      </span>
      <span className="absolute right-2 text-[9px] text-[#7D858E] font-mono-num pointer-events-none">
        ▶
      </span>

      {/* Movable thumbstick */}
      <div
        style={{
          transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
        }}
        className={`w-12 h-12 rounded-full border pointer-events-none transition-transform duration-75 ${
          active
            ? 'bg-[#C89B3C] border-[#F5E6C4] shadow-lg shadow-[#C89B3C]/25'
            : 'bg-[#3A4046] border-[#7D858E]'
        }`}
      />
    </div>
  );
};
