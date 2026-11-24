use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("3UcmouisNffeyqHTrwmkztu22Zf9jFj2cvZyvLC1t4EW");

#[program]
pub mod liquidity_vault {
    use super::*;

    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        ctx.accounts.vault.set_inner(Vault {
            admin: ctx.accounts.admin.key(),
            accepted_token_mint: ctx.accounts.accepted_token_mint.key(),
            share_mint: ctx.accounts.share_mint.key(),
            total_deposited: 0,
            bump: ctx.bumps.vault,
        });

        Ok(())
    }

    pub fn open_position(ctx: Context<OpenPosition>) -> Result<()> {
        ctx.accounts.position.set_inner(Position {
            vault: ctx.accounts.vault.key(),
            user: ctx.accounts.user.key(),
            deposited_amount: 0,
            bump: ctx.bumps.position,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = Vault::SPACE,
        seeds = [b"vault", admin.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    pub accepted_token_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        seeds = [b"share_mint", vault.key().as_ref()],
        bump,
        mint::decimals = accepted_token_mint.decimals,
        mint::authority = vault
    )]
    pub share_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        seeds = [b"vault_tokens", vault.key().as_ref()],
        bump,
        token::mint = accepted_token_mint,
        token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        seeds = [b"vault", vault.admin.as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = user,
        space = Position::SPACE,
        seeds = [b"position", vault.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Vault {
    pub admin: Pubkey,
    pub accepted_token_mint: Pubkey,
    pub share_mint: Pubkey,
    pub total_deposited: u64,
    pub bump: u8,
}

impl Vault {
    pub const SPACE: usize = 8 + 32 + 32 + 32 + 8 + 1;
}

#[account]
pub struct Position {
    pub vault: Pubkey,
    pub user: Pubkey,
    pub deposited_amount: u64,
    pub bump: u8,
}

impl Position {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 1;
}
