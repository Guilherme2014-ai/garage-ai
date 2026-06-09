export interface UserViewModel {
  id: string;
  email: string;
  name: string;
  image: string | null;
  provider: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublicViewModel {
  id: string;
  email: string;
  name: string;
  image: string | null;
  provider: string | null;
}
