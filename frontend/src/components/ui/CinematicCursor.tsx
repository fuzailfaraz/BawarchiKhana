'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const KnifeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 21s-1.36-2.36-2.5-4a11 11 0 0 0-2.3-3.61l-5.69-5.69-1.42 1.42a1 1 0 0 0 0 1.42l5.69 5.69A11 11 0 0 0 18.4 18.5C20.14 19.64 21 21 21 21Z" />
    <path d="M12.69 11.31 3 1.5" />
    <path d="m3 3 8 8" />
  </svg>
);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'flame' | 'flare' | 'ember';
}

export function CinematicCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: width / 2, y: height / 2 };
    const lastMouse = { x: width / 2, y: height / 2 };

    // GSAP Custom Cursor Setup
    const cursor = cursorRef.current;
    const dot = dotRef.current;

    // Smooth inertia pos
    const pos = { x: width / 2, y: height / 2 };

    // Deep Fire Palette (No pure whites, lower intensity)
    const colors = ['#E63946', '#FF7A00', '#FF9500', '#FFB300'];
    let particles: Particle[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Spotlight hover tracking for cards
      const cards = document.querySelectorAll('.spotlight-card');
      cards.forEach((card) => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });

      // Move the tiny dot/icon instantly
      gsap.to(dot, {
        x: mouse.x,
        y: mouse.y,
        duration: 0.1,
        ease: 'power3.out'
      });

      // Move the main cursor outer ring with inertia
      gsap.to(pos, {
        x: mouse.x,
        y: mouse.y,
        duration: 0.8, // Smooth delay
        ease: 'power3.out',
        onUpdate: () => {
          gsap.set(cursor, { x: pos.x, y: pos.y });
        }
      });

      // Speed calculation for dynamic fire trail
      const dx = mouse.x - lastMouse.x;
      const dy = mouse.y - lastMouse.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      // Dynamic Particle Generation
      // Reduced count for a much cleaner, elegant look
      const particlesToCreate = Math.min(Math.floor(speed / 4), 6) + 1;

      for (let i = 0; i < particlesToCreate; i++) {
        // Spray angle opposite to movement
        const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.0;
        const velocity = (Math.random() * speed * 0.1) + 0.5;

        const typeRand = Math.random();
        let type: 'flame' | 'flare' | 'ember' = 'flame';
        if (typeRand > 0.95) type = 'flare'; // Only 5% chance of flare so it feels special
        else if (typeRand > 0.7) type = 'ember'; // 25% chance of flying spark

        particles.push({
          x: mouse.x + (Math.random() - 0.5) * (type === 'flame' ? 12 : 5),
          y: mouse.y + (Math.random() - 0.5) * (type === 'flame' ? 12 : 5),
          vx: -Math.cos(angle) * velocity + (Math.random() - 0.5) * 1.5,
          vy: -Math.sin(angle) * velocity + (Math.random() - 0.5) * 1.5 - (speed * 0.04),
          life: 0,
          maxLife: Math.random() * 25 + (type === 'flare' ? 10 : 20), // Die faster
          size: Math.random() * (speed > 15 ? 12 : 6) + (type === 'flare' ? 10 : 3),
          color: colors[Math.floor(Math.random() * colors.length)],
          type
        });
      }
    };

    // Idle Ember Generation
    const idleInterval = setInterval(() => {
      if (Math.random() > 0.4) { // 60% chance to spawn an ember while idle
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 20,
          y: mouse.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 1,
          vy: -Math.random() * 1.5 - 0.5,
          life: 0,
          maxLife: Math.random() * 40 + 30,
          size: Math.random() * 4 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: 'ember'
        });
      }
    }, 120);

    window.addEventListener('mousemove', handleMouseMove);

    // Hover Interaction States
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const isClickable =
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.closest('a') ||
        target.closest('button') ||
        target.classList.contains('group');

      if (isClickable) {
        setIsHovering(true);
        // Magnetic expansion effect for outer ring
        gsap.to(cursor, {
          scale: 1.5, // Less aggressive scale
          backgroundColor: 'rgba(255, 77, 109, 0.05)', // Softer tint
          borderColor: 'rgba(255, 179, 0, 0.5)',
          boxShadow: '0 0 20px rgba(255,122,0,0.3)',
          duration: 0.4,
          ease: 'back.out(1.5)'
        });
        // Spin the knife on hover
        gsap.to(dot, {
          rotation: 180,
          scale: 1.1,
          duration: 0.5,
          ease: 'power3.out'
        });

        // Spawn a gentle, subtle flare burst
        for (let i = 0; i < 10; i++) {
          const typeRand = Math.random();
          particles.push({
            x: mouse.x,
            y: mouse.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 0,
            maxLife: Math.random() * 30 + 15,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: typeRand > 0.8 ? 'flare' : 'flame'
          });
        }
      } else {
        setIsHovering(false);
        // Return to normal
        gsap.to(cursor, {
          scale: 1,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          boxShadow: '0 0 10px rgba(255,122,0,0.1)',
          duration: 0.4,
          ease: 'power3.out'
        });
        gsap.to(dot, {
          rotation: 0,
          scale: 1,
          duration: 0.5,
          ease: 'power3.out'
        });
      }
    };
    window.addEventListener('mouseover', handleMouseOver);

    // Optimized WebGL-style Canvas Render Loop
    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Intense bloom blending
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Fire physics turbulence
        p.vx += (Math.random() - 0.5) * 0.3;
        p.vy -= 0.05;

        const progress = p.life / p.maxLife;
        // **MASSIVELY REDUCED OPACITY** for elegance
        const opacity = Math.max(0, 1 - Math.pow(progress, 1.2)) * 0.45;
        const currentSize = Math.max(0, p.size * (1 - progress));

        if (p.life >= p.maxLife || opacity <= 0 || currentSize <= 0) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `${r}, ${g}, ${b}`;
        };
        const rgb = hexToRgb(p.color);

        ctx.beginPath();

        if (p.type === 'flare') {
          // Draw a cinematic stretched flare (softer)
          const angle = Math.atan2(p.vy, p.vx);
          const length = currentSize * 3; // Shorter streak
          const width = currentSize / 3;

          ctx.ellipse(p.x, p.y, length, width, angle, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, length);
          gradient.addColorStop(0, `rgba(255, 180, 80, ${opacity * 0.9})`); // Soft amber core
          gradient.addColorStop(0.2, `rgba(${rgb}, ${opacity * 0.6})`);
          gradient.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = gradient;
        } else if (p.type === 'ember') {
          // Tiny solid hot spark
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${opacity * 0.9})`;
        } else {
          // Soft atmospheric flame
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize);
          gradient.addColorStop(0, `rgba(${rgb}, ${opacity * 0.7})`);
          gradient.addColorStop(0.5, `rgba(${rgb}, ${opacity * 0.3})`);
          gradient.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = gradient;
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
        }

        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      clearInterval(idleInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        * {
          cursor: none !important;
        }
      `}} />

      {/* Cinematic Fire Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{ filter: 'blur(2px)' }}
      />

      {/* Outer Ring / Inertia Cursor */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-12 h-12 -ml-6 -mt-6 rounded-full border border-white/20 pointer-events-none z-[9999] flex items-center justify-center transition-colors shadow-[0_0_20px_rgba(255,122,0,0.2)]"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Center Knife Cursor */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-6 h-6 -ml-3 -mt-3 pointer-events-none z-[10000] flex items-center justify-center text-amber-400 drop-shadow-[0_0_12px_rgba(255,179,0,1)]"
      >
        <KnifeIcon className="w-5 h-5 text-amber-500 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] transform -rotate-45" />
      </div>
    </>
  );
}
