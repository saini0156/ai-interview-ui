/**
 * InteractiveLayer.jsx
 * Global interactive effects:
 *  - Custom dual-cursor (dot + ring)
 *  - Scroll-reveal IntersectionObserver
 *  - Ripple-on-click for buttons
 *  - Magnetic button hover effect
 */
import { useEffect, useRef, useState } from "react";

/* ─── Custom Cursor ────────────────────────────────────────────────── */
export function CustomCursor() {
  const dot  = useRef(null);
  const ring = useRef(null);
  const pos  = useRef({ x: 0, y: 0 });
  const ring_pos = useRef({ x: 0, y: 0 });
  const raf  = useRef(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice) return;

    const lerp = (a, b, n) => a + (b - a) * n;

    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dot.current) {
        dot.current.style.left  = e.clientX + "px";
        dot.current.style.top   = e.clientY + "px";
      }
    };

    const animate = () => {
      ring_pos.current.x = lerp(ring_pos.current.x, pos.current.x, 0.14);
      ring_pos.current.y = lerp(ring_pos.current.y, pos.current.y, 0.14);
      if (ring.current) {
        ring.current.style.left = ring_pos.current.x + "px";
        ring.current.style.top  = ring_pos.current.y + "px";
      }
      raf.current = requestAnimationFrame(animate);
    };

    const onEnterBtn = () => {
      if (dot.current)  dot.current.style.transform  = "translate(-50%,-50%) scale(2.2)";
      if (ring.current) { ring.current.style.width = "50px"; ring.current.style.height = "50px"; ring.current.style.borderColor = "var(--primary)"; }
    };
    const onLeaveBtn = () => {
      if (dot.current)  dot.current.style.transform  = "translate(-50%,-50%) scale(1)";
      if (ring.current) { ring.current.style.width = "32px"; ring.current.style.height = "32px"; ring.current.style.borderColor = "rgba(59,130,246,0.6)"; }
    };

    const attachToButtons = () => {
      document.querySelectorAll("button, a, [data-cursor]").forEach(el => {
        el.addEventListener("mouseenter", onEnterBtn);
        el.addEventListener("mouseleave", onLeaveBtn);
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf.current = requestAnimationFrame(animate);

    // Reattach on DOM mutations
    const obs = new MutationObserver(attachToButtons);
    obs.observe(document.body, { childList: true, subtree: true });
    attachToButtons();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
      obs.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={dot}  className="cursor-dot"  />
      <div ref={ring} className="cursor-ring" />
    </>
  );
}

/* ─── Scroll Reveal ────────────────────────────────────────────────── */
export function ScrollReveal({ children, className = "", delay = 0, style = {} }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </div>
  );
}

/* ─── Ripple Button ────────────────────────────────────────────────── */
export function RippleButton({ children, className = "", style = {}, onClick, ...props }) {
  const ref = useRef(null);

  const handleClick = (e) => {
    const btn  = ref.current;
    if (!btn) { onClick?.(e); return; }
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    ripple.style.cssText = `
      width: ${size}px; height: ${size}px;
      left: ${x}px; top: ${y}px;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      className={`ripple-container ${className}`}
      style={style}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─── Magnetic Button ──────────────────────────────────────────────── */
export function MagneticButton({ children, className = "", style = {}, strength = 0.35, ...props }) {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const btn  = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) * strength;
    const dy   = (e.clientY - cy) * strength;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const onMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  };

  return (
    <button
      ref={ref}
      className={className}
      style={{ ...style, transition: "transform 0.4s cubic-bezier(.16,1,.3,1)" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
}

/* ─── Number Counter animation ─────────────────────────────────────── */
export function AnimatedNumber({ to, duration = 1800, suffix = "", className = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setVal(Math.round(ease * to));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);

  return <span ref={ref} className={className}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── Tilt Card ────────────────────────────────────────────────────── */
export function TiltCard({ children, className = "", style = {}, intensity = 10 }) {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.03)`;
  };

  const onMouseLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(800px) rotateY(0) rotateX(0) scale(1)";
  };

  return (
    <div
      ref={ref}
      className={`tilt-card glass-card ${className}`}
      style={{ transition: "transform 0.2s ease, box-shadow 0.3s ease", ...style }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

/* ─── Typewriter text ──────────────────────────────────────────────── */
export function Typewriter({ texts, speed = 60, pause = 2000 }) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx]         = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    const delay = deleting ? speed / 2 : speed;

    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setDisplay(current.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      } else if (!deleting && charIdx === current.length) {
        setTimeout(() => setDeleting(true), pause);
      } else if (deleting && charIdx > 0) {
        setDisplay(current.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
      } else if (deleting && charIdx === 0) {
        setDeleting(false);
        setIdx(i => (i + 1) % texts.length);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return <span className="typing-cursor">{display}</span>;
}

/* ─── Particle canvas background (Polygon Mesh) ───────────────────── */
export function ParticleBackground({ count = 80 }) {
  const canvas = useRef(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let w, h, particles = [], raf;

    const colors = [
      "rgba(99,102,241, ",  // Indigo
      "rgba(236,72,153, ",  // Pink
      "rgba(59,130,246, ",  // Blue
      "rgba(167,139,250, "  // Light Purple
    ];

    const resize = () => {
      w = c.width  = c.offsetWidth;
      h = c.height = c.offsetHeight;
    };
    resize();

    const rand = (min, max) => Math.random() * (max - min) + min;

    class Particle {
      constructor() { this.reset(true); }
      reset(initial = false) {
        // Bias heavily to the right side of the screen
        const isRightBias = Math.random() > 0.3;
        this.x  = isRightBias ? rand(w * 0.4, w + 100) : rand(-50, w);
        this.y  = initial ? rand(0, h) : rand(h + 10, h + 100);
        this.vx = rand(-0.3, 0.3);
        this.vy = rand(-0.6, -0.1);
        this.r  = rand(1.5, 3.5);
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.y < -50 || this.x < -50 || this.x > w + 50) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor + "0.8)";
        ctx.fill();
        
        // Add a subtle glow to nodes
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.baseColor + "0.6)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < count; i++) particles.push(new Particle());

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      
      // Update nodes
      particles.forEach(p => p.update());
      
      // Draw Mesh Triangles
      for (let i = 0; i < particles.length; i++) {
        let p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          let p2 = particles[j];
          let d1 = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (d1 > 140) continue;
          
          for (let k = j + 1; k < particles.length; k++) {
            let p3 = particles[k];
            let d2 = Math.hypot(p2.x - p3.x, p2.y - p3.y);
            let d3 = Math.hypot(p1.x - p3.x, p1.y - p3.y);
            
            if (d2 < 140 && d3 < 140) {
              const alpha = Math.max(0, 0.15 - (d1 + d2 + d3) / 2000);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.lineTo(p3.x, p3.y);
              ctx.closePath();
              ctx.fillStyle = p1.baseColor + alpha + ")";
              ctx.fill();
            }
          }
        }
      }

      // Draw Nodes
      particles.forEach(p => p.draw());

      raf = requestAnimationFrame(loop);
    };

    loop();
    const ro = new ResizeObserver(resize);
    ro.observe(c);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [count]);

  return (
    <canvas
      ref={canvas}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none", mixBlendMode: "screen" }}
    />
  );
}
