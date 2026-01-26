# API Reference & Messaging Standard

This guide defines the strict communication contract between Client and Server.

## 1. Messaging Standard (The Protocol)

ToProccess is not a pure RESTful API. It is a **Transaction-Oriented** API.
It uses a single endpoint to process business commands.

### Request Envelope

**Endpoint**: `POST /toProccess`
**Headers**: `Content-Type: application/json`

```json
{
    "tx": 1001, // (Required) Transaction ID. Defines INTENT.
    "params": {
        // (Optional) Data needed to execute it.
        "userId": 55,
        "filters": { "active": true }
    }
}
```

### Response Envelope

Server always responds with predictable 3-part structure.

```json
{
  "code": 200,          // Mirror of HTTP Status. To ease client reading.
  "msg": "OK",          // Short human message. (Ex: "User Created", "Validation Error").
  "data": { ... }       // Success payload (only if code 2xx).
  // OR
  "alerts": ["..."]     // Error list (only if code 4xx/5xx).
}
```

---

## 2. Common Status Codes

| Code    | Meaning           | Common Cause                                       |
| :------ | :---------------- | :------------------------------------------------- |
| **200** | OK                | Successful operation.                              |
| **201** | Created           | Record created successfully.                       |
| **400** | Bad Request       | Validation error (check `alerts`).                 |
| **401** | Unauthorized      | Session cookie expired or missing.                 |
| **403** | Forbidden         | Logged in user but no permission for this TX.      |
| **404** | Not Found         | Requested resource (e.g., user ID) does not exist. |
| **429** | Too Many Requests | Rate limit exceeded. Slow down.                    |
| **500** | Internal Error    | Server bug. Contact support.                       |

---

## 3. Auxiliary Endpoints Dictionary

Although `/toProccess` is king, support endpoints exist:

- `GET /health`: Returns `200 OK` if server runs. (For Load Balancers).
- `GET /ready`: Verifies DB connection. (For K8s Readiness Probe).
- `GET /csrf`: Gets CSRF token for forms.
- `POST /login`: Authentication and session creation.
- `POST /logout`: Session destruction.
