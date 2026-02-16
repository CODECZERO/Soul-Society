# Seireitei Vault: Technical Deep-Dive 🛡️🌌

The Seireitei Vault is a high-performance, decentralized NoSQL database replacement built on the Stellar Soroban network. It provides a zero-dependency data layer for the Gotei 13 protocol.

## 1. Architectural Foundation
The vault leverages Soroban's **Persistent Storage** to ensure data durability across the Stellar network.

### Data Key Structure
All records are stored using a structured `DataKey`:
```rust
pub enum DataKey {
    Vault(Symbol, Symbol), // (Collection, RecordID)
}
```
- **Collection**: Acts as a "Table" (e.g., `Users`, `Posts`, `Donations`).
- **RecordID**: A unique identifier (e.g., `nanoid` generated in the backend).

## 2. High-Velocity Compression (Zstandard)
To minimize on-chain storage costs and ledger bloat, the vault utilizes **Zstandard (Zstd)** via the `zstd-codec` (WASM).

- **Workflow**:
  1. Backend stringifies the JSON document.
  2. Zstd compresses the string into a binary BLOB.
  3. The BLOB is sent to the `put` function of the Soroban contract.
- **Efficiency**: Zstd provides up to 70% storage reduction compared to raw JSON, with near-instantaneous operation speeds.

## 3. Decentralized Indexing Strategy
Since raw Key-Value storage doesn't support "Query All" or "Lookup by Field", the Seireitei Vault implements a multi-layer indexing strategy in the application/service layer.

### Primary Index (Collection Index)
Every time a record is added, its ID is appended to a special index record:
- **Key**: `System:CollectionName_Index`
- **Value**: `[ID1, ID2, ID3, ...]`

### Secondary Index (Lookup Index)
Enables high-speed lookups by non-primary fields (e.g., looking up a user by Email).
- **Key**: `CollectionName_FieldName_Index:FieldValue`
- **Value**: `RecordID`

## 4. On-Chain API Reference

| Function | Parameters | Description |
| :--- | :--- | :--- |
| `put` | `(env, collection, id, data)` | Persists a Zstd binary BLOB in the specified collection. |
| `get` | `(env, collection, id)` | Retrieves the binary BLOB for the given record. |
| `has` | `(env, collection, id)` | Checks for the existence of a specific record ID. |

## 5. Backend Integration
The `SeireiteiVaultService` in the Node.js backend handles:
- **Automation**: Automatic ID generation and secondary indexing.
- **RPC Orchestration**: Uses `simulateTransaction` for non-mutating reads (GET) and `TransactionBuilder` for on-chain writes (PUT).
- **Graceful Failover**: Environment-aware logic for Testnet connectivity.

---
**Protocol Status**: Fully Decentralized. **Infrastructure**: 0 External Databases. ⚔️🛡️⚖️📜🌐🌌🚀🏧💨⚡
