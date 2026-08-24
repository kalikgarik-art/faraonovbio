/**
 * Utilities for parsing media URLs (YouTube, Spotify, Direct Audio)
 * and compressing uploaded images for local storage.
 */

export interface ParsedMedia {
  type: 'youtube' | 'spotify' | 'direct';
  id?: string;
  embedUrl?: string;
  previewImageUrl?: string;
  cleanUrl: string;
}

export function parseAudioSource(inputUrl: string): ParsedMedia {
  const url = (inputUrl || '').trim();
  if (!url) {
    return { type: 'direct', cleanUrl: '' };
  }

  // 1. Check YouTube
  // Matches: youtube.com/watch?v=XYZ, youtu.be/XYZ, music.youtube.com/watch?v=XYZ, youtube.com/embed/XYZ, youtube.com/shorts/XYZ
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      id: videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=1&playsinline=1&rel=0&iv_load_policy=3`,
      previewImageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      cleanUrl: url
    };
  }

  // 2. Check Spotify
  // Matches: open.spotify.com/track/XYZ, open.spotify.com/album/XYZ, open.spotify.com/playlist/XYZ, spotify:track:XYZ
  const spotifyMatch = url.match(
    /(?:open\.spotify\.com\/(track|album|playlist|episode)\/|spotify:(track|album|playlist|episode):)([a-zA-Z0-9]+)/i
  );
  if (spotifyMatch) {
    const entityType = spotifyMatch[1] || spotifyMatch[2] || 'track';
    const spotifyId = spotifyMatch[3];
    return {
      type: 'spotify',
      id: spotifyId,
      embedUrl: `https://open.spotify.com/embed/${entityType}/${spotifyId}?utm_source=generator&theme=0`,
      cleanUrl: url
    };
  }

  // 3. Fallback to direct audio URL (e.g. mp3, ogg, wav, cdn)
  return {
    type: 'direct',
    cleanUrl: url
  };
}

/**
 * Compresses an uploaded image file on the client side into a base64 DataURL.
 * This guarantees the image will render instantly and fit safely in localStorage.
 */
export function compressImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an animated GIF or SVG, don't compress via canvas (to preserve animation / vector quality)
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Export as WebP or JPEG
        const mime = file.type === 'image/png' && file.size < 800000 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mime, quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
