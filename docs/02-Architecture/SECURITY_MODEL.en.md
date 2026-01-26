# Security Model

Security is the bouncer at the club door. No one gets in without being on the list.

## Key Concepts

### 1. Profiles

Each user has a `profile_id`.

- `1` = Admin
- `2` = Public (Not logged in)
- `3` = Client, etc.

### 2. Transactions (`tx`)

Every action in the system has a unique number.

- `101`: Login
- `501`: View Reports

### 3. Permissions Matrix

The `security.permissions` table crosses Profiles with Transactions.

| Profile    | Transaction (`tx`) | Allowed? |
| :--------- | :----------------- | :------- |
| Admin (1)  | View Reports (501) | ✅ YES   |
| Public (2) | View Reports (501) | ❌ NO    |
| Public (2) | Login (101)        | ✅ YES   |

## Authentication vs Authorization

- **Authentication**: "Who are you?". Solved with Login (Email/Password) and Sessions.
- **Authorization**: "What can you do?". Solved by checking the permissions matrix described above.

## How to add permissions

When you create a new feature (`tx: 999`), you must insert a row in the database stating which profiles can use it.
