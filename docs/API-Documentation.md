# GigDesk API Documentation

Generated from `docs/GigDesk-API.postman_collection.json` (Postman Collection v2.1). Source of truth: `src/app.ts:21` + `src/modules/*/routes.ts` + `src/modules/*/schemas.ts`.

**Base URLs**
- Production: `https://api-gigdesk-production.up.railway.app`
- Local: `http://localhost:4000`

Set Postman variable `{{baseUrl}}` to one of above. `{{adminToken}}` and `{{workerToken}}` are auto-set by Tests scripts on login/verify.

All request bodies **MUST** be valid JSON with double-quoted keys (`{"email":"..."}` not `{email: "..."}`), header `Content-Type: application/json`. Invalid JSON now returns `400 {"ok":false,"error":"Invalid JSON"}` via `src/middleware/error-handler.ts:18`.

---

## How to Import & View Documentation in Postman

1. Postman > **Import** > **Files** > select `docs/GigDesk-API.postman_collection.json` (13 folders, 46 requests, 43 endpoints).
2. Collection appears as **GigDesk API** -> click folder to see module-wise docs.
3. Click **View Documentation** (right panel, or `Ctrl+Alt+D`) or select any request > **Documentation** tab to see description + example body + headers per `schemas.ts`.
4. To publish: Postman > Collection `...` > **View Documentation** > **Publish** > copy link, or **Export** > `Run in Postman` button.

---

## 01 Health - `src/routes/health.ts:5`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Liveness. 200 `{ok:true, service:"api.gigdesk", time: ISO}` |

**cURL**
```bash
curl {{baseUrl}}/health
```

---

## 02 Auth - Admin - `src/modules/auth/routes.ts:12`

| Method | Path | Auth | Schema |
|---|---|---|---|
| POST | `/auth/login` | public | `src/modules/auth/schemas.ts:3` |
| POST | `/auth/forgot-password` | public | `src/modules/auth/schemas.ts:30` |
| GET | `/auth/me` | admin JWT `requireAdmin` | - |
| PATCH | `/auth/profile` | admin JWT | `src/modules/auth/schemas.ts:10` |
| POST | `/auth/change-password` | admin JWT | `src/modules/auth/schemas.ts:23` |

**POST /auth/login**
```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@gigdesk.local",
  "password": "admin@123"
}
```
Success `200` `{ok:true, token:"<jwt>", admin:{id,email,fullName}}` -> Tests script sets `{{adminToken}}`. Failure `401 Invalid email or password` / `400 Validation failed`.

**POST /auth/forgot-password**
```json
{ "email": "admin@gigdesk.local", "newPassword": "newAdmin@12345" }
```
`newPassword` min 8 chars.

**GET /auth/me** `Authorization: Bearer {{adminToken}}`

**PATCH /auth/profile**
```json
{ "fullName": "GigDesk Admin Updated", "phone": "9876543210" }
```
`fullName` 1-120, `phone` `""` or 10 digits.

**POST /auth/change-password**
```json
{ "currentPassword": "admin@123", "newPassword": "newAdmin@12345" }
```

---

## 03 Worker-Auth - Public - `src/modules/worker-auth/routes.ts:8`

| Method | Path | Auth | Schema |
|---|---|---|---|
| POST | `/worker/register` | public | `src/modules/worker/schemas.ts:10` |
| POST | `/worker/otp/request` | public | `src/modules/worker-auth/schemas.ts:10` |
| POST | `/worker/otp/verify` | public | `src/modules/worker-auth/schemas.ts:14` |

**POST /worker/register** `201`
```json
{
  "fullName": "Rahul Kumar",
  "phone": "+919800110002",
  "city": "Hyderabad",
  "area": "Gachibowli",
  "pincode": "500032",
  "idProofUrl": "https://example.com/id-proof.jpg"
}
```
`phone` must be `+91` +10 digits (spaces stripped), `pincode` 6 digits, `idProofUrl` URL.

**POST /worker/otp/request**
```json
{ "phone": "+919800110002" }
```

**POST /worker/otp/verify** -> `200 {token}` sets `{{workerToken}}`
```json
{ "phone": "+919800110002", "code": "123456" }
```
`code` 6 digits.

---

## 04 Uploads - `src/modules/uploads/routes.ts:8`

| Method | Path | Schema |
|---|---|---|
| POST | `/uploads/presign` | `src/modules/uploads/schemas.ts:3` kind `id-proof`\|`completion-photo`, contentType `image/jpeg`\|`png`\|`webp` |

```json
{ "kind": "id-proof", "contentType": "image/jpeg" }
{ "kind": "completion-photo", "contentType": "image/png" }
```
Returns `{url, key}`. `503` if S3 env not set `src/config/env.ts:19`.

---

## 05 Worker - Protected `src/app.ts:39 requireWorker` + `src/modules/worker/routes.ts:26`

Header for all: `Authorization: Bearer {{workerToken}}`

| Method | Path | Body/Query |
|---|---|---|
| GET | `/worker/me` | - |
| PATCH | `/worker/me` | `src/modules/worker/schemas.ts:19` optional `fullName,city,area,pincode` |
| GET | `/worker/home` | - |
| GET | `/worker/jobs/available` | - |
| GET | `/worker/jobs/:id` | `id` uuid |
| POST | `/worker/jobs/:id/request` | none |
| GET | `/worker/requests` | - |
| GET | `/worker/assignments` | - |
| GET | `/worker/assignments/active` | - |
| POST | `/worker/assignments/:id/complete` | `src/modules/worker/schemas.ts:26` `{proofPhotoUrl:url}` |
| GET | `/worker/earnings` | - |
| GET | `/worker/performance` | - |
| GET | `/worker/area` | - |
| GET | `/worker/notifications` | `?unread=true` |
| POST | `/worker/notifications/read-all` | - |
| POST | `/worker/notifications/:id/read` | `id` uuid |

**PATCH /worker/me**
```json
{ "fullName": "Rahul K", "city": "Hyderabad", "area": "Madhapur", "pincode": "500081" }
```

**POST /worker/assignments/:id/complete**
```json
{ "proofPhotoUrl": "https://example.com/completion.jpg" }
```

**GET /worker/notifications?unread=true** filters unread.

---

## 06 Admin - Workers `src/app.ts:44 requireAdmin` + `src/modules/workers/routes.ts:10`

Header: `Authorization: Bearer {{adminToken}}`

| Method | Path | Query/Body |
|---|---|---|
| GET | `/admin/workers` | `src/modules/workers/schemas.ts:3` `?status=pending\|approved\|rejected&city=&district=&pincode=&search=&page=&pageSize=` |
| GET | `/admin/workers/:id` | `id` uuid |
| POST | `/admin/workers/:id/review` | `src/modules/workers/schemas.ts:21` `{decision:"approve"\|"reject", reason?}` |

**Example List:** `GET {{baseUrl}}/admin/workers?status=pending&city=Hyderabad&pincode=500032&search=Rahul&page=1&pageSize=15`

**Approve**
```json
{ "decision": "approve" }
```
**Reject**
```json
{ "decision": "reject", "reason": "ID proof unclear, please resubmit" }
```

---

## 07 Admin - Jobs `src/modules/jobs/routes.ts:11`

| Method | Path | Query/Body |
|---|---|---|
| POST | `/admin/jobs` | `src/modules/jobs/schemas.ts:3` |
| GET | `/admin/jobs` | `src/modules/jobs/schemas.ts:17` |
| GET | `/admin/jobs/:id` | `id` uuid |
| POST | `/admin/jobs/:id/cancel` | `src/modules/jobs/schemas.ts:37` |

**POST /admin/jobs** `201`
```json
{
  "title": "Office Cleaning - Gachibowli",
  "description": "Need cleaning for 2BHK",
  "city": "Hyderabad",
  "district": "Hyderabad",
  "area": "Gachibowli",
  "pincode": "500032",
  "payAmountInr": 1500,
  "deadline": "2026-09-10T10:00:00.000Z"
}
```
`payAmountInr` positive int, `deadline` future ISO date.

**GET /admin/jobs?status=open&city=Hyderabad&search=Cleaning&page=1&pageSize=15**

**POST /admin/jobs/:id/cancel**
```json
{ "reason": "Client cancelled requirement" }
```

---

## 08 Admin - Requests `src/modules/requests/routes.ts:6`

| Method | Path | Query |
|---|---|---|
| GET | `/admin/requests` | `src/modules/requests/schemas.ts:3` `?status=pending\|approved\|rejected&jobId=&workerId=&page=&pageSize=` |
| POST | `/admin/requests/:id/approve` | - |
| POST | `/admin/requests/:id/reject` | - |

`POST /admin/requests/{{requestId}}/approve` creates assignment, auto-rejects rivals.

---

## 09 Admin - Assignments `src/modules/assignments/routes.ts:6`

| Method | Path | Body |
|---|---|---|
| POST | `/admin/assignments/assign` | `src/modules/assignments/schemas.ts:3` `{jobId:uuid, workerId:uuid}` |
| POST | `/admin/assignments/:id/cancel` | - |

```json
{ "jobId": "{{jobId}}", "workerId": "{{workerId}}" }
```

---

## 10 Admin - Payouts `src/modules/payouts/routes.ts:6`

| Method | Path | Query |
|---|---|---|
| GET | `/admin/payouts` | `src/modules/payouts/schemas.ts:3` `?status=pending\|paid&workerId=&page=&pageSize=` |
| POST | `/admin/payouts/:id/mark-paid` | - |

`GET {{baseUrl}}/admin/payouts?status=pending&page=1&pageSize=15`

---

## 11 Admin - Events `src/modules/events/routes.ts:8`

| Method | Path | Query |
|---|---|---|
| GET | `/admin/events` | `src/modules/events/schemas.ts:3` `?type=&jobId=&status=pending\|processed&page=&pageSize=` |

`GET {{baseUrl}}/admin/events?type=job.created&page=1&pageSize=15`

---

## 12 Admin - Summary `src/modules/summary/routes.ts:7`

| Method | Path |
|---|---|
| GET | `/admin/summary` |

Returns dashboard counts: pending workers, open jobs, pending requests, payouts.

---

## 13 Admin - Meta `src/modules/meta/routes.ts:7`

| Method | Path |
|---|---|
| GET | `/admin/meta/locations` |

Returns cities/areas/pincodes.

---

## Common Errors & Fix

| Status | Example Body | Cause |
|---|---|---|
| 400 Invalid JSON | `{"ok":false,"error":"Invalid JSON","body":"{email: \"...\"}"}` | Missing `"` around keys. Fix to `{"email":"..."}` `src/middleware/error-handler.ts:18` |
| 400 Validation failed | `{"ok":false,"error":"Validation failed","issues":[{"field":"pincode","message":"Pincode must be 6 digits"}]}` | Zod validation `src/modules/*/schemas.ts` |
| 401 | `{"ok":false,"error":"Unauthorized"}` | Missing/invalid `Bearer` token `src/middleware/require-admin.ts` / `require-worker.ts` |
| 404 | ... | Resource not found |
| 500 | `{"ok":false,"error":"Internal server error"}` | DB `DATABASE_URL` or migration not run. Check Railway logs `console.error` `src/middleware/error-handler.ts:29`. Run `railway run npm run db:migrate` |

Import file: `docs/GigDesk-API.postman_collection.json` verified `node -e` `13 folders, 46 requests`.
