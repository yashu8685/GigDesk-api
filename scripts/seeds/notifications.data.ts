export interface NotificationSeed {
  workerKey: string
  type: string
  title: string
  body: string
  jobKey?: string
  hoursAgo: number
}

/** 25 worker-app inbox entries. */
export const notificationSeeds: Array<NotificationSeed> = [
  // request.approved (8)
  { workerKey: 'w01', type: 'request.approved', title: 'Request approved', body: 'You are assigned to "Billboard cleaning".', jobKey: 'j05', hoursAgo: 20 },
  { workerKey: 'w19', type: 'request.approved', title: 'Request approved', body: 'You are assigned to "Grocery restocking run".', jobKey: 'j06', hoursAgo: 18 },
  { workerKey: 'w10', type: 'request.approved', title: 'Request approved', body: 'You are assigned to "Inventory counting".', jobKey: 'j07', hoursAgo: 16 },
  { workerKey: 'w02', type: 'request.approved', title: 'Request approved', body: 'You were assigned to "Flyer distribution".', jobKey: 'j11', hoursAgo: 95 },
  { workerKey: 'w07', type: 'request.approved', title: 'Request approved', body: 'You were assigned to "Shop shifting help".', jobKey: 'j13', hoursAgo: 91 },
  { workerKey: 'w12', type: 'request.approved', title: 'Request approved', body: 'You were assigned to "Warehouse scanning".', jobKey: 'j15', hoursAgo: 87 },
  { workerKey: 'w19', type: 'request.approved', title: 'Request approved', body: 'You were assigned to "Retail restock — T. Nagar".', jobKey: 'j18', hoursAgo: 81 },
  { workerKey: 'w06', type: 'request.approved', title: 'Request approved', body: 'You were assigned to "Sample distribution".', jobKey: 'j22', hoursAgo: 73 },
  // request.rejected (7)
  { workerKey: 'w04', type: 'request.rejected', title: 'Request not approved', body: 'Your request for "Load/unload truck" was not approved.', jobKey: 'j12', hoursAgo: 93 },
  { workerKey: 'w12', type: 'request.rejected', title: 'Request not approved', body: 'Your request for "Data entry support" was not approved.', jobKey: 'j14', hoursAgo: 89 },
  { workerKey: 'w13', type: 'request.rejected', title: 'Request not approved', body: 'Your request for "Cab fleet cleaning" was not approved.', jobKey: 'j16', hoursAgo: 85 },
  { workerKey: 'w21', type: 'request.rejected', title: 'Request not approved', body: 'Your request for "Food packing drive" was not approved.', jobKey: 'j19', hoursAgo: 79 },
  { workerKey: 'w01', type: 'request.rejected', title: 'Request not approved', body: 'Your request for "Billboard removal" was not approved.', jobKey: 'j20', hoursAgo: 77 },
  { workerKey: 'w14', type: 'request.rejected', title: 'Request not approved', body: 'Your request for "Event teardown" was not approved.', jobKey: 'j21', hoursAgo: 75 },
  { workerKey: 'w02', type: 'request.rejected', title: 'Request not approved', body: 'Your request for "Night shift security" was not approved.', jobKey: 'j24', hoursAgo: 56 },
  // assignment.cancelled (6)
  { workerKey: 'w02', type: 'assignment.cancelled', title: 'Assignment cancelled', body: 'Your assignment for "Billboard cleaning" was cancelled.', jobKey: 'j05', hoursAgo: 21 },
  { workerKey: 'w02', type: 'assignment.cancelled', title: 'Assignment cancelled', body: 'Your assignment for "Load/unload truck" was cancelled.', jobKey: 'j12', hoursAgo: 93 },
  { workerKey: 'w11', type: 'assignment.cancelled', title: 'Assignment cancelled', body: 'Your assignment for "Warehouse scanning" was cancelled.', jobKey: 'j15', hoursAgo: 87 },
  { workerKey: 'w16', type: 'assignment.cancelled', title: 'Assignment cancelled', body: 'Your assignment for "Document delivery" was cancelled.', jobKey: 'j17', hoursAgo: 83 },
  { workerKey: 'w01', type: 'assignment.cancelled', title: 'Assignment cancelled', body: 'Your assignment for "Night shift security" was cancelled.', jobKey: 'j24', hoursAgo: 50 },
  { workerKey: 'w11', type: 'assignment.cancelled', title: 'Assignment cancelled', body: 'Your assignment for "Mall promotion crew" was cancelled.', jobKey: 'j25', hoursAgo: 48 },
  // payout.paid (4)
  { workerKey: 'w02', type: 'payout.paid', title: 'Payment sent', body: '₹450 for "Flyer distribution" has been paid.', jobKey: 'j11', hoursAgo: 60 },
  { workerKey: 'w03', type: 'payout.paid', title: 'Payment sent', body: '₹800 for "Load/unload truck" has been paid.', jobKey: 'j12', hoursAgo: 58 },
  { workerKey: 'w07', type: 'payout.paid', title: 'Payment sent', body: '₹900 for "Shop shifting help" has been paid.', jobKey: 'j13', hoursAgo: 55 },
  { workerKey: 'w11', type: 'payout.paid', title: 'Payment sent', body: '₹500 for "Data entry support" has been paid.', jobKey: 'j14', hoursAgo: 52 },
]
