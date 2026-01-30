import { useEffect, useState, useMemo } from "react";
import { Program, AnchorProvider, web3, Idl, BN } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../utils/idl.json";

// Hardcoded program ID from the IDL or constant
const PROGRAM_ID = new PublicKey("JSkdjZGLt8gKvFsQCB2Kzd7ERgUEk1FXNJEeUiw9PWM");
const MAYA_SEED = "maya";

export interface PetAccount {
  name: string;
  hunger: number;
  happiness: number;
  alive: boolean;
  lastUpdate: BN;
  totalSolReceived: BN;
  lastFeeder: PublicKey;
}

// Hardcoded owner from lib.rs
// const OWNER_KEY = new PublicKey("HpMFXSQA8nKJDidF88hDsYv1efnVgwPnzwCYH1khxMZp");
const OWNER_KEY = new PublicKey("9Yz1ZHg1SFzrhHgVXKnLSBSUBtzo8uTsmwHpkzcbmNzv");

export function useMayaProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet as any, {
      preflightCommitment: "processed",
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (provider) {
      return new Program(idl as Idl, provider);
    }
    // Read-only fallback if no provider/wallet
    const readonlyProvider = new AnchorProvider(connection, { publicKey: OWNER_KEY } as any, {
      preflightCommitment: "processed",
    });
    return new Program(idl as Idl, readonlyProvider);
  }, [provider, connection]);

  const [pet, setPet] = useState<PetAccount | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const getPetAddress = () => {
    const [petPda] = PublicKey.findProgramAddressSync(
      [Buffer.from(MAYA_SEED)],
      PROGRAM_ID
    );
    return petPda;
  };

  const fetchPet = async () => {
    if (!program) return;
    setLoading(true);
    try {
      // Fetch Balance only if wallet is connected
      if (wallet.publicKey) {
        const bal = await connection.getBalance(wallet.publicKey);
        setBalance(bal / web3.LAMPORTS_PER_SOL);
      }

      const petPda = getPetAddress();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account: any = await (program as any).account.pet.fetch(petPda);
      console.log("Pet Fetched:", account);
      setPet(account);
    } catch (err) {
      console.log("Pet not found or error:", err);
      setPet(null);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to events
  useEffect(() => {
    if (!program) return;

    fetchPet(); // Initial fetch

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (program as any).addEventListener(
      "EmitPetUpdated",
      (event: any, slot: any) => {
        console.log("DEBUG: event received:", event);
        setPet(
          (prev) => {
            if (!prev) return null;
            const updated = {
              ...prev,
              ...event,
              // Anchor usually camelCases event fields. 
              // We ensure lastUpdate is updated to reset interpolation.
              lastUpdate: event.lastUpdate || event.last_update || prev.lastUpdate,
            } as any;
            console.log("DEBUG: updated pet state:", updated);
            return updated;
          }
        );
        fetchPet();
      }
    );

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (program as any).removeEventListener(listener);
    };
  }, [program]);

  const feedPet = async () => {
    if (!program || !wallet.publicKey) return;
    try {
      const petPda = getPetAddress();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = await (program as any).methods
        .feedPet()
        .accounts({
          pet: petPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Fed Pet:", tx);
      await connection.confirmTransaction(tx, "processed");
      await fetchPet(); // Manual fetch for reliability
    } catch (err) {
      console.error("Feed Error:", err);
      throw err;
    }
  };

  const playPet = async () => {
    if (!program || !wallet.publicKey) return;
    try {
      const petPda = getPetAddress();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = await (program as any).methods
        .playPet()
        .accounts({
          pet: petPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log("Played with Pet:", tx);
      await connection.confirmTransaction(tx, "processed");
      await fetchPet(); // Manual fetch for reliability
    } catch (err) {
      console.error("Play Error:", err);
      throw err;
    }
  };

  const initPet = async (name: string) => {
    if (!program || !wallet.publicKey) return;
    try {
      const petPda = getPetAddress();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tx = await (program as any).methods
        .initPet(name)
        .accounts({
          pet: petPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      await connection.confirmTransaction(tx, "processed");
      fetchPet();
    } catch (err) {
      console.error("Init Error", err);
      throw err;
    }
  };

  const requestAirdrop = async () => {
    if (!wallet.publicKey) return;
    try {
      setLoading(true);
      const sig = await connection.requestAirdrop(wallet.publicKey, 2 * web3.LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      fetchPet();
    } catch (err) {
      console.error("Airdrop Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    pet,
    balance,
    loading,
    feedPet,
    playPet,
    initPet,
    requestAirdrop,
    programId: PROGRAM_ID,
    ownerKey: OWNER_KEY,
  };
}
