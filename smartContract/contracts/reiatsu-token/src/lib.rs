#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Address, String, Map, map, IntoVal};

#[contracttype]
pub enum DataKey {
    Balance(Address),
    Admin,
}

#[contract]
pub struct ReiatsuToken;

#[contractimpl]
impl ReiatsuToken {
    /// Initialize the token with an administrator
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Mint new Reiatsu (RA) for a Soul Reaper
    pub fn mint(env: Env, admin: Address, to: Address, amount: i128) {
        admin.require_auth();
        let stored_admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Not initialized");
        if admin != stored_admin {
            panic!("Not authorized");
        }

        let mut balance: i128 = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&DataKey::Balance(to.clone()), &balance);
    }

    /// Check Reiatsu balance of a Reaper
    pub fn balance(env: Env, reaper: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(reaper)).unwrap_or(0)
    }

    /// Transfer Reiatsu between Reapers
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        
        let mut from_balance: i128 = env.storage().persistent().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        if from_balance < amount {
            panic!("Insufficient Reiatsu");
        }

        let mut to_balance: i128 = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        
        from_balance -= amount;
        to_balance += amount;

        env.storage().persistent().set(&DataKey::Balance(from), &from_balance);
        env.storage().persistent().set(&DataKey::Balance(to), &to_balance);
    }
}
