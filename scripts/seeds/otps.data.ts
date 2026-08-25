export interface OtpSeed {
  workerKey: string
  purpose: 'login' | 'registration'
  consumed: boolean
  createdHoursAgo: number
}

/** 5 sample OTP rows (transient auth data — all already consumed/expired). */
export const otpSeeds: Array<OtpSeed> = [
  { workerKey: 'w01', purpose: 'login', consumed: true, createdHoursAgo: 30 },
  { workerKey: 'w10', purpose: 'login', consumed: true, createdHoursAgo: 25 },
  { workerKey: 'w16', purpose: 'login', consumed: true, createdHoursAgo: 20 },
  { workerKey: 'w19', purpose: 'registration', consumed: true, createdHoursAgo: 100 },
  { workerKey: 'w21', purpose: 'login', consumed: true, createdHoursAgo: 15 },
]
