import React, { useState, useEffect } from 'react';
import { ShieldCheck, Gamepad2, Music, Moon, Circle, MinusCircle } from 'lucide-react';
import { DiscordConfig } from '../types/bio';
import { fetchLanyardUser, LanyardData } from '../services/lanyard';

interface DiscordWidgetProps {
  config: DiscordConfig;
}

export const DiscordWidget: React.FC<DiscordWidgetProps> = ({ config }) => {
  const [lanyardData, setLanyardData] = useState<LanyardData | null>(null);

  useEffect(() => {
    if (!config.enabled) return;

    if (config.mode === 'lanyard' && config.lanyardUserId) {
      const load = async () => {
        const data = await fetchLanyardUser(config.lanyardUserId!);
        if (data) setLanyardData(data);
      };
      load();
      const interval = setInterval(load, 15000);
      return () => clearInterval(interval);
    }
  }, [config.enabled, config.mode, config.lanyardUserId]);

  if (!config.enabled) return null;

  // Derive data from Lanyard or manual config
  const isLanyardActive = config.mode === 'lanyard' && lanyardData;

  const username = isLanyardActive
    ? lanyardData.discord_user.global_name || lanyardData.discord_user.username
    : config.manual.username;

  const avatarUrl = isLanyardActive
    ? lanyardData.discord_user.avatar
      ? `https://cdn.discordapp.com/avatars/${lanyardData.discord_user.id}/${lanyardData.discord_user.avatar}.png?size=128`
      : config.manual.avatarUrl
    : config.manual.avatarUrl;

  const status = isLanyardActive ? lanyardData.discord_status : config.manual.status;

  // Activity
  let activityTitle = config.manual.activityTitle;
  let activityDetails = config.manual.activityDetails;
  let activityTime = config.manual.activityTime;
  let activityBadge = config.manual.activityBadge;
  const isSpotify = isLanyardActive && lanyardData.listening_to_spotify && lanyardData.spotify;

  if (isSpotify && lanyardData.spotify) {
    activityTitle = `Listening to ${lanyardData.spotify.song}`;
    activityDetails = `by ${lanyardData.spotify.artist}`;
    activityTime = 'on Spotify';
    activityBadge = 'SPOTIFY';
  } else if (isLanyardActive && lanyardData.activities && lanyardData.activities.length > 0) {
    const act = lanyardData.activities.find((a) => a.type === 0 || a.type === 4) || lanyardData.activities[0];
    if (act) {
      activityTitle = act.name ? `Playing ${act.name}` : 'Online';
      activityDetails = act.details || act.state || '';
      activityTime = act.timestamps?.start ? 'in progress' : '';
      activityBadge = act.name?.toUpperCase() || 'DISCORD';
    }
  }

  const renderStatusIcon = () => {
    switch (status) {
      case 'online':
        return <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />;
      case 'idle':
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-zinc-900 flex items-center justify-center">
            <Moon className="w-2.5 h-2.5 text-zinc-900 fill-zinc-900" />
          </div>
        );
      case 'dnd':
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-zinc-900 flex items-center justify-center">
            <MinusCircle className="w-2.5 h-2.5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-zinc-500 ring-2 ring-zinc-900 flex items-center justify-center">
            <Circle className="w-2 h-2 text-zinc-900 fill-zinc-900" />
          </div>
        );
    }
  };

  return (
    <div
      id="discord-activity-widget"
      className="w-full glass-panel-subtle rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all duration-300 hover:border-white/15"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar with status indicator */}
        <div className="relative w-11 h-11 flex-shrink-0">
          <img
            src={avatarUrl}
            alt={username}
            className="w-full h-full rounded-full object-cover border border-white/20 shadow-sm"
          />
          <div className="absolute -bottom-0.5 -right-0.5">
            {renderStatusIcon()}
          </div>
        </div>

        {/* Discord user info & rich presence */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white/95 truncate">
              {username}
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20 flex-shrink-0" />
          </div>

          <div className="text-xs text-zinc-300 font-medium truncate mt-0.5">
            {activityTitle}
          </div>

          {(activityDetails || activityTime) && (
            <div className="text-[11px] text-zinc-400 truncate">
              {activityDetails} {activityTime && <span className="opacity-75">{activityTime}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Activity badge pill */}
      {activityBadge && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
          {isSpotify ? (
            <Music className="w-3 h-3 text-emerald-400" />
          ) : (
            <Gamepad2 className="w-3 h-3 text-zinc-400" />
          )}
          <span>{activityBadge}</span>
        </div>
      )}
    </div>
  );
};
