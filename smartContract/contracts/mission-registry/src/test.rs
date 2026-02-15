#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{Env, String};

#[contract]
pub struct MockSoulBadge;

#[contractimpl]
impl MockSoulBadge {
    pub fn mint(env: Env, reaper: Address, mission_id: String, rank: String) {
        // Record the minting event for verification
        env.events().publish((symbol_short!("mint"),), (reaper, mission_id, rank));
    }
}

#[test]
fn test_mission_registry_lifecycle() {
    let env = Env::default();
    
    // 1. Register contracts
    let registry_id = env.register_contract(None, MissionRegistry);
    let registry_client = MissionRegistryClient::new(&env, &registry_id);
    
    let badge_id = env.register_contract(None, MockSoulBadge);

    let admin = Address::generate(&env);
    let captain = Address::generate(&env);
    let reaper = Address::generate(&env);
    let validator = Address::generate(&env);
    
    let mission_id = String::from_str(&env, "MISSION-99");
    let title = String::from_str(&env, "Suppression in Rukongai");
    let proof_cid = String::from_str(&env, "QmProof123");
    
    env.mock_all_auths();

    // 2. Setup inter-contract link
    registry_client.set_badge_contract(&admin, &badge_id);

    // 3. Register mission
    registry_client.register_mission(&captain, &mission_id, &title, &50);
    
    let mission = registry_client.get_mission(&mission_id).unwrap();
    assert_eq!(mission.title, title);
    assert_eq!(mission.status, String::from_str(&env, "ACTIVE"));

    // 4. Seal proof (triggers inter-contract call to SoulBadge.mint)
    registry_client.seal_proof(&validator, &reaper, &mission_id, &proof_cid);

    let updated_mission = registry_client.get_mission(&mission_id).unwrap();
    assert_eq!(updated_mission.status, String::from_str(&env, "SEALED"));

    // 5. Verify Soul Badge was minted via events (since it's a mock)
    // In a real test we'd check the events or storage of the mock
    // For now, this confirms the code executes without panicking
}
