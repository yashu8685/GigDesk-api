export interface RequestSeed {
  key: string
  jobKey: string
  workerKey: string
  status: 'pending' | 'approved' | 'rejected'
  requestedHoursAgo: number
  reviewedHoursAgo?: number
}

/**
 * 25 requests: 8 approved (most linked to assignments), 10 pending
 * (rival selections on open jobs), 7 rejected. Worker pincodes always
 * match the job pincode.
 */
export const requestSeeds: Array<RequestSeed> = [
  // Approved (8)
  { key: 'r01', jobKey: 'j05', workerKey: 'w01', status: 'approved', requestedHoursAgo: 24, reviewedHoursAgo: 20 },
  { key: 'r02', jobKey: 'j06', workerKey: 'w19', status: 'approved', requestedHoursAgo: 22, reviewedHoursAgo: 18 },
  { key: 'r03', jobKey: 'j07', workerKey: 'w10', status: 'approved', requestedHoursAgo: 20, reviewedHoursAgo: 16 },
  { key: 'r04', jobKey: 'j11', workerKey: 'w02', status: 'approved', requestedHoursAgo: 97, reviewedHoursAgo: 95 },
  { key: 'r05', jobKey: 'j13', workerKey: 'w07', status: 'approved', requestedHoursAgo: 93, reviewedHoursAgo: 91 },
  { key: 'r06', jobKey: 'j15', workerKey: 'w12', status: 'approved', requestedHoursAgo: 89, reviewedHoursAgo: 87 },
  { key: 'r07', jobKey: 'j18', workerKey: 'w19', status: 'approved', requestedHoursAgo: 83, reviewedHoursAgo: 81 },
  { key: 'r08', jobKey: 'j22', workerKey: 'w06', status: 'approved', requestedHoursAgo: 75, reviewedHoursAgo: 73 },
  // Pending (10) — rivals on open jobs
  { key: 'r09', jobKey: 'j01', workerKey: 'w03', status: 'pending', requestedHoursAgo: 8 },
  { key: 'r10', jobKey: 'j01', workerKey: 'w04', status: 'pending', requestedHoursAgo: 6 },
  { key: 'r11', jobKey: 'j01', workerKey: 'w02', status: 'pending', requestedHoursAgo: 4 },
  { key: 'r12', jobKey: 'j02', workerKey: 'w22', status: 'pending', requestedHoursAgo: 7 },
  { key: 'r13', jobKey: 'j03', workerKey: 'w16', status: 'pending', requestedHoursAgo: 10 },
  { key: 'r14', jobKey: 'j03', workerKey: 'w17', status: 'pending', requestedHoursAgo: 5 },
  { key: 'r15', jobKey: 'j04', workerKey: 'w11', status: 'pending', requestedHoursAgo: 9 },
  { key: 'r16', jobKey: 'j04', workerKey: 'w12', status: 'pending', requestedHoursAgo: 6 },
  { key: 'r17', jobKey: 'j04', workerKey: 'w13', status: 'pending', requestedHoursAgo: 4 },
  { key: 'r18', jobKey: 'j04', workerKey: 'w14', status: 'pending', requestedHoursAgo: 2 },
  // Rejected (7)
  { key: 'r19', jobKey: 'j12', workerKey: 'w04', status: 'rejected', requestedHoursAgo: 95, reviewedHoursAgo: 93 },
  { key: 'r20', jobKey: 'j14', workerKey: 'w12', status: 'rejected', requestedHoursAgo: 91, reviewedHoursAgo: 89 },
  { key: 'r21', jobKey: 'j16', workerKey: 'w13', status: 'rejected', requestedHoursAgo: 87, reviewedHoursAgo: 85 },
  { key: 'r22', jobKey: 'j19', workerKey: 'w21', status: 'rejected', requestedHoursAgo: 81, reviewedHoursAgo: 79 },
  { key: 'r23', jobKey: 'j20', workerKey: 'w01', status: 'rejected', requestedHoursAgo: 79, reviewedHoursAgo: 77 },
  { key: 'r24', jobKey: 'j21', workerKey: 'w14', status: 'rejected', requestedHoursAgo: 77, reviewedHoursAgo: 75 },
  { key: 'r25', jobKey: 'j24', workerKey: 'w02', status: 'rejected', requestedHoursAgo: 58, reviewedHoursAgo: 56 },
]
