import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Maya } from "../target/types/maya";

describe("maya", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Maya as Program<Maya>;

  it("Is initialized!", async () => {
    const pet = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .initPet("maya")
      .accounts({
        pet: pet.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([pet])
      .rpc();

    console.log("Your transaction signature", tx);
  });

  it("Is decayed!", async () => {
    const pet = anchor.web3.Keypair.generate();

    const tx = await program.methods
      .initPet("maya")
      .accounts({
        pet: pet.publicKey,
        authority: provider.wallet.publicKey,
      })
      .signers([pet])
      .rpc();

    let petAccount = await program.account.pet.fetch(pet.publicKey);
    console.log("Initial Hunger", petAccount.hunger);

    await new Promise((resolve) => setTimeout(resolve, 70_0));

    const decaytx = await program.methods
      .applyDecay()
      .accounts({
        pet: pet.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    petAccount = await program.account.pet.fetch(pet.publicKey);

    const sig = await provider.connection.getTransaction(decaytx, {
      commitment: "confirmed",
    });

    console.log(sig?.meta?.logMessages);
    console.log("pet after decay", petAccount.hunger);
  });
});
