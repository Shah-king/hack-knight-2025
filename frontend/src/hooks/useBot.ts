import { useState, useCallback, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';

export interface BotStatus {
  botId: string;
  meetingNumber: string;
  botName: string;
  status: string;
  isMuted: boolean;
  isAudioEnabled: boolean;
  joinedAt: Date;
  uptime: number;
}

export const useBot = () => {
  const { user } = useUser();
  const [botData, setBotData] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

  /**
   * Connect to WebSocket to receive bot events
   */
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ Bot WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'bot_joined':
              console.log('Bot joined meeting:', message.data);
              setBotData({
                ...message.data,
                joinedAt: new Date(message.data.joinedAt)
              });
              break;

            case 'bot_left':
              console.log('Bot left meeting:', message.data);
              setBotData(null);
              break;

            case 'bot_status':
              if (message.data) {
                setBotData({
                  ...message.data,
                  joinedAt: new Date(message.data.joinedAt)
                });
              }
              break;

            case 'bot_muted':
              setBotData(prev => prev ? { ...prev, isMuted: true } : null);
              break;

            case 'bot_unmuted':
              setBotData(prev => prev ? { ...prev, isMuted: false } : null);
              break;

            case 'bot_spoke':
              console.log('Bot spoke in meeting');
              break;

            default:
              // Ignore other message types
              break;
          }
        } catch (err) {
          console.error('Failed to parse bot WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('Bot WebSocket error:', event);
      };

      ws.onclose = () => {
        console.log('Bot WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create bot WebSocket:', err);
    }
  }, [wsUrl]);

  /**
   * Fetch current bot status for user
   */
  const fetchBotStatus = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch(`${apiUrl}/api/zoom/my-bot/${user.id}`);

      if (response.status === 404) {
        // No active bot
        setBotData(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch bot status');
      }

      const data = await response.json();
      if (data.success && data.bot) {
        setBotData({
          ...data.bot,
          joinedAt: new Date(data.bot.joinedAt)
        });
      }
    } catch (err) {
      console.error('Error fetching bot status:', err);
    }
  }, [user, apiUrl]);

  /**
   * Leave meeting
   */
  const leaveMeeting = useCallback(async (botId?: string) => {
    if (!user && !botId) {
      setError('No bot ID or user available');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/zoom/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: botId || botData?.botId,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave meeting');
      }

      setBotData(null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to leave meeting';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, botData, apiUrl]);

  /**
   * Mute bot
   */
  const muteBot = useCallback(async () => {
    if (!botData) {
      setError('No active bot');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/zoom/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: botData.botId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mute bot');
      }

      setBotData(prev => prev ? { ...prev, isMuted: true } : null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to mute bot';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [botData, apiUrl]);

  /**
   * Unmute bot
   */
  const unmuteBot = useCallback(async () => {
    if (!botData) {
      setError('No active bot');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/zoom/unmute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: botData.botId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unmute bot');
      }

      setBotData(prev => prev ? { ...prev, isMuted: false } : null);
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to unmute bot';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [botData, apiUrl]);

  /**
   * Make bot speak (text-to-speech)
   */
  const speak = useCallback(async (text: string, voiceId?: string) => {
    if (!botData) {
      setError('No active bot');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Bot speaking: "${text}"`);

      const response = await fetch(`${apiUrl}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          botId: botData.botId,
          voiceId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate speech');
      }

      console.log('✅ Bot spoke successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to speak';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [botData, apiUrl]);

  // Connect WebSocket on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Fetch bot status on mount
  useEffect(() => {
    if (user) {
      fetchBotStatus();
    }
  }, [user, fetchBotStatus]);

  return {
    // State
    botData,
    isLoading,
    error,
    hasActiveBot: !!botData,

    // Actions
    fetchBotStatus,
    leaveMeeting,
    muteBot,
    unmuteBot,
    speak
  };
};
