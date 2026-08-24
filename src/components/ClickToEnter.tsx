import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2 } from 'lucide-react';

interface ClickToEnterProps {
  isVisible: boolean;
  onEnter: () => void;
  title?: string;
  subtitle?: string;
}

export const ClickToEnter: React.FC<ClickToEnterProps> = ({
  isVisible,
  onEnter,
  title = '[ faraonov.lol ]',
  subtitle = 'click anywhere to enter'
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="click-to-enter-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onClick={onEnter}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl cursor-pointer select-none"
        >
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1, 0.98] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <h1 className="text-2xl sm:text-3xl font-bold tracking-widest text-white/90 uppercase font-mono-code drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                {title}
              </h1>
            </motion.div>

            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex items-center gap-2 text-xs sm:text-sm tracking-widest text-zinc-400 uppercase font-mono-code"
            >
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <span>{subtitle}</span>
            </motion.div>
          </div>

          <div className="absolute bottom-8 text-[11px] text-zinc-500 font-mono-code">
            press or tap anywhere to start audio & load profile
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
