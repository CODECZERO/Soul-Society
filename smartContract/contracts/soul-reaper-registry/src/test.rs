#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol, String as SorobanString};

fn setup() -> (Env, SoulReaperRegistryClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(SoulReaperRegistry, ());
    let client = SoulReaperRegistryClient::new(&env, &id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, client, admin)
}

#[test]
fn test_register_reaper() {
    let (env, client, _admin) = setup();
    let owner = Address::generate(&env);
    client.register(&owner, &SorobanString::from_str(&env, "Ichigo"), &5, &Symbol::new(&env, "Captain"), &9000);
    
    let reaper = client.get_reaper(&owner).unwrap();
    assert_eq!(reaper.division, 5);
    assert_eq!(reaper.power_level, 9000);
    assert_eq!(reaper.status, ReaperStatus::Active);
    assert_eq!(client.total_reapers(), 1);
}

#[test]
fn test_division_filtering() {
    let (env, client, _admin) = setup();
    let o1 = Address::generate(&env);
    let o2 = Address::generate(&env);
    let o3 = Address::generate(&env);
    
    client.register(&o1, &SorobanString::from_str(&env, "A"), &3, &Symbol::new(&env, "Lt"), &100);
    client.register(&o2, &SorobanString::from_str(&env, "B"), &3, &Symbol::new(&env, "Lt"), &200);
    client.register(&o3, &SorobanString::from_str(&env, "C"), &7, &Symbol::new(&env, "Lt"), &300);
    
    let div3 = client.get_by_division(&3);
    assert_eq!(div3.len(), 2);
    let div7 = client.get_by_division(&7);
    assert_eq!(div7.len(), 1);
}

#[test]
fn test_update_power_with_history() {
    let (env, client, _admin) = setup();
    let owner = Address::generate(&env);
    client.register(&owner, &SorobanString::from_str(&env, "Kenpachi"), &11, &Symbol::new(&env, "Captain"), &5000);
    client.update_power(&owner, &9000);
    
    let reaper = client.get_reaper(&owner).unwrap();
    assert_eq!(reaper.power_level, 9000);
    
    let history = client.get_power_history(&owner);
    assert_eq!(history.len(), 2);
    assert_eq!(history.get(1).unwrap().old_power, 5000);
    assert_eq!(history.get(1).unwrap().new_power, 9000);
}

#[test]
fn test_promote() {
    let (env, client, admin) = setup();
    let owner = Address::generate(&env);
    client.register(&owner, &SorobanString::from_str(&env, "Renji"), &6, &Symbol::new(&env, "Lt"), &3000);
    client.promote(&admin, &owner, &Symbol::new(&env, "Captain"));
    let reaper = client.get_reaper(&owner).unwrap();
    assert_eq!(reaper.rank, Symbol::new(&env, "Captain"));
}

#[test]
fn test_suspend_and_reinstate() {
    let (env, client, admin) = setup();
    let owner = Address::generate(&env);
    client.register(&owner, &SorobanString::from_str(&env, "Gin"), &3, &Symbol::new(&env, "Captain"), &7000);
    
    client.suspend(&admin, &owner);
    assert_eq!(client.get_reaper(&owner).unwrap().status, ReaperStatus::Suspended);
    
    client.reinstate(&admin, &owner);
    assert_eq!(client.get_reaper(&owner).unwrap().status, ReaperStatus::Active);
}

#[test]
#[should_panic(expected = "Division must be 1-13")]
fn test_invalid_division() {
    let (env, client, _admin) = setup();
    let owner = Address::generate(&env);
    client.register(&owner, &SorobanString::from_str(&env, "X"), &14, &Symbol::new(&env, "Lt"), &100);
}

#[test]
#[should_panic(expected = "Suspended")]
fn test_suspended_cannot_update_power() {
    let (env, client, admin) = setup();
    let owner = Address::generate(&env);
    client.register(&owner, &SorobanString::from_str(&env, "S"), &1, &Symbol::new(&env, "Lt"), &100);
    client.suspend(&admin, &owner);
    client.update_power(&owner, &200);
}
