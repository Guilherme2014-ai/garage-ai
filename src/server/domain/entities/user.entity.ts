export interface UserEntity {
  id: string;
  email: string;
  name: string;
  password: string | null;
  image: string | null;
  provider: string | null;
  providerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
