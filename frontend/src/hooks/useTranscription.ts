import { useState, useRef, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useAudioCapture } from './useAudioCapture';

export interface Transcription {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  isFinal: boolean;
  confidence?: number;
}

export interface TranscriptionState {
  transcriptions: Transcription[];
  isConnected: boolean;
  isTranscribing: boolean;
  meetingId: string | null;
  error: string | null;
}

export const useTranscription = () => {
  const { user } = useUser();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

  /**
   * Handle incoming audio data and send to backend
   */
  const handleAudioData = useCallback((audioChunk: Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && isTranscribing) {
      // Send binary audio data directly
      wsRef.current.send(audioChunk);
    }
  }, [isTranscribing]);

  /**
   * Audio capture hook
   */
  const {
    isCapturing,
    hasPermission,
    startCapture,
    stopCapture,
    requestPermission,
    cleanup: cleanupAudio
  } = useAudioCapture({
    onAudioData: handleAudioData,
    onError: (err) => setError(err.message)
  });

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);

        // Clear any reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message.type, message);

          switch (message.type) {
            case 'transcription_started':
              setMeetingId(message.meetingId);
              setIsTranscribing(true);
              console.log('Transcription started:', message.meetingId);
              break;

            case 'transcription':
              console.log('📝 Transcript data:', message.data);
              const newTranscription: Transcription = {
                id: `${Date.now()}-${Math.random()}`,
                speaker: message.data.speaker || 'User',
                text: message.data.text,
                timestamp: new Date(message.data.timestamp),
                isFinal: message.data.isFinal,
                confidence: message.data.confidence
              };

              console.log('✅ Adding transcript to state:', newTranscription);

              setTranscriptions(prev => {
                // If this is an interim result, replace the last interim
                if (!newTranscription.isFinal && prev.length > 0 && !prev[prev.length - 1].isFinal) {
                  return [...prev.slice(0, -1), newTranscription];
                }
                // Otherwise add as new transcription
                return [...prev, newTranscription];
              });
              break;

            case 'transcription_stopped':
              setIsTranscribing(false);
              console.log('Transcription stopped');
              break;

            case 'error':
              console.error('WebSocket error:', message.message);
              setError(message.message);
              break;

            case 'pong':
              // Keep-alive response
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsTranscribing(false);

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to connect to server');
    }
  }, [wsUrl]);

  /**
   * Start transcription
   */
  const startTranscription = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return false;
    }

    try {
      // Clear previous transcriptions
      setTranscriptions([]);
      setError(null);

      // Send start message to backend
      wsRef.current?.send(JSON.stringify({
        type: 'start_transcription',
        userId: user.id,
        title: `Meeting ${new Date().toLocaleString()}`
      }));

      // Start audio capture
      const started = await startCapture();
      if (!started) {
        setError('Failed to start audio capture');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to start transcription:', err);
      setError('Failed to start transcription');
      return false;
    }
  }, [user, isConnected, startCapture]);

  /**
   * Stop transcription
   */
  const stopTranscription = useCallback(() => {
    // Stop audio capture
    stopCapture();

    // Send stop message to backend
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_transcription'
      }));
    }

    setIsTranscribing(false);
  }, [stopCapture]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    cleanupAudio();
    setIsConnected(false);
    setIsTranscribing(false);
  }, [cleanupAudio]);

  /**
   * Clear transcriptions
   */
  const clearTranscriptions = useCallback(() => {
    setTranscriptions([]);
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Keep-alive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    // State
    transcriptions,
    isConnected,
    isTranscribing,
    isCapturing,
    hasPermission,
    meetingId,
    error,

    // Actions
    startTranscription,
    stopTranscription,
    clearTranscriptions,
    requestPermission,
    connect,
    disconnect
  };
};
