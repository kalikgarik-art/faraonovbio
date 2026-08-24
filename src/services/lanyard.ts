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
