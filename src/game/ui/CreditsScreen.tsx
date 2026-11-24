import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { soundEngine } from '../core/audio';

interface CreditsScreenProps {
  onBack: () => void;
}

export const CreditsScreen: React.FC<CreditsScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full h-full bg-[#0D0F10] text-[#E6E2D8] flex flex-col overflow-hidden">
      <header className="shrink-0 px-5 py-3 border-b border-[#252A2E] bg-[#121517] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="min-h-[44px] px-4 py-1.5 rounded-lg bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h1 className="font-display text-lg sm:text-xl font-bold text-[#F5E6C4]">
          Kredit
        </h1>

        <span className="text-xs text-[#8F969E]">Prototipe Fondasi</span>
      </header>

      <div className="flex-1 overflow-y-auto ember-scroll p-6 flex items-center justify-center">
        <div className="w-full max-w-lg bg-[#14171A] border border-[#2A3036] rounded p-6 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#F5E6C4]">
            THE LAST EMBER
          </h2>
          <p className="text-xs italic text-[#C89B3C]">
            &ldquo;Survive. Die. Remember. Rise Again.&rdquo;
          </p>

          <div className="space-y-3 pt-3 border-t border-[#252A2E] text-xs text-[#B8B2A6] leading-relaxed">
            <div>
              <div className="text-[#F5E6C4] font-semibold">Konsep & Dunia</div>
              <div>Dark Fantasy Survival Roguelite RPG · Bioma Hutan Terlupakan</div>
            </div>
            <div>
              <div className="text-[#F5E6C4] font-semibold">Arsitektur Sistem</div>
              <div>
                Generator Chunk Prosedural 32x32 · Eksplorasi Real-Time · Pertarungan
                Berbasis Giliran · Penyimpanan Lokal 3 Slot Luring
              </div>
            </div>
            <div>
              <div className="text-[#F5E6C4] font-semibold">Grafis & Audio</div>
              <div>Ilustrasi HD 2D Dark Fantasy Kanvas · Efek Suara Sintesis Web Audio</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
