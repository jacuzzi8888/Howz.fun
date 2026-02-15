use bolt_lang::*;
use horse_progress::HorseProgress;

declare_id!("Race1111111111111111111111111111111111111");

#[system]
pub mod race_update {

    pub fn execute(ctx: Context<Components>, _args_p: Vec<u8>) -> Result<Components> {
        let horse = &mut ctx.accounts.horse_progress;
        
        if !horse.is_finished {
            // Update progress based on speed
            horse.progress += horse.speed;
            
            if horse.progress >= 10000 {
                horse.progress = 10000;
                horse.is_finished = true;
            }
        }
        
        Ok(ctx.accounts)
    }

    #[system_input]
    pub struct Components {
        pub horse_progress: HorseProgress,
    }
}
