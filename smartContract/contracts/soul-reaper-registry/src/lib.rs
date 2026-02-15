#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, vec, Env, String, Symbol, Vec, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SoulReaper {
    pub name: String,
    pub division: u32,
    pub rank: Symbol,
    pub power_level: u32,
    pub owner: Address,
}

#[contracttype]
pub enum DataKey {
    Reaper(Address),
    AllReapers,
}

#[contract]
pub struct SoulReaperRegistry;

#[contractimpl]
impl SoulReaperRegistry {
    /// Register a new Soul Reaper in the Gotei 13
    pub fn register(env: Env, owner: Address, name: String, division: u32, rank: Symbol, power_level: u32) {
        owner.require_auth();
        
        let reaper = SoulReaper {
            name,
            division,
            rank,
            power_level,
            owner: owner.clone(),
        };
        
        // Store reaper by owner address
        env.storage().persistent().set(&DataKey::Reaper(owner.clone()), &reaper);
        
        // Update the list of all owners
        let mut all_reapers: Vec<Address> = env.storage().persistent().get(&DataKey::AllReapers).unwrap_or(vec![&env]);
        
        // Only add if not already in the list
        if !all_reapers.contains(owner.clone()) {
            all_reapers.push_back(owner);
            env.storage().persistent().set(&DataKey::AllReapers, &all_reapers);
        }

        // Emit an event for real-time tracking
        env.events().publish(
            (symbol_short!("registry"), symbol_short!("new_reaper")),
            reaper
        );
    }

    /// Update power level (requires owner auth)
    pub fn update_power(env: Env, owner: Address, new_power: u32) {
        owner.require_auth();
        
        let mut reaper: SoulReaper = env.storage().persistent().get(&DataKey::Reaper(owner.clone())).expect("Reaper not found");
        reaper.power_level = new_power;
        
        env.storage().persistent().set(&DataKey::Reaper(owner.clone()), &reaper);
        
        // Emit update event
        env.events().publish(
            (symbol_short!("registry"), symbol_short!("upd_power")),
            reaper
        );
    }

    /// Get a specific reaper's info
    pub fn get_reaper(env: Env, owner: Address) -> Option<SoulReaper> {
        env.storage().persistent().get(&DataKey::Reaper(owner))
    }

    /// Get all registered Soul Reapers
    pub fn get_all(env: Env) -> Vec<SoulReaper> {
        let owners: Vec<Address> = env.storage().persistent().get(&DataKey::AllReapers).unwrap_or(vec![&env]);
        let mut result = Vec::new(&env);
        
        for owner in owners {
            if let Some(reaper) = env.storage().persistent().get(&DataKey::Reaper(owner)) {
                result.push_back(reaper);
            }
        }
        
        result
    }
}
