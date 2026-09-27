export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}