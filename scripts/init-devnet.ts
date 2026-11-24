import * as anchor from "@coral-xyz/anchor";
import { createMint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { LiquidityVault } from "../target/types/liquidity_vault";

async function main(): Promise<void> {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.LiquidityVault as anchor.Program<LiquidityVault>;
  const admin = provider.wallet.publicKey;
  const acceptedTokenMint = await createMint(
    provider.connection,
    (provider.wallet as anchor.Wallet).payer,
    admin,
    null,
    6,
  );
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), admin.toBuffer()],
    program.programId,
  );
  const [shareMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("share_mint"), vault.toBuffer()],
    program.programId,
  );
  const [vaultTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault_tokens"), vault.toBuffer()],
    program.programId,
  );

  const signature = await program.methods
    .initializeVault()
    .accountsPartial({
      admin,
      vault,
      acceptedTokenMint,
      shareMint,
      vaultTokenAccount,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      systemProgram: anchor.web3.SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  console.log(`Cluster: ${provider.connection.rpcEndpoint}`);
  console.log(`Program: ${program.programId.toBase58()}`);
  console.log(`Accepted token mint: ${acceptedTokenMint.toBase58()}`);
  console.log(`Vault config: ${vault.toBase58()}`);
  console.log(`Share mint: ${shareMint.toBase58()}`);
  console.log(`Vault token account: ${vaultTokenAccount.toBase58()}`);
  console.log(`Initialize signature: ${signature}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
