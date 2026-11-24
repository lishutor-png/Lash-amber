import React, { useRef, useState } from 'react';

interface VirtualJoystickProps {
  onVectorChange: (vx: number, vy: number) => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onVectorChange }) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const maxRadius = 46;

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

    if (dist < 7) {
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
      className={`relative w-36 h-36 rounded-full border-2 transition-colors touch-none select-none flex items-center justify-center shadow-xl ${
        active
          ? 'bg-[#14171A]/85 border-[#E5B85A]/85 shadow-[#C89B3C]/20'
          : 'bg-[#14171A]/65 border-[#5A626A]/65'
      }`}
    >
      {/* Directional ring & ticks */}
      <div className="absolute inset-2.5 rounded-full border border-[#5A626A]/35 pointer-events-none" />
      <span className="absolute top-2 text-[10px] text-[#9BA3AB] font-mono-num pointer-events-none">
        ▲
      </span>
      <span className="absolute bottom-2 text-[10px] text-[#9BA3AB] font-mono-num pointer-events-none">
        ▼
      </span>
      <span className="absolute left-2.5 text-[10px] text-[#9BA3AB] font-mono-num pointer-events-none">
        ◀
      </span>
      <span className="absolute right-2.5 text-[10px] text-[#9BA3AB] font-mono-num pointer-events-none">
        ▶
      </span>

      {/* Movable thumbstick (56px) */}
      <div
        style={{
          transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
        }}
        className={`w-14 h-14 rounded-full border-2 pointer-events-none transition-transform duration-75 shadow-lg ${
          active
            ? 'bg-gradient-to-br from-[#E5B85A] to-[#C89B3C] border-[#FFF5D6] shadow-[#C89B3C]/35'
            : 'bg-gradient-to-br from-[#485058] to-[#2C3137] border-[#8F969E]'
        }`}
      />
    </div>
  );
};
