# API Reference

## HTTP Endpoints

The framework minimizes the number of endpoints to simplify security.

### 1. Main Endpoint (`POST /toProccess`)

The gateway for all business operations.

**Request:**

```json
POST /toProccess
Content-Type: application/json
Authorization: Bearer <token>

{
  "tx": 101,          // Transaction ID
  "data": { ... }     // BO Parameters
}
```

**Response (Success 200):**

```json
{
  "ok": true,
  "data": { ... }
}
```

**Response (Error 4xx/5xx):**

```json
{
    "ok": false,
    "error": "Readable error message"
}
```

### 2. Health Check (`GET /health`)

For monitoring (Kubernetes, AWS LB).

- Returns 200 `OK`.

### 3. Generated Documentation (`GET /api-docs`)

If you generated docs with `npm run docs:gen`, they usually live here (if served statically).

## Error Code Dictionary

| Code                | Meaning                   | Suggested Action |
| :------------------ | :------------------------ | :--------------- |
| `ERR_AUTH_FAIL`     | Incorrect User/Password   | Retry login      |
| `ERR_NO_PERMISSION` | Valid login but no access | Contact admin    |
| `ERR_VALIDATION`    | Malformed data (Zod)      | Fix form         |
| `ERR_DB_CONN`       | Database down             | Retry later      |
