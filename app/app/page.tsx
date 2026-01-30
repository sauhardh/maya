"use client";

import { useState, useEffect, useRef } from "react";
import Scene from "@/components/Scene";
import Interface from "@/components/Interface";
import { useMayaProgram } from "./hooks/useMayaProgram";

export default function Home() {
  const { pet, loading, feedPet, playPet, initPet, ownerKey, balance, requestAirdrop } = useMayaProgram();
  const [animState, setAnimState] = useState<"idle" | "eating" | "playing" | "dead">("idle");
  const [realTimeStats, setRealTimeStats] = useState({ hunger: 100, happiness: 100 });

  // Sync animation state with pet alive status
  const displayState = pet && (!pet.alive || realTimeStats.hunger <= 0) ? "dead" : animState;

  // Visual/Behavioral Synchronization Effect
  useEffect(() => {
    if (!pet || !pet.alive) return;

    const updateStats = () => {
      const now = Math.floor(Date.now() / 1000);
      const rawLastUpdate = pet.lastUpdate;
      const lastUpdate = typeof rawLastUpdate === 'number' ? rawLastUpdate : (rawLastUpdate as any).toNumber?.() || rawLastUpdate;
      const elapsed = Math.max(0, now - lastUpdate);

      const hungerDecay = (elapsed / 30) * 1;
      const happinessDecay = (elapsed / 30) * 2;

      setRealTimeStats({
        hunger: Math.max(0, pet.hunger - hungerDecay),
        happiness: Math.max(0, pet.happiness - happinessDecay)
      });
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();
    return () => clearInterval(interval);
  }, [pet]);

  // Cross-user Animation Trigger
  const lastUpdateRef = useRef<number>(0);
  useEffect(() => {
    if (!pet) return;
    const rawLastUpdate = pet.lastUpdate;
    const lastUpdate = typeof rawLastUpdate === 'number' ? rawLastUpdate : (rawLastUpdate as any).toNumber?.() || rawLastUpdate;

    if (lastUpdate > lastUpdateRef.current && lastUpdateRef.current !== 0) {
      // Something happened! Check what.
      const prevHunger = realTimeStats.hunger;
      const prevHappiness = realTimeStats.happiness;

      if (pet.hunger > prevHunger) {
        setAnimState("eating");
        setTimeout(() => setAnimState("idle"), 3000);
      } else if (pet.happiness > prevHappiness) {
        setAnimState("playing");
        setTimeout(() => setAnimState("idle"), 3000);
      }
    }
    lastUpdateRef.current = lastUpdate;
  }, [pet?.lastUpdate]);

  const handleFeed = async () => {
    try {
      await feedPet();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlay = async () => {
    try {
      await playPet();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <main className="h-screen w-screen bg-gradient-to-b from-blue-200 to-purple-200 relative overflow-hidden">
      <Scene
        mayaState={displayState}
        hunger={realTimeStats.hunger}
        happiness={realTimeStats.happiness}
      />
      <Interface
        pet={pet}
        onFeed={handleFeed}
        onPlay={handlePlay}
        onInit={initPet}
        onRequestAirdrop={requestAirdrop}
        loading={loading}
        ownerKey={ownerKey}
        balance={balance}
        realTimeStats={realTimeStats}
      />
    </main>
  );
}
