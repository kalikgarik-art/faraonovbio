import React, { useState, useEffect } from 'react';
import { Settings, Globe, Sparkles } from 'lucide-react';
import { BioConfig } from './types/bio';
import { DEFAULT_BIO_CONFIG } from './config/defaultConfig';
import { ParticleCanvas } from './components/ParticleCanvas';
import { ClickToEnter } from './components/ClickToEnter';
import { ProfileCard } from './components/ProfileCard';
import { ConfigModal } from './components/ConfigModal';
import { DomainGuideModal } from './components/DomainGuideModal';

export default function App() {
  const [config, setConfig] = useState<BioConfig>(() => {
    try {
      const saved = localStorage.getItem('faraonov_bio_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_BIO_CONFIG;
  });

  const [hasEntered, setHasEntered] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isDomainGuideOpen, setIsDomainGuideOpen] = useState(false);

  // Sync to local storage for persistence across reloads
  useEffect(() => {
    try {
      localStorage.setItem('faraonov_bio_config', JSON.stringify(config));
    } catch {
      // ignore
    }
  }, [config]);

  // Update page title dynamically
  useEffect(() => {
    document.title = `${config.profile.displayName || config.profile.username} • bio`;
  }, [config.profile.displayName, config.profile.username]);

  const handleEnter = () => {
    setHasEntered(true);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white flex flex-col items-center justify-center select-none selection:bg-white/20 selection:text-white">
      {/* Background Image / Video / Atmosphere */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {config.theme.bgType === 'video' ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            src={config.theme.bgUrl}
            className="w-full h-full object-cover"
            style={{
              filter: `blur(${config.theme.bgBlur}px) brightness(${config.theme.bgBrightness}%)`,
              transform: 'scale(1.05)'
            }}
          />
        ) : (
          <img
            src={config.theme.bgUrl}
            alt="Background"
            className="w-full h-full object-cover object-center transition-all duration-700"
            style={{
              filter: `blur(${config.theme.bgBlur}px) brightness(${config.theme.bgBrightness}%)`,
              transform: 'scale(1.05)'
            }}
          />
        )}

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/80 pointer-events-none" />
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
      </div>

      {/* Particle Canvas (Snow / Embers / Rain / Stars) */}
      <ParticleCanvas
        type={config.theme.particles}
        count={config.theme.particlesCount}
        speed={config.theme.particlesSpeed}
      />

      {/* Click To Enter Screen */}
      <ClickToEnter
        isVisible={!hasEntered}
        onEnter={handleEnter}
        title={config.theme.enterScreenText || `[ ${config.profile.username}.lol ]`}
        subtitle={config.theme.enterScreenSubtext || 'click anywhere to enter'}
      />

      {/* Main Bio Container */}
      <div className="relative z-20 w-full min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <ProfileCard
          config={config}
          autoPlayTriggered={hasEntered}
        />
      </div>

      {/* Floating Action Controls */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsDomainGuideOpen(true)}
          title="Инструкция: как привязать faraonov.lol"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all duration-200 hover:scale-105 shadow-lg active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Подключить домен</span>
        </button>

        <button
          onClick={() => setIsConfigOpen(true)}
          title="Настройки био и экспорт config.ts"
          className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-all duration-200 hover:scale-105 shadow-lg active:scale-95 flex items-center gap-1.5"
        >
          <Settings className="w-4 h-4 text-zinc-300" />
          <span className="hidden sm:inline">Настроить био</span>
        </button>
      </div>

      {/* Modals */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onOpenDomainGuide={() => {
          setIsConfigOpen(false);
          setIsDomainGuideOpen(true);
        }}
      />

      <DomainGuideModal
        isOpen={isDomainGuideOpen}
        onClose={() => setIsDomainGuideOpen(false)}
        domainName={`${config.profile.username}.lol`}
      />
    </main>
  );
}
