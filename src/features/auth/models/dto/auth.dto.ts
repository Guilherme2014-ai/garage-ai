export interface SignInDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  email: string;
  name: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
