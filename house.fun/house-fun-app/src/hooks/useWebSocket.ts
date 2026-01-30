import { useEffect, useRef, useCallback, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface WebSocketMessage {
  type: 'bet' | 'race_start' | 'race_end' | 'hand_start' | 'hand_end' | 'player_action' | 'pot_update';
  gameType: 'FLIP_IT' | 'FIGHT_CLUB' | 'DEGEN_DERBY' | 'SHADOW_POKER';
  data: unknown;
  timestamp: number;
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketReturn {
  status: WebSocketStatus;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: Omit<WebSocketMessage, 'timestamp'>) => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook for WebSocket real-time updates
 * Connects to server for live game updates
 */
export function useGameWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { publicKey } = useWallet();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');

    // In production, this would connect to your WebSocket server
    // For now, we'll simulate the connection
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://api.house.fun/ws';
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setStatus('connected');
        console.log('WebSocket connected');
        
        // Subscribe to all games
        ws.send(JSON.stringify({
          type: 'subscribe',
          games: ['FLIP_IT', 'FIGHT_CLUB', 'DEGEN_DERBY', 'SHADOW_POKER'],
          wallet: publicKey?.toString(),
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        console.log('WebSocket disconnected');
        
        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        setStatus('error');
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      setStatus('error');
      console.error('Failed to connect WebSocket:', error);
    }
  }, [publicKey]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
      }));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
  };
}

/**
 * Hook for real-time race updates (Degen Derby)
 */
export function useRaceUpdates(raceId: string | null) {
  const { lastMessage } = useGameWebSocket();
  const [raceStatus, setRaceStatus] = useState<'waiting' | 'running' | 'finished'>('waiting');
  const [winner, setWinner] = useState<number | null>(null);

  useEffect(() => {
    if (!lastMessage || !raceId) return;

    if (lastMessage.type === 'race_start' && (lastMessage.data as { raceId: string }).raceId === raceId) {
      setRaceStatus('running');
    }

    if (lastMessage.type === 'race_end' && (lastMessage.data as { raceId: string }).raceId === raceId) {
      setRaceStatus('finished');
      setWinner((lastMessage.data as { winner: number }).winner);
    }
  }, [lastMessage, raceId]);

  return { raceStatus, winner };
}

/**
 * Hook for real-time poker table updates
 */
export function usePokerUpdates(tableId: string | null) {
  const { lastMessage } = useGameWebSocket();
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [pot, setPot] = useState<number>(0);
  const [communityCards, setCommunityCards] = useState<string[]>([]);

  useEffect(() => {
    if (!lastMessage || !tableId) return;

    const data = lastMessage.data as { tableId: string; [key: string]: unknown };
    if (data.tableId !== tableId) return;

    switch (lastMessage.type) {
      case 'player_action':
        setCurrentPlayer((data.nextPlayer as string) || null);
        break;
      case 'pot_update':
        setPot((data.pot as number) || 0);
        break;
      case 'hand_start':
        setCommunityCards([]);
        setPot(0);
        break;
    }
  }, [lastMessage, tableId]);

  return { currentPlayer, pot, communityCards };
}

/**
 * Hook for live bet notifications
 */
export function useLiveBets(gameType: 'FLIP_IT' | 'FIGHT_CLUB' | 'DEGEN_DERBY' | 'SHADOW_POKER') {
  const { lastMessage } = useGameWebSocket();
  const [recentBet, setRecentBet] = useState<{ player: string; amount: number; timestamp: number } | null>(null);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'bet' && lastMessage.gameType === gameType) {
      const data = lastMessage.data as { player: string; amount: number };
      setRecentBet({
        player: data.player,
        amount: data.amount,
        timestamp: lastMessage.timestamp,
      });
    }
  }, [lastMessage, gameType]);

  return recentBet;
}
