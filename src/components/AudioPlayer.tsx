import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Disc3, Music2, ExternalLink } from 'lucide-react';
import { AudioConfig } from '../types/bio';
import { parseAudioSource } from '../utils/mediaHelpers';

interface AudioPlayerProps {
  config: AudioConfig;
  autoPlayTriggered: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  config,
  autoPlayTriggered
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(82);
  const [volume, setVolume] = useState(config.defaultVolume ?? 0.7);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const [ytReady, setYtReady] = useState(false);

  const parsedMedia = parseAudioSource(config.audioUrl);
  const isYouTube = parsedMedia.type === 'youtube' && !!parsedMedia.id;
  const isSpotify = parsedMedia.type === 'spotify' && !!parsedMedia.id;
  const isDirectAudio = !isYouTube && !isSpotify;

  // Track cover and titles
  const displayTitle = config.title || (isYouTube ? 'YouTube Track' : isSpotify ? 'Spotify Track' : 'Background Music');
  const displayArtist = config.artist || (isYouTube ? 'YouTube' : isSpotify ? 'Spotify' : 'Artist');
  const displayCover = config.coverUrl || (isYouTube && parsedMedia.previewImageUrl ? parsedMedia.previewImageUrl : '');

  // ==========================================
  // 1. DIRECT HTML5 AUDIO PLAYBACK
  // ==========================================
  useEffect(() => {
    if (!config.enabled || !isDirectAudio || !config.audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio();
    audio.src = config.audioUrl;
    audio.loop = config.loop;
    audio.volume = isMuted ? 0 : volume;
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(Math.floor(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.floor(audio.currentTime));
    };

    const handleEnded = () => {
      if (!config.loop) {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    if (autoPlayTriggered && config.autoplayOnEnter) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.log('Audio autoplay prevented:', err);
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [config.audioUrl, config.enabled, config.loop, isDirectAudio]);

  // ==========================================
  // 2. YOUTUBE IFRAME API PLAYBACK
  // ==========================================
  useEffect(() => {
    if (!config.enabled || !isYouTube || !parsedMedia.id) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
      setYtReady(false);
      return;
    }

    let isSubscribed = true;

    const initYT = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }

      const containerId = 'yt-hidden-player-' + parsedMedia.id;
      if (!document.getElementById(containerId)) return;

      ytPlayerRef.current = new window.YT.Player(containerId, {
        height: '10',
        width: '10',
        videoId: parsedMedia.id,
        playerVars: {
          autoplay: autoPlayTriggered && config.autoplayOnEnter ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: config.loop ? 1 : 0,
          playlist: config.loop ? parsedMedia.id : undefined,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: (event: any) => {
            if (!isSubscribed) return;
            setYtReady(true);
            try {
              event.target.setVolume(Math.round(volume * 100));
              const dur = event.target.getDuration();
              if (dur && !isNaN(dur)) setDuration(Math.floor(dur));
              if (autoPlayTriggered && config.autoplayOnEnter) {
                event.target.playVideo();
                setIsPlaying(true);
              }
            } catch {}
          },
          onStateChange: (event: any) => {
            if (!isSubscribed) return;
            // 1 = Playing, 2 = Paused, 0 = Ended
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false);
            }
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initYT;
    } else {
      initYT();
    }

    return () => {
      isSubscribed = false;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
        ytPlayerRef.current = null;
      }
    };
  }, [isYouTube, parsedMedia.id, config.enabled]);

  // YouTube progress tracking interval
  useEffect(() => {
    if (!isYouTube || !isPlaying) return;
    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const cur = ytPlayerRef.current.getCurrentTime();
          const dur = ytPlayerRef.current.getDuration();
          if (cur) setCurrentTime(Math.floor(cur));
          if (dur && (!duration || duration === 82)) setDuration(Math.floor(dur));
        } catch {}
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isYouTube, isPlaying, duration]);

  // Handle Autoplay Trigger from screen tap
  useEffect(() => {
    if (autoPlayTriggered && config.enabled) {
      if (isDirectAudio && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else if (isYouTube && ytPlayerRef.current && ytReady) {
        try {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        } catch {}
      }
    }
  }, [autoPlayTriggered, config.enabled, isDirectAudio, isYouTube, ytReady]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (isDirectAudio) {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else if (isYouTube && ytPlayerRef.current) {
      try {
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        console.log('Error toggling YT playback:', e);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (isDirectAudio && audioRef.current) {
      audioRef.current.currentTime = time;
    } else if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(time, true);
      } catch {}
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (isDirectAudio && audioRef.current) {
      audioRef.current.volume = val;
    } else if (isYouTube && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(Math.round(val * 100));
      } catch {}
    }
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      const restore = volume || 0.5;
      setIsMuted(false);
      if (isDirectAudio && audioRef.current) audioRef.current.volume = restore;
      if (isYouTube && ytPlayerRef.current) ytPlayerRef.current.setVolume(Math.round(restore * 100));
    } else {
      setIsMuted(true);
      if (isDirectAudio && audioRef.current) audioRef.current.volume = 0;
      if (isYouTube && ytPlayerRef.current) ytPlayerRef.current.setVolume(0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!config.enabled) return null;

  // ==========================================
  // SPOTIFY COMPACT EMBED WIDGET
  // ==========================================
  if (isSpotify && parsedMedia.embedUrl) {
    return (
      <div id="spotify-player-widget" className="w-full rounded-2xl overflow-hidden glass-panel-subtle shadow-xl border border-white/10 p-1.5 transition-all">
        <iframe
          src={parsedMedia.embedUrl}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl shadow-inner bg-black/40"
          title="Spotify Embed Track"
        />
      </div>
    );
  }

  return (
    <div
      id="audio-player-card"
      className="w-full glass-panel-subtle rounded-2xl p-3.5 flex items-center gap-3.5 transition-all duration-300 hover:border-white/15 relative"
    >
      {/* Hidden container for YouTube iframe */}
      {isYouTube && (
        <div className="absolute -top-[9999px] -left-[9999px] opacity-0 pointer-events-none w-1 h-1 overflow-hidden" ref={ytContainerRef}>
          <div id={`yt-hidden-player-${parsedMedia.id}`} />
        </div>
      )}

      {/* Track cover spinning vinyl */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-md ${
            isPlaying ? 'animate-spin-slow' : ''
          }`}
        >
          {displayCover ? (
            <img
              src={displayCover}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
              {isYouTube ? (
                <Music2 className="w-6 h-6 text-red-400" />
              ) : (
                <Disc3 className="w-6 h-6 text-zinc-400" />
              )}
            </div>
          )}
        </div>
        {/* Center spindle dot */}
        <div className="absolute inset-0 m-auto w-2.5 h-2.5 bg-black rounded-full border border-white/40 shadow" />
      </div>

      {/* Track info & controls */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-sm font-semibold tracking-wide text-white/95 truncate">
              {displayTitle}
            </span>
            {displayArtist && (
              <span className="text-xs text-zinc-400 truncate">
                by {displayArtist}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isYouTube && (
              <a
                href={config.audioUrl}
                target="_blank"
                rel="noreferrer"
                title="Открыть в YouTube"
                className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 flex items-center justify-center transition-all"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-transform active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-white text-white" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Progress bar & timer */}
        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono-code">
          <span className="w-8 text-left">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:bg-white/30"
          />
          <span className="w-8 text-right">{formatTime(duration)}</span>

          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-1 pl-1">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-12 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
