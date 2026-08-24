export interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    avatar: string | null;
    discriminator: string;
    global_name: string | null;
    avatar_decoration_data?: {
      asset: string;
      sku_id: string;
    } | null;
  };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: Array<{
    id: string;
    name: string;
    type: number;
    state?: string;
    details?: string;
    timestamps?: {
      start?: number;
      end?: number;
    };
    assets?: {
      large_image?: string;
      large_text?: string;
      small_image?: string;
      small_text?: string;
    };
  }>;
  spotify: {
    track_id: string;
    timestamps: {
      start: number;
      end: number;
    };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
  } | null;
  listening_to_spotify: boolean;
}

export interface LanyardCheckResult {
  success: boolean;
  data?: LanyardData;
  error?: string;
  code?: 'NOT_MONITORED' | 'INVALID_ID' | 'NOT_FOUND' | 'NETWORK_ERROR';
}

/**
 * Validates a Discord ID format (17 to 20 digits).
 */
export function isValidDiscordSnowflake(id: string): boolean {
  return /^\d{17,20}$/.test(id.trim());
}

/**
 * Checks a user on Lanyard and returns structured status or error details.
 */
export async function checkLanyardUser(rawUserId: string): Promise<LanyardCheckResult> {
  const userId = (rawUserId || '').trim();
  if (!userId) {
    return { success: false, error: 'Введите Discord ID', code: 'INVALID_ID' };
  }

  if (!isValidDiscordSnowflake(userId)) {
    return {
      success: false,
      error: 'ID должен состоять только из 17-20 цифр (например, 820698188188188188). Никнейм не подходит!',
      code: 'INVALID_ID'
    };
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${userId}`);
    const json = await res.json().catch(() => null);

    if (res.ok && json?.success && json?.data) {
      return { success: true, data: json.data as LanyardData };
    }

    if (json?.error?.message?.toLowerCase().includes('user_not_monitored') || json?.error?.code === 'user_not_monitored') {
      return {
        success: false,
        error: 'Пользователь не найден в Lanyard. Чтобы Lanyard видел ваш статус, вам нужно просто один раз вступить на официальный сервер Lanyard: discord.gg/lanyard',
        code: 'NOT_MONITORED'
      };
    }

    if (res.status === 404) {
      return {
        success: false,
        error: 'Пользователь не найден в Lanyard. Вступите на сервер discord.gg/lanyard, чтобы Lanyard начал отслеживать ваш статус.',
        code: 'NOT_MONITORED'
      };
    }

    return {
      success: false,
      error: json?.error?.message || 'Не удалось получить статус Discord через Lanyard.',
      code: 'NOT_FOUND'
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Ошибка сети при обращении к Lanyard API.',
      code: 'NETWORK_ERROR'
    };
  }
}

export async function fetchLanyardUser(userId: string): Promise<LanyardData | null> {
  const result = await checkLanyardUser(userId);
  return result.success && result.data ? result.data : null;
}

/**
 * Subscribes to real-time Lanyard updates via WebSocket with automatic heartbeat,
 * error handling, and periodic polling fallback.
 */
export function subscribeLanyardUser(
  userId: string,
  onUpdate: (data: LanyardData) => void,
  onError?: (err: string) => void
): () => void {
  const cleanId = (userId || '').trim();
  if (!cleanId || !isValidDiscordSnowflake(cleanId)) {
    return () => {};
  }

  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let isUnmounted = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const fallbackPoll = async () => {
    const data = await fetchLanyardUser(cleanId);
    if (!isUnmounted && data) {
      onUpdate(data);
    }
  };

  // Immediate initial load
  fallbackPoll();

  const connectWs = () => {
    if (isUnmounted) return;
    try {
      ws = new WebSocket('wss://api.lanyard.rest/socket');

      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: cleanId
            }
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { op, t, d } = payload;

          // Op 1: Hello from Lanyard - start heartbeat
          if (op === 1 && d?.heartbeat_interval) {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            heartbeatTimer = setInterval(() => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
            }, d.heartbeat_interval);
          }

          // Op 0: Dispatch event (INIT_STATE or PRESENCE_UPDATE)
          if (op === 0) {
            if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
              if (d && !isUnmounted) {
                onUpdate(d as LanyardData);
              }
            }
          }
        } catch {
          // ignore parsing error
        }
      };

      ws.onerror = () => {
        if (!pollInterval && !isUnmounted) {
          pollInterval = setInterval(fallbackPoll, 10000);
        }
        if (onError) onError('WebSocket connection failed');
      };

      ws.onclose = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (!isUnmounted) {
          setTimeout(connectWs, 5000);
        }
      };
    } catch {
      if (!pollInterval && !isUnmounted) {
        pollInterval = setInterval(fallbackPoll, 10000);
      }
    }
  };

  connectWs();

  return () => {
    isUnmounted = true;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (pollInterval) clearInterval(pollInterval);
    if (ws) {
      try {
        ws.close();
      } catch {
        // ignore
      }
    }
  };
}

