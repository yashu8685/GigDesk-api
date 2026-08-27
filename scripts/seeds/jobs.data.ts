export interface JobSeed {
  key: string
  title: string
  description: string
  city: string
  district: string
  area: string
  pincode: string
  payAmountInr: number
  durationHours: number
  status: 'open' | 'assigned' | 'completed' | 'cancelled'
  workerKey?: string // assignee for assigned/completed jobs (must match pincode)
  createdHoursAgo: number
  assignedHoursAgo?: number
  completedHoursAgo?: number
  cancelledReason?: string
  cancelledHoursAgo?: number
}

/** 25 jobs: 4 open, 6 assigned, 13 completed, 2 cancelled. */
export const jobSeeds: Array<JobSeed> = [
  // Open (4)
  { key: 'j01', title: 'Warehouse sorting shift', description: 'Sort inbound packages at the MG Road warehouse. Gloves provided.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'MG Road', pincode: '560001', payAmountInr: 900, durationHours: 6, status: 'open', createdHoursAgo: 30 },
  { key: 'j02', title: 'Delivery run — Adyar to Guindy', description: 'Pick up packaged material and deliver between two outlets.', city: 'Chennai', district: 'Chennai', area: 'Adyar', pincode: '600020', payAmountInr: 500, durationHours: 2, status: 'open', createdHoursAgo: 26 },
  { key: 'j03', title: 'Store signage mounting', description: 'Mount new signboard at retail store entrance, Begumpet.', city: 'Hyderabad', district: 'Hyderabad', area: 'Begumpet', pincode: '500016', payAmountInr: 850, durationHours: 5, status: 'open', createdHoursAgo: 22 },
  { key: 'j04', title: 'Event setup crew', description: 'Arrange chairs and stage for a corporate event at HITEC City.', city: 'Hyderabad', district: 'Hyderabad', area: 'HITEC City', pincode: '500081', payAmountInr: 600, durationHours: 2, status: 'open', createdHoursAgo: 18 },
  // Assigned (6)
  { key: 'j05', title: 'Billboard cleaning', description: 'Clean and prep billboard surface on MG Road for new creative.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'MG Road', pincode: '560001', payAmountInr: 550, durationHours: 3, status: 'assigned', workerKey: 'w01', createdHoursAgo: 40, assignedHoursAgo: 20 },
  { key: 'j06', title: 'Grocery restocking run', description: 'Restock shelves at a supermarket in T. Nagar before opening.', city: 'Chennai', district: 'Chennai', area: 'T. Nagar', pincode: '600017', payAmountInr: 750, durationHours: 4, status: 'assigned', workerKey: 'w19', createdHoursAgo: 38, assignedHoursAgo: 18 },
  { key: 'j07', title: 'Inventory counting', description: 'Cycle count at electronics warehouse, HITEC City.', city: 'Hyderabad', district: 'Hyderabad', area: 'HITEC City', pincode: '500081', payAmountInr: 700, durationHours: 4, status: 'assigned', workerKey: 'w10', createdHoursAgo: 36, assignedHoursAgo: 16 },
  { key: 'j08', title: 'Banner installation', description: 'Install promotional banners across Koramangala retail strip.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'Koramangala', pincode: '560034', payAmountInr: 650, durationHours: 3, status: 'assigned', workerKey: 'w06', createdHoursAgo: 34, assignedHoursAgo: 14 },
  { key: 'j09', title: 'Packing support', description: 'Support order packing desk at Begumpet fulfilment hub.', city: 'Hyderabad', district: 'Hyderabad', area: 'Begumpet', pincode: '500016', payAmountInr: 600, durationHours: 4, status: 'assigned', workerKey: 'w16', createdHoursAgo: 32, assignedHoursAgo: 12 },
  { key: 'j10', title: 'Stall setup — expo ground', description: 'Set up brand stalls at Adyar expo ground.', city: 'Chennai', district: 'Chennai', area: 'Adyar', pincode: '600020', payAmountInr: 550, durationHours: 3, status: 'assigned', workerKey: 'w21', createdHoursAgo: 30, assignedHoursAgo: 10 },
  // Completed (13)
  { key: 'j11', title: 'Flyer distribution', description: 'Distribute flyers near MG Road metro exit.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'MG Road', pincode: '560001', payAmountInr: 450, durationHours: 3, status: 'completed', workerKey: 'w02', createdHoursAgo: 100, assignedHoursAgo: 95, completedHoursAgo: 90 },
  { key: 'j12', title: 'Load/unload truck', description: 'Unload furnishing truck at MG Road godown.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'MG Road', pincode: '560001', payAmountInr: 800, durationHours: 4, status: 'completed', workerKey: 'w03', createdHoursAgo: 98, assignedHoursAgo: 93, completedHoursAgo: 88 },
  { key: 'j13', title: 'Shop shifting help', description: 'Help shift a bakery outlet within Koramangala.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'Koramangala', pincode: '560034', payAmountInr: 900, durationHours: 5, status: 'completed', workerKey: 'w07', createdHoursAgo: 96, assignedHoursAgo: 91, completedHoursAgo: 85 },
  { key: 'j14', title: 'Data entry support', description: 'Entry of survey forms at HITEC City office.', city: 'Hyderabad', district: 'Hyderabad', area: 'HITEC City', pincode: '500081', payAmountInr: 500, durationHours: 3, status: 'completed', workerKey: 'w11', createdHoursAgo: 94, assignedHoursAgo: 89, completedHoursAgo: 84 },
  { key: 'j15', title: 'Warehouse scanning', description: 'Barcode scanning shift at HITEC City warehouse.', city: 'Hyderabad', district: 'Hyderabad', area: 'HITEC City', pincode: '500081', payAmountInr: 750, durationHours: 5, status: 'completed', workerKey: 'w12', createdHoursAgo: 92, assignedHoursAgo: 87, completedHoursAgo: 82 },
  { key: 'j16', title: 'Cab fleet cleaning', description: 'Interior cleaning for 10 cabs, HITEC City depot.', city: 'Hyderabad', district: 'Hyderabad', area: 'HITEC City', pincode: '500081', payAmountInr: 600, durationHours: 3, status: 'completed', workerKey: 'w13', createdHoursAgo: 90, assignedHoursAgo: 85, completedHoursAgo: 80 },
  { key: 'j17', title: 'Document delivery', description: 'Deliver signed documents between two Begumpet offices.', city: 'Hyderabad', district: 'Hyderabad', area: 'Begumpet', pincode: '500016', payAmountInr: 400, durationHours: 2, status: 'completed', workerKey: 'w17', createdHoursAgo: 88, assignedHoursAgo: 83, completedHoursAgo: 78 },
  { key: 'j18', title: 'Retail restock — T. Nagar', description: 'Restock apparel at T. Nagar retail store.', city: 'Chennai', district: 'Chennai', area: 'T. Nagar', pincode: '600017', payAmountInr: 700, durationHours: 4, status: 'completed', workerKey: 'w19', createdHoursAgo: 86, assignedHoursAgo: 81, completedHoursAgo: 76 },
  { key: 'j19', title: 'Food packing drive', description: 'Pack food kits at Adyar community centre.', city: 'Chennai', district: 'Chennai', area: 'Adyar', pincode: '600020', payAmountInr: 550, durationHours: 3, status: 'completed', workerKey: 'w22', createdHoursAgo: 84, assignedHoursAgo: 79, completedHoursAgo: 74 },
  { key: 'j20', title: 'Billboard removal', description: 'Dismantle old billboard on MG Road.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'MG Road', pincode: '560001', payAmountInr: 650, durationHours: 3, status: 'completed', workerKey: 'w04', createdHoursAgo: 82, assignedHoursAgo: 77, completedHoursAgo: 72 },
  { key: 'j21', title: 'Event teardown', description: 'Teardown and load-out after HITEC City expo.', city: 'Hyderabad', district: 'Hyderabad', area: 'HITEC City', pincode: '500081', payAmountInr: 650, durationHours: 3, status: 'completed', workerKey: 'w14', createdHoursAgo: 80, assignedHoursAgo: 75, completedHoursAgo: 70 },
  { key: 'j22', title: 'Sample distribution', description: 'Hand out samples at Koramangala supermarket.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'Koramangala', pincode: '560034', payAmountInr: 500, durationHours: 3, status: 'completed', workerKey: 'w06', createdHoursAgo: 78, assignedHoursAgo: 73, completedHoursAgo: 68 },
  { key: 'j23', title: 'Stock audit help', description: 'Assist annual stock audit at Begumpet store.', city: 'Hyderabad', district: 'Hyderabad', area: 'Begumpet', pincode: '500016', payAmountInr: 700, durationHours: 4, status: 'completed', workerKey: 'w16', createdHoursAgo: 76, assignedHoursAgo: 71, completedHoursAgo: 66 },
  // Cancelled (2)
  { key: 'j24', title: 'Night shift security', description: 'Overnight watch at MG Road construction site.', city: 'Bengaluru', district: 'Bengaluru Urban', area: 'MG Road', pincode: '560001', payAmountInr: 1000, durationHours: 8, status: 'cancelled', workerKey: 'w01', createdHoursAgo: 60, assignedHoursAgo: 55, cancelledReason: 'Client postponed the work', cancelledHoursAgo: 50 },
  { key: 'j25', title: 'Mall promotion crew', description: 'Promotion desk at HITEC City mall atrium.', city: 'Hyderabad', district: 'Hyderabad', area: 'HITEC City', pincode: '500081', payAmountInr: 800, durationHours: 6, status: 'cancelled', workerKey: 'w11', createdHoursAgo: 58, assignedHoursAgo: 53, cancelledReason: 'Venue permit denied', cancelledHoursAgo: 48 },
]
