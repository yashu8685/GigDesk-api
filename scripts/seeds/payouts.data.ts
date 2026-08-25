export interface PayoutSeed {
  jobKey: string
  paid?: boolean
  paidHoursAgo?: number
}

/** One payout per completed job (unique constraint) — 9 pending, 4 paid. */
export const payoutSeeds: Array<PayoutSeed> = [
  { jobKey: 'j11', paid: true, paidHoursAgo: 60 },
  { jobKey: 'j12', paid: true, paidHoursAgo: 58 },
  { jobKey: 'j13', paid: true, paidHoursAgo: 55 },
  { jobKey: 'j14', paid: true, paidHoursAgo: 52 },
  { jobKey: 'j15' },
  { jobKey: 'j16' },
  { jobKey: 'j17' },
  { jobKey: 'j18' },
  { jobKey: 'j19' },
  { jobKey: 'j20' },
  { jobKey: 'j21' },
  { jobKey: 'j22' },
  { jobKey: 'j23' },
]
