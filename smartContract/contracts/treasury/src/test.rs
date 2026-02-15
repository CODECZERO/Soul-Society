#![cfg(test)]
use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, Address};

#[test]
fn test_treasury_lifecycle() {
    let env = Env::default();
    let contract_id = env.register(DivisionTreasury, ());
    let client = DivisionTreasuryClient::new(&env, &contract_id);

    let divider = Address::generate(&env);
    env.mock_all_auths();

    // Test deposit
    client.deposit(&divider, &1000);
    assert_eq!(client.get_balance(&divider), 1000);

    // Test withdraw
    client.withdraw(&divider, &400);
    assert_eq!(client.get_balance(&divider), 600);
}

#[test]
#[should_panic(expected = "Insufficient Reiatsu in Treasury")]
fn test_insufficient_funds() {
    let env = Env::default();
    let contract_id = env.register(DivisionTreasury, ());
    let client = DivisionTreasuryClient::new(&env, &contract_id);

    let divider = Address::generate(&env);
    env.mock_all_auths();

    client.deposit(&divider, &100);
    client.withdraw(&divider, &200);
}
