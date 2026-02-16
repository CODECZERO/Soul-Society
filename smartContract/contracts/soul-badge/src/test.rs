#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String as SorobanString};

fn setup() -> (Env, SoulBadgeClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let id = env.register(SoulBadge, ());
    let client = SoulBadgeClient::new(&env, &id);
    let admin = Address::generate(&env);
    client.initialize(&admin);
    (env, client, admin)
}

#[test]
fn test_mint_badge() {
    let (env, client, _admin) = setup();
    let reaper = Address::generate(&env);
    client.mint(&reaper, &SorobanString::from_str(&env, "M001"), &SorobanString::from_str(&env, "Captain"));
    assert_eq!(client.badge_count(&reaper), 1);
    assert_eq!(client.total_badges(), 1);
    let badges = client.get_badges(&reaper);
    assert_eq!(badges.len(), 1);
    assert_eq!(badges.get(0).unwrap().tier, BadgeTier::Bronze);
}

#[test]
fn test_tier_progression() {
    let (env, client, _admin) = setup();
    let reaper = Address::generate(&env);
    // Mint 5 badges to reach Silver
    client.mint(&reaper, &SorobanString::from_str(&env, "M0"), &SorobanString::from_str(&env, "Lt"));
    client.mint(&reaper, &SorobanString::from_str(&env, "M1"), &SorobanString::from_str(&env, "Lt"));
    client.mint(&reaper, &SorobanString::from_str(&env, "M2"), &SorobanString::from_str(&env, "Lt"));
    client.mint(&reaper, &SorobanString::from_str(&env, "M3"), &SorobanString::from_str(&env, "Lt"));
    client.mint(&reaper, &SorobanString::from_str(&env, "M4"), &SorobanString::from_str(&env, "Lt"));
    // After 5 mints, active_count before 6th mint = 5 → Silver
    client.mint(&reaper, &SorobanString::from_str(&env, "M5"), &SorobanString::from_str(&env, "Lt"));
    let badges = client.get_badges(&reaper);
    // First 5 badges are Bronze (active_count 0..=4), 6th is Silver
    assert_eq!(badges.get(4).unwrap().tier, BadgeTier::Bronze);
    assert_eq!(badges.get(5).unwrap().tier, BadgeTier::Silver);
}

#[test]
fn test_verify_badge() {
    let (env, client, _admin) = setup();
    let reaper = Address::generate(&env);
    client.mint(&reaper, &SorobanString::from_str(&env, "V001"), &SorobanString::from_str(&env, "Captain"));
    assert!(client.verify_badge(&reaper, &SorobanString::from_str(&env, "V001")));
    assert!(!client.verify_badge(&reaper, &SorobanString::from_str(&env, "V999")));
}

#[test]
fn test_revoke_badge() {
    let (env, client, admin) = setup();
    let reaper = Address::generate(&env);
    client.mint(&reaper, &SorobanString::from_str(&env, "R001"), &SorobanString::from_str(&env, "Lt"));
    assert_eq!(client.badge_count(&reaper), 1);
    
    client.revoke(&admin, &reaper, &SorobanString::from_str(&env, "R001"));
    assert_eq!(client.badge_count(&reaper), 0);
    assert!(!client.verify_badge(&reaper, &SorobanString::from_str(&env, "R001")));
}

#[test]
fn test_leaderboard() {
    let (env, client, _admin) = setup();
    let r1 = Address::generate(&env);
    let r2 = Address::generate(&env);
    
    // r1 gets 3 badges, r2 gets 1
    client.mint(&r1, &SorobanString::from_str(&env, "A0"), &SorobanString::from_str(&env, "Lt"));
    client.mint(&r1, &SorobanString::from_str(&env, "A1"), &SorobanString::from_str(&env, "Lt"));
    client.mint(&r1, &SorobanString::from_str(&env, "A2"), &SorobanString::from_str(&env, "Lt"));
    client.mint(&r2, &SorobanString::from_str(&env, "B0"), &SorobanString::from_str(&env, "Lt"));
    
    let top = client.get_top_reapers(&10);
    assert_eq!(top.len(), 2);
    assert_eq!(top.get(0).unwrap().badge_count, 3);
    assert_eq!(top.get(1).unwrap().badge_count, 1);
}
