#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Env, Address, String, Vec,
};

mod test;

// ═══════════════════════════════════════════════════════════════════
//  ESCROW CONTRACT — LOCK, DO WORK, GET PAID
//  Architecture: Trustless escrow for charitable donations.
//  Flow: Donor donates → 50% immediate to NGO, 50% locked in escrow
//        → NGO completes task → Community verifies → Release or Refund
//  Dispute: Community votes; if scam (>60%) → 30-day lock → Refund
//  Rewards: Accurate scam detectors earn badges + tokens
// ═══════════════════════════════════════════════════════════════════

// ── Data Types ───────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum EscrowStatus {
    Locked,      // Funds locked, waiting for task completion
    Released,    // Task verified, funds released to NGO
    Disputed,    // Community flagged as scam, 30-day lock started
    Refunded,    // Dispute confirmed, funds returned to donor
}

#[derive(Clone, Debug)]
#[contracttype]
pub struct EscrowData {
    pub donor: Address,
    pub ngo: Address,
    pub total_amount: i128,
    pub locked_amount: i128,       // 50% held in escrow
    pub status: EscrowStatus,
    pub task_id: String,
    pub created_at: u64,           // ledger timestamp
    pub deadline: u64,             // task completion deadline
    pub dispute_start: u64,        // when dispute was initiated (0 if none)
    pub dispute_lock_days: u64,    // 30 days in ledger time
    pub real_votes: u32,           // votes saying "real"
    pub scam_votes: u32,           // votes saying "scam"
    pub proof_cid: String,         // IPFS CID of proof-of-work
    pub released_at: u64,          // when funds were released (0 if not)
}

/// Vote record to prevent double-voting
#[derive(Clone, Debug)]
#[contracttype]
pub struct VoteRecord {
    pub voter: Address,
    pub is_scam: bool,
    pub timestamp: u64,
}

/// Leaderboard entry for accurate voters
#[derive(Clone, Debug)]
#[contracttype]
pub struct VoterAccuracy {
    pub correct_votes: u32,
    pub total_votes: u32,
    pub rewards_earned: i128,
}

// ── Storage Keys ─────────────────────────────────────────────────

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Escrow(String),               // task_id → EscrowData
    Votes(String),                // task_id → Vec<VoteRecord>
    VoterStats(Address),          // voter → VoterAccuracy
    EscrowIndex,                  // → Vec<String> (all task_ids)
    NgoEscrows(Address),          // ngo → Vec<String> (their task_ids)
    DonorEscrows(Address),        // donor → Vec<String>
    TotalLocked,                  // Global total locked amount
    TotalReleased,                // Global total released amount
    TotalRefunded,                // Global total refunded amount
    DisputeThreshold,             // Vote % to trigger dispute (default 60)
    LockDuration,                 // Lock duration in ledger time (default ~30 days)
}

// ── Constants ────────────────────────────────────────────────────

const DEFAULT_DISPUTE_THRESHOLD: u32 = 60; // 60% scam votes to dispute
const DEFAULT_LOCK_DURATION: u64 = 2_592_000; // ~30 days in seconds
const MIN_VOTES_FOR_DECISION: u32 = 3;  // Minimum votes before resolving

// ── Contract ─────────────────────────────────────────────────────

#[contract]
pub struct EscrowContract;

#[allow(deprecated)]
#[contractimpl]
impl EscrowContract {

    // ── INITIALIZATION ──────────────────────────────────────────

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::TotalLocked, &0i128);
        env.storage().persistent().set(&DataKey::TotalReleased, &0i128);
        env.storage().persistent().set(&DataKey::TotalRefunded, &0i128);
        env.storage().persistent().set(&DataKey::DisputeThreshold, &DEFAULT_DISPUTE_THRESHOLD);
        env.storage().persistent().set(&DataKey::LockDuration, &DEFAULT_LOCK_DURATION);

        let empty_index: Vec<String> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::EscrowIndex, &empty_index);
    }

    // ── CREATE ESCROW ───────────────────────────────────────────

    /// Creates a new escrow. The donor locks `locked_amount` (typically 50% of total).
    /// The other 50% is sent directly to the NGO off-chain.
    pub fn create_escrow(
        env: Env,
        donor: Address,
        ngo: Address,
        total_amount: i128,
        locked_amount: i128,
        task_id: String,
        deadline: u64,
    ) {
        donor.require_auth();

        if locked_amount <= 0 || total_amount <= 0 {
            panic!("Amounts must be positive");
        }
        if locked_amount > total_amount {
            panic!("Locked amount cannot exceed total");
        }
        if env.storage().persistent().has(&DataKey::Escrow(task_id.clone())) {
            panic!("Escrow already exists for this task");
        }

        let now = env.ledger().timestamp();

        let escrow = EscrowData {
            donor: donor.clone(),
            ngo: ngo.clone(),
            total_amount,
            locked_amount,
            status: EscrowStatus::Locked,
            task_id: task_id.clone(),
            created_at: now,
            deadline,
            dispute_start: 0,
            dispute_lock_days: DEFAULT_LOCK_DURATION,
            real_votes: 0,
            scam_votes: 0,
            proof_cid: String::from_str(&env, ""),
            released_at: 0,
        };

        env.storage().persistent().set(&DataKey::Escrow(task_id.clone()), &escrow);

        // Initialize empty vote list
        let empty_votes: Vec<VoteRecord> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::Votes(task_id.clone()), &empty_votes);

        // Update indices
        let mut index: Vec<String> = env.storage().persistent()
            .get(&DataKey::EscrowIndex).unwrap_or(Vec::new(&env));
        index.push_back(task_id.clone());
        env.storage().persistent().set(&DataKey::EscrowIndex, &index);

        // Update NGO escrows
        let mut ngo_escrows: Vec<String> = env.storage().persistent()
            .get(&DataKey::NgoEscrows(ngo.clone())).unwrap_or(Vec::new(&env));
        ngo_escrows.push_back(task_id.clone());
        env.storage().persistent().set(&DataKey::NgoEscrows(ngo.clone()), &ngo_escrows);

        // Update donor escrows
        let mut donor_escrows: Vec<String> = env.storage().persistent()
            .get(&DataKey::DonorEscrows(donor.clone())).unwrap_or(Vec::new(&env));
        donor_escrows.push_back(task_id.clone());
        env.storage().persistent().set(&DataKey::DonorEscrows(donor.clone()), &donor_escrows);

        // Update global locked total
        let total_locked: i128 = env.storage().persistent()
            .get(&DataKey::TotalLocked).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TotalLocked, &(total_locked + locked_amount));

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("created")),
            (task_id, donor, ngo, locked_amount),
        );
    }

    // ── SUBMIT PROOF ────────────────────────────────────────────

    /// NGO submits proof of completed work (IPFS CID).
    pub fn submit_proof(env: Env, task_id: String, proof_cid: String) {
        let mut escrow: EscrowData = env.storage().persistent()
            .get(&DataKey::Escrow(task_id.clone()))
            .expect("Escrow not found");

        escrow.ngo.require_auth();

        if escrow.status != EscrowStatus::Locked {
            panic!("Escrow is not in Locked state");
        }

        escrow.proof_cid = proof_cid;
        env.storage().persistent().set(&DataKey::Escrow(task_id.clone()), &escrow);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("proof")),
            task_id,
        );
    }

    // ── COMMUNITY VOTE ──────────────────────────────────────────

    /// Community member votes on whether the task is real or a scam.
    /// Cannot vote on own escrow. Cannot double-vote.
    pub fn vote(env: Env, task_id: String, voter: Address, is_scam: bool) {
        voter.require_auth();

        let mut escrow: EscrowData = env.storage().persistent()
            .get(&DataKey::Escrow(task_id.clone()))
            .expect("Escrow not found");

        if escrow.status != EscrowStatus::Locked {
            panic!("Escrow is not in Locked state");
        }

        // Prevent donor/NGO from voting on their own escrow
        if voter == escrow.donor || voter == escrow.ngo {
            panic!("Cannot vote on own escrow");
        }

        // Check for double voting
        let mut votes: Vec<VoteRecord> = env.storage().persistent()
            .get(&DataKey::Votes(task_id.clone())).unwrap_or(Vec::new(&env));

        for i in 0..votes.len() {
            if votes.get(i).unwrap().voter == voter {
                panic!("Already voted");
            }
        }

        // Record vote
        let vote = VoteRecord {
            voter: voter.clone(),
            is_scam,
            timestamp: env.ledger().timestamp(),
        };
        votes.push_back(vote);
        env.storage().persistent().set(&DataKey::Votes(task_id.clone()), &votes);

        // Update escrow vote counts
        if is_scam {
            escrow.scam_votes += 1;
        } else {
            escrow.real_votes += 1;
        }
        env.storage().persistent().set(&DataKey::Escrow(task_id.clone()), &escrow);

        // Update voter stats
        let mut stats: VoterAccuracy = env.storage().persistent()
            .get(&DataKey::VoterStats(voter.clone()))
            .unwrap_or(VoterAccuracy {
                correct_votes: 0,
                total_votes: 0,
                rewards_earned: 0,
            });
        stats.total_votes += 1;
        env.storage().persistent().set(&DataKey::VoterStats(voter.clone()), &stats);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("vote")),
            (task_id, voter, is_scam),
        );
    }

    // ── RELEASE ESCROW ──────────────────────────────────────────

    /// Release locked funds to the NGO after community verification.
    /// Requires: status == Locked, real_votes > scam_votes, min votes met.
    pub fn release(env: Env, task_id: String) {
        let admin: Address = env.storage().persistent()
            .get(&DataKey::Admin).expect("Not initialized");
        admin.require_auth();

        let mut escrow: EscrowData = env.storage().persistent()
            .get(&DataKey::Escrow(task_id.clone()))
            .expect("Escrow not found");

        if escrow.status != EscrowStatus::Locked {
            panic!("Escrow is not in Locked state");
        }

        let total_votes = escrow.real_votes + escrow.scam_votes;
        if total_votes < MIN_VOTES_FOR_DECISION {
            panic!("Not enough votes to make a decision");
        }

        let real_pct = (escrow.real_votes as u64 * 100) / total_votes as u64;
        let threshold = env.storage().persistent()
            .get(&DataKey::DisputeThreshold).unwrap_or(DEFAULT_DISPUTE_THRESHOLD);

        if real_pct < threshold as u64 {
            panic!("Not enough real votes to release");
        }

        escrow.status = EscrowStatus::Released;
        escrow.released_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Escrow(task_id.clone()), &escrow);

        // Update global stats
        let total_locked: i128 = env.storage().persistent()
            .get(&DataKey::TotalLocked).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TotalLocked,
            &(total_locked - escrow.locked_amount));

        let total_released: i128 = env.storage().persistent()
            .get(&DataKey::TotalReleased).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TotalReleased,
            &(total_released + escrow.locked_amount));

        // Reward accurate voters
        Self::reward_voters(&env, &task_id, false);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("release")),
            (task_id, escrow.ngo, escrow.locked_amount),
        );
    }

    // ── DISPUTE ESCROW ──────────────────────────────────────────

    /// Initiate a dispute — starts the 30-day lock timer.
    /// Requires: scam_votes > threshold and min votes met.
    pub fn dispute(env: Env, task_id: String) {
        let admin: Address = env.storage().persistent()
            .get(&DataKey::Admin).expect("Not initialized");
        admin.require_auth();

        let mut escrow: EscrowData = env.storage().persistent()
            .get(&DataKey::Escrow(task_id.clone()))
            .expect("Escrow not found");

        if escrow.status != EscrowStatus::Locked {
            panic!("Escrow is not in Locked state");
        }

        let total_votes = escrow.real_votes + escrow.scam_votes;
        if total_votes < MIN_VOTES_FOR_DECISION {
            panic!("Not enough votes to dispute");
        }

        let scam_pct = (escrow.scam_votes as u64 * 100) / total_votes as u64;
        let threshold = env.storage().persistent()
            .get(&DataKey::DisputeThreshold).unwrap_or(DEFAULT_DISPUTE_THRESHOLD);

        if scam_pct < threshold as u64 {
            panic!("Not enough scam votes to dispute");
        }

        escrow.status = EscrowStatus::Disputed;
        escrow.dispute_start = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Escrow(task_id.clone()), &escrow);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("dispute")),
            (task_id, escrow.scam_votes, escrow.real_votes),
        );
    }

    // ── REFUND ESCROW ───────────────────────────────────────────

    /// Refund locked funds to the donor after the 30-day dispute lock.
    /// Requires: status == Disputed, lock period expired.
    pub fn refund(env: Env, task_id: String) {
        let admin: Address = env.storage().persistent()
            .get(&DataKey::Admin).expect("Not initialized");
        admin.require_auth();

        let mut escrow: EscrowData = env.storage().persistent()
            .get(&DataKey::Escrow(task_id.clone()))
            .expect("Escrow not found");

        if escrow.status != EscrowStatus::Disputed {
            panic!("Escrow must be in Disputed state to refund");
        }

        let now = env.ledger().timestamp();
        let lock_end = escrow.dispute_start + escrow.dispute_lock_days;
        if now < lock_end {
            panic!("Lock period has not expired yet");
        }

        escrow.status = EscrowStatus::Refunded;
        env.storage().persistent().set(&DataKey::Escrow(task_id.clone()), &escrow);

        // Update global stats
        let total_locked: i128 = env.storage().persistent()
            .get(&DataKey::TotalLocked).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TotalLocked,
            &(total_locked - escrow.locked_amount));

        let total_refunded: i128 = env.storage().persistent()
            .get(&DataKey::TotalRefunded).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TotalRefunded,
            &(total_refunded + escrow.locked_amount));

        // Reward accurate voters (those who correctly voted scam)
        Self::reward_voters(&env, &task_id, true);

        env.events().publish(
            (symbol_short!("escrow"), symbol_short!("refund")),
            (task_id, escrow.donor, escrow.locked_amount),
        );
    }

    // ── QUERIES ─────────────────────────────────────────────────

    /// Get escrow details by task ID.
    pub fn get_escrow(env: Env, task_id: String) -> EscrowData {
        env.storage().persistent()
            .get(&DataKey::Escrow(task_id))
            .expect("Escrow not found")
    }

    /// Get all escrows for an NGO.
    pub fn get_ngo_escrows(env: Env, ngo: Address) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::NgoEscrows(ngo))
            .unwrap_or(Vec::new(&env))
    }

    /// Get all escrows for a donor.
    pub fn get_donor_escrows(env: Env, donor: Address) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::DonorEscrows(donor))
            .unwrap_or(Vec::new(&env))
    }

    /// Get votes for a specific escrow.
    pub fn get_votes(env: Env, task_id: String) -> Vec<VoteRecord> {
        env.storage().persistent()
            .get(&DataKey::Votes(task_id))
            .unwrap_or(Vec::new(&env))
    }

    /// Get voter accuracy stats.
    pub fn get_voter_stats(env: Env, voter: Address) -> VoterAccuracy {
        env.storage().persistent()
            .get(&DataKey::VoterStats(voter))
            .unwrap_or(VoterAccuracy {
                correct_votes: 0,
                total_votes: 0,
                rewards_earned: 0,
            })
    }

    /// Get global platform stats.
    pub fn get_platform_stats(env: Env) -> (i128, i128, i128) {
        let locked: i128 = env.storage().persistent()
            .get(&DataKey::TotalLocked).unwrap_or(0);
        let released: i128 = env.storage().persistent()
            .get(&DataKey::TotalReleased).unwrap_or(0);
        let refunded: i128 = env.storage().persistent()
            .get(&DataKey::TotalRefunded).unwrap_or(0);
        (locked, released, refunded)
    }

    /// Get all escrow task IDs.
    pub fn get_all_escrow_ids(env: Env) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::EscrowIndex)
            .unwrap_or(Vec::new(&env))
    }

    // ── INTERNAL HELPERS ────────────────────────────────────────

    /// Reward voters who voted correctly.
    /// If was_scam=true, those who voted "scam" were correct.
    /// If was_scam=false, those who voted "real" were correct.
    fn reward_voters(env: &Env, task_id: &String, was_scam: bool) {
        let votes: Vec<VoteRecord> = env.storage().persistent()
            .get(&DataKey::Votes(task_id.clone()))
            .unwrap_or(Vec::new(env));

        for i in 0..votes.len() {
            let vote = votes.get(i).unwrap();
            let voted_correctly = vote.is_scam == was_scam;

            if voted_correctly {
                let mut stats: VoterAccuracy = env.storage().persistent()
                    .get(&DataKey::VoterStats(vote.voter.clone()))
                    .unwrap_or(VoterAccuracy {
                        correct_votes: 0,
                        total_votes: 0,
                        rewards_earned: 0,
                    });
                stats.correct_votes += 1;
                stats.rewards_earned += 10; // 10 Reiatsu per correct vote
                env.storage().persistent().set(&DataKey::VoterStats(vote.voter.clone()), &stats);
            }
        }
    }
}
