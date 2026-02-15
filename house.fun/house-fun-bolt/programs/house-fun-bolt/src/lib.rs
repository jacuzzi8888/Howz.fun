use bolt_lang::prelude::*;

declare_id!("47DuafSp8oz5nz2XMSLGJQz2uy9naTrsQfNAGBrvu3NA");

#[program]
pub mod house_fun_bolt {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
