#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String as SorobanString};

fn setup() -> (Env, MissionRegistryClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(MissionRegistry, ());
    let client = MissionRegistryClient::new(&env, &id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, client, admin)
}

#[test]
fn test_register_mission() {
    let (env, client, _admin) = setup();
    let captain = Address::generate(&env);
    client.register_mission(
        &captain,
        &SorobanString::from_str(&env, "M001"),
        &SorobanString::from_str(&env, "Rescue Op"),
        &30, &0,
    );
    let mission = client.get_mission(&SorobanString::from_str(&env, "M001"));
    assert!(mission.is_some());
    let m = mission.unwrap();
    assert_eq!(m.status, MissionStatus::Active);
    assert_eq!(m.required_seals, 1);
    
    let counter = client.get_counter();
    assert_eq!(counter.total, 1);
    assert_eq!(counter.active, 1);
}

#[test]
fn test_high_danger_requires_two_seals() {
    let (env, client, _admin) = setup();
    let captain = Address::generate(&env);
    client.register_mission(
        &captain,
        &SorobanString::from_str(&env, "EXTREME01"),
        &SorobanString::from_str(&env, "Extreme Danger"),
        &90, &0,
    );
    let m = client.get_mission(&SorobanString::from_str(&env, "EXTREME01")).unwrap();
    assert_eq!(m.required_seals, 2);
}

#[test]
fn test_advance_status() {
    let (env, client, _admin) = setup();
    let captain = Address::generate(&env);
    client.register_mission(
        &captain,
        &SorobanString::from_str(&env, "ADV01"),
        &SorobanString::from_str(&env, "Advance Test"),
        &20, &0,
    );
    client.advance_status(&captain, &SorobanString::from_str(&env, "ADV01"));
    let m = client.get_mission(&SorobanString::from_str(&env, "ADV01")).unwrap();
    assert_eq!(m.status, MissionStatus::InProgress);

    client.advance_status(&captain, &SorobanString::from_str(&env, "ADV01"));
    let m2 = client.get_mission(&SorobanString::from_str(&env, "ADV01")).unwrap();
    assert_eq!(m2.status, MissionStatus::Review);
}

#[test]
fn test_seal_proof_low_danger() {
    let (env, client, _admin) = setup();
    let captain = Address::generate(&env);
    let validator = Address::generate(&env);
    let reaper = Address::generate(&env);

    client.register_mission(
        &captain,
        &SorobanString::from_str(&env, "SEAL01"),
        &SorobanString::from_str(&env, "Seal Test"),
        &20, &0,
    );

    client.seal_proof(
        &validator, &reaper,
        &SorobanString::from_str(&env, "SEAL01"),
        &SorobanString::from_str(&env, "QmProofCID"),
    );

    let m = client.get_mission(&SorobanString::from_str(&env, "SEAL01")).unwrap();
    assert_eq!(m.status, MissionStatus::Sealed);
    
    let counter = client.get_counter();
    assert_eq!(counter.sealed, 1);
    assert_eq!(counter.active, 0);
}

#[test]
fn test_fail_mission() {
    let (env, client, admin) = setup();
    let captain = Address::generate(&env);
    client.register_mission(
        &captain,
        &SorobanString::from_str(&env, "FAIL01"),
        &SorobanString::from_str(&env, "Fail Test"),
        &30, &0,
    );

    client.fail_mission(&admin, &SorobanString::from_str(&env, "FAIL01"));
    let m = client.get_mission(&SorobanString::from_str(&env, "FAIL01")).unwrap();
    assert_eq!(m.status, MissionStatus::Failed);

    let counter = client.get_counter();
    assert_eq!(counter.failed, 1);
}

#[test]
fn test_captain_missions_tracking() {
    let (env, client, _admin) = setup();
    let captain = Address::generate(&env);

    client.register_mission(&captain, &SorobanString::from_str(&env, "CM1"), &SorobanString::from_str(&env, "A"), &10, &0);
    client.register_mission(&captain, &SorobanString::from_str(&env, "CM2"), &SorobanString::from_str(&env, "B"), &20, &0);

    let missions = client.get_missions_by_captain(&captain);
    assert_eq!(missions.len(), 2);
}
