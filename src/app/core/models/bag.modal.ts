export interface Patient {
    _id: string;
    firstname: string;
    lastname: string;
    UHID: string;
    haemovigilId: string;
    bloodGroup: string;
}

export interface BloodBag {
    _id: string;
    bloodBagId: string;
    bloodGroup: string;
    bloodcomponent: string;
}

export interface BagAllocation {
    _id: string;
    patientId: Patient;
    bloodBagId: BloodBag;
    transporterKey?: string | null;
    allocatedOn: string;
    status: string;
}
