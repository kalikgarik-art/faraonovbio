import React, { useEffect, useRef } from 'react';
import { ParticleType } from '../types/bio';

interface ParticleCanvasProps {
  type: ParticleType;
  count?: number;
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
  color?: string;
  rotation?: number;
  rotationSpeed?: number;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  type,
  count = 45,
  speed = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (type === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const numParticles = Math.min(count, 120);

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: type === 'snow' ? Math.random() * 3 + 1.2 : Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.8 * speed,
        speedY: (type === 'embers' ? -(Math.random() * 1.5 + 0.5) : Math.random() * 1.2 + 0.6) * speed,
        opacity: Math.random() * 0.6 + 0.25,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.01,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.02
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (type === 'snow') {
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.6 + p.speedX;
          p.y += p.speedY;

          // Draw snow flake with soft glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
        } else if (type === 'rain') {
          p.x += p.speedX * 0.4;
          p.y += p.speedY * 5;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 2, p.y + p.size * 6);
          ctx.strokeStyle = `rgba(180, 210, 255, ${p.opacity * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        } else if (type === 'embers') {
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.8;
          p.y += p.speedY;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 120, 50, ${p.opacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(255, 90, 20, 0.9)';
          ctx.fill();
        } else if (type === 'stars' || type === 'sparkles') {
          p.wobble += p.wobbleSpeed;
          const currentOpacity = (Math.sin(p.wobble) + 1) * 0.5 * p.opacity;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
          ctx.fill();
        } else if (type === 'sakura') {
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 1.2 + p.speedX;
          p.y += p.speedY;
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation || 0);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 2, p.size, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 183, 197, ${p.opacity * 0.75})`;
          ctx.shadowBlur = 3;
          ctx.shadowColor = 'rgba(255, 183, 197, 0.5)';
          ctx.fill();
          ctx.restore();
        }

        // Reset particles out of bounds
        if (p.y > height + 20) {
          p.y = -10;
          p.x = Math.random() * width;
        } else if (p.y < -20) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -10;
        else if (p.x < -20) p.x = width + 10;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [type, count, speed]);

  if (type === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      style={{ opacity: 0.85 }}
    />
  );
};
