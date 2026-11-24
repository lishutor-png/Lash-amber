import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from './game/core/audio';
import {
  CharacterClassId,
  GameSettings,
  PlayerState,
  SaveSlotRecord,
  ScreenRoute,
  WorldState,
} from './game/core/types';
import {
  deleteSaveSlot,
  getMostRecentSaveSlot,
  listSaveSlots,
  loadFromSlot,
  loadSettings,
  saveSettings,
  saveToSlot,
} from './game/save/saveManager';
import {
  createInitialPlayer,
  normalizePlayerState,
  normalizeWorldState,
} from './game/survival/survivalSystem';
import { CharacterSelectScreen } from './game/ui/CharacterSelectScreen';
import { CollectionScreen } from './game/ui/CollectionScreen';
import { CreditsScreen } from './game/ui/CreditsScreen';
import { GameScreen } from './game/ui/GameScreen';
import { LoadGameScreen } from './game/ui/LoadGameScreen';
import { MainMenu } from './game/ui/MainMenu';
import { SettingsScreen } from './game/ui/SettingsScreen';
import { SplashScreen } from './game/ui/SplashScreen';

interface ActiveSession {
  key: number;
  slotIndex: 1 | 2 | 3;
  player: PlayerState;
  world: WorldState;
}

export default function App() {
  const [screen, setScreen] = useState<ScreenRoute>('SPLASH');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [saveSlots, setSaveSlots] = useState<SaveSlotRecord[]>([]);
  const [recentSave, setRecentSave] = useState<SaveSlotRecord | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);

  const refreshSaves = useCallback(async () => {
    const slots = await listSaveSlots();
    setSaveSlots(slots);
    const recent = await getMostRecentSaveSlot();
    setRecentSave(recent);
  }, []);

  useEffect(() => {
    refreshSaves();
  }, [refreshSaves]);

  useEffect(() => {
    soundEngine.configure(settings.sfxEnabled, settings.masterVolume);
    saveSettings(settings);
  }, [settings]);

  const handleStartNewGame = async (
    classId: CharacterClassId,
    seed: number,
    slotIndex: 1 | 2 | 3
  ) => {
    const newPlayer = createInitialPlayer(classId);
    const newWorld: WorldState = {
      seed,
      biomeName: 'Hutan Terlupakan — Pembukaan Rimba Awal',
      currentRegionX: 0,
      currentRegionY: 0,
      exploredRegions: ['0,0'],
      gameTimeSeconds: 0,
      dayCount: 1,
      completedNights: 0,
      nightEscalationRate: 0.05,
      harvestedNodes: {},
      defeatedMonsters: {},
      defeatedAnimals: {},
      tamedCreatures: {},
      groundLootByRegion: {},
      merchantsByRegion: {},
      exploredChunks: [],
      exploredTilesByRegion: {},
      discoveredLandmarksByRegion: {},
    };

    await saveToSlot(slotIndex, newPlayer, newWorld);
    await refreshSaves();

    setSession({
      key: Date.now(),
      slotIndex,
      player: newPlayer,
      world: newWorld,
    });
    setScreen('PLAYING');
  };

  const handleLoadSlot = async (slotIndex: 1 | 2 | 3) => {
    const record = await loadFromSlot(slotIndex);
    if (!record || !record.player || !record.world) return;
    setSession({
      key: Date.now(),
      slotIndex,
      player: normalizePlayerState(record.player),
      world: normalizeWorldState(record.world),
    });
    setScreen('PLAYING');
  };

  const handleContinue = async () => {
    const recent = await getMostRecentSaveSlot();
    if (!recent || !recent.player || !recent.world) return;
    setSession({
      key: Date.now(),
      slotIndex: recent.slotIndex,
      player: normalizePlayerState(recent.player),
      world: normalizeWorldState(recent.world),
    });
    setScreen('PLAYING');
  };

  const handleSaveToSlot = async (
    slotIndex: 1 | 2 | 3,
    player: PlayerState,
    world: WorldState
  ) => {
    await saveToSlot(slotIndex, player, world);
    await refreshSaves();
    setSession((prev) => (prev ? { ...prev, slotIndex } : prev));
  };

  const handleDeleteSlot = async (slotIndex: 1 | 2 | 3) => {
    await deleteSaveSlot(slotIndex);
    await refreshSaves();
  };

  return (
    <main className="w-screen h-[100dvh] overflow-hidden bg-[#0D0F10]">
      {screen === 'SPLASH' && (
        <SplashScreen onComplete={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'MAIN_MENU' && (
        <MainMenu
          recentSave={recentSave}
          onNewGame={() => setScreen('CHARACTER_SELECT')}
          onContinue={handleContinue}
          onLoadGame={() => {
            refreshSaves();
            setScreen('LOAD_GAME');
          }}
          onCollection={() => setScreen('COLLECTION')}
          onSettings={() => setScreen('SETTINGS')}
          onCredits={() => setScreen('CREDITS')}
        />
      )}

      {screen === 'CHARACTER_SELECT' && (
        <CharacterSelectScreen
          saveSlots={saveSlots}
          onBack={() => setScreen('MAIN_MENU')}
          onStartGame={handleStartNewGame}
        />
      )}

      {screen === 'LOAD_GAME' && (
        <LoadGameScreen
          saveSlots={saveSlots}
          onBack={() => setScreen('MAIN_MENU')}
          onLoadSlot={handleLoadSlot}
          onDeleteSlot={handleDeleteSlot}
        />
      )}

      {screen === 'COLLECTION' && (
        <CollectionScreen onBack={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'SETTINGS' && (
        <SettingsScreen
          settings={settings}
          onUpdateSettings={setSettings}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {screen === 'CREDITS' && (
        <CreditsScreen onBack={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'PLAYING' && session && (
        <GameScreen
          key={session.key}
          initialPlayer={session.player}
          initialWorld={session.world}
          activeSlotIndex={session.slotIndex}
          saveSlots={saveSlots}
          settings={settings}
          onToggleSfx={() =>
            setSettings((s) => ({ ...s, sfxEnabled: !s.sfxEnabled }))
          }
          onSaveToSlot={handleSaveToSlot}
          onLoadLastSave={handleContinue}
          onNewGame={() => setScreen('CHARACTER_SELECT')}
          onQuitToMenu={() => {
            refreshSaves();
            setScreen('MAIN_MENU');
          }}
        />
      )}
    </main>
  );
}
