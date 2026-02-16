#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Env, Address, String, Vec, vec, IntoVal,
};

mod test;

// ═══════════════════════════════════════════════════════════════════
//  MISSION REGISTRY v2 — FULL LIFECYCLE, DEADLINES, MULTI-VALIDATOR
// ═══════════════════════════════════════════════════════════════════

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MissionStatus {
    Active,
    InProgress,
    Review,
    Sealed,
    Failed,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Mission {
    pub title: String,
    pub danger_level: u32,
    pub status: MissionStatus,
    pub captain: Address,
    pub created_at: u64,
    pub deadline: u64,          // Timestamp; 0 = no deadline
    pub seal_count: u32,        // Number of validator seals
    pub required_seals: u32,    // 1 for Low/Med, 2+ for High/Extreme
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MissionProof {
    pub mission_id: String,
    pub proof_cid: String,
    pub validator: Address,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MissionCounter {
    pub total: u32,
    pub active: u32,
    pub sealed: u32,
    pub failed: u32,
}

#[contracttype]
pub enum DataKey {
    Mission(String),
    Proof(String),
    MissionValidators(String),   // Vec<Address> of validators who sealed
    Counter,
    CaptainMissions(Address),    // Vec<String> of mission IDs per captain
    BadgeContract,
    TokenContract,
    Admin,
}

#[contract]
pub struct MissionRegistry;

#[allow(deprecated)]
#[contractimpl]
impl MissionRegistry {

    // ── INITIALIZATION ───────────────────────────────────────────

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::Counter, &MissionCounter {
            total: 0, active: 0, sealed: 0, failed: 0,
        });
    }

    // ── ADMIN CONFIG ─────────────────────────────────────────────

    pub fn set_badge_contract(env: Env, admin: Address, badge_contract: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&DataKey::BadgeContract, &badge_contract);
    }

    pub fn set_token_contract(env: Env, admin: Address, token_contract: Address) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        env.storage().instance().set(&DataKey::TokenContract, &token_contract);
    }

    // ── MISSION LIFECYCLE ────────────────────────────────────────

    /// Register a new mission. Danger level determines seal requirements.
    pub fn register_mission(
        env: Env, captain: Address, mission_id: String,
        title: String, danger_level: u32, deadline: u64,
    ) {
        captain.require_auth();

        if env.storage().persistent().has(&DataKey::Mission(mission_id.clone())) {
            panic!("Mission ID already exists");
        }

        // High/Extreme danger = 2 seals required, else 1
        let required_seals = if danger_level > 70 { 2 } else { 1 };

        let mission = Mission {
            title,
            danger_level,
            status: MissionStatus::Active,
            captain: captain.clone(),
            created_at: env.ledger().timestamp(),
            deadline,
            seal_count: 0,
            required_seals,
        };

        env.storage().persistent().set(&DataKey::Mission(mission_id.clone()), &mission);
        env.storage().persistent().set(
            &DataKey::MissionValidators(mission_id.clone()), &Vec::<Address>::new(&env)
        );

        // Track missions per captain
        let mut captain_missions: Vec<String> = env.storage().persistent()
            .get(&DataKey::CaptainMissions(captain.clone()))
            .unwrap_or(vec![&env]);
        captain_missions.push_back(mission_id.clone());
        env.storage().persistent().set(&DataKey::CaptainMissions(captain), &captain_missions);

        // Update counter
        let mut counter: MissionCounter = Self::get_counter_internal(&env);
        counter.total += 1;
        counter.active += 1;
        env.storage().persistent().set(&DataKey::Counter, &counter);

        env.events().publish(
            (symbol_short!("mission"), symbol_short!("reg")),
            (mission_id, env.ledger().timestamp()),
        );
    }

    /// Advance mission status: Active → InProgress → Review
    pub fn advance_status(env: Env, captain: Address, mission_id: String) {
        captain.require_auth();

        let mut mission: Mission = env.storage().persistent()
            .get(&DataKey::Mission(mission_id.clone())).expect("Mission not found");

        if mission.captain != captain {
            panic!("Only the captain can advance status");
        }

        mission.status = match mission.status {
            MissionStatus::Active => MissionStatus::InProgress,
            MissionStatus::InProgress => MissionStatus::Review,
            _ => panic!("Cannot advance from current status"),
        };

        env.storage().persistent().set(&DataKey::Mission(mission_id.clone()), &mission);

        env.events().publish(
            (symbol_short!("mission"), symbol_short!("advance")),
            (mission_id, env.ledger().timestamp()),
        );
    }

    /// Seal a mission with proof. Multi-validator for high-danger missions.
    pub fn seal_proof(
        env: Env, validator: Address, reaper: Address,
        mission_id: String, proof_cid: String,
    ) {
        validator.require_auth();

        let mut mission: Mission = env.storage().persistent()
            .get(&DataKey::Mission(mission_id.clone())).expect("Mission not found");

        if mission.status == MissionStatus::Sealed {
            panic!("Mission already sealed");
        }
        if mission.status == MissionStatus::Failed || mission.status == MissionStatus::Expired {
            panic!("Mission is failed/expired");
        }

        // Check deadline
        if mission.deadline > 0 && env.ledger().timestamp() > mission.deadline {
            mission.status = MissionStatus::Expired;
            env.storage().persistent().set(&DataKey::Mission(mission_id.clone()), &mission);

            let mut counter = Self::get_counter_internal(&env);
            if counter.active > 0 { counter.active -= 1; }
            counter.failed += 1;
            env.storage().persistent().set(&DataKey::Counter, &counter);

            panic!("Mission deadline has passed");
        }

        // Check validator hasn't already sealed this mission
        let mut validators: Vec<Address> = env.storage().persistent()
            .get(&DataKey::MissionValidators(mission_id.clone()))
            .unwrap_or(vec![&env]);
        for i in 0..validators.len() {
            if validators.get(i).unwrap() == validator {
                panic!("Validator already sealed this mission");
            }
        }
        validators.push_back(validator.clone());
        env.storage().persistent().set(
            &DataKey::MissionValidators(mission_id.clone()), &validators
        );

        mission.seal_count += 1;

        // Store proof
        let proof = MissionProof {
            mission_id: mission_id.clone(),
            proof_cid,
            validator: validator.clone(),
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Proof(mission_id.clone()), &proof);

        // Check if enough seals to finalize
        if mission.seal_count >= mission.required_seals {
            mission.status = MissionStatus::Sealed;

            let mut counter = Self::get_counter_internal(&env);
            if counter.active > 0 { counter.active -= 1; }
            counter.sealed += 1;
            env.storage().persistent().set(&DataKey::Counter, &counter);

            // Inter-contract: Mint Soul Badge
            if let Some(badge_id) = env.storage().instance().get::<_, Address>(&DataKey::BadgeContract) {
                let rank = if mission.danger_level > 80 {
                    String::from_str(&env, "Captain")
                } else if mission.danger_level > 40 {
                    String::from_str(&env, "Lieutenant")
                } else {
                    String::from_str(&env, "Assistant Reaper")
                };
                env.invoke_contract::<()>(
                    &badge_id, &symbol_short!("mint"),
                    (reaper.clone(), mission_id.clone(), rank).into_val(&env),
                );
            }

            // Inter-contract: Mint Reiatsu Token reward
            if let Some(token_id) = env.storage().instance().get::<_, Address>(&DataKey::TokenContract) {
                let reward: i128 = 100 + (mission.danger_level as i128 * 10);
                let minter = env.current_contract_address();
                env.invoke_contract::<()>(
                    &token_id, &symbol_short!("mint"),
                    (minter, reaper.clone(), reward).into_val(&env),
                );
            }
        }

        env.storage().persistent().set(&DataKey::Mission(mission_id.clone()), &mission);

        env.events().publish(
            (symbol_short!("mission"), symbol_short!("sealed")),
            (mission_id, env.ledger().timestamp()),
        );
    }

    /// Mark a mission as failed (admin or captain only).
    pub fn fail_mission(env: Env, caller: Address, mission_id: String) {
        caller.require_auth();

        let mut mission: Mission = env.storage().persistent()
            .get(&DataKey::Mission(mission_id.clone())).expect("Mission not found");

        let is_admin = Self::is_admin(&env, &caller);
        if !is_admin && mission.captain != caller {
            panic!("Only admin or captain can fail a mission");
        }

        mission.status = MissionStatus::Failed;
        env.storage().persistent().set(&DataKey::Mission(mission_id.clone()), &mission);

        let mut counter = Self::get_counter_internal(&env);
        if counter.active > 0 { counter.active -= 1; }
        counter.failed += 1;
        env.storage().persistent().set(&DataKey::Counter, &counter);

        env.events().publish(
            (symbol_short!("mission"), symbol_short!("failed")),
            (mission_id, env.ledger().timestamp()),
        );
    }

    // ── QUERIES ──────────────────────────────────────────────────

    pub fn get_mission(env: Env, mission_id: String) -> Option<Mission> {
        env.storage().persistent().get(&DataKey::Mission(mission_id))
    }

    pub fn get_proof(env: Env, mission_id: String) -> Option<MissionProof> {
        env.storage().persistent().get(&DataKey::Proof(mission_id))
    }

    pub fn get_counter(env: Env) -> MissionCounter {
        Self::get_counter_internal(&env)
    }

    pub fn get_missions_by_captain(env: Env, captain: Address) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::CaptainMissions(captain))
            .unwrap_or(vec![&env])
    }

    pub fn get_validators(env: Env, mission_id: String) -> Vec<Address> {
        env.storage().persistent()
            .get(&DataKey::MissionValidators(mission_id))
            .unwrap_or(vec![&env])
    }

    // ── INTERNALS ────────────────────────────────────────────────

    fn get_counter_internal(env: &Env) -> MissionCounter {
        env.storage().persistent().get(&DataKey::Counter)
            .unwrap_or(MissionCounter { total: 0, active: 0, sealed: 0, failed: 0 })
    }

    fn require_admin(env: &Env, caller: &Address) {
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin).expect("Not initialized");
        if *caller != admin { panic!("Not admin"); }
    }

    fn is_admin(env: &Env, caller: &Address) -> bool {
        if let Some(admin) = env.storage().instance().get::<_, Address>(&DataKey::Admin) {
            *caller == admin
        } else {
            false
        }
    }
}
