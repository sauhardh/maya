import { PublicKey } from "@solana/web3.js";

/**
 * The Program ID of the Maya Anchor program.
 * Can be overridden by the NEXT_PUBLIC_PROGRAM_ID environment variable.
 */
export const PROGRAM_ID = new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "JSkdjZGLt8gKvFsQCB2Kzd7ERgUEk1FXNJEeUiw9PWM"
);

/**
 * The specific owner key required to initialize Maya.
 * Can be overridden by the NEXT_PUBLIC_OWNER_KEY environment variable.
 */
export const OWNER_KEY = new PublicKey(
    process.env.NEXT_PUBLIC_OWNER_KEY || "9Yz1ZHg1SFzrhHgVXKnLSBSUBtzo8uTsmwHpkzcbmNzv"
);

/**
 * Seed for the Maya PDA.
 */
export const MAYA_SEED = "maya";

/**
 * Solana RPC Endpoint.
 */
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:8899";
