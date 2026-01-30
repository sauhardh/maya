use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::Pet;
use crate::PetDied;
use crate::UpdatePet;

use crate::DECAY_TIME;
use crate::FOOD_COST_LAMPORTS;
use crate::HAPPINESS_DECAY_AMT;
use crate::HUNGER_DECAY_AMT;

pub struct PetCare {}
impl PetCare {
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

        // SAFETY: The highest `decayed_times` can be is 255. Since, cat only live for 100 lives. So there is
        // no need to worry about life crossing 255. Consider life as a heart (like in minecraft)
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

            emit!(PetDied { timestamp: now })
        }

        Ok(())
    }
}
