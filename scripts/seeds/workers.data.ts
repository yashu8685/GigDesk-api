export interface WorkerSeed {
  key: string
  fullName: string
  phone: string
  city: string
  area: string
  pincode: string
  status: 'pending' | 'approved' | 'rejected'
  registeredHoursAgo: number
  reviewedHoursAgo?: number
  rejectionReason?: string
}

/** 25 workers across 6 pincodes: 16 approved, 7 pending, 3 rejected. */
export const workerSeeds: Array<WorkerSeed> = [
  // MG Road, Bengaluru — 560001
  { key: 'w01', fullName: 'Ramesh Gupta', phone: '+919800110001', city: 'Bengaluru', area: 'MG Road', pincode: '560001', status: 'approved', registeredHoursAgo: 240, reviewedHoursAgo: 236 },
  { key: 'w02', fullName: 'Sita Devi', phone: '+919800110002', city: 'Bengaluru', area: 'MG Road', pincode: '560001', status: 'approved', registeredHoursAgo: 230, reviewedHoursAgo: 226 },
  { key: 'w03', fullName: 'Mohan Rao', phone: '+919800110003', city: 'Bengaluru', area: 'MG Road', pincode: '560001', status: 'approved', registeredHoursAgo: 220, reviewedHoursAgo: 216 },
  { key: 'w04', fullName: 'Priya Sharma', phone: '+919800110004', city: 'Bengaluru', area: 'MG Road', pincode: '560001', status: 'approved', registeredHoursAgo: 210, reviewedHoursAgo: 206 },
  { key: 'w05', fullName: 'Arun Verma', phone: '+919800110005', city: 'Bengaluru', area: 'MG Road', pincode: '560001', status: 'pending', registeredHoursAgo: 5 },
  // Koramangala, Bengaluru — 560034
  { key: 'w06', fullName: 'Kavya Reddy', phone: '+919800120001', city: 'Bengaluru', area: 'Koramangala', pincode: '560034', status: 'approved', registeredHoursAgo: 200, reviewedHoursAgo: 196 },
  { key: 'w07', fullName: 'Suresh Babu', phone: '+919800120002', city: 'Bengaluru', area: 'Koramangala', pincode: '560034', status: 'approved', registeredHoursAgo: 190, reviewedHoursAgo: 186 },
  { key: 'w08', fullName: 'Anil Kumar', phone: '+919800120003', city: 'Bengaluru', area: 'Koramangala', pincode: '560034', status: 'rejected', registeredHoursAgo: 180, reviewedHoursAgo: 176, rejectionReason: 'ID document unreadable' },
  { key: 'w09', fullName: 'Deepa Nair', phone: '+919800120004', city: 'Bengaluru', area: 'Koramangala', pincode: '560034', status: 'pending', registeredHoursAgo: 9 },
  // HITEC City, Hyderabad — 500081
  { key: 'w10', fullName: 'Lakshmi Prasad', phone: '+919400130001', city: 'Hyderabad', area: 'HITEC City', pincode: '500081', status: 'approved', registeredHoursAgo: 170, reviewedHoursAgo: 166 },
  { key: 'w11', fullName: 'Imran Khan', phone: '+919400130002', city: 'Hyderabad', area: 'HITEC City', pincode: '500081', status: 'approved', registeredHoursAgo: 160, reviewedHoursAgo: 156 },
  { key: 'w12', fullName: 'Swathi Rao', phone: '+919400130003', city: 'Hyderabad', area: 'HITEC City', pincode: '500081', status: 'approved', registeredHoursAgo: 150, reviewedHoursAgo: 146 },
  { key: 'w13', fullName: 'Vinod Yadav', phone: '+919400130004', city: 'Hyderabad', area: 'HITEC City', pincode: '500081', status: 'approved', registeredHoursAgo: 140, reviewedHoursAgo: 136 },
  { key: 'w14', fullName: 'Rekha Singh', phone: '+919400130005', city: 'Hyderabad', area: 'HITEC City', pincode: '500081', status: 'approved', registeredHoursAgo: 130, reviewedHoursAgo: 126 },
  { key: 'w15', fullName: 'Mahesh Joshi', phone: '+919400130006', city: 'Hyderabad', area: 'HITEC City', pincode: '500081', status: 'pending', registeredHoursAgo: 12 },
  // Begumpet, Hyderabad — 500016
  { key: 'w16', fullName: 'Farhan Ali', phone: '+919400140001', city: 'Hyderabad', area: 'Begumpet', pincode: '500016', status: 'approved', registeredHoursAgo: 120, reviewedHoursAgo: 116 },
  { key: 'w17', fullName: 'Divya Krishnan', phone: '+919400140002', city: 'Hyderabad', area: 'Begumpet', pincode: '500016', status: 'approved', registeredHoursAgo: 110, reviewedHoursAgo: 106 },
  { key: 'w18', fullName: 'Ganesh B', phone: '+919400140003', city: 'Hyderabad', area: 'Begumpet', pincode: '500016', status: 'pending', registeredHoursAgo: 20 },
  // T. Nagar, Chennai — 600017
  { key: 'w19', fullName: 'Karthik Raja', phone: '+919600150001', city: 'Chennai', area: 'T. Nagar', pincode: '600017', status: 'approved', registeredHoursAgo: 100, reviewedHoursAgo: 96 },
  { key: 'w20', fullName: 'Meena Iyer', phone: '+919600150002', city: 'Chennai', area: 'T. Nagar', pincode: '600017', status: 'rejected', registeredHoursAgo: 90, reviewedHoursAgo: 86, rejectionReason: 'Phone number unreachable for verification' },
  // Adyar, Chennai — 600020
  { key: 'w21', fullName: 'Priya Venkatesh', phone: '+919600160001', city: 'Chennai', area: 'Adyar', pincode: '600020', status: 'approved', registeredHoursAgo: 80, reviewedHoursAgo: 76 },
  { key: 'w22', fullName: 'Rahul Menon', phone: '+919600160002', city: 'Chennai', area: 'Adyar', pincode: '600020', status: 'approved', registeredHoursAgo: 70, reviewedHoursAgo: 66 },
  { key: 'w23', fullName: 'Sneha Reddy', phone: '+919600160003', city: 'Chennai', area: 'Adyar', pincode: '600020', status: 'pending', registeredHoursAgo: 30 },
  { key: 'w24', fullName: 'Vikram Singh', phone: '+919600160004', city: 'Chennai', area: 'Adyar', pincode: '600020', status: 'rejected', registeredHoursAgo: 40, reviewedHoursAgo: 36, rejectionReason: 'Address mismatch in ID proof' },
  { key: 'w25', fullName: 'Asha Pillai', phone: '+919600160005', city: 'Chennai', area: 'Adyar', pincode: '600020', status: 'pending', registeredHoursAgo: 2 },
]
