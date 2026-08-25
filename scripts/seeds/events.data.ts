export interface EventSeed {
  type: string
  jobKey?: string
  workerKey?: string
  status: 'pending' | 'processed'
  hoursAgo: number
}

/** 25 observable events written by API state changes. */
export const eventSeeds: Array<EventSeed> = [
  // job.completed (13) — processed for paid jobs, pending otherwise
  { type: 'job.completed', jobKey: 'j11', workerKey: 'w02', status: 'processed', hoursAgo: 90 },
  { type: 'job.completed', jobKey: 'j12', workerKey: 'w03', status: 'processed', hoursAgo: 88 },
  { type: 'job.completed', jobKey: 'j13', workerKey: 'w07', status: 'processed', hoursAgo: 85 },
  { type: 'job.completed', jobKey: 'j14', workerKey: 'w11', status: 'processed', hoursAgo: 84 },
  { type: 'job.completed', jobKey: 'j15', workerKey: 'w12', status: 'pending', hoursAgo: 82 },
  { type: 'job.completed', jobKey: 'j16', workerKey: 'w13', status: 'pending', hoursAgo: 80 },
  { type: 'job.completed', jobKey: 'j17', workerKey: 'w17', status: 'pending', hoursAgo: 78 },
  { type: 'job.completed', jobKey: 'j18', workerKey: 'w19', status: 'pending', hoursAgo: 76 },
  { type: 'job.completed', jobKey: 'j19', workerKey: 'w22', status: 'pending', hoursAgo: 74 },
  { type: 'job.completed', jobKey: 'j20', workerKey: 'w04', status: 'pending', hoursAgo: 72 },
  { type: 'job.completed', jobKey: 'j21', workerKey: 'w14', status: 'pending', hoursAgo: 70 },
  { type: 'job.completed', jobKey: 'j22', workerKey: 'w06', status: 'pending', hoursAgo: 68 },
  { type: 'job.completed', jobKey: 'j23', workerKey: 'w16', status: 'pending', hoursAgo: 66 },
  // job.assigned (6)
  { type: 'job.assigned', jobKey: 'j05', workerKey: 'w01', status: 'processed', hoursAgo: 20 },
  { type: 'job.assigned', jobKey: 'j06', workerKey: 'w19', status: 'processed', hoursAgo: 18 },
  { type: 'job.assigned', jobKey: 'j07', workerKey: 'w10', status: 'processed', hoursAgo: 16 },
  { type: 'job.assigned', jobKey: 'j08', workerKey: 'w06', status: 'processed', hoursAgo: 14 },
  { type: 'job.assigned', jobKey: 'j09', workerKey: 'w16', status: 'processed', hoursAgo: 12 },
  { type: 'job.assigned', jobKey: 'j10', workerKey: 'w21', status: 'processed', hoursAgo: 10 },
  // job.cancelled (2)
  { type: 'job.cancelled', jobKey: 'j24', workerKey: 'w01', status: 'processed', hoursAgo: 50 },
  { type: 'job.cancelled', jobKey: 'j25', workerKey: 'w11', status: 'processed', hoursAgo: 48 },
  // worker.approved (4)
  { type: 'worker.approved', workerKey: 'w01', status: 'processed', hoursAgo: 236 },
  { type: 'worker.approved', workerKey: 'w06', status: 'processed', hoursAgo: 196 },
  { type: 'worker.approved', workerKey: 'w10', status: 'processed', hoursAgo: 166 },
  { type: 'worker.approved', workerKey: 'w16', status: 'processed', hoursAgo: 116 },
]
