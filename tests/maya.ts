import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Maya } from "../target/types/maya";
import { rpc } from "@coral-xyz/anchor/dist/cjs/utils";
import { listeners } from "node:cluster";

describe("maya", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Maya as Program<Maya>;
  let petPda: anchor.web3.PublicKey;

  it("Is initialized!", async () => {
    [petPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("maya")],
      program.programId
    );

    console.log("test", provider.wallet.publicKey.toBase58());
    // // This listens for event logs
    // const events = await program.account.pet.subscribe(petPda);
    // events.on("change", (account) => {
    //   console.log("event changed", account);
    // });

    let txSig = await program.methods
      .initPet("fluffy")
      .accounts({
        pet: petPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature", txSig);
  });

  it("Is decayed!", async () => {
    [petPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("maya")],
      program.programId
    );

    console.log("decay test", provider.wallet.publicKey.toBase58());
    //
    // // This listens for event logs
    const listener = program.addEventListener(
      "emitPetUpdated",
      (event, slot) => {
        console.log("EmitPetUpdated", event, "slot", slot);
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 100000));

    let txDecay = await program.methods
      .applyDecay()
      .accounts({
        pet: petPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("decay Your transaction signature", txDecay);

    const petAccount = await program.account.pet.fetch(petPda);
    console.log("pet after decay", petAccount);

    await program.removeEventListener(listener);
  });

  it("Feed", async () => {
    [petPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("maya")],
      program.programId
    );

    console.log("feed test", provider.wallet.publicKey.toBase58());
    //
    // // This listens for event logs
    const listener = program.addEventListener(
      "emitPetUpdated",
      (event, slot) => {
        console.log("feed EmitPetUpdated", event, "slot", slot);
      }
    );

    let txFeed = await program.methods
      .feedPet()
      .accounts({
        pet: petPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Feed transaction signature:", txFeed);

    const petAccount = await program.account.pet.fetch(petPda);
    console.log("pet after feed", petAccount);

    await program.removeEventListener(listener);
  });

  it("play with cat", async () => {
    [petPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("maya")],
      program.programId
    );

    console.log("play test", provider.wallet.publicKey.toBase58());
    //
    // // This listens for event logs
    const listener = program.addEventListener(
      "emitPetUpdated",
      (event, slot) => {
        console.log("playing EmitPetUpdated", event, "slot", slot);
      }
    );

    let txFeed = await program.methods
      .playPet()
      .accounts({
        pet: petPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Feed transaction signature:", txFeed);

    const petAccount = await program.account.pet.fetch(petPda);
    console.log("pet after play", petAccount);

    await program.removeEventListener(listener);
  });

  it("withdraw", async () => {
    const authorityBefore = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    const petBefore = await provider.connection.getBalance(petPda);

    console.log(
      "Authority balance before withdraw:",
      authorityBefore / anchor.web3.LAMPORTS_PER_SOL
    );
    console.log(
      "Pet balance before withdraw:",
      petBefore / anchor.web3.LAMPORTS_PER_SOL
    );

    const txWithdraw = await program.methods
      .withdrawSol()
      .accounts({
        pet: petPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Withdraw tx signature:", txWithdraw);

    const authorityAfter = await provider.connection.getBalance(
      provider.wallet.publicKey
    );
    const petAfter = await provider.connection.getBalance(petPda);

    console.log(
      "Authority balance after withdraw:",
      authorityAfter / anchor.web3.LAMPORTS_PER_SOL
    );
    console.log(
      "Pet balance after withdraw:",
      petAfter / anchor.web3.LAMPORTS_PER_SOL
    );
  });
});
