export type ParticleType = 'snow' | 'stars' | 'rain' | 'embers' | 'sakura' | 'sparkles' | 'none';

export type SocialPlatform = 
  | 'discord' 
  | 'telegram' 
  | 'youtube' 
  | 'roblox' 
  | 'steam' 
  | 'spotify' 
  | 'vk' 
  | 'github' 
  | 'tiktok' 
  | 'twitch' 
  | 'twitter' 
  | 'instagram'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  customIcon?: string;
}

export interface DiscordManualConfig {
  username: string;
  avatarUrl: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activityTitle: string;
  activityDetails: string;
  activityTime: string;
  activityBadge: string;
  verified?: boolean;
}

export interface DiscordConfig {
  enabled: boolean;
  mode: 'manual' | 'lanyard';
  lanyardUserId?: string; // e.g. "820698188188188188"
  manual: DiscordManualConfig;
}

export interface AudioConfig {
  enabled: boolean;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  autoplayOnEnter: boolean;
  loop: boolean;
  defaultVolume: number; // 0 to 1
  sourceType?: 'direct' | 'youtube' | 'spotify';
}

export interface ThemeConfig {
  bgType: 'image' | 'video' | 'gif';
  bgUrl: string;
  bgBlur: number; // in px
  bgBrightness: number; // in %
  cardOpacity: number; // in %
  particles: ParticleType;
  particlesCount: number;
  particlesSpeed: number;
  particlesColor?: string;
  fontFamily: 'sans' | 'cinzel' | 'syne' | 'mono' | 'display';
  accentColor: string;
  enterScreenText: string;
  enterScreenSubtext: string;
  customCursor: boolean;
}

export interface ProfileConfig {
  username: string;
  displayName: string;
  avatarUrl: string;
  cardBannerUrl: string;
  bioQuote: string;
  location: string;
  viewsCount: number;
  userUid: string;
  badges: string[];
  verified: boolean;
}

export interface BioConfig {
  profile: ProfileConfig;
  socials: SocialLink[];
  discord: DiscordConfig;
  audio: AudioConfig;
  theme: ThemeConfig;
}
