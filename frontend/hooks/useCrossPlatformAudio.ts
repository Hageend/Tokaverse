import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';

export const useCrossPlatformAudio = (source: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const soundRef = useRef<Audio.Sound | null>(null);
  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isUnmounted = false;

    async function setupAudio() {
      if (Platform.OS === 'web') {
        // En Web, usamos HTMLAudioElement nativo
        // El source de require() en web es un string (URL)
        const audioPath = typeof source === 'string' ? source : (source && source.uri) || '';
        const audio = new window.Audio(audioPath || source);
        audio.loop = true;
        audio.volume = volume;
        webAudioRef.current = audio;
        
        // El navegador bloquea play() hasta interacción del usuario
        const playWithInteraction = () => {
          if (audio) {
            audio.play().catch(e => console.warn('Web Audio pending interaction:', e));
            setIsPlaying(true);
            window.removeEventListener('click', playWithInteraction);
            window.removeEventListener('touchstart', playWithInteraction);
          }
        };

        window.addEventListener('click', playWithInteraction);
        window.addEventListener('touchstart', playWithInteraction);
      } else {
        // En Móvil, usamos expo-av
        try {
          const { sound } = await Audio.Sound.createAsync(
            source,
            { shouldPlay: true, isLooping: true, volume },
            (status: AVPlaybackStatus) => {
              if (status.isLoaded) setIsPlaying(status.isPlaying);
            }
          );
          if (!isUnmounted) {
            soundRef.current = sound;
          } else {
            await sound.unloadAsync();
          }
        } catch (error) {
          console.error('Error loading mobile audio:', error);
        }
      }
    }

    setupAudio();

    return () => {
      isUnmounted = true;
      if (Platform.OS === 'web') {
        webAudioRef.current?.pause();
        webAudioRef.current = null;
      } else if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [source]);

  // Sincronizar volumen
  useEffect(() => {
    if (Platform.OS === 'web') {
      if (webAudioRef.current) webAudioRef.current.volume = volume;
    } else if (soundRef.current) {
      soundRef.current.setVolumeAsync(volume);
    }
  }, [volume]);

  const play = async () => {
    if (Platform.OS === 'web') {
      webAudioRef.current?.play().catch(console.warn);
      setIsPlaying(true);
    } else if (soundRef.current) {
      await soundRef.current.playAsync();
    }
  };

  const pause = async () => {
    if (Platform.OS === 'web') {
      webAudioRef.current?.pause();
      setIsPlaying(false);
    } else if (soundRef.current) {
      await soundRef.current.pauseAsync();
    }
  };

  return { isPlaying, setVolume, play, pause, volume };
};
