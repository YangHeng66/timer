export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export interface ProfileUpdateForm {
  username?: string;
  email?: string;
}

export interface PasswordChangeForm {
  oldPassword: string;
  newPassword: string;
}
