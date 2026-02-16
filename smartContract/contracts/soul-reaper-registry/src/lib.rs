#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Env, String, Symbol, Vec, vec, Address,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReaperStatus { Active, Suspended }

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SoulReaper {
    pub name: String,
    pub division: u32,
    pub rank: Symbol,
    pub power_level: u32,
    pub owner: Address,
    pub status: ReaperStatus,
    pub joined_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PowerChange {
    pub old_power: u32,
    pub new_power: u32,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Reaper(Address),
    AllReapers,
    DivisionMembers(u32),
    DivisionCapacity(u32),
    PowerHistory(Address),
    Admin,
    TotalReapers,
}

const MAX_DIVISIONS: u32 = 13;
const DEFAULT_DIVISION_CAPACITY: u32 = 50;

#[contract]
pub struct SoulReaperRegistry;

#[allow(deprecated)]
#[contractimpl]
impl SoulReaperRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) { panic!("Already initialized"); }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::TotalReapers, &0u32);
    }

    pub fn register(env: Env, owner: Address, name: String, division: u32, rank: Symbol, power_level: u32) {
        owner.require_auth();
        if division == 0 || division > MAX_DIVISIONS { panic!("Division must be 1-13"); }

        let capacity: u32 = env.storage().persistent().get(&DataKey::DivisionCapacity(division)).unwrap_or(DEFAULT_DIVISION_CAPACITY);
        let members: Vec<Address> = env.storage().persistent().get(&DataKey::DivisionMembers(division)).unwrap_or(vec![&env]);
        if members.len() >= capacity { panic!("Division at capacity"); }
        if env.storage().persistent().has(&DataKey::Reaper(owner.clone())) { panic!("Already registered"); }

        let reaper = SoulReaper { name, division, rank, power_level, owner: owner.clone(), status: ReaperStatus::Active, joined_at: env.ledger().timestamp() };
        env.storage().persistent().set(&DataKey::Reaper(owner.clone()), &reaper);

        let mut div_members = members;
        div_members.push_back(owner.clone());
        env.storage().persistent().set(&DataKey::DivisionMembers(division), &div_members);

        let mut all: Vec<Address> = env.storage().persistent().get(&DataKey::AllReapers).unwrap_or(vec![&env]);
        all.push_back(owner.clone());
        env.storage().persistent().set(&DataKey::AllReapers, &all);

        let mut total: u32 = env.storage().persistent().get(&DataKey::TotalReapers).unwrap_or(0);
        total += 1;
        env.storage().persistent().set(&DataKey::TotalReapers, &total);

        let history = vec![&env, PowerChange { old_power: 0, new_power: power_level, timestamp: env.ledger().timestamp() }];
        env.storage().persistent().set(&DataKey::PowerHistory(owner), &history);
        env.events().publish((symbol_short!("registry"), symbol_short!("new_rpr")), reaper);
    }

    pub fn update_power(env: Env, owner: Address, new_power: u32) {
        owner.require_auth();
        let mut reaper: SoulReaper = env.storage().persistent().get(&DataKey::Reaper(owner.clone())).expect("Not found");
        if reaper.status == ReaperStatus::Suspended { panic!("Suspended"); }
        let old_power = reaper.power_level;
        reaper.power_level = new_power;
        env.storage().persistent().set(&DataKey::Reaper(owner.clone()), &reaper);
        let mut history: Vec<PowerChange> = env.storage().persistent().get(&DataKey::PowerHistory(owner.clone())).unwrap_or(vec![&env]);
        history.push_back(PowerChange { old_power, new_power, timestamp: env.ledger().timestamp() });
        env.storage().persistent().set(&DataKey::PowerHistory(owner.clone()), &history);
    }

    pub fn promote(env: Env, admin: Address, owner: Address, new_rank: Symbol) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        let mut reaper: SoulReaper = env.storage().persistent().get(&DataKey::Reaper(owner.clone())).expect("Not found");
        reaper.rank = new_rank;
        env.storage().persistent().set(&DataKey::Reaper(owner), &reaper);
    }

    pub fn suspend(env: Env, admin: Address, owner: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        let mut reaper: SoulReaper = env.storage().persistent().get(&DataKey::Reaper(owner.clone())).expect("Not found");
        reaper.status = ReaperStatus::Suspended;
        env.storage().persistent().set(&DataKey::Reaper(owner), &reaper);
    }

    pub fn reinstate(env: Env, admin: Address, owner: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        let mut reaper: SoulReaper = env.storage().persistent().get(&DataKey::Reaper(owner.clone())).expect("Not found");
        reaper.status = ReaperStatus::Active;
        env.storage().persistent().set(&DataKey::Reaper(owner), &reaper);
    }

    pub fn set_division_capacity(env: Env, admin: Address, division: u32, capacity: u32) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().persistent().set(&DataKey::DivisionCapacity(division), &capacity);
    }

    pub fn get_reaper(env: Env, owner: Address) -> Option<SoulReaper> {
        env.storage().persistent().get(&DataKey::Reaper(owner))
    }

    pub fn get_by_division(env: Env, division: u32) -> Vec<SoulReaper> {
        let members: Vec<Address> = env.storage().persistent().get(&DataKey::DivisionMembers(division)).unwrap_or(vec![&env]);
        let mut result = Vec::new(&env);
        for i in 0..members.len() {
            if let Some(r) = env.storage().persistent().get::<_, SoulReaper>(&DataKey::Reaper(members.get(i).unwrap())) { result.push_back(r); }
        }
        result
    }

    pub fn get_all(env: Env) -> Vec<SoulReaper> {
        let owners: Vec<Address> = env.storage().persistent().get(&DataKey::AllReapers).unwrap_or(vec![&env]);
        let mut result = Vec::new(&env);
        for i in 0..owners.len() {
            if let Some(r) = env.storage().persistent().get::<_, SoulReaper>(&DataKey::Reaper(owners.get(i).unwrap())) { result.push_back(r); }
        }
        result
    }

    pub fn get_power_history(env: Env, owner: Address) -> Vec<PowerChange> {
        env.storage().persistent().get(&DataKey::PowerHistory(owner)).unwrap_or(vec![&env])
    }

    pub fn total_reapers(env: Env) -> u32 {
        env.storage().persistent().get(&DataKey::TotalReapers).unwrap_or(0)
    }

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("Not initialized");
        if *caller != admin { panic!("Not admin"); }
    }
}

mod test;
