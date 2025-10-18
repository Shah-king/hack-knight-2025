import { useRef, useState, useCallback } from 'react';

export interface AudioCaptureOptions {
  onAudioData?: (audioChunk: Blob) => void;
  onError?: (error: Error) => void;
  sampleRate?: number;
  channelCount?: number;
}

export const useAudioCapture = (options: AudioCaptureOptions = {}) => {
  const {
    onAudioData,
    onError,
    sampleRate = 16000,
    channelCount = 1
  } = options;

  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Request microphone permission and initialize audio capture
   */
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: { ideal: sampleRate },
          channelCount: { ideal: channelCount }
        }
      });

      streamRef.current = stream;
      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Failed to get microphone permission:', error);
      setHasPermission(false);
      onError?.(error as Error);
      return false;
    }
  }, [sampleRate, channelCount, onError]);

  /**
   * Start capturing audio
   */
  const startCapture = useCallback(async () => {
    if (!streamRef.current) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      // Create MediaRecorder with the stream
      const mediaRecorder = new MediaRecorder(streamRef.current!, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onAudioData?.(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        onError?.(new Error('MediaRecorder error'));
        stopCapture();
      };

      mediaRecorder.onstop = () => {
        setIsCapturing(false);
      };

      // Start recording and emit data every 250ms for real-time streaming
      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setIsCapturing(true);

      console.log('🎤 Audio capture started');
      return true;
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      onError?.(error as Error);
      return false;
    }
  }, [onAudioData, onError, requestPermission]);

  /**
   * Stop capturing audio
   */
  const stopCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    setIsCapturing(false);
    console.log('🎤 Audio capture stopped');
  }, []);

  /**
   * Clean up all resources
   */
  const cleanup = useCallback(() => {
    stopCapture();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setHasPermission(null);
  }, [stopCapture]);

  return {
    isCapturing,
    hasPermission,
    startCapture,
    stopCapture,
    requestPermission,
    cleanup
  };
};
