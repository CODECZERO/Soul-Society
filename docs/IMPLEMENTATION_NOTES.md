# Contract Implementation Details

## 1. Division Treasury
- **Storage**: Maps `Address` (NGO) to `i128` (Balance).
- **Security**: NGO must authorize deposits/withdrawals.

## 2. Soul Badge
- **Storage**: Vector of `Badge` structs per `Address`.
- **Badge Struct**: `mission_id`, `rank`, `timestamp`.
