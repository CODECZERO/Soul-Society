#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{Env, String};

#[test]
fn test_mission_registry_lifecycle() {
    let env = Env::default();
    let contract_id = env.register(MissionRegistry, ());
    let client = MissionRegistryClient::new(&env, &contract_id);

    let captain = Address::generate(&env);
    let mission_id = String::from_str(&env, "MISSION-99");
    let title = String::from_str(&env, "Suppression in Rukongai");
    
    env.mock_all_auths();

    // Register mission
    client.register_mission(&captain, &mission_id, &title, &3);
    
    let mission = client.get_mission(&mission_id).unwrap();
    assert_eq!(mission.title, title);
    assert_eq!(mission.status, String::from_str(&env, "ACTIVE"));

    // Seal proof
    let validator = Address::generate(&env);
    let proof_cid = String::from_str(&env, "QmProof123");
    client.seal_proof(&validator, &mission_id, &proof_cid);

    let updated_mission = client.get_mission(&mission_id).unwrap();
    assert_eq!(updated_mission.status, String::from_str(&env, "SEALED"));

    let proof = client.get_proof(&mission_id).unwrap();
    assert_eq!(proof.proof_cid, proof_cid);
    assert_eq!(proof.validator, validator);
}
