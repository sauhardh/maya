use anchor_lang::prelude::{*};

pub mod utils;
pub mod constants;

use crate::constants::*;
use crate::utils::PetCare;

// This is the Program ID. Update this when you deploy your own program.
// It must match the ID in Anchor.toml and your local keys.
declare_id!("JSkdjZGLt8gKvFsQCB2Kzd7ERgUEk1FXNJEeUiw9PWM");

#[program]
pub mod maya {
    use super::*;

    pub fn init_pet(ctx: Context<InitPet>, name: Option<String>) -> Result<()> {
        msg!("Welcome home {name:?} <<<<< ID: {:?}", ctx.program_id);

        // For test
        require!(ctx.accounts.authority.key() == OWNER, CustomError::UnAuthorized);

        let pet = &mut ctx.accounts.pet;
        pet.name = name.unwrap_or("maya".to_string());
        pet.hunger = 100;
        pet.happiness = 100;
        pet.alive = true;
        // pet.food_queue = 0;
        pet.last_update = Clock::get()?.unix_timestamp;
        pet.total_sol_received = 0;
        pet.last_feeder = ctx.accounts.authority.key();

        emit!(EmitPetUpdated{
            hunger: pet.hunger,
            happiness:pet.happiness,
            alive:pet.alive,
            last_feeder:pet.last_feeder,
            last_update: pet.last_update,
        });

        Ok(())
    }

    pub fn apply_decay(ctx: Context<UpdatePet>) -> Result<()> {
        let pet = &mut ctx.accounts.pet;
        require!(pet.alive, CustomError::PetIsDead);
        PetCare::apply_decay_internal(pet)?;

        emit!(EmitPetUpdated{
            hunger: pet.hunger,
            happiness:pet.happiness,
            alive:pet.alive,
            last_feeder:pet.last_feeder,
            last_update: pet.last_update,
        });

        Ok(())
    }

    pub fn feed_pet(ctx: Context<UpdatePet>) -> Result<()> {
        msg!("Feeding Pet");
        PetCare::receive_sol(&ctx)?;

        let pet = &mut ctx.accounts.pet;

        PetCare::apply_decay_internal(pet)?;
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

       emit!(EmitPetUpdated{
        hunger: pet.hunger,
        happiness:pet.happiness,
        alive:pet.alive,
        last_feeder:pet.last_feeder,
        last_update: pet.last_update,
        });

        msg!("Now hunger is, {}", pet.hunger);
        Ok(())
    }

    pub fn play_pet(ctx: Context<UpdatePet>) -> Result<()> {
        let pet = &mut ctx.accounts.pet;

        PetCare::apply_decay_internal(pet)?;

        if pet.happiness + HAPPINESS_GAIN_AMT <= MAX_HAPPINESS_AMT {
            pet.happiness += HAPPINESS_GAIN_AMT;
        } else {
            pet.happiness = MAX_HAPPINESS_AMT;
        }
        
       emit!(EmitPetUpdated{
        hunger: pet.hunger,
        happiness:pet.happiness,
        alive:pet.alive,
        last_feeder:pet.last_feeder,
        last_update: pet.last_update,
        });


        Ok(())
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>)-> Result<()>{
        require!(ctx.accounts.authority.key() == OWNER, CustomError::UnAuthorized);

        let pet_account = &mut ctx.accounts.pet;
        let pet_lamports = **pet_account.to_account_info().lamports.borrow();

       let rent = Rent::get()?; 
       let min_balance = rent.minimum_balance(pet_account.to_account_info().data_len());

       let withdrawable = pet_lamports - min_balance;

       **pet_account.to_account_info().lamports.borrow_mut() -= withdrawable;
       **ctx.accounts.authority.to_account_info().lamports.borrow_mut() += withdrawable;

        Ok(())
    }
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

#[derive(Accounts)]
pub struct WithdrawSol<'info>{
    #[account(mut, seeds = [b"maya"], bump)]
    pub pet: Account<'info, Pet>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>
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

#[event]
pub struct EmitPetUpdated {
    pub hunger: u8,
    pub happiness: u8,
    pub alive: bool,
    pub last_feeder: Pubkey,
    pub last_update: i64,
}

#[event]
pub struct PetDied{
    pub timestamp: i64
}

#[error_code]
pub enum CustomError {
    #[msg("Pet is dead and cannot be inteacted with!")]
    PetIsDead,

    #[msg("Nothing to decay yet!")]
    NoDecayNeeded,

    #[msg("Overflow occured")]
    Overflow,

    #[msg("You are not worthy enough to create a new pet")]
    UnAuthorized,

    #[msg("Insufficient fund, Includes rent calculation")]
    InSufficientFunds
}
