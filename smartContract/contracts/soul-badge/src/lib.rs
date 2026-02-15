#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contractevent, symbol_short, Env, Address, String, Vec, vec};

mod test;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Badge {
    pub mission_id: String,
    pub rank: String,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Badges(Address),
}

#[contract]
pub struct SoulBadge;

#[contractimpl]
impl SoulBadge {
    /// Mint a new Soul Badge for a successful mission
    pub fn mint(env: Env, reaper: Address, mission_id: String, rank: String) {
        // In a real scenario, this would require NGO/Admin auth
        // reaper.require_auth(); 
        
        let mut badges: Vec<Badge> = env.storage().persistent().get(&DataKey::Badges(reaper.clone())).unwrap_or(vec![&env]);
        
        let new_badge = Badge {
            mission_id,
            rank,
            timestamp: env.ledger().timestamp(),
        };
        
        badges.push_back(new_badge);
        env.storage().persistent().set(&DataKey::Badges(reaper.clone()), &badges);
        
        env.events().publish(
            (symbol_short!("badge"), symbol_short!("minted")),
            (reaper, env.ledger().timestamp())
        );
    }

    /// Get all badges for a Soul Reaper
    pub fn get_badges(env: Env, reaper: Address) -> Vec<Badge> {
        env.storage().persistent().get(&DataKey::Badges(reaper)).unwrap_or(vec![&env])
    }
}
