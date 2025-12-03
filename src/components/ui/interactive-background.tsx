import React, { useEffect, useRef } from 'react';
import { useTheme } from '../theme-context';

interface Star {
  x: number;
  y: number;
  radius: number;     // Distance from center
  angle: number;      // Orbital angle
  orbitSpeed: number; // Speed of rotation around center
  size: number;
  baseSize: number;
  color: string;
  blinkSpeed: number;
  blinkOffset: number;
  morph: number;
  starShapeAngle: number; // Rotation of the star shape itself
  starShapeSpeed: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  color: string;
  active: boolean;
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let animationFrameId: number;
    let time = 0;

    // Configuration
    const starCount = window.innerWidth < 768 ? 60 : 120;
    const colors = ['#06b6d4', '#9333ea', '#db2777', '#3b82f6'];
    
    const mouseRadius = 200;
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      centerX = canvas.width / 2;
      centerY = canvas.height / 2;
      // Only re-init if stars are empty to avoid resetting positions on mobile scroll
      if (stars.length === 0) initStars();
    };

    const initStars = () => {
      stars = [];
      // Use a max radius that covers the corners
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) * 1.5;

      for (let i = 0; i < starCount; i++) {
        const radius = Math.random() * maxRadius;
        const angle = Math.random() * Math.PI * 2;
        
        // Calculate initial position just to have values
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        stars.push({
          x,
          y,
          radius,
          angle,
          orbitSpeed: 0.0003 + (Math.random() * 0.0002), // Very slow rotation
          size: Math.random() * 1.5 + 1, 
          baseSize: Math.random() * 1.5 + 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          blinkSpeed: Math.random() * 0.03 + 0.01,
          blinkOffset: Math.random() * Math.PI * 2,
          morph: 0,
          starShapeAngle: Math.random() * Math.PI * 2,
          starShapeSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    };

    const spawnMeteor = () => {
        if (Math.random() < 0.997) return; // Rare
        if (meteors.length > 1) return;

        const startX = Math.random() * canvas.width;
        const startY = Math.random() * (canvas.height * 0.4);
        
        meteors.push({
            x: startX,
            y: startY,
            vx: -3 - Math.random() * 3,
            vy: 3 + Math.random() * 3,
            length: 40 + Math.random() * 60,
            opacity: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            active: true
        });
    };

    const drawStarShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number) => {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;

        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const currAngle = angle + (Math.PI / spikes) * i;
            ctx.lineTo(
                x + Math.cos(currAngle) * r,
                y + Math.sin(currAngle) * r
            );
        }
        ctx.closePath();
        ctx.fill();
    };

    const drawParticle = (ctx: CanvasRenderingContext2D, star: Star, opacity: number) => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = star.color;
      
      // Glow
      ctx.shadowBlur = star.size * 2;
      ctx.shadowColor = star.color;

      if (star.morph < 0.05) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
      } else if (star.morph > 0.95) {
          drawStarShape(ctx, star.x, star.y, star.size, star.starShapeAngle);
      } else {
          ctx.globalAlpha = opacity * (1 - star.morph);
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = opacity * star.morph;
          drawStarShape(ctx, star.x, star.y, star.size, star.starShapeAngle);
      }
      
      ctx.restore();
    };

    const drawMeteor = (ctx: CanvasRenderingContext2D, meteor: Meteor) => {
        if (!meteor.active) return;

        ctx.save();
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * 15, meteor.y - meteor.vy * 15);
        gradient.addColorStop(0, meteor.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * 4, meteor.y - meteor.vy * 4);
        ctx.stroke();
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = meteor.color;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Meteors logic
      spawnMeteor();
      meteors.forEach((meteor, index) => {
          if(!meteor.active) return;
          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          meteor.opacity -= 0.015;

          if(meteor.y > canvas.height || meteor.x < 0 || meteor.opacity <= 0) {
              meteor.active = false;
              meteors.splice(index, 1);
          } else {
              drawMeteor(ctx, meteor);
          }
      });

      // Stars logic
      stars.forEach((star) => {
        // 1. Update orbital position
        star.angle += star.orbitSpeed;
        
        // 2. Calculate base position from center
        const baseX = centerX + Math.cos(star.angle) * star.radius;
        const baseY = centerY + Math.sin(star.angle) * star.radius;

        // 3. Mouse interaction
        const dx = mouseRef.current.x - baseX;
        const dy = mouseRef.current.y - baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let targetX = baseX;
        let targetY = baseY;
        let targetSize = star.baseSize;
        let targetMorph = 0;
        let targetAlpha = 0.7 + Math.sin(time * star.blinkSpeed) * 0.2;

        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius;
          const pullStrength = 20 * force;
          
          // Push stars away slightly or pull them? Let's pull them towards mouse like a gravity well
          targetX += (dx / distance) * pullStrength;
          targetY += (dy / distance) * pullStrength;

          targetSize = star.baseSize * (1 + force * 2);
          targetAlpha = 1;
          targetMorph = force;
          star.starShapeAngle += 0.1; // Spin faster when near mouse
        } else {
            star.starShapeAngle += star.starShapeSpeed;
        }

        // Smooth lerp to target
        star.x += (targetX - star.x) * 0.1;
        star.y += (targetY - star.y) * 0.1;
        star.size += (targetSize - star.size) * 0.1;
        star.morph += (targetMorph - star.morph) * 0.1;

        drawParticle(ctx, star, targetAlpha);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);

    resizeCanvas();
    initStars();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 w-full h-full"
    />
  );
}
