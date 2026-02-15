use soroban_sdk::{contract, contractimpl, contracttype, contractevent, symbol_short, Env, Address};

mod test;

#[contracttype]
pub enum DataKey {
    Balance(Address),
}

#[contract]
pub struct DivisionTreasury;

#[contractimpl]
impl DivisionTreasury {
    /// Deposit XLM (Reiatsu) into the Division Treasury
    pub fn deposit(env: Env, divider: Address, amount: i128) {
        divider.require_auth();
        
        let mut balance: i128 = env.storage().persistent().get(&DataKey::Balance(divider.clone())).unwrap_or(0);
        balance += amount;
        
        env.storage().persistent().set(&DataKey::Balance(divider.clone()), &balance);
        
        env.events().publish(
            (symbol_short!("treasury"), symbol_short!("deposit")),
            (divider, amount)
        );
    }

    /// Withdraw funds for tactical allocation
    pub fn withdraw(env: Env, divider: Address, amount: i128) {
        divider.require_auth();
        
        let mut balance: i128 = env.storage().persistent().get(&DataKey::Balance(divider.clone())).unwrap_or(0);
        if balance < amount {
            panic!("Insufficient Reiatsu in Treasury");
        }
        
        balance -= amount;
        env.storage().persistent().set(&DataKey::Balance(divider.clone()), &balance);
        
        env.events().publish(
            (symbol_short!("treasury"), symbol_short!("withdraw")),
            (divider, amount)
        );
    }

    /// Get current balance of a Division
    pub fn get_balance(env: Env, divider: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(divider)).unwrap_or(0)
    }
}
