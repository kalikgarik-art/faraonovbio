import React, { useState, useRef } from 'react';
import { 
  X, 
  Settings, 
  Sparkles, 
  Image as ImageIcon, 
  Music, 
  Share2, 
  Code, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Gamepad2, 
  User, 
  Upload, 
  Radio, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { BioConfig, SocialPlatform } from '../types/bio';
import { PRESET_BACKGROUNDS, PRESET_TRACKS, DEFAULT_BIO_CONFIG } from '../config/defaultConfig';
import { compressImageFile, parseAudioSource } from '../utils/mediaHelpers';
import { checkLanyardUser, LanyardCheckResult } from '../services/lanyard';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BioConfig;
  onChangeConfig: (newConfig: BioConfig) => void;
  onOpenDomainGuide: () => void;
}

type TabType = 'profile' | 'theme' | 'discord' | 'audio' | 'socials' | 'export';

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onOpenDomainGuide
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [newBadgeText, setNewBadgeText] = useState('');
  
  // Image uploading states
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Lanyard tester state
  const [isCheckingLanyard, setIsCheckingLanyard] = useState(false);
  const [lanyardCheckResult, setLanyardCheckResult] = useState<LanyardCheckResult | null>(null);

  // File input refs
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const updateProfile = (field: keyof BioConfig['profile'], value: any) => {
    onChangeConfig({
      ...config,
      profile: {
        ...config.profile,
        [field]: value
      }
    });
  };

  const updateTheme = (field: keyof BioConfig['theme'], value: any) => {
    onChangeConfig({
      ...config,
      theme: {
        ...config.theme,
        [field]: value
      }
    });
  };

  const updateDiscordManual = (field: keyof BioConfig['discord']['manual'], value: any) => {
    onChangeConfig({
      ...config,
      discord: {
        ...config.discord,
        manual: {
          ...config.discord.manual,
          [field]: value
        }
      }
    });
  };

  const updateAudio = (field: keyof BioConfig['audio'], value: any) => {
    onChangeConfig({
      ...config,
      audio: {
        ...config.audio,
        [field]: value
      }
    });
  };

  // Upload handler for background image
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBg(true);
      const dataUrl = await compressImageFile(file, 1920, 1080, 0.85);
      updateTheme('bgUrl', dataUrl);
    } catch (err) {
      alert('Не удалось загрузить фотографию. Попробуйте другой файл.');
    } finally {
      setIsUploadingBg(false);
    }
  };

  // Upload handler for avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const dataUrl = await compressImageFile(file, 400, 400, 0.9);
      updateProfile('avatarUrl', dataUrl);
    } catch {
      alert('Ошибка при загрузке аватара');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Upload handler for profile banner
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      const dataUrl = await compressImageFile(file, 1000, 500, 0.85);
      updateProfile('cardBannerUrl', dataUrl);
    } catch {
      alert('Ошибка при загрузке баннера');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Upload handler for audio cover
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const dataUrl = await compressImageFile(file, 400, 400, 0.9);
      updateAudio('coverUrl', dataUrl);
    } catch {
      alert('Ошибка при загрузке обложки');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Upload handler for custom audio file
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeConfig({
          ...config,
          audio: {
            ...config.audio,
            audioUrl: reader.result,
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Мой трек'
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Test Lanyard connection
  const handleTestLanyard = async () => {
    const id = config.discord.lanyardUserId;
    if (!id || !id.trim()) {
      setLanyardCheckResult({
        success: false,
        error: 'Введите ваш 18-значный Discord ID пользователя',
        code: 'INVALID_ID'
      });
      return;
    }
    setIsCheckingLanyard(true);
    setLanyardCheckResult(null);
    try {
      const result = await checkLanyardUser(id);
      setLanyardCheckResult(result);
      if (result.success && result.data) {
        // Auto-sync into bio profile option
        const u = result.data.discord_user;
        const name = u.global_name || u.username;
        const av = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256` : '';
        if (confirm(`Найдено: ${name}! Хотите автоматически обновить ник и аватарку в вашем профиле?`)) {
          onChangeConfig({
            ...config,
            profile: {
              ...config.profile,
              displayName: name,
              username: u.username,
              avatarUrl: av || config.profile.avatarUrl
            },
            discord: {
              ...config.discord,
              mode: 'lanyard',
              manual: {
                ...config.discord.manual,
                username: `${u.username}#${u.discriminator === '0' ? '' : u.discriminator}`,
                avatarUrl: av || config.discord.manual.avatarUrl
              }
            }
          });
        }
      }
    } finally {
      setIsCheckingLanyard(false);
    }
  };

  // Auto-detect & autofill media details from input URL
  const handleAudioUrlChange = (newUrl: string) => {
    const parsed = parseAudioSource(newUrl);
    let updatedAudio = {
      ...config.audio,
      audioUrl: newUrl
    };

    if (parsed.type === 'youtube') {
      if (parsed.previewImageUrl && (!config.audio.coverUrl || config.audio.coverUrl.includes('unsplash') || config.audio.coverUrl.includes('freesound'))) {
        updatedAudio.coverUrl = parsed.previewImageUrl;
      }
      if (!config.audio.title || config.audio.title === 'mr.faraon') {
        updatedAudio.title = 'YouTube Music';
        updatedAudio.artist = 'YouTube';
      }
    } else if (parsed.type === 'spotify') {
      if (!config.audio.title || config.audio.title === 'mr.faraon') {
        updatedAudio.title = 'Spotify Track';
        updatedAudio.artist = 'Spotify';
      }
    }

    onChangeConfig({
      ...config,
      audio: updatedAudio
    });
  };

  const handleAddBadge = () => {
    if (!newBadgeText.trim()) return;
    updateProfile('badges', [...config.profile.badges, newBadgeText.trim()]);
    setNewBadgeText('');
  };

  const handleRemoveBadge = (index: number) => {
    const updated = config.profile.badges.filter((_, i) => i !== index);
    updateProfile('badges', updated);
  };

  const handleAddSocial = () => {
    const newSocial = {
      id: `social-${Date.now()}`,
      platform: 'telegram' as SocialPlatform,
      label: 'Telegram',
      url: 'https://t.me/'
    };
    onChangeConfig({
      ...config,
      socials: [...config.socials, newSocial]
    });
  };

  const handleRemoveSocial = (id: string) => {
    onChangeConfig({
      ...config,
      socials: config.socials.filter(s => s.id !== id)
    });
  };

  const handleUpdateSocial = (id: string, field: string, value: string) => {
    onChangeConfig({
      ...config,
      socials: config.socials.map(s => {
        if (s.id === id) {
          return { ...s, [field]: value };
        }
        return s;
      })
    });
  };

  const generateTsCode = () => {
    return `// Конфигурационный файл для вашего био-сайта
// Скопируйте этот код в файл: src/config/defaultConfig.ts

import { BioConfig } from '../types/bio';

export const DEFAULT_BIO_CONFIG: BioConfig = ${JSON.stringify(config, null, 2)};
`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateTsCode());
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "bio-config.json");
    a.click();
  };

  const handleDownloadStandaloneHtml = () => {
    const parsedMedia = parseAudioSource(config.audio.audioUrl);
    const isYt = parsedMedia.type === 'youtube';
    const isSp = parsedMedia.type === 'spotify';

    const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${config.profile.username} • bio</title>
  <meta name="description" content="${config.profile.username} bio link profile" />

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"><\/script>

  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #050505;
      color: #f3f4f6;
      margin: 0;
      overflow-x: hidden;
      user-select: none;
    }
    .font-mono-code { font-family: 'JetBrains Mono', monospace; }
    .glass-card {
      background: rgba(10, 10, 14, 0.45);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
    }
    .glass-widget {
      background: rgba(20, 20, 25, 0.35);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.07);
    }
    .glass-pill {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glass-pill:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .text-glow { text-shadow: 0 0 12px rgba(255, 255, 255, 0.4); }
    .avatar-glow { box-shadow: 0 0 20px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 255, 255, 0.12); }
    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow { animation: spinSlow 12s linear infinite; }
  </style>
</head>
<body class="relative min-h-screen w-full flex flex-col items-center justify-center selection:bg-white/20 selection:text-white">

  <!-- BACKGROUND IMAGE -->
  <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <img
      id="bg-image"
      src="${config.theme.bgUrl}"
      alt="Background"
      class="w-full h-full object-cover object-center scale-105 filter brightness-[65%] blur-[${config.theme.bgBlur || 2}px] transition-all duration-700"
    />
    <div class="absolute inset-0 bg-black/35 pointer-events-none"></div>
  </div>

  <!-- SNOW CANVAS -->
  <canvas id="snow-canvas" class="fixed inset-0 pointer-events-none z-10 w-full h-full opacity-90"></canvas>

  <!-- CLICK TO ENTER OVERLAY -->
  <div
    id="click-overlay"
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl cursor-pointer select-none transition-opacity duration-700"
    onclick="enterSite()"
  >
    <div class="text-center px-4">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-widest text-white/90 uppercase font-mono-code mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
        [ ${config.profile.username}.lol ]
      </h1>
      <div class="flex items-center justify-center gap-2 text-xs sm:text-sm tracking-widest text-zinc-400 uppercase font-mono-code animate-pulse">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        <span>${config.theme.enterScreenText || 'click anywhere to enter'}</span>
      </div>
    </div>
  </div>

  <!-- MAIN BIO CONTAINER -->
  <div class="relative z-20 w-full max-w-[460px] mx-auto px-3.5 py-6 flex flex-col items-center gap-3.5 my-auto">
    <div class="w-full glass-card rounded-[26px] overflow-hidden">
      <!-- Banner -->
      <div class="relative w-full h-36 sm:h-40 overflow-hidden bg-zinc-900">
        <img
          src="${config.profile.cardBannerUrl}"
          alt="Banner"
          class="w-full h-full object-cover object-center brightness-90 transition-transform duration-700 hover:scale-105"
        />
        <div class="absolute top-3 right-3 flex items-center gap-1.5 z-10 font-mono-code text-[11px] text-zinc-300">
          <div class="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <svg class="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>${config.profile.viewsCount}</span>
          </div>
          <div class="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <span>#${config.profile.userUid}</span>
          </div>
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none"></div>
      </div>

      <!-- Profile Body -->
      <div class="relative px-6 pb-6 pt-0 flex flex-col items-center text-center">
        <!-- Avatar -->
        <div class="relative -mt-14 mb-3">
          <div class="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 avatar-glow bg-zinc-900">
            <img
              src="${config.profile.avatarUrl}"
              alt="Avatar"
              class="w-full h-full object-cover"
            />
          </div>
        </div>

        <!-- Username -->
        <div class="flex items-center justify-center gap-1.5 mb-2.5">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white/95 text-glow">
            ${config.profile.displayName || config.profile.username}
          </h1>
          <svg class="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>
        </div>

        <!-- Badges Tags -->
        <div class="flex flex-wrap items-center justify-center gap-1.5 max-w-sm mb-4">
          ${config.profile.badges.map((b: string) => `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono-code text-zinc-300 glass-pill">${b}</span>`).join('')}
        </div>

        <!-- Bio Quote -->
        <p class="text-xs sm:text-[13px] text-zinc-300/90 leading-relaxed font-normal max-w-xs mb-3.5 tracking-wide">
          ${config.profile.bioQuote}
        </p>

        <!-- Location -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-400 mb-4 select-none">
          <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>${config.profile.location}</span>
        </div>

        <!-- Social Icons Row -->
        <div class="flex items-center justify-center gap-3 pt-1 border-t border-white/5 w-full">
          ${config.socials.map((s: any) => `
            <a href="${s.url}" target="_blank" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all hover:scale-110 shadow-sm" title="${s.platform}">
              <span class="text-xs font-mono-code font-bold uppercase">${s.platform.substring(0, 2)}</span>
            </a>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- DISCORD WIDGET -->
    ${config.discord.enabled ? `
    <div class="w-full glass-widget rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-white/15 transition-all">
      <div class="flex items-center gap-3 min-w-0">
        <div class="relative w-11 h-11 flex-shrink-0">
          <img src="${config.discord.manual.avatarUrl || config.profile.avatarUrl}" alt="Discord" class="w-full h-full rounded-full object-cover border border-white/20 shadow-sm" />
          <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-zinc-900"></div>
        </div>
        <div class="flex flex-col min-w-0">
          <div class="text-sm font-bold text-white/95 truncate">${config.discord.manual.username}</div>
          <div class="text-xs text-zinc-300 font-medium truncate mt-0.5">${config.discord.manual.activityTitle}</div>
          <div class="text-[11px] text-zinc-400 truncate">${config.discord.manual.activityDetails}</div>
        </div>
      </div>
      <div class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
        ${config.discord.manual.activityBadge}
      </div>
    </div>` : ''}

    <!-- AUDIO PLAYER WIDGET -->
    ${config.audio.enabled ? (
      isSp && parsedMedia.embedUrl ? `
      <div class="w-full rounded-2xl overflow-hidden glass-widget border border-white/10 p-1">
        <iframe src="${parsedMedia.embedUrl}" width="100%" height="80" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" class="rounded-xl"></iframe>
      </div>` : `
      <div class="w-full glass-widget rounded-2xl p-3.5 flex items-center gap-3.5 hover:border-white/15 transition-all">
        <div class="relative w-12 h-12 flex-shrink-0">
          <div id="vinyl-disk" class="w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-md">
            <img src="${config.audio.coverUrl || (isYt && parsedMedia.previewImageUrl ? parsedMedia.previewImageUrl : '')}" alt="Cover" class="w-full h-full object-cover" />
          </div>
          <div class="absolute inset-0 m-auto w-2.5 h-2.5 bg-black rounded-full border border-white/40 shadow"></div>
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <div class="truncate">
              <span class="text-sm font-semibold tracking-wide text-white/95">${config.audio.title}</span>
              <span class="text-xs text-zinc-400 ml-2">by ${config.audio.artist}</span>
            </div>
            <button onclick="toggleAudio()" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white">
              <svg id="play-icon" class="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
          <div class="flex items-center gap-2 text-[11px] text-zinc-400 font-mono-code">
            <span id="cur-time">00:00</span>
            <input id="audio-progress" type="range" min="0" max="100" value="0" oninput="seekAudio(this.value)" class="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
            <span id="dur-time">00:00</span>
          </div>
        </div>
      </div>`
    ) : ''}

    <div class="text-[11px] text-zinc-500/70 font-mono-code select-none">
      <span>${config.profile.username}.lol</span>
    </div>
  </div>

  ${!isSp && !isYt ? `<audio id="bg-audio" loop src="${config.audio.audioUrl}"></audio>` : ''}
  ${isYt ? `<div id="yt-player" class="hidden"></div><script src="https://www.youtube.com/iframe_api"><\/script>` : ''}

  <script>
    const isYt = ${isYt};
    let ytPlayer = null;
    let audio = document.getElementById('bg-audio');
    const playIcon = document.getElementById('play-icon');
    const vinyl = document.getElementById('vinyl-disk');
    const curTimeSpan = document.getElementById('cur-time');
    const durTimeSpan = document.getElementById('dur-time');
    const progress = document.getElementById('audio-progress');
    let isPlaying = false;

    window.onYouTubeIframeAPIReady = function() {
      if (isYt) {
        ytPlayer = new YT.Player('yt-player', {
          height: '1', width: '1',
          videoId: '${parsedMedia.id || ''}',
          playerVars: { autoplay: 0, controls: 0, loop: 1, playlist: '${parsedMedia.id || ''}' },
          events: {
            onStateChange: (e) => {
              setPlayState(e.data === 1);
            }
          }
        });
      }
    };

    function enterSite() {
      const overlay = document.getElementById('click-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 700);
      }
      if (isYt && ytPlayer) {
        try { ytPlayer.playVideo(); } catch(e){}
      } else if (audio) {
        audio.play().then(() => setPlayState(true)).catch(e => console.log(e));
      }
    }

    function toggleAudio() {
      if (isYt && ytPlayer) {
        if (isPlaying) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
      } else if (audio) {
        if (isPlaying) {
          audio.pause();
          setPlayState(false);
        } else {
          audio.play().then(() => setPlayState(true)).catch(e => console.log(e));
        }
      }
    }

    function setPlayState(p) {
      isPlaying = p;
      if (vinyl) {
        p ? vinyl.classList.add('animate-spin-slow') : vinyl.classList.remove('animate-spin-slow');
      }
      if (playIcon) {
        playIcon.innerHTML = p ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
      }
    }

    if (audio) {
      audio.addEventListener('timeupdate', () => {
        if (progress) progress.value = Math.floor(audio.currentTime);
        if (curTimeSpan) curTimeSpan.textContent = formatTime(Math.floor(audio.currentTime));
      });
      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          if (progress) progress.max = Math.floor(audio.duration);
          if (durTimeSpan) durTimeSpan.textContent = formatTime(Math.floor(audio.duration));
        }
      });
    }

    function seekAudio(val) { 
      if (isYt && ytPlayer) ytPlayer.seekTo(val, true);
      else if (audio) audio.currentTime = val; 
    }
    function formatTime(s) {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return (m < 10 ? '0' + m : m) + ':' + (sec < 10 ? '0' + sec : sec);
    }

    // Snow
    const canvas = document.getElementById('snow-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let w = (canvas.width = window.innerWidth);
      let h = (canvas.height = window.innerHeight);
      window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });
      const flakes = Array.from({ length: 50 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        radius: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.8,
        speedY: Math.random() * 1.2 + 0.5,
        opacity: Math.random() * 0.6 + 0.3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.01
      }));
      function drawSnow() {
        ctx.clearRect(0, 0, w, h);
        for (let f of flakes) {
          f.wobble += f.wobbleSpeed;
          f.x += Math.sin(f.wobble) * 0.5 + f.speedX;
          f.y += f.speedY;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + f.opacity + ')';
          ctx.fill();
          if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
          if (f.x > w + 10) f.x = -10; else if (f.x < -10) f.x = w + 10;
        }
        requestAnimationFrame(drawSnow);
      }
      drawSnow();
    }
  <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetToDefault = () => {
    if (confirm('Сбросить все настройки к исходному виду faraonov.lol?')) {
      onChangeConfig(DEFAULT_BIO_CONFIG);
    }
  };

  const parsedCurrentAudio = parseAudioSource(config.audio.audioUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Hidden file inputs for uploading from PC */}
      <input type="file" ref={bgFileInputRef} onChange={handleBgUpload} accept="image/*" className="hidden" />
      <input type="file" ref={avatarFileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
      <input type="file" ref={bannerFileInputRef} onChange={handleBannerUpload} accept="image/*" className="hidden" />
      <input type="file" ref={coverFileInputRef} onChange={handleCoverUpload} accept="image/*" className="hidden" />
      <input type="file" ref={audioFileInputRef} onChange={handleAudioFileUpload} accept="audio/*" className="hidden" />

      <div
        id="config-editor-modal"
        className="relative w-full max-w-3xl bg-zinc-950/95 border border-white/10 rounded-2xl shadow-2xl text-zinc-200 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Редактор и настройки био
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-code">
                  faraonov.lol
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Загружайте свои фото, подключайте Discord ID, YouTube/Spotify и настраивайте внешний вид
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDomainGuide}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Привязать домен
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-zinc-900/40 border-b border-white/5 overflow-x-auto">
          {[
            { id: 'profile', label: 'Профиль', icon: User },
            { id: 'theme', label: 'Фон & Снег', icon: ImageIcon },
            { id: 'discord', label: 'Discord', icon: Gamepad2 },
            { id: 'audio', label: 'Музыка (YouTube/Spotify)', icon: Music },
            { id: 'socials', label: 'Соцсети', icon: Share2 },
            { id: 'export', label: 'Конфиг-файл', icon: Code }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* ==========================================
              TAB 1: PROFILE
          ========================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1 font-medium">Имя пользователя (Ник):</label>
                  <input
                    type="text"
                    value={config.profile.displayName}
                    onChange={(e) => updateProfile('displayName', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1 font-medium">UID / Номер профиля:</label>
                  <input
                    type="text"
                    value={config.profile.userUid}
                    onChange={(e) => updateProfile('userUid', e.target.value)}
                    placeholder="#38073"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none"
                  />
                </div>
              </div>

              {/* Avatar with Upload button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-zinc-400 text-xs font-medium">Аватарка профиля:</label>
                  <button
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {isUploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    <span>Загрузить фото с ПК</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-white/20 bg-zinc-900 flex-shrink-0">
                    <img src={config.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={config.profile.avatarUrl}
                    onChange={(e) => updateProfile('avatarUrl', e.target.value)}
                    placeholder="URL или загрузите файл..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Banner with Upload button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-zinc-400 text-xs font-medium">Баннер карточки профиля:</label>
                  <button
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {isUploadingBanner ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    <span>Загрузить фото с ПК</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-10 rounded-lg overflow-hidden border border-white/20 bg-zinc-900 flex-shrink-0">
                    <img src={config.profile.cardBannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={config.profile.cardBannerUrl}
                    onChange={(e) => updateProfile('cardBannerUrl', e.target.value)}
                    placeholder="URL или загрузите файл..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1 font-medium">Цитата / Описание био:</label>
                <textarea
                  rows={2}
                  value={config.profile.bioQuote}
                  onChange={(e) => updateProfile('bioQuote', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1 font-medium">Локация:</label>
                  <input
                    type="text"
                    value={config.profile.location}
                    onChange={(e) => updateProfile('location', e.target.value)}
                    placeholder="Belarus"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1 font-medium">Счетчик просмотров:</label>
                  <input
                    type="number"
                    value={config.profile.viewsCount}
                    onChange={(e) => updateProfile('viewsCount', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none"
                  />
                </div>
              </div>

              {/* Badges manager */}
              <div className="pt-2 border-t border-white/10">
                <label className="block text-zinc-400 text-xs mb-2 font-medium">Значки / Бейджи (rtx 5060ti, coder и т.д.):</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {config.profile.badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-zinc-200"
                    >
                      <span>{badge}</span>
                      <button
                        onClick={() => handleRemoveBadge(idx)}
                        className="text-zinc-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Добавить новый тег (например: software dev)"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBadge()}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                  />
                  <button
                    onClick={handleAddBadge}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Добавить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: THEME & BACKGROUND PHOTO
          ========================================== */}
          {activeTab === 'theme' && (
            <div className="space-y-5">
              {/* PC Upload Banner Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-white mb-0.5">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Поставить свою фотку на фон сайта</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Выберите любое изображение с вашего компьютера (JPEG, PNG, GIF, WebP)
                  </p>
                </div>
                <button
                  onClick={() => bgFileInputRef.current?.click()}
                  disabled={isUploadingBg}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 active:scale-95 whitespace-nowrap"
                >
                  {isUploadingBg ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Загрузка...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Выбрать фото с ПК</span>
                    </>
                  )}
                </button>
              </div>

              {/* Custom background URL input */}
              <div>
                <label className="block text-zinc-400 text-xs mb-1 font-medium">Или введите прямую ссылку на фото / GIF:</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/20 bg-zinc-900 flex-shrink-0">
                    <img src={config.theme.bgUrl} alt="Background Preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={config.theme.bgUrl}
                    onChange={(e) => updateTheme('bgUrl', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Presets Grid */}
              <div>
                <label className="block text-zinc-400 text-xs mb-2 font-medium">Готовые пресеты атмосферных фонов:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_BACKGROUNDS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onChangeConfig({
                          ...config,
                          theme: {
                            ...config.theme,
                            bgUrl: preset.url
                          },
                          profile: {
                            ...config.profile,
                            cardBannerUrl: preset.banner
                          }
                        });
                      }}
                      className={`relative rounded-xl overflow-hidden border p-1 text-left transition-all ${
                        config.theme.bgUrl === preset.url
                          ? 'border-indigo-400 ring-2 ring-indigo-400/30'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="h-16 w-full rounded-lg overflow-hidden bg-zinc-900 mb-1">
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-[11px] font-semibold text-white truncate px-1">{preset.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders: Blur, Brightness, Opacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Размытие фона:</span>
                    <span>{config.theme.bgBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={config.theme.bgBlur}
                    onChange={(e) => updateTheme('bgBlur', Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Яркость фона:</span>
                    <span>{config.theme.bgBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={config.theme.bgBrightness}
                    onChange={(e) => updateTheme('bgBrightness', Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-zinc-400 mb-1">
                    <span>Прозрачность карты:</span>
                    <span>{config.theme.cardOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={95}
                    value={config.theme.cardOpacity}
                    onChange={(e) => updateTheme('cardOpacity', Number(e.target.value))}
                    className="w-full accent-indigo-400"
                  />
                </div>
              </div>

              {/* Particles selector */}
              <div className="pt-2 border-t border-white/10">
                <label className="block text-zinc-400 text-xs mb-2 font-medium">Частицы на фоне:</label>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {[
                    { id: 'snow', label: '❄️ Снег' },
                    { id: 'rain', label: '🌧️ Дождь' },
                    { id: 'stars', label: '✨ Звезды' },
                    { id: 'embers', label: '🔥 Искры' },
                    { id: 'sakura', label: '🌸 Сакура' },
                    { id: 'sparkles', label: '💫 Блеск' },
                    { id: 'none', label: '🚫 Нет' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => updateTheme('particles', p.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        config.theme.particles === p.id
                          ? 'bg-white/20 border-white text-white font-bold'
                          : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: DISCORD WIDGET & LANYARD
          ========================================== */}
          {activeTab === 'discord' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="font-semibold text-white">Включить виджет Discord</span>
                  <p className="text-zinc-400 text-xs">Показывает статус, игру и активность в реальном времени</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.discord.enabled}
                  onChange={(e) => onChangeConfig({
                    ...config,
                    discord: { ...config.discord, enabled: e.target.checked }
                  })}
                  className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              {/* Mode switch */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onChangeConfig({
                    ...config,
                    discord: { ...config.discord, mode: 'lanyard' }
                  })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    config.discord.mode === 'lanyard'
                      ? 'border-indigo-400 bg-indigo-500/15 text-white'
                      : 'border-white/10 bg-black/30 text-zinc-400'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-indigo-400" />
                    <span>По ID (Lanyard Live Sync)</span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">Авто-статус из реального Discord</div>
                </button>

                <button
                  onClick={() => onChangeConfig({
                    ...config,
                    discord: { ...config.discord, mode: 'manual' }
                  })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    config.discord.mode === 'manual'
                      ? 'border-indigo-400 bg-indigo-500/15 text-white'
                      : 'border-white/10 bg-black/30 text-zinc-400'
                  }`}
                >
                  <div className="font-bold text-xs">Ручная настройка (Симулятор)</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Ввести статус, игру и имя вручную</div>
                </button>
              </div>

              {config.discord.mode === 'lanyard' ? (
                <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3.5">
                  <div>
                    <label className="block text-indigo-300 font-medium text-xs mb-1.5">
                      Ваш Discord User ID (18-19 цифр):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Например: 820698188188188188"
                        value={config.discord.lanyardUserId || ''}
                        onChange={(e) => {
                          onChangeConfig({
                            ...config,
                            discord: { ...config.discord, lanyardUserId: e.target.value }
                          });
                          setLanyardCheckResult(null);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono-code text-xs outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={handleTestLanyard}
                        disabled={isCheckingLanyard}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
                      >
                        {isCheckingLanyard ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Проверка...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Проверить ID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Lanyard Diagnostic Status Result */}
                  {lanyardCheckResult && (
                    <div className={`p-3.5 rounded-xl border text-xs ${
                      lanyardCheckResult.success 
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        {lanyardCheckResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="font-bold">
                            {lanyardCheckResult.success
                              ? `Успешно подключено к Discord: ${lanyardCheckResult.data?.discord_user.global_name || lanyardCheckResult.data?.discord_user.username} (${lanyardCheckResult.data?.discord_status})`
                              : lanyardCheckResult.error}
                          </div>

                          {lanyardCheckResult.code === 'NOT_MONITORED' && (
                            <div className="pt-2">
                              <a
                                href="https://discord.gg/lanyard"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Вступить на официальный сервер Lanyard (discord.gg/lanyard)</span>
                              </a>
                              <p className="text-[11px] text-zinc-400 mt-1.5">
                                💡 Discord не передает данные сторонним сайтам, если бот Lanyard не находится на одном сервере с вами. Вступите на их сервер, и статус заработает мгновенно!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <div className="text-[11px] text-zinc-400 space-y-1.5 pt-1 border-t border-white/5">
                    <div className="font-semibold text-zinc-300 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-indigo-400" />
                      <span>Как узнать свой Discord ID:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 pl-1 text-zinc-400">
                      <li>В Discord откройте Настройки пользователя → «Расширенные» → включите «Режим разработчика».</li>
                      <li>Нажмите правой кнопкой мыши по своему нику/аватарке → «Копировать ID пользователя».</li>
                      <li>Вступите на сервер <a href="https://discord.gg/lanyard" target="_blank" rel="noreferrer" className="text-indigo-300 underline">discord.gg/lanyard</a> (требуется один раз).</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 text-xs mb-1 font-medium">Имя & Тег в Discord:</label>
                      <input
                        type="text"
                        value={config.discord.manual.username}
                        onChange={(e) => updateDiscordManual('username', e.target.value)}
                        placeholder="Faraonov #2016"
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs mb-1 font-medium">Статус:</label>
                      <select
                        value={config.discord.manual.status}
                        onChange={(e) => updateDiscordManual('status', e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                      >
                        <option value="online">В сети (Online / Зеленый)</option>
                        <option value="idle">Не активен (Idle / Желтый полумесяц)</option>
                        <option value="dnd">Не беспокоить (DND / Красный)</option>
                        <option value="offline">Не в сети (Offline / Серый)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs mb-1 font-medium">Заголовок активности / Игры:</label>
                    <input
                      type="text"
                      value={config.discord.manual.activityTitle}
                      onChange={(e) => updateDiscordManual('activityTitle', e.target.value)}
                      placeholder="Playing Project Real"
                      className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-zinc-400 text-xs mb-1 font-medium">Детали активности:</label>
                      <input
                        type="text"
                        value={config.discord.manual.activityDetails}
                        onChange={(e) => updateDiscordManual('activityDetails', e.target.value)}
                        placeholder="Editing Tab #13"
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs mb-1 font-medium">Бейдж справа (например REAL):</label>
                      <input
                        type="text"
                        value={config.discord.manual.activityBadge}
                        onChange={(e) => updateDiscordManual('activityBadge', e.target.value)}
                        placeholder="REAL"
                        className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 4: AUDIO (YOUTUBE & SPOTIFY)
          ========================================== */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="font-semibold text-white">Включить аудиоплеер</span>
                  <p className="text-zinc-400 text-xs">Воспроизводит атмосферную музыку при входе на сайт</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.audio.enabled}
                  onChange={(e) => updateAudio('enabled', e.target.checked)}
                  className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                />
              </div>

              {/* YouTube / Spotify / MP3 Link Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/20 via-emerald-950/20 to-black border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-white text-xs font-bold flex items-center gap-2">
                    <Music className="w-4 h-4 text-indigo-400" />
                    <span>Ссылка на трек (YouTube, Spotify или прямой MP3):</span>
                  </label>
                  {parsedCurrentAudio.type === 'youtube' && (
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold uppercase border border-red-500/30 flex items-center gap-1">
                      <span>YouTube видео</span>
                    </span>
                  )}
                  {parsedCurrentAudio.type === 'spotify' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30 flex items-center gap-1">
                      <span>Spotify трек</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={config.audio.audioUrl}
                    onChange={(e) => handleAudioUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... или https://open.spotify.com/track/..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono-code text-xs outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => audioFileInputRef.current?.click()}
                    title="Загрузить MP3 с компьютера"
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold whitespace-nowrap transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Файл с ПК</span>
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400">
                  ⚡ Поддерживаются: ссылки на видео/треки с <b>YouTube</b>, <b>YouTube Music</b>, <b>Spotify</b>, а также прямые ссылки на <b>MP3/WAV</b> файлы или загрузка с вашего ПК.
                </p>
              </div>

              {/* Track Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1 font-medium">Название трека:</label>
                  <input
                    type="text"
                    value={config.audio.title}
                    onChange={(e) => updateAudio('title', e.target.value)}
                    placeholder="mr.faraon"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1 font-medium">Автор / Исполнитель:</label>
                  <input
                    type="text"
                    value={config.audio.artist}
                    onChange={(e) => updateAudio('artist', e.target.value)}
                    placeholder="faraonov"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Cover image with upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-zinc-400 text-xs font-medium">Обложка пластинки / трека:</label>
                  <button
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {isUploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    <span>Загрузить обложку с ПК</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-zinc-900 flex-shrink-0">
                    <img src={config.audio.coverUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80'} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={config.audio.coverUrl}
                    onChange={(e) => updateAudio('coverUrl', e.target.value)}
                    placeholder="URL обложки..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:border-indigo-400 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Preset tracks */}
              <div className="pt-2 border-t border-white/10">
                <label className="block text-zinc-400 text-xs mb-2 font-medium">Или выберите готовый трек:</label>
                <div className="space-y-2">
                  {PRESET_TRACKS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        onChangeConfig({
                          ...config,
                          audio: {
                            ...config.audio,
                            title: t.title,
                            artist: t.artist,
                            coverUrl: t.cover,
                            audioUrl: t.url
                          }
                        });
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        config.audio.audioUrl === t.url
                          ? 'border-indigo-400 bg-indigo-500/15 text-white font-semibold'
                          : 'border-white/10 bg-black/30 text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={t.cover} alt={t.title} className="w-9 h-9 rounded-lg object-cover" />
                        <div className="text-left">
                          <div className="text-xs font-bold text-white">{t.title}</div>
                          <div className="text-[11px] text-zinc-400">{t.artist}</div>
                        </div>
                      </div>
                      <span className="text-[11px] text-indigo-300">Выбрать</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 5: SOCIAL LINKS
          ========================================== */}
          {activeTab === 'socials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Иконки социальных сетей:</span>
                <button
                  onClick={handleAddSocial}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Добавить ссылку
                </button>
              </div>

              <div className="space-y-2.5">
                {config.socials.map((social) => (
                  <div
                    key={social.id}
                    className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 justify-between"
                  >
                    <div className="flex items-center gap-2 w-full sm:w-1/3">
                      <select
                        value={social.platform}
                        onChange={(e) => handleUpdateSocial(social.id, 'platform', e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-xs outline-none w-full"
                      >
                        <option value="discord">Discord</option>
                        <option value="telegram">Telegram</option>
                        <option value="youtube">YouTube</option>
                        <option value="roblox">Roblox</option>
                        <option value="steam">Steam</option>
                        <option value="spotify">Spotify</option>
                        <option value="vk">ВКонтакте (VK)</option>
                        <option value="github">GitHub</option>
                        <option value="tiktok">TikTok</option>
                        <option value="twitch">Twitch</option>
                        <option value="twitter">Twitter / X</option>
                        <option value="instagram">Instagram</option>
                      </select>
                    </div>

                    <div className="flex-1 w-full flex items-center gap-2">
                      <input
                        type="text"
                        value={social.url}
                        onChange={(e) => handleUpdateSocial(social.id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono-code text-xs outline-none"
                      />
                      <button
                        onClick={() => handleRemoveSocial(social.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 6: EXPORT CONFIG
          ========================================== */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Готовый файл конфигурации
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Все сделанные вами изменения можно легко сохранить. Скачайте автономный <code className="text-white bg-black/40 px-1.5 py-0.5 rounded font-mono-code">index.html</code> (открывается двойным кликом) или скопируйте код в <code className="text-white bg-black/40 px-1.5 py-0.5 rounded font-mono-code">src/config/defaultConfig.ts</code>.
                </p>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-[11px] font-mono-code text-zinc-300 overflow-x-auto max-h-64 leading-relaxed">
                  {generateTsCode()}
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition-all active:scale-95"
                >
                  {copiedConfig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedConfig ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-zinc-400 hover:text-rose-300 text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Сбросить к стандарту
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadStandaloneHtml}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Скачать index.html (Один файл)
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    bio-config.json
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/30"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Копировать код
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-zinc-900/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 font-mono-code">
            ✨ Изменения отображаются мгновенно на превью
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
