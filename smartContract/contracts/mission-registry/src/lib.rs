#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Address, String, Map, map, IntoVal, Val};

mod test;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Mission {
    pub title: String,
    pub danger_level: u32,
    pub status: String,
    pub captain: Address,
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
pub enum DataKey {
    Mission(String),
    Proof(String),
    BadgeContract,
}

#[contract]
pub struct MissionRegistry;

#[contractimpl]
impl MissionRegistry {
    /// Configure the Soul Badge contract address (Admin only)
    pub fn set_badge_contract(env: Env, admin: Address, badge_contract: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::BadgeContract, &badge_contract);
    }

    /// Register a strategic mission in the Seireitei Registry
    pub fn register_mission(env: Env, captain: Address, mission_id: String, title: String, danger_level: u32) {
        captain.require_auth();
        
        let mission = Mission {
            title,
            danger_level,
            status: String::from_str(&env, "ACTIVE"),
            captain,
        };
        
        env.storage().persistent().set(&DataKey::Mission(mission_id.clone()), &mission);
        
        env.events().publish(
            (symbol_short!("mission"), symbol_short!("reg")),
            (mission_id, env.ledger().timestamp())
        );
    }

    /// Seal tactical proof for a mission and mint a Soul Badge for the Reaper
    pub fn seal_proof(env: Env, validator: Address, reaper: Address, mission_id: String, proof_cid: String) {
        validator.require_auth();
        
        // Ensure mission exists
        let mut mission: Mission = env.storage().persistent().get(&DataKey::Mission(mission_id.clone())).expect("Mission not found");
        mission.status = String::from_str(&env, "SEALED");
        
        let proof = MissionProof {
            mission_id: mission_id.clone(),
            proof_cid,
            validator: validator.clone(),
            timestamp: env.ledger().timestamp(),
        };
        
        env.storage().persistent().set(&DataKey::Mission(mission_id.clone()), &mission);
        env.storage().persistent().set(&DataKey::Proof(mission_id.clone()), &proof);
        
        // --- INTER-CONTRACT CALL ---
        // Retrieve the Soul Badge contract ID
        if let Some(badge_contract_id) = env.storage().instance().get::<_, Address>(&DataKey::BadgeContract) {
            // Define the rank based on danger level
            let rank = if mission.danger_level > 80 {
                String::from_str(&env, "Captain")
            } else if mission.danger_level > 40 {
                String::from_str(&env, "Lieutenant")
            } else {
                String::from_str(&env, "Assistant Reaper")
            };

            // Invoke the Soul Badge contract's mint function
            // We use the generic invoke_contract to avoid WASM dependencies at build time
            env.invoke_contract::<()>(
                &badge_contract_id,
                &symbol_short!("mint"),
                (reaper, mission_id.clone(), rank).into_val(&env),
            );
        }
        // ---------------------------

        env.events().publish(
            (symbol_short!("mission"), symbol_short!("sealed")),
            (mission_id, env.ledger().timestamp())
        );
    }

    /// Retrieve mission details
    pub fn get_mission(env: Env, mission_id: String) -> Option<Mission> {
        env.storage().persistent().get(&DataKey::Mission(mission_id))
    }

    /// Retrieve mission proof
    pub fn get_proof(env: Env, mission_id: String) -> Option<MissionProof> {
        env.storage().persistent().get(&DataKey::Proof(mission_id))
    }
}
