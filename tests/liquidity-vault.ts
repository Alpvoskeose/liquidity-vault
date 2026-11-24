import * as anchor from "@coral-xyz/anchor";
import { getAccount, getMint, createMint } from "@solana/spl-token";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { LiquidityVault } from "../target/types/liquidity_vault";

describe("liquidity-vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.LiquidityVault as anchor.Program<LiquidityVault>;
  const payer = (provider.wallet as anchor.Wallet).payer;

  it("initializes the vault, share mint, token store, and user position", async () => {
    const acceptedTokenMint = await createMint(
      provider.connection,
      payer,
      provider.wallet.publicKey,
      null,
      6,
    );
    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), provider.wallet.publicKey.toBuffer()],
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

    await program.methods
      .initializeVault()
      .accountsPartial({
        admin: provider.wallet.publicKey,
        vault,
        acceptedTokenMint,
        shareMint,
        vaultTokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const vaultState = await program.account.vault.fetch(vault);
    assert.isTrue(vaultState.admin.equals(provider.wallet.publicKey));
    assert.isTrue(vaultState.acceptedTokenMint.equals(acceptedTokenMint));
    assert.isTrue(vaultState.shareMint.equals(shareMint));
    assert.equal(vaultState.totalDeposited.toString(), "0");

    const shareMintState = await getMint(provider.connection, shareMint);
    assert.isTrue(shareMintState.mintAuthority?.equals(vault));
    const tokenAccountState = await getAccount(provider.connection, vaultTokenAccount);
    assert.isTrue(tokenAccountState.owner.equals(vault));
    assert.isTrue(tokenAccountState.mint.equals(acceptedTokenMint));

    const user = Keypair.generate();
    const signature = await provider.connection.requestAirdrop(user.publicKey, anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature, "confirmed");
    const [position] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), vault.toBuffer(), user.publicKey.toBuffer()],
      program.programId,
    );

    await program.methods
      .openPosition()
      .accountsPartial({
        user: user.publicKey,
        vault,
        position,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const positionState = await program.account.position.fetch(position);
    assert.isTrue(positionState.vault.equals(vault));
    assert.isTrue(positionState.user.equals(user.publicKey));
    assert.equal(positionState.depositedAmount.toString(), "0");
  });
});
