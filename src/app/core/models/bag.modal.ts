export interface Patient {
  _id: string;
  firstname: string;
  lastname: string;
  UHID: string;
  haemovigilId: string;
  bloodGroup: string;
  mobile: number;
}

export interface BloodBag {
  _id: string;
  bloodBagId: string;
  bloodGroup: string;
  bloodcomponent: string;
  volume: number;
}

export interface BagAllocation {
  _id: string;
  patientId: Patient;
  bloodBagId: BloodBag;
  allocatedOn: string; // ISO date string
  status: string;
  createdAt: number;
  updatedAt: number;
  transporterKey: string;
}
