
// export interface Patient {
//   _id: string;
//   firstname?: string;
//   lastname?: string;
//   UHID?: string;
//   haemovigilId?: string;
//   bloodGroup?: string;
//   dob?: string | null;
//   mobile: number;
//   isActive: boolean;
//   updatedAt: number;
//   createdAt: string;
// }

export interface Patient {
  dop: any;
  _id: string;
  firstname: string;
  lastname?: string;
  UHID?: string;
  haemovigilId?: string;
  bloodGroup?: string;
  dob?: Date;
  mobile?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  gender?: 'Male' | 'Female' | 'Other';
  wardNo?: string;
  department?: string;
  donorNo?: string;
  dateOfProcedure?: number;
  donorName?: string;
  weight?: number;
  address?: string;
  haemoglobin?: number;
  HIV?: 'Positive' | 'Negative' | 'Not Tested';
  HBsAg?: 'Positive' | 'Negative' | 'Not Tested';
  HCV?: 'Positive' | 'Negative' | 'Not Tested';
  VDRL?: 'Positive' | 'Negative' | 'Not Tested';
  MP?: 'Positive' | 'Negative' | 'Not Tested';
  remarks?: string;
  signature?: string;
}