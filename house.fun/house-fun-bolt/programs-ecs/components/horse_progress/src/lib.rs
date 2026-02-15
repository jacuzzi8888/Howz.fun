use bolt_lang::*;

declare_id!("Horse1111111111111111111111111111111111111");

#[component]
#[derive(Default)]
pub struct HorseProgress {
    pub horse_id: u8,
    pub progress: u32, // 0 to 10000
    pub speed: u32,
    pub is_finished: bool,
}
