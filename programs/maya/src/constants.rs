use anchor_lang::prelude::*;

pub const HUNGER_GAIN_AMT: u8 = 2;
pub const HUNGER_DECAY_AMT: u8 = 1;
pub const HAPPINESS_DECAY_AMT: u8 = 2;
pub const HAPPINESS_GAIN_AMT: u8 = 5;

pub const MAX_FEED_AMT: u8 = 100;
pub const MAX_HAPPINESS_AMT: u8 = 100;

pub const DECAY_TIME: i64 = 30;
pub const FOOD_COST_LAMPORTS: u64 = 100_000_000; // 0.1 sol

#[constant]
pub const OWNER: Pubkey = pubkey!("9Yz1ZHg1SFzrhHgVXKnLSBSUBtzo8uTsmwHpkzcbmNzv");
