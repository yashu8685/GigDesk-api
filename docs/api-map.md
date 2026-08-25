# GigDesk — Complete API Map

**STATUS: ALL ENDPOINTS BUILT AND TESTED ✔** (39 total — every module E2E tested:
happy path + bad input + edge cases)

Base: `http://localhost:4000` · All bodies JSON · Admin routes need
`Authorization: Bearer <token>` · Worker routes need worker JWT (OTP login).

---

## Shared

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | — | Liveness check |

---

## Yaswanth — Admin web (`app.gigdesk`)

### Auth
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Email + password → JWT (`{email, password}`) |
| GET | `/auth/me` | Current admin profile |

### Workers (screen: Workers, Worker Details/Review)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/workers` | List workers — `?status=&city=&pincode=&search=&page=` |
| GET | `/admin/workers/:id` | Full detail: proof, registration + review record |
| POST | `/admin/workers/:id/review` | `{decision: 'approve'\|'reject', reason?}` — reject requires reason |

### Jobs (screens: Jobs, Post Job, Job Details)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/jobs` | Post job — `{title, description, city, area, pincode, payAmountInr, durationHours}` |
| GET | `/admin/jobs` | List — `?status=open\|assigned\|completed\|cancelled&city=&search=&page=` |
| GET | `/admin/jobs/:id` | Detail + timeline + requests + assignment history |
| POST | `/admin/jobs/:id/cancel` | Cancel job — `{reason}` (required) |

### Requests (screen: Job Requests)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/requests` | List — `?status=pending\|approved\|rejected&jobId=` |
| POST | `/admin/requests/:id/approve` | Approve → transaction: assignment created, rival pendings auto-rejected |
| POST | `/admin/requests/:id/reject` | Reject |

### Assignments (screen: Assignment)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/admin/jobs/:id/assign` | Direct assign — `{workerId}` (server enforces: approved + pincode match + job open) |
| POST | `/admin/assignments/:id/cancel` | Cancel assignment → job reopens, history kept |

### Completed work / Ledger (screens: Completed Work, Completion Proof, Payout Ledger)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/completions` | Completed jobs — worker, payout, proof URL |
| GET | `/admin/payouts` | Ledger — `?status=pending\|paid&workerId=` |
| POST | `/admin/payouts/:id/mark-paid` | Mark payout paid |
| GET | `/admin/events` | Activity/history feed — `?type=&jobId=&page=` |

### Notifications / Dashboard
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/notifications` | Admin inbox (from event_log: new registrations, new requests…) |
| GET | `/admin/summary` | Dashboard counts: pending workers, open jobs, pending requests, payouts |

---

## Swamy — Worker app (`flutter-gigdesk`)

### Auth (screens: Worker Login, Worker Registration)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/worker/otp/request` | `{phone}` → OTP sent (hashed in `auth_otps`) |
| POST | `/worker/otp/verify` | `{phone, code}` → worker JWT (only if approved; pending → limited token) |
| POST | `/worker/register` | `{fullName, phone, city, area, pincode, idProofKey}` → status `pending` |
| GET | `/worker/me` | Own profile + approval status (screen: Registration Pending, Profile) |
| PATCH | `/worker/me` | Update own profile fields (not phone/status) |

### Jobs (screens: Worker Home, Available Jobs, Job Details)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/worker/home` | Summary: approval status, active job, earnings, unread notifications |
| GET | `/worker/jobs/available` | Open jobs in worker's pincode — **only if approved** |
| GET | `/worker/jobs/:id` | Job detail + own request status for it |
| POST | `/worker/jobs/:id/request` | Select a job → creates pending request (server checks: approved + same pincode + job open + no duplicate) |

### My jobs (screens: My Jobs, Active Job, Completion Proof)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/worker/requests` | Own request history with statuses |
| GET | `/worker/assignments` | Own assignment history |
| GET | `/worker/assignments/active` | Current active job |
| POST | `/worker/assignments/:id/complete` | `{proofPhotoKey}` **required** → transaction: job completed + payout row + event row |

### Earnings / Performance (screens: Earnings, My Performance)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/worker/earnings` | Payout list + totals (pending vs paid) |
| GET | `/worker/performance` | Derived: completed count, cancellations, lifetime earnings |

### Areas & Notifications (screens: Work Areas, Notifications)
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/worker/area` | Own serviceable area (single pincode, v1) |
| GET | `/worker/notifications` | Inbox — `?unread=` |
| POST | `/worker/notifications/:id/read` | Mark one read |
| POST | `/worker/notifications/read-all` | Mark all read |

---

## Uploads (both apps — never direct to S3 from client)
| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/uploads/presign` | `{kind: 'id-proof'\|'completion-photo', contentType}` → presigned PUT URL + final file key |

## Build order (module by module)
1. ~~auth (admin)~~ ✅ done
2. workers (admin review side) → 3. jobs → 4. requests → 5. assignments
6. completions → 7. payouts → 8. events/notifications → 9. worker auth (OTP) → 10. uploads
