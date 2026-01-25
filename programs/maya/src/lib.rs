use anchor_lang::prelude::{msg, *};

declare_id!("7j4hga4DjgvX2Ge1vxaXUYiW2Tv1a2CJQ5XrnqkJW5nP");

#[program]
pub mod maya {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
