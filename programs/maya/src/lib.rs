use anchor_lang::prelude::*;
use anchor_lang::system_program;
declare_id!("7j4hga4DjgvX2Ge1vxaXUYiW2Tv1a2CJQ5XrnqkJW5nP");

#[program]
pub mod maya {
    use super::*;

    pub const HUNGER_GAIN_AMT: u8 = 2;
    pub const HUNGER_DECAY_AMT: u8 = 1;
    pub const HAPPINESS_DECAY_AMT: u8 = 2;
    pub const HAPPINESS_GAIN_AMT: u8 = 5;

    pub const MAX_FEED_AMT: u8 = 100;
    pub const MAX_HAPPINESS_AMT: u8 = 100;

    pub const DECAY_TIME: i64 = 30;
    pub const FOOD_COST_LAMPORTS: u64 = 100_000_000;

    pub fn init_pet(ctx: Context<InitPet>, name: Option<String>) -> Result<()> {
        msg!("Welcome home {name:?} <<<<< ID: {:?}", ctx.program_id);

        let pet = &mut ctx.accounts.pet;
        pet.name = name.unwrap_or("maya".to_string());
        pet.hunger = 100;
        pet.happiness = 100;
        pet.alive = true;
        // pet.food_queue = 0;
        pet.last_update = Clock::get()?.unix_timestamp;
        pet.total_sol_received = 0;
        pet.last_feeder = ctx.accounts.authority.key();

        Ok(())
    }

    pub fn apply_decay(ctx: Context<UpdatePet>) -> Result<()> {
        let pet = &mut ctx.accounts.pet;
        require!(pet.alive, CustomError::PetIsDead);
        apply_decay_internal(&mut ctx.accounts.pet)?;

        Ok(())
    }

    pub fn feed_pet(ctx: Context<UpdatePet>) -> Result<()> {
        msg!("Feeding Pet");
        receive_sol(&ctx)?;

        let pet = &mut ctx.accounts.pet;

        apply_decay_internal(pet)?;
        require!(pet.alive, CustomError::PetIsDead);

        if pet.hunger + HUNGER_GAIN_AMT <= MAX_FEED_AMT {
            pet.hunger += HUNGER_GAIN_AMT;

            if pet.happiness + HAPPINESS_GAIN_AMT <= MAX_HAPPINESS_AMT {
                pet.happiness += HAPPINESS_GAIN_AMT;
            }
        } else {
            pet.hunger = MAX_FEED_AMT;
            pet.happiness = MAX_HAPPINESS_AMT;
        }

        pet.total_sol_received += FOOD_COST_LAMPORTS;
        pet.last_feeder = ctx.accounts.authority.key();

        msg!("Now hunger is, {}", pet.hunger);
        Ok(())
    }

    pub fn play_pet(ctx: Context<UpdatePet>) -> Result<()> {
        let pet = &mut ctx.accounts.pet;

        apply_decay_internal(pet)?;

        if pet.happiness + HAPPINESS_GAIN_AMT <= MAX_HAPPINESS_AMT {
            pet.happiness += HAPPINESS_GAIN_AMT;
        } else {
            pet.happiness = MAX_HAPPINESS_AMT;
        }

        Ok(())
    }
}

pub fn receive_sol(ctx: &Context<UpdatePet>) -> Result<()> {
    let ix = system_program::Transfer {
        from: ctx.accounts.authority.to_account_info(),
        to: ctx.accounts.pet.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), ix);

    system_program::transfer(cpi_ctx, FOOD_COST_LAMPORTS)
}

pub fn apply_decay_internal(pet: &mut Pet) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let elapsed = now.saturating_sub(pet.last_update);

    // SAFETY: The highest `decayed_times` can be is 255. Since, cat only lives 100 lives. So there is
    // no need to worry about lives crossing 255.
    let decayed_times = (elapsed / DECAY_TIME).min(u8::MAX as i64) as u8;

    if decayed_times == 0 {
        return Ok(());
    }

    pet.hunger = pet
        .hunger
        .saturating_sub(decayed_times.saturating_mul(HUNGER_DECAY_AMT));
    pet.happiness = pet
        .happiness
        .saturating_sub(decayed_times.saturating_mul(HAPPINESS_DECAY_AMT));

    pet.last_update += decayed_times as i64 * DECAY_TIME;

    if pet.hunger == 0 || pet.happiness == 0 {
        pet.alive = false;
        pet.happiness = 0;
        pet.hunger = 0;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct InitPet<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [b"maya"],
        bump,
        space = 8 + Pet::INIT_SPACE 
    )]
    pub pet: Account<'info, Pet>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pet {
    pub name: String,
    pub hunger: u8,
    pub happiness: u8,
    pub alive: bool,
    // pub food_queue: u32,
    pub last_update: i64,
    pub total_sol_received: u64,
    pub last_feeder: Pubkey,
}

impl Pet {
    pub const MAX_NAME_LEN: usize = 32;

    pub const INIT_SPACE: usize = 4 + Self::MAX_NAME_LEN +
        1 + //hunger
        1 + //happiness
        1 + //alive
        // 4 + //food_queue
        8 + //last_update
        8 + //total_sol_received
        64; //last_feeder
}

#[derive(Accounts)]
pub struct UpdatePet<'info> {
    #[account(mut, seeds=[b"maya"], bump)]
    pub pet: Account<'info, Pet>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum CustomError {
    #[msg("Pet is dead and cannot be inteacted with!")]
    PetIsDead,

    #[msg("Nothing to decay yet!")]
    NoDecayNeeded,

    #[msg("Overflow occured")]
    Overflow,
}
