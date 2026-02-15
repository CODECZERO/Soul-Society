#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{Env, String};

#[test]
fn test_badge_minting() {
    let env = Env::default();
    let contract_id = env.register(SoulBadge, ());
    let client = SoulBadgeClient::new(&env, &contract_id);

    let reaper = Address::generate(&env);
    let mission_id = String::from_str(&env, "MISSION-001");
    let rank = String::from_str(&env, "HIGHT-TIER");

    client.mint(&reaper, &mission_id, &rank);
    
    let badges = client.get_badges(&reaper);
    assert_eq!(badges.len(), 1);
    assert_eq!(badges.get(0).unwrap().mission_id, mission_id);
}
