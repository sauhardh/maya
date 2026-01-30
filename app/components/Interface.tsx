"use client";

import { PetAccount } from "@/app/hooks/useMayaProgram";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

interface InterfaceProps {
    pet: PetAccount | null;
    onFeed: () => void;
    onPlay: () => void;
    onInit: (name: string) => void;
    onRequestAirdrop: () => void;
    loading: boolean;
    ownerKey: PublicKey;
    balance: number;
    realTimeStats: { hunger: number; happiness: number };
}

export default function Interface({ pet, onFeed, onPlay, onInit, onRequestAirdrop, loading, ownerKey, balance, realTimeStats }: InterfaceProps) {
    const { publicKey } = useWallet();
    const isOwner = publicKey?.toBase58() === ownerKey.toBase58();

    // Loading State
    if (loading && !pet) {
        return (
            <div className="absolute inset-0 flex items-center justify-center text-white pointer-events-none">
                <span className="bg-black/50 px-4 py-2 rounded-full">Finding Maya...</span>
            </div>
        )
    }

    // Not Initialized State
    if (!pet) {
        return (
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 right-4 pointer-events-auto">
                    <WalletMultiButton />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 p-8 rounded-2xl shadow-xl text-center backdrop-blur-sm pointer-events-auto max-w-sm mx-4">

                        {isOwner ? (
                            <>
                                <h1 className="text-2xl font-bold mb-2 text-purple-900">Maya is sleeping...</h1>
                                <p className="mb-2 text-gray-600">Only you can wake her up.</p>
                                <div className="text-xs text-gray-400 mb-2 font-mono">
                                    Network: localhost | Balance: <span className={balance > 0 ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{balance.toFixed(2)} SOL</span>
                                </div>
                                <div className="text-[10px] text-gray-300 mb-6 font-mono truncate">
                                    Auth: {ownerKey.toBase58()}
                                </div>

                                {balance === 0 && (
                                    <button
                                        onClick={onRequestAirdrop}
                                        className="mb-4 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 py-1 px-3 rounded-lg transition-colors"
                                    >
                                        {loading ? "Requesting..." : "Get Local SOL (Airdrop)"}
                                    </button>
                                )}
                                <button
                                    onClick={() => onInit("Maya")}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? "Waking up..." : "Initialize Maya"}
                                </button>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold mb-2 text-gray-800">Maya hasn't arrived yet.</h1>
                                <p className="text-gray-600">Waiting for the owner to initialize the world.</p>
                                <div className="text-xs text-gray-400 mt-4 font-mono">
                                    Requires Owner: {ownerKey.toBase58().slice(0, 8)}...
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        )
    }

    const isDead = !pet.alive || realTimeStats.hunger <= 0;

    // Active Game State
    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none select-none">
            {/* Wallet (Top Right) */}
            <div className="absolute top-4 right-4 pointer-events-auto">
                <WalletMultiButton />
            </div>

            {/* Stats Board (Top Left) */}
            <div className="absolute top-4 left-4 bg-white/90 p-4 rounded-xl shadow-lg w-64 backdrop-blur-sm pointer-events-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-1">{pet.name}</h2>
                <div className="text-xs text-gray-500 mb-3">
                    Status: {!isDead ? <span className="text-green-600 font-bold">HAPPY</span> : <span className="text-red-600 font-bold">RIP</span>}
                </div>

                {/* Health */}
                <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>Fullness</span>
                        <span>{realTimeStats.hunger.toFixed(0)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-red-500 h-2.5 rounded-full transition-all duration-300 linear"
                            style={{ width: `${realTimeStats.hunger}%` }}
                        ></div>
                    </div>
                </div>

                {/* Happiness */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-700 mb-1">
                        <span>Happiness</span>
                        <span>{realTimeStats.happiness.toFixed(0)}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-yellow-400 h-2.5 rounded-full transition-all duration-300 linear"
                            style={{ width: `${realTimeStats.happiness}%` }}
                        ></div>
                    </div>
                </div>

                <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                    Current Feeder: <span className="font-mono text-gray-600">{pet.lastFeeder.toBase58().slice(0, 4)}...{pet.lastFeeder.toBase58().slice(-4)}</span>
                </div>
            </div>

            {/* Actions (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6 pointer-events-auto">
                <button
                    onClick={onFeed}
                    disabled={isDead || loading}
                    className="flex flex-col items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all text-white text-3xl border-4 border-white">
                        🍗
                    </div>
                    <span className="font-bold text-white drop-shadow-md text-lg">Feed</span>
                </button>

                <button
                    onClick={onPlay}
                    disabled={isDead || loading}
                    className="flex flex-col items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all text-white text-3xl border-4 border-white">
                        🧶
                    </div>
                    <span className="font-bold text-white drop-shadow-md text-lg">Play</span>
                </button>
            </div>

            {/* Game Over Overlay */}
            {isDead && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 backdrop-blur-sm px-4">
                    <div className="text-center text-white p-8 border-4 border-white rounded-2xl max-w-lg">
                        <h1 className="text-6xl font-black mb-4 animate-pulse uppercase tracking-wider text-red-500">Game Over</h1>
                        <p className="text-xl text-gray-300 mb-4">Maya has passed away from hunger...</p>
                        <p className="text-sm text-gray-400">She remains in the garden graveyard forever.</p>
                    </div>
                </div>
            )}

        </div>
    );
}
