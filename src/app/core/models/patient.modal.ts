
export interface Patient {
  _id: string;
  firstname?: string;
  lastname?: string;
  UHID?: string;
  haemovigilId?: string;
  bloodGroup?: string;
  dob?: string | null;
  mobile: number;
  isActive: boolean;
  updatedAt: number;
  createdAt: string;
}