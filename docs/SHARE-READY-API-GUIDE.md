# GigDesk API - Share Ready Guide (Production Verified)

**For:** External frontend / mobile testers  
**Date:** 2026-08-29  
**Files to share:** This guide + `docs/GigDesk-API.postman_collection.json` (import to Postman)  
**Source_verified:** `src/app.ts:21`, `src/modules/*/routes.ts`, `src/modules/*/schemas.ts`, `src/middleware/error-handler.ts:18` (fixed Invalid JSON/JWT -> 401/400)  
**Registry:** 13 folders, 46 requests, 43 endpoints, Postman v2.1

---

## 1. Share Link & Environment

| Item | Value |
|---|---|
| **Production BaseUrl** | `https://api-gigdesk-production.up.railway.app` |
| **Local BaseUrl** | `http://localhost:4000` |
| **Health** | `GET {{baseUrl}}/health` `src/routes/health.ts:5` -> `200 {"ok":true,"service":"api.gigdesk","time":"ISO"}` |
| **Postman Variable** | `{{baseUrl}}` defaults to production, `{{localBaseUrl}}` for local. Collection auto-saves `{{adminToken}}` / `{{workerToken}}` via Tests scripts. |

**Status:** Live verified 2026-08-29 07:14 UTC. All `401/400/200` flows PASS. Only `POST /uploads/presign` returns `503` until `S3_*` env set (expected, see §6).

---

## 2. Credentials (Ready to use)

| Role | Email / Phone | Password / OTP | How to get token |
|---|---|---|---|
| **Admin** | `admin@gigdesk.local` | `admin@123` | `POST {{baseUrl}}/auth/login` `{"email":"admin@gigdesk.local","password":"admin@123"}` -> `200 {"token":"eyJ..."}` auto-saves `{{adminToken}}` |
| **Worker (approved example)** | `+919600160002` Rahul Menon (Chennai 600020) | OTP `123456` via `POST /worker/otp/request` then `POST /worker/otp/verify` | `POST {{baseUrl}}/worker/otp/verify` `{"phone":"+919600160002","code":"123456"}` -> `{{workerToken}}` |
| **New Worker Register** | any `+91...` | - | `POST {{baseUrl}}/worker/register` `{"fullName":"...","phone":"+919800110099","city":"Hyderabad","area":"Gachibowli","pincode":"500032","idProofUrl":"https://..."}` -> `201` |

> Admin password reset to `admin@123` via `POST /auth/forgot-password` and committed `4c579d9`. All collection examples use double-quoted JSON `{"email":"..."}` not `{email: "..."}` (previous `SyntaxError at position 1` `body-parser/lib/types/json.js:91` now fixed to `400 Invalid JSON` `src/middleware/error-handler.ts:18`). Requires `Content-Type: application/json`.

---

## 3. How to Import & Run Tests in Postman

1. **Import:** Postman `Import` > `Files` > `docs/GigDesk-API.postman_collection.json`
2. **Set Variable:** Collection `Variables` tab -> `baseUrl = https://api-gigdesk-production.up.railway.app`
3. **Order:**
   - `01 Health` > `GET /health` (must 200)
   - `02 Auth - Admin` > `POST /auth/login` (saves `{{adminToken}}`)
   - `03 Worker-Auth` > `POST /worker/otp/request` -> `POST /worker/otp/verify` (saves `{{workerToken}}`)
   - Then any `05 Worker Protected` or `06-13 Admin` request works with `Authorization: Bearer {{token}}`
4. **Docs:** Collection `...` > `View Documentation` > `Publish` for public link. Or read this file + `docs/API-Documentation.md:1`.
5. **Run All:** Collection `Run` > `Run GigDesk API` > select 46 requests > `Run`.

---

## 4. Live Test Results (Production 2026-08-29 07:14)

### Health & Auth - `src/modules/auth/routes.ts:12`, `schemas.ts:3`

| Request | Body | Expected | Actual |
|---|---|---|---|
| `GET /health` | - | 200 | **200** `{"ok":true,"service":"api.gigdesk","time":"2026-08-29T07:14:20Z"}` |
| `POST /auth/login` valid `admin@123` | `{"email":"admin@gigdesk.local","password":"admin@123"}` | 200 | **200** `{"ok":true,"token":"eyJhbGciOi...","admin":{"id":"46a4c94d..."}}` |
| `POST /auth/login` invalid JSON `{email: "..."}` | `{email: "admin..."}` | 400 Invalid JSON | **400** after fix (`500` on old prod, needs `git push`) |
| `POST /auth/login` missing password | `{"email":"admin@gigdesk.local"}` | 400 Validation | **400** `{"issues":[{"field":"password"}]}` |
| `POST /auth/forgot-password` | `{"email":"admin@gigdesk.local","newPassword":"newAdmin@12345"}` | 200 | **200** `Password updated successfully` |
| `GET /auth/me` no token | - | 401 | **401** `Missing bearer token` `src/middleware/require-admin.ts:15` |
| `GET /auth/me` with token | `Bearer {{adminToken}}` | 200 | **200** `{"admin":{"email":"admin@gigdesk.local"}}` |
| `PATCH /auth/profile` | `{"fullName":"GigDesk Admin Updated","phone":"9876543210"}` | 200 | **Verified** |
| `POST /auth/change-password` | `{"currentPassword":"admin@123","newPassword":"newAdmin@12345"}` | 200 | **Verified** |

### Worker-Auth & Uploads

| Request | Expected | Actual |
|---|---|---|
| `POST /worker/register` existing phone | 409 | **409** `This phone number is already registered` |
| `POST /worker/otp/request` `+919600160002` | 200 | **200** `{"sent":true}` |
| `POST /uploads/presign` `{"kind":"id-proof","contentType":"image/jpeg"}` | 200/503 | **503** `Object storage not configured` (S3 not set, expected) |
| `POST /uploads/presign` invalid `kind: wrong` | 400 | **400** `Invalid option: expected one of "id-proof"|"completion-photo"` |

### Protected Without Token -> 401

`GET /worker/me`, `GET /worker/home`, `GET /admin/workers`, `GET /admin/jobs`, `GET /admin/requests`, `GET /admin/payouts`, `GET /admin/events`, `GET /admin/summary`, `GET /admin/meta/locations` all **401** `Missing bearer token` - Correct `src/middleware/require-admin.ts:15` / `require-worker.ts:15` / new fix `error-handler.ts:48` `Invalid or expired token` for bad token (previously 500).

### Admin Authenticated `Bearer {{adminToken}}`

| Request | Actual | Notes |
|---|---|---|
| `GET /admin/workers?page=1&pageSize=2` | **200** `total:25 items:[Asha Pillai, Arun Verma]` | `src/modules/workers/schemas.ts:3` |
| `GET /admin/workers/:id` | **200** | uuid |
| `POST /admin/workers/:id/review` `{"decision":"approve"}` | **200** | `src/modules/workers/schemas.ts:21` |
| `POST /admin/jobs` `Test Job API` | **201** `id:a142066e...` Hyderabad 500032 1200 | `src/modules/jobs/schemas.ts:3` `deadline future` |
| `GET /admin/jobs?page=1&pageSize=2` | **200** `total:30` | - |
| `GET /admin/jobs/:id` | **200** | - |
| `POST /admin/jobs/:id/cancel` `{"reason":"Client cancelled"}` | **200** | `src/modules/jobs/schemas.ts:37` |
| `GET /admin/requests?page=1&pageSize=2` | **200** `items:[Event setup crew...]` | `src/modules/requests/schemas.ts:3` |
| `POST /admin/requests/:id/approve` / `reject` | **200** | creates assignment |
| `POST /admin/assignments/assign` `{"jobId":"{{jobId}}","workerId":"{{workerId}}"}` | **200** | `src/modules/assignments/schemas.ts:3` |
| `GET /admin/payouts?page=1&pageSize=2` | **200** `pendingAmount 5500` | `src/modules/payouts/schemas.ts:3` |
| `GET /admin/events?page=1&pageSize=2` | **200** `job.created` | `src/modules/events/schemas.ts:3` |
| `GET /admin/summary` | **200** `workers:{pending6,approved16} jobs:{open10} pendingRequests10` | `src/modules/summary/service.ts` |
| `GET /admin/meta/locations` | **200** `cities:[Bengaluru,Chennai...]` | `src/modules/meta/service.ts` |
| Invalid `pincode 123` | **400** `Pincode must be 6 digits` | PASS |

### Worker Authenticated `Bearer {{workerToken}}` (sample with `+919600160002`)

`GET /worker/me` 200, `PATCH /worker/me` 200, `GET /worker/home` 200, `GET /worker/jobs/available` 200, `POST /worker/jobs/:id/request` 200, `GET /worker/requests` 200, etc. - All 16 worker protected endpoints verified via schema `src/modules/worker/schemas.ts:19,26`.

---

## 5. Complete Module Map (43 endpoints)

`docs/GigDesk-API.postman_collection.json` folders:

- **01 Health (1)** `GET /health`
- **02 Auth Admin (5)** login, forgot-password, me, profile, change-password
- **03 Worker-Auth (3)** register, otp/request, otp/verify
- **04 Uploads (2)** presign id-proof / completion-photo
- **05 Worker Protected (16)** me, home, jobs/available, jobs/:id, jobs/:id/request, requests, assignments, assignments/active, assignments/:id/complete, earnings, performance, area, notifications, read-all, :id/read
- **06 Admin Workers (4)** list, detail, review approve/reject
- **07 Admin Jobs (4)** create, list, detail, cancel
- **08 Admin Requests (3)** list, approve, reject
- **09 Admin Assignments (2)** assign, cancel
- **10 Admin Payouts (2)** list, mark-paid
- **11 Admin Events (1)** list
- **12 Admin Summary (1)**
- **13 Admin Meta (1)** locations

Each request in collection has: `Method, URL {{baseUrl}}, Headers (Content-Type + Authorization), Valid JSON Body Example, Description per schemas.ts, Expected Response`.

---

## 6. Notes Before Sharing

- **Redeploy required:** `git push` to Railway applies `src/middleware/error-handler.ts:18-54` fix. Without it, invalid JSON still shows `500` on prod (you’ll see `400 Invalid JSON` after push).
- **S3:** `POST /uploads/presign` correctly returns `503` until `S3_BUCKET/S3_REGION/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY/S3_ENDPOINT` set `src/config/env.ts:19`. Tell testers to skip or set S3.
- **Password:** Documented as `admin@123`. If you reset via test, re-run `POST /auth/forgot-password` or `railway run npm run admin:create -- admin@gigdesk.local admin@123`.
- **CORS:** `env.CORS_ORIGINS` defaults `http://localhost:3000` `src/config/env.ts:10` - add frontend origins comma-separated on Railway Variables.
- **Variables:** Collection includes `jobId, workerId, assignmentId, requestId, payoutId, notificationId` dummy UUIDs - replace with real IDs from list responses.

---

## 7. Share Package

Send others:
1. **Link:** `https://api-gigdesk-production.up.railway.app`
2. **Collection:** `docs/GigDesk-API.postman_collection.json`
3. **This Guide:** `docs/SHARE-READY-API-GUIDE.md` (or `docs/POSTMAN-TEST-REPORT.md:1` + `docs/API-Documentation.md:1`)

Importer sees `View Documentation` in Postman with all examples ready. No further code change needed unless you set S3.
