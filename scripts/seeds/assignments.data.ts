export interface AssignmentSeed {
  jobKey: string
  workerKey: string
  status: 'active' | 'cancelled'
  source: 'admin_direct' | 'request_approved'
  requestKey?: string
  assignedHoursAgo: number
  cancelledHoursAgo?: number
}

/**
 * 25 assignments: 13 active (one per assigned/completed job — the DB allows
 * only one active per job) + 12 cancelled (reassignment and job-cancellation
 * history).
 */
export const assignmentSeeds: Array<AssignmentSeed> = [
  // Active — assigned jobs (6)
  { jobKey: 'j05', workerKey: 'w01', status: 'active', source: 'request_approved', requestKey: 'r01', assignedHoursAgo: 20 },
  { jobKey: 'j06', workerKey: 'w19', status: 'active', source: 'request_approved', requestKey: 'r02', assignedHoursAgo: 18 },
  { jobKey: 'j07', workerKey: 'w10', status: 'active', source: 'request_approved', requestKey: 'r03', assignedHoursAgo: 16 },
  { jobKey: 'j08', workerKey: 'w06', status: 'active', source: 'admin_direct', assignedHoursAgo: 14 },
  { jobKey: 'j09', workerKey: 'w16', status: 'active', source: 'admin_direct', assignedHoursAgo: 12 },
  { jobKey: 'j10', workerKey: 'w21', status: 'active', source: 'admin_direct', assignedHoursAgo: 10 },
  // Active — completed jobs (13)
  { jobKey: 'j11', workerKey: 'w02', status: 'active', source: 'request_approved', requestKey: 'r04', assignedHoursAgo: 95 },
  { jobKey: 'j12', workerKey: 'w03', status: 'active', source: 'admin_direct', assignedHoursAgo: 93 },
  { jobKey: 'j13', workerKey: 'w07', status: 'active', source: 'request_approved', requestKey: 'r05', assignedHoursAgo: 91 },
  { jobKey: 'j14', workerKey: 'w11', status: 'active', source: 'admin_direct', assignedHoursAgo: 89 },
  { jobKey: 'j15', workerKey: 'w12', status: 'active', source: 'request_approved', requestKey: 'r06', assignedHoursAgo: 87 },
  { jobKey: 'j16', workerKey: 'w13', status: 'active', source: 'admin_direct', assignedHoursAgo: 85 },
  { jobKey: 'j17', workerKey: 'w17', status: 'active', source: 'admin_direct', assignedHoursAgo: 83 },
  { jobKey: 'j18', workerKey: 'w19', status: 'active', source: 'request_approved', requestKey: 'r07', assignedHoursAgo: 81 },
  { jobKey: 'j19', workerKey: 'w22', status: 'active', source: 'admin_direct', assignedHoursAgo: 79 },
  { jobKey: 'j20', workerKey: 'w04', status: 'active', source: 'admin_direct', assignedHoursAgo: 77 },
  { jobKey: 'j21', workerKey: 'w14', status: 'active', source: 'admin_direct', assignedHoursAgo: 75 },
  { jobKey: 'j22', workerKey: 'w06', status: 'active', source: 'request_approved', requestKey: 'r08', assignedHoursAgo: 73 },
  { jobKey: 'j23', workerKey: 'w16', status: 'active', source: 'admin_direct', assignedHoursAgo: 71 },
  // Cancelled — reassignment history (4)
  { jobKey: 'j05', workerKey: 'w02', status: 'cancelled', source: 'admin_direct', assignedHoursAgo: 30, cancelledHoursAgo: 21 },
  { jobKey: 'j12', workerKey: 'w02', status: 'cancelled', source: 'admin_direct', assignedHoursAgo: 94, cancelledHoursAgo: 93 },
  { jobKey: 'j15', workerKey: 'w11', status: 'cancelled', source: 'admin_direct', assignedHoursAgo: 88, cancelledHoursAgo: 87 },
  { jobKey: 'j17', workerKey: 'w16', status: 'cancelled', source: 'admin_direct', assignedHoursAgo: 84, cancelledHoursAgo: 83 },
  // Cancelled — job was cancelled while assigned (2)
  { jobKey: 'j24', workerKey: 'w01', status: 'cancelled', source: 'admin_direct', assignedHoursAgo: 55, cancelledHoursAgo: 50 },
  { jobKey: 'j25', workerKey: 'w11', status: 'cancelled', source: 'admin_direct', assignedHoursAgo: 53, cancelledHoursAgo: 48 },
]
