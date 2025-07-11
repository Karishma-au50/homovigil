export interface User {
  id: string;           // or number, depending on your backend
  mobile: string;
  name?: string;
  email?: string;
  role?: string;

  // Add other fields as needed from your backend's JWT/user object
  exp?: number;         // JWT expiration (optional, for token validation)
}