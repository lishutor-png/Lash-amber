import React from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { GameSettings } from '../core/types';
import { soundEngine } from '../core/audio';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (next: GameSettings) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack,
}) => {
  const toggle = (key: 'sfxEnabled' | 'showMinimap' | 'showControlHints') => {
    soundEngine.playClick();
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="w-full h-full bg-[#0D0F10] text-[#E6E2D8] flex flex-col overflow-hidden">
      <header className="shrink-0 px-5 py-3 border-b border-[#252A2E] bg-[#121517] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="min-h-[40px] px-3 py-1.5 rounded bg-[#1C2024] hover:bg-[#272C31] border border-[#3A4046] text-xs font-medium flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <h1 className="font-display text-lg sm:text-xl font-bold text-[#F5E6C4]">
          Pengaturan
        </h1>

        <span className="text-xs text-[#8F969E]">Tersimpan Otomatis</span>
      </header>

      <div className="flex-1 overflow-y-auto ember-scroll p-5 flex items-center justify-center">
        <div className="w-full max-w-xl bg-[#14171A] border border-[#2A3036] rounded p-5 space-y-4">
          {/* SFX Toggle */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#252A2E]">
            <div>
              <div className="text-sm font-semibold text-[#F5E6C4]">Efek Suara (SFX)</div>
              <div className="text-xs text-[#8F969E]">
                Suara langkah, tebasan, dan pengumpulan sumber daya.
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle('sfxEnabled')}
              className={`min-h-[40px] px-4 py-1.5 rounded border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                settings.sfxEnabled
                  ? 'bg-[#17281E] border-[#C89B3C] text-[#F5E6C4]'
                  : 'bg-[#1C2024] border-[#3A4046] text-[#8F969E]'
              }`}
            >
              {settings.sfxEnabled ? (
                <Volume2 className="w-4 h-4 text-[#C89B3C]" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span>{settings.sfxEnabled ? 'Aktif' : 'Mati'}</span>
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#252A2E]">
            <div>
              <div className="text-sm font-semibold text-[#F5E6C4]">Volume Utama</div>
              <div className="text-xs text-[#8F969E] font-mono-num">
                {Math.round(settings.masterVolume * 100)}%
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.masterVolume * 100)}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  masterVolume: Number(e.target.value) / 100,
                })
              }
              aria-label="Volume Utama"
              className="w-40 accent-[#C89B3C] cursor-pointer"
            />
          </div>

          {/* Minimap Toggle */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#252A2E]">
            <div>
              <div className="text-sm font-semibold text-[#F5E6C4]">Peta Mini (Minimap)</div>
              <div className="text-xs text-[#8F969E]">
                Tampilkan peta mini di pojok kanan atas saat eksplorasi.
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle('showMinimap')}
              className={`min-h-[40px] px-4 py-1.5 rounded border text-xs font-semibold cursor-pointer ${
                settings.showMinimap
                  ? 'bg-[#17281E] border-[#C89B3C] text-[#F5E6C4]'
                  : 'bg-[#1C2024] border-[#3A4046] text-[#8F969E]'
              }`}
            >
              {settings.showMinimap ? 'Tampil' : 'Sembunyi'}
            </button>
          </div>

          {/* Control Hints Toggle */}
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#252A2E]">
            <div>
              <div className="text-sm font-semibold text-[#F5E6C4]">Petunjuk Tombol</div>
              <div className="text-xs text-[#8F969E]">
                Tampilkan label pintasan keyboard dan petunjuk aksi di layar.
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle('showControlHints')}
              className={`min-h-[40px] px-4 py-1.5 rounded border text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                settings.showControlHints
                  ? 'bg-[#17281E] border-[#C89B3C] text-[#F5E6C4]'
                  : 'bg-[#1C2024] border-[#3A4046] text-[#8F969E]'
              }`}
            >
              {settings.showControlHints ? 'Tampil' : 'Sembunyi'}
            </button>
          </div>

          {/* Camera Zoom Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#F5E6C4]">Zoom Kamera</div>
              <div className="text-xs text-[#8F969E]">
                Atur kedekatan kamera eksplorasi agar karakter dan hutan tampak jelas.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {(
                [
                  { id: 'VERY_CLOSE', label: 'Sangat Dekat' },
                  { id: 'CLOSE', label: 'Dekat' },
                  { id: 'NORMAL', label: 'Normal' },
                  { id: 'FAR', label: 'Jauh' },
                ] as const
              ).map((opt) => {
                const active = (settings.cameraZoom ?? 'VERY_CLOSE') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateSettings({ ...settings, cameraZoom: opt.id });
                    }}
                    className={`min-h-[40px] px-3 py-1.5 rounded border text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#C89B3C] border-[#F5E6C4] text-[#0D0F10]'
                        : 'bg-[#1C2024] border-[#3A4046] text-[#E6E2D8] hover:bg-[#272C31]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
