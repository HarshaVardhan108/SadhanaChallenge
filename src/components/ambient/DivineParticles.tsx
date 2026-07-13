"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Subtle Three.js divine light particles — soft golden/blue dust over Vrindavan sky.
 * Respects prefers-reduced-motion and stays very light on GPU.
 */
export function DivineParticles({ count = 80 }: { count?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    const gold = new THREE.Color("#FFD54F");
    const cream = new THREE.Color("#FFF8E7");
    const sky = new THREE.Color("#A8E6FF");
    const blue = new THREE.Color("#1A4FA3");

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      speeds[i] = 0.002 + Math.random() * 0.006;

      const palette = [gold, cream, sky, blue][i % 4];
      colors[i * 3] = palette.r;
      colors[i * 3 + 1] = palette.g;
      colors[i * 3 + 2] = palette.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += 1;
      const pos = geometry.attributes.position as THREE.BufferAttribute;
      const arr = pos.array as Float32Array;

      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += speeds[i];
        arr[i * 3] += Math.sin(frame * 0.01 + i) * 0.002;
        if (arr[i * 3 + 1] > 7) {
          arr[i * 3 + 1] = -7;
          arr[i * 3] = (Math.random() - 0.5) * 24;
        }
      }
      pos.needsUpdate = true;
      points.rotation.y = frame * 0.0003;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [count]);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-[1] opacity-70"
      aria-hidden
    />
  );
}
