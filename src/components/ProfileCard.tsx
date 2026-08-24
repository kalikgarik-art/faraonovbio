import React, { useState } from 'react';
import { Eye, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { BioConfig } from '../types/bio';
import { SocialIcon } from './SocialIcons';
import { DiscordWidget } from './DiscordWidget';
import { AudioPlayer } from './AudioPlayer';

interface ProfileCardProps {
  config: BioConfig;
  autoPlayTriggered: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  config,
  autoPlayTriggered
}) => {
  const { profile, socials, discord, audio, theme } = config;
  const [views, setViews] = useState(profile.viewsCount);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);

  const handleCardClick = () => {
    if (!hasIncrementedView) {
      setViews(prev => prev + 1);
      setHasIncrementedView(true);
    }
  };

  const getFontClass = () => {
    switch (theme.fontFamily) {
      case 'cinzel': return 'font-cinzel';
      case 'syne': return 'font-syne';
      case 'mono': return 'font-mono-code';
      case 'display': return 'font-display';
      default: return 'font-sans';
    }
  };

  return (
    <div
      id="main-bio-container"
      className="relative z-20 w-full max-w-[460px] mx-auto px-3.5 py-6 flex flex-col items-center gap-3.5"
    >
      {/* Primary Bio Glass Card */}
      <div
        id="profile-glass-card"
        onClick={handleCardClick}
        style={{
          backgroundColor: `rgba(10, 10, 14, ${theme.cardOpacity / 100})`,
          backdropFilter: `blur(${theme.bgBlur * 6 + 12}px)`,
          WebkitBackdropFilter: `blur(${theme.bgBlur * 6 + 12}px)`
        }}
        className={`w-full rounded-[26px] overflow-hidden border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] transition-all duration-300 ${getFontClass()}`}
      >
        {/* Banner Section */}
        <div className="relative w-full h-36 sm:h-40 overflow-hidden bg-zinc-900">
          <img
            src={profile.cardBannerUrl || theme.bgUrl}
            alt="Profile Banner"
            className="w-full h-full object-cover object-center filter brightness-90 transition-transform duration-700 hover:scale-105"
          />

          {/* Top Info Badges (Views & UID) */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10 select-none">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono-code text-zinc-300 shadow-sm">
              <Eye className="w-3 h-3 text-zinc-400" />
              <span>{views}</span>
            </div>
            {profile.userUid && (
              <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-mono-code text-zinc-300 shadow-sm">
                <span>{profile.userUid}</span>
              </div>
            )}
          </div>

          {/* Dark gradient fade into card body */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
        </div>

        {/* Card Body with Avatar, Badges, Bio */}
        <div className="relative px-6 pb-6 pt-0 flex flex-col items-center text-center">
          {/* Circular Avatar overlapping banner */}
          <div className="relative -mt-14 mb-3 group">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 avatar-glow bg-zinc-900 transition-transform duration-300 group-hover:scale-105">
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 rounded-full ring-1 ring-white/30 pointer-events-none" />
          </div>

          {/* Username & Verified Badge */}
          <div className="flex items-center justify-center gap-1.5 mb-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white/95 text-glow select-none">
              {profile.displayName || profile.username}
            </h1>
            {profile.verified && (
              <CheckCircle2 className="w-4 h-4 text-zinc-400 fill-zinc-400/20" />
            )}
          </div>

          {/* Badges / Chips list */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm mb-4">
              {profile.badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-mono-code text-zinc-300 glass-pill tracking-tight transition-all duration-200 hover:scale-105"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Bio Quote */}
          {profile.bioQuote && (
            <p className="text-xs sm:text-[13px] text-zinc-300/90 leading-relaxed font-normal max-w-xs mb-3.5 tracking-wide">
              {profile.bioQuote}
            </p>
          )}

          {/* Location */}
          {profile.location && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-4 select-none">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>{profile.location}</span>
            </div>
          )}

          {/* Social Links Row */}
          {socials && socials.length > 0 && (
            <div className="flex items-center justify-center gap-3 pt-1 border-t border-white/5 w-full">
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                  title={social.label}
                >
                  <SocialIcon platform={social.platform} className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discord Activity Widget */}
      {discord.enabled && (
        <DiscordWidget config={discord} />
      )}

      {/* Audio Player Widget */}
      {audio.enabled && (
        <AudioPlayer
          config={audio}
          autoPlayTriggered={autoPlayTriggered}
        />
      )}

      {/* Subtle branding / custom credit */}
      <div className="text-[11px] text-zinc-500/70 font-mono-code flex items-center gap-1 pt-1 select-none">
        <Sparkles className="w-3 h-3 text-zinc-600" />
        <span>{profile.username}.lol</span>
      </div>
    </div>
  );
};
