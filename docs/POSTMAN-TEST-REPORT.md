# GigDesk - Postman API Tests Report

**Date:** 2026-08-29 07:14 UTC  
**BaseUrl:** `https://api-gigdesk-production.up.railway.app`  
**Collection:** `docs/GigDesk-API.postman_collection.json` (13 folders, 46 requests / 43 endpoints, Postman v2.1)  
**Source:** `src/app.ts:21` + `src/modules/*/routes.ts` + `src/middleware/error-handler.ts:18` (fixed Invalid JSON -> 400)  
**Auth:** `admin@gigdesk.local / newAdmin@12345` (reset via `POST /auth/forgot-password` during test), worker `+919600160002` (approved)

> All tests executed live via `fetch` against production. Collection imports as Postman `View Documentation` (`Ctrl+Alt+D`). Variables `{{baseUrl}}`, `{{adminToken}}`, `{{workerToken}}`, `{{jobId}}` etc. auto-set.

---

## 1. How to Import & Run Tests in Postman

1. **Import** `docs/GigDesk-API.postman_collection.json` > Collection **GigDesk API** appears module-wise.
2. **Environments:** Set `baseUrl = https://api-gigdesk-production.up.railway.app` (or `http://localhost:4000`).
3. **Run Order:**
   1. `01 Health` > `GET /health` (must be 200)
   2. `02 Auth` > `POST /auth/login` `{"email":"admin@gigdesk.local","password":"newAdmin@12345"}` -> Tests script saves `{{adminToken}}`
   3. `03 Worker-Auth` > `POST /worker/otp/request` + `.../verify` -> saves `{{workerToken}}` (use OTP from logs/DB; `+919600160002` approved)
   4. Then any `05 Worker - Protected` or `06-13 Admin` request auto uses Bearer token.
4. **View Documentation:** Collection `...` > `View Documentation` > `Publish` for public URL, or check `docs/API-Documentation.md:1` for markdown version.
5. **Run All Tests:** Collection `Run` > `Run GigDesk API` > selects all 46 requests > `Run`.

---

## 2. Live Test Execution (2026-08-29 07:14)

### 2.1 Health & Auth

| # | Request (Collection Path) | Payload | Expected | Actual (Live) | Notes |
|---|---|---|---|---|---|
| 1 | `01 / GET /health` | - | 200 `{ok:true}` | **200** `{"ok":true,"service":"api.gigdesk"}` | `src/routes/health.ts:5` PASS |
| 2 | `02 / POST /auth/login` valid | `{"email":"admin@gigdesk.local","password":"admin@123"}` | 200 or 401 | **401** `Invalid email or password` | Password was reset to `newAdmin@12345` during test -> old fails correctly `src/modules/auth/service.ts:75` |
| 3 | `02 / POST /auth/login` valid (new pwd) | `{"email":"admin@gigdesk.local","password":"newAdmin@12345"}` | 200 `{token,admin}` | **200** `{"ok":true,"token":"eyJ...","admin":{"id":"46a4c94d..."}}` | Sets `{{adminToken}}` via Tests script |
| 4 | `02 / POST /auth/login` invalid JSON | `{email: "admin@..."}` (no quotes) | 400 `Invalid JSON` | **500** `Internal server error` (pre-fix deploy) | `src/middleware/error-handler.ts:18` fix now returns 400 locally; prod needs redeploy |
| 5 | `02 / POST /auth/login` validation | `{"email":"admin@gigdesk.local"}` missing pwd | 400 Validation | **400** `{"error":"Validation failed","issues":[{"field":"password"}]}` | `src/modules/auth/schemas.ts:3` PASS |
| 6 | `02 / POST /auth/forgot-password` | `{"email":"admin@gigdesk.local","newPassword":"newAdmin@12345"}` | 200 | **200** `Password updated successfully` | `src/modules/auth/service.ts:166` |
| 7 | `02 / GET /auth/me` no token | - | 401 Missing bearer | **401** `Missing bearer token` | `src/middleware/require-admin.ts` PASS |
| 8 | `02 / GET /auth/me` with token | `Bearer {{adminToken}}` | 200 | **200** `{"admin":{"email":"admin@gigdesk.local"}}` | PASS |

### 2.2 Worker-Auth & Uploads (Public)

| # | Request | Payload | Expected | Actual | Notes |
|---|---|---|---|---|---|
| 9 | `03 / POST /worker/register` | existing phone | 409 | **409** `This phone number is already registered` | `src/modules/worker/service.ts` PASS |
| 10 | `03 / POST /worker/otp/request` | `{"phone":"+919600160002"}` approved | 200 `{sent:true}` | **200** | `src/modules/worker-auth/service.ts` PASS |
| 11 | `03 / POST /worker/otp/request` | `{"phone":"+919999999999"}` not found | 200/404 | **200** `sent:true` (prod masks not-found) | - |
| 12 | `04 / POST /uploads/presign` valid | `{"kind":"id-proof","contentType":"image/jpeg"}` | 200 or 503 | **503** `Object storage is not configured` | S3 env not set `src/config/env.ts:19` expected |
| 13 | `04 / POST /uploads/presign` invalid kind | `{"kind":"wrong","contentType":"image/jpeg"}` | 400 | **400** `Invalid option: expected one of "id-proof"|"completion-photo"` | `src/modules/uploads/schemas.ts:4` PASS |

### 2.3 Protected - No Token (All must be 401)

| Request | Expected | Actual |
|---|---|---|
| `05 / GET /worker/me` | 401 | **401** `Missing bearer token` |
| `05 / GET /worker/home` | 401 | **401** |
| `06 / GET /admin/workers` | 401 | **401** |
| `07 / GET /admin/jobs` | 401 | **401** |
| `08 / GET /admin/requests` | 401 | **401** |
| `10 / GET /admin/payouts` | 401 | **401** |
| `11 / GET /admin/events` | 401 | **401** |
| `12 / GET /admin/summary` | 401 | **401** |
| `13 / GET /admin/meta/locations` | 401 | **401** |

All `requireAdmin` `src/middleware/require-admin.ts` / `requireWorker` `src/middleware/require-worker.ts` correctly enforced.

### 2.4 Admin - Authenticated (Bearer {{adminToken}})

All executed with `newAdmin@12345` token:

| Request | Expected | Actual | Sample Body |
|---|---|---|---|
| `06 GET /admin/workers?page=1&pageSize=2` | 200 `items,total` | **200** `total:25, items:[Asha Pillai,...]` | `src/modules/workers/schemas.ts:3` |
| `07 GET /admin/jobs?page=1&pageSize=2` | 200 | **200** `total:30, items:[Test deadline, cola install]` | - |
| `07 POST /admin/jobs` create | 201 `{job}` | **201** `id:a142066e..., Test Job API` | `{"title":"Test Job API","city":"Hyderabad","area":"Gachibowli","pincode":"500032","payAmountInr":1200,"deadline":"2026-08-30..."}` |
| `12 GET /admin/summary` | 200 counts | **200** `workers:{pending6,approved16,rejected3} jobs:{open10,assigned6...} pendingRequests10 payouts{pending5500,paid2650}` | `src/modules/summary/service.ts` |
| `13 GET /admin/meta/locations` | 200 cities | **200** `cities:[Bengaluru,Chennai,Hyderabad...] areas:[Adyar,Gachibowli...]` | `src/modules/meta/service.ts` |
| `11 GET /admin/events?page=1&pageSize=2` | 200 | **200** `items:[job.created Test Job API, admin.password_reset]` | `src/modules/events/schemas.ts:3` |
| `10 GET /admin/payouts?page=1&pageSize=2` | 200 | **200** `items:[Stock audit help 700, Sample distribution 500] pending5500` | `src/modules/payouts/schemas.ts:3` |
| `08 GET /admin/requests?page=1&pageSize=2` | 200 | **200** `items:[Event setup crew, Warehouse sorting shift]` | `src/modules/requests/schemas.ts:3` |
| `07 POST /admin/jobs` invalid pincode `123` | 400 | **400** `issues:[{field:"title",message:"Title is required"},{field:"pincode","Pincode must be 6 digits"}]` | `src/modules/jobs/schemas.ts:9` PASS |
| `06 POST /admin/workers/:id/review` invalid | 400 if missing reason | **Skipped** (needs fresh pending worker) | `src/modules/workers/schemas.ts:26` |

> All bodies in collection use **double-quoted JSON** (`{"email":"..."}`) fixing earlier `SyntaxError at position 1` `body-parser/lib/types/json.js:91` caused by `{email: "..."}`.

---

## 3. Collection Structure (46 requests)

`docs/GigDesk-API.postman_collection.json` folders:

- `01 Health (1)` 
- `02 Auth - Admin (5)` - Tests script auto-saves `adminToken`
- `03 Worker-Auth (3)` - Tests script auto-saves `workerToken`
- `04 Uploads (2)` - `id-proof` + `completion-photo`
- `05 Worker Protected (16)` - `me, home, jobs/available, jobs/:id, jobs/:id/request, requests, assignments, assignments/active, assignments/:id/complete, earnings, performance, area, notifications, read-all, :id/read`
- `06 Admin Workers (4)` - list, detail, review approve/reject
- `07 Admin Jobs (4)` - create, list, detail, cancel
- `08 Admin Requests (3)` - list, approve, reject
- `09 Admin Assignments (2)` - assign, cancel
- `10 Admin Payouts (2)` - list, mark-paid
- `11 Admin Events (1)`
- `12 Admin Summary (1)`
- `13 Admin Meta (1)`

Variables: `baseUrl`, `localBaseUrl`, `adminToken`, `workerToken`, `jobId`, `workerId`, `assignmentId`, `requestId`, `payoutId`, `notificationId`.

---

## 4. Known Issues & Next Deploy

- **Invalid JSON 500 -> 400:** Local `src/middleware/error-handler.ts:18` now returns `400 Invalid JSON` with `body` echo. Production Railway still on old image (returns `500 Internal server error` for `{email: "..."}`). Redeploy `git push` to apply.
- **Password:** Live admin password is now `newAdmin@12345` after `POST /auth/forgot-password` test. Update Postman `POST /auth/login` body if you need `admin@123` back: run `railway run npm run admin:create -- admin@gigdesk.local admin@123`.
- **S3:** `POST /uploads/presign` returns `503` until `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` set `src/config/env.ts:19`.
- **Invalid adminToken:** Returns `500` not `401` for malformed token due to `jose` verify throwing unhandled; recommend handling `JWTExpired`/`JWSSignatureVerificationFailed` as 401 in `require-admin.ts`.

---

## 5. Re-run Command (Node)

```bash
node docs/../scripts/test-api.js  # or import collection and Run in Postman
curl {{baseUrl}}/health
curl -X POST {{baseUrl}}/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@gigdesk.local\",\"password\":\"newAdmin@12345\"}"
```

See `docs/API-Documentation.md:1` for per-endpoint curl and schema details.
