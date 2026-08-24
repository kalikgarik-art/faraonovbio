import React, { useState, useEffect } from 'react';
import { ShieldCheck, Gamepad2, Music, Moon, Circle, MinusCircle } from 'lucide-react';
import { DiscordConfig } from '../types/bio';
import { subscribeLanyardUser, LanyardData } from '../services/lanyard';

interface DiscordWidgetProps {
  config: DiscordConfig;
}

export const DiscordWidget: React.FC<DiscordWidgetProps> = ({ config }) => {
  const [lanyardData, setLanyardData] = useState<LanyardData | null>(null);

  useEffect(() => {
    if (!config.enabled) return;

    if (config.mode === 'lanyard' && config.lanyardUserId) {
      const unsubscribe = subscribeLanyardUser(config.lanyardUserId, (data) => {
        setLanyardData(data);
      });
      return () => {
        unsubscribe();
      };
    } else {
      setLanyardData(null);
    }
  }, [config.enabled, config.mode, config.lanyardUserId]);

  if (!config.enabled) return null;

  const isLanyardMode = config.mode === 'lanyard';

  // Compute username
  let username = config.manual.username;
  if (isLanyardMode && lanyardData) {
    username = lanyardData.discord_user.global_name || lanyardData.discord_user.username;
  }

  // Compute avatar URL
  let avatarUrl = config.manual.avatarUrl;
  if (isLanyardMode && lanyardData) {
    if (lanyardData.discord_user.avatar) {
      const isAnimated = lanyardData.discord_user.avatar.startsWith('a_');
      avatarUrl = `https://cdn.discordapp.com/avatars/${lanyardData.discord_user.id}/${lanyardData.discord_user.avatar}.${isAnimated ? 'gif' : 'webp'}?size=160`;
    } else {
      const defaultIndex = (parseInt(lanyardData.discord_user.discriminator || '0', 10) || 0) % 5;
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    }
  }

  // Compute status
  const status = isLanyardMode
    ? (lanyardData ? lanyardData.discord_status : 'offline')
    : config.manual.status;

  // Activity fields
  let activityTitle = '';
  let activityDetails = '';
  let activityTime = '';
  let activityBadge = '';
  let isSpotify = false;

  if (isLanyardMode) {
    if (lanyardData) {
      if (lanyardData.listening_to_spotify && lanyardData.spotify) {
        isSpotify = true;
        activityTitle = `Listening to ${lanyardData.spotify.song}`;
        activityDetails = `by ${lanyardData.spotify.artist}`;
        activityTime = 'on Spotify';
        activityBadge = 'SPOTIFY';
      } else if (lanyardData.activities && lanyardData.activities.length > 0) {
        // Find game or active app first (type 0=playing, 1=streaming, 2=listening, 3=watching, 5=competing)
        const gameAct = lanyardData.activities.find((a) => a.type !== 4);
        const customAct = lanyardData.activities.find((a) => a.type === 4);

        if (gameAct) {
          activityTitle = `Playing ${gameAct.name}`;
          activityDetails = gameAct.details || gameAct.state || '';
          activityBadge = gameAct.name.toUpperCase().substring(0, 12);
          if (gameAct.timestamps?.start) {
            const elapsedMins = Math.max(1, Math.floor((Date.now() - gameAct.timestamps.start) / 60000));
            activityTime = elapsedMins > 60 ? `${Math.floor(elapsedMins / 60)}h ${elapsedMins % 60}m` : `${elapsedMins}m elapsed`;
          }
        } else if (customAct) {
          activityTitle = customAct.state || customAct.name || 'Custom Status';
          activityDetails = customAct.details || '';
          activityBadge = 'STATUS';
        } else {
          activityTitle = status === 'online' ? 'Online on Discord' : status === 'idle' ? 'Away / Idle' : status === 'dnd' ? 'Do Not Disturb' : 'Offline';
          activityDetails = '';
          activityBadge = '';
        }
      } else {
        // Online with no activities
        if (status === 'online') {
          activityTitle = 'Online on Discord';
          activityDetails = 'No current activity';
        } else if (status === 'idle') {
          activityTitle = 'Away / Idle';
        } else if (status === 'dnd') {
          activityTitle = 'Do Not Disturb';
        } else {
          activityTitle = 'Offline';
          activityDetails = 'Currently away';
        }
        activityBadge = '';
      }
    } else {
      activityTitle = 'Connecting to Discord...';
      activityDetails = config.lanyardUserId ? `ID: ${config.lanyardUserId}` : '';
      activityBadge = 'SYNC';
    }
  } else {
    activityTitle = config.manual.activityTitle || 'Online';
    activityDetails = config.manual.activityDetails || '';
    activityTime = config.manual.activityTime || '';
    activityBadge = config.manual.activityBadge || '';
  }

  const renderStatusIcon = () => {
    switch (status) {
      case 'online':
        return <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900 shadow-sm" />;
      case 'idle':
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-2 ring-zinc-900 flex items-center justify-center shadow-sm">
            <Moon className="w-2.5 h-2.5 text-zinc-900 fill-zinc-900" />
          </div>
        );
      case 'dnd':
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 ring-2 ring-zinc-900 flex items-center justify-center shadow-sm">
            <MinusCircle className="w-2.5 h-2.5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-3.5 h-3.5 rounded-full bg-zinc-500 ring-2 ring-zinc-900 flex items-center justify-center shadow-sm">
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

          {(activityDetails || activityTime) ? (
            <div className="text-[11px] text-zinc-400 truncate">
              {activityDetails} {activityTime && <span className="opacity-75 font-mono text-[10px]">({activityTime})</span>}
            </div>
          ) : null}
        </div>
      </div>

      {/* Activity badge pill */}
      {activityBadge ? (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold tracking-wider uppercase text-zinc-300">
          {isSpotify ? (
            <Music className="w-3 h-3 text-emerald-400" />
          ) : (
            <Gamepad2 className="w-3 h-3 text-zinc-400" />
          )}
          <span>{activityBadge}</span>
        </div>
      ) : null}
    </div>
  );
};

