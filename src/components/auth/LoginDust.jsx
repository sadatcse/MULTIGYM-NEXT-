"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Gold dust drifting up through the light over the team photo — three.js
// points with a small custom shader. three.js is only downloaded once the
// panel is actually on screen (never on phones, where the panel is hidden),
// pauses off-screen / in background tabs, and is skipped entirely for
// people who prefer reduced motion.

const COUNT = 150;
const GOLD_LIGHT = 0xf0d494;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uAspect;
  uniform vec2 uPointer;
  attribute float aSize;
  attribute float aSeed;
  attribute float aSpeed;
  varying float vAlpha;
  const float SPAN = 3.2;

  void main() {
    vec3 p = position;
    p.x *= uAspect;
    // Rise slowly and wrap around.
    p.y = mod(p.y + uTime * aSpeed + SPAN * 0.5, SPAN) - SPAN * 0.5;
    // Gentle sway, and parallax with the pointer (nearer moves more).
    p.x += sin(uTime * 0.22 + aSeed * 6.2831) * 0.07;
    p.xy += uPointer * (p.z + 1.2) * 0.05;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (3.0 / -mv.z);

    float twinkle = 0.45 + 0.55 * sin(uTime * (0.6 + aSeed) + aSeed * 12.0);
    float edgeFade = smoothstep(SPAN * 0.5, SPAN * 0.3, abs(p.y));
    vAlpha = twinkle * edgeFade;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * vAlpha * uOpacity;
    gl_FragColor = vec4(uColor * a, a); // premultiplied
  }
`;

export default function LoginDust({ className = "" }) {
  const mountRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || reduce) return undefined;

    let disposed = false;
    let started = false;
    let onScreen = false;
    let sync = () => {};
    let cleanup = () => {};

    const start = async () => {
      let THREE;
      try {
        THREE = await import("three");
      } catch {
        return;
      }
      if (disposed) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL — the photo alone is fine
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      const canvas = renderer.domElement;
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.6s ease";
      mount.appendChild(canvas);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20);
      camera.position.z = 3;

      const positions = new Float32Array(COUNT * 3);
      const sizes = new Float32Array(COUNT);
      const seeds = new Float32Array(COUNT);
      const speeds = new Float32Array(COUNT);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() * 2 - 1) * 1.45;
        positions[i * 3 + 1] = (Math.random() * 2 - 1) * 1.6;
        positions[i * 3 + 2] = Math.random() * 2.2 - 1;
        // A few large, soft "bokeh" motes among fine dust.
        sizes[i] = Math.random() < 0.06 ? 9 + Math.random() * 6 : 1.4 + Math.random() * 2.6;
        seeds[i] = Math.random();
        speeds[i] = 0.025 + Math.random() * 0.06;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
      geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

      const uniforms = {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uAspect: { value: 1 },
        uPointer: { value: new THREE.Vector2() },
        uColor: { value: new THREE.Color(GOLD_LIGHT) },
        uOpacity: { value: 0.7 },
      };
      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        premultipliedAlpha: true,
        blending: THREE.AdditiveBlending,
      });
      scene.add(new THREE.Points(geometry, material));

      const resize = () => {
        const { width, height } = mount.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        uniforms.uAspect.value = camera.aspect;
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      const target = { x: 0, y: 0 };
      const onPointer = (e) => {
        target.x = (e.clientX / window.innerWidth) * 2 - 1;
        target.y = -((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      const t0 = performance.now();
      let last = t0;
      let shown = false;
      const loop = () => {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        uniforms.uTime.value = (now - t0) / 1000;
        const p = uniforms.uPointer.value;
        p.x += (target.x - p.x) * Math.min(1, dt * 2);
        p.y += (target.y - p.y) * Math.min(1, dt * 2);
        renderer.render(scene, camera);
        if (!shown) {
          shown = true;
          canvas.style.opacity = "1";
        }
      };

      sync = () => renderer.setAnimationLoop(onScreen && !document.hidden ? loop : null);
      document.addEventListener("visibilitychange", sync);
      sync();

      cleanup = () => {
        renderer.setAnimationLoop(null);
        ro.disconnect();
        document.removeEventListener("visibilitychange", sync);
        window.removeEventListener("pointermove", onPointer);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        canvas.remove();
      };
    };

    // Start (and download three.js) only once the panel is on screen.
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !started) {
        started = true;
        start();
      }
      sync();
    });
    io.observe(mount);

    return () => {
      disposed = true;
      io.disconnect();
      cleanup();
    };
  }, [reduce]);

  return <div ref={mountRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
