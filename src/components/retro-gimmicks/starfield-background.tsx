import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider/theme-context";
import { resolvesToDark } from "@/lib/theme/apply-theme";

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
}
interface ShootingStar {
  x: number;
  y: number;
  len: number;
  speed: number;
  life: number;
}

const STAR_COLOR = "#e0217a";
const NIGHT_SKY_COLOR = "#0d0b24";

export default function StarfieldBackground() {
  const theme = useTheme();
  const active = theme.retro && theme.gimmicks.starfield;
  const isDark = resolvesToDark(theme.mode);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Dark mode gets a proper night sky; light mode keeps whatever
    // background color is customized and just scatters pink stars on it.
    const backgroundFill = isDark ? NIGHT_SKY_COLOR : theme.colors.bg;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let animId = 0;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 1.3 + 0.4,
        phase: Math.random() * Math.PI * 2,
      }));
      shootingStars = [];
    }

    function draw(time: number) {
      ctx!.fillStyle = backgroundFill;
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      stars.forEach((s) => {
        const twinkle = prefersReducedMotion ? 1 : 0.5 + 0.5 * Math.sin(time / 600 + s.phase);
        ctx!.globalAlpha = twinkle;
        ctx!.fillStyle = STAR_COLOR;
        ctx!.fillRect(s.x, s.y, s.r * 2, s.r * 2);
      });
      ctx!.globalAlpha = 1;

      if (!prefersReducedMotion) {
        shootingStars.forEach((s) => {
          ctx!.strokeStyle = `rgba(224,33,122,${s.life})`;
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          ctx!.moveTo(s.x, s.y);
          ctx!.lineTo(s.x - s.len, s.y - s.len * 0.4);
          ctx!.stroke();
          s.x += s.speed;
          s.y += s.speed * 0.4;
          s.life -= 0.02;
        });
        shootingStars = shootingStars.filter((s) => s.life > 0);
        if (Math.random() < 0.01) {
          shootingStars.push({
            x: Math.random() * canvas!.width * 0.6,
            y: Math.random() * canvas!.height * 0.3,
            len: 60 + Math.random() * 40,
            speed: 6 + Math.random() * 4,
            life: 1,
          });
        }
      }
    }

    function loop(time: number) {
      draw(time);
      animId = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);
    if (prefersReducedMotion) {
      draw(0);
    } else {
      animId = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [active, isDark, theme.colors.bg]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
