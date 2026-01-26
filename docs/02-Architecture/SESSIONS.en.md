# Session Management

The system manages user state using Signed HTTP-Only Cookies and persistent Database storage.

## Why not JWT (Stateless)?

Although JWTs are popular, they have serious revocation issues (you can't "logout" someone instantly without extra complexity).
Database sessions are:

- **Revocable**: Delete the row in DB and user is out instantly.
- **Secure**: Client only has an opaque ID (`connect.sid`), no data.
- **Limited**: You can list "Active Devices" and close a specific one.

## Cookie Architecture

Default configuration in `SessionService`:

| Attribute  | Value            | Reason                                                                                     |
| :--------- | :--------------- | :----------------------------------------------------------------------------------------- |
| `httpOnly` | `true`           | Browser JavaScript CANNOT read the cookie. Total protection against XSS stealing sessions. |
| `secure`   | `true` (in Prod) | Only travels via HTTPS.                                                                    |
| `sameSite` | `strict`         | Cookie is not sent if you come from another site (extra CSRF protection).                  |
| `maxAge`   | 14 days          | Session duration.                                                                          |

## Storage (`connect-pg-simple`)

Sessions are NOT saved in RAM (so server can restart without logging everyone out). They are saved in Postgres `session` table.

### `session` Table Schema

| Column   | Type      | Description                                    |
| :------- | :-------- | :--------------------------------------------- |
| `sid`    | PK        | Session ID (the one in the cookie).            |
| `sess`   | JSON      | Session data (user_id, profile_id, cart, etc). |
| `expire` | Timestamp | When it should be automatically deleted.       |

## Usage in Code

From anywhere with request access (`req`):

```typescript
// Read
const userId = req.session.user_id

// Write (Persists automatically at end of request)
req.session.cart = { items: [] }

// Destroy (Logout)
req.session.destroy()
```
