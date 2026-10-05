import { useSyncExternalStore } from 'react';
import { audioEngine } from '../audio/audioEngine';

export function useAudioEffects() {
  const snapshot = useSyncExternalStore(audioEngine.subscribe, audioEngine.getSnapshot);
  return { ...snapshot, engine: audioEngine };
}
