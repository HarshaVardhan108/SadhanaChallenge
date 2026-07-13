"use client";

import { useEffect, useRef, useState } from "react";
import { Music2, VolumeX } from "lucide-react";

/**
 * Optional soft ambient "flute-like" pad using Web Audio API
 * (no external audio file required). User must enable intentionally.
 */
export function FluteAmbient() {
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);

  useEffect(() => {
    return () => {
      nodesRef.current.forEach(({ osc, gain }) => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch {
          /* ignore */
        }
      });
      nodesRef.current = [];
      ctxRef.current?.close();
    };
  }, []);

  const start = async () => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.03;
    master.connect(ctx.destination);

    // Soft pentatonic pad (flute-ish feel)
    const freqs = [392, 440, 523.25, 587.33]; // G A C D
    nodesRef.current = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.value = 0.15 / (i + 1);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15 + i * 0.05;
      lfoGain.gain.value = 4;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      lfo.start();
      return { osc, gain };
    });
    setOn(true);
  };

  const stop = () => {
    nodesRef.current.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* ignore */
      }
    });
    nodesRef.current = [];
    ctxRef.current?.close();
    ctxRef.current = null;
    setOn(false);
  };

  return (
    <button
      type="button"
      onClick={() => (on ? stop() : start())}
      className="fixed bottom-24 right-3 z-40 flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-white px-3 py-2 text-xs font-medium text-krishna shadow-lg transition hover:bg-gold/30 sm:bottom-6 sm:right-4 lg:bottom-6"
      aria-pressed={on}
      title={on ? "Mute flute ambience" : "Play soft flute ambience"}
    >
      {on ? <VolumeX className="h-3.5 w-3.5" /> : <Music2 className="h-3.5 w-3.5" />}
      {on ? "Mute flute" : "Flute ambience"}
    </button>
  );
}
