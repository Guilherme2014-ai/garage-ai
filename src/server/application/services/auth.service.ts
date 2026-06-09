import bcrypt from "bcryptjs";
import type { UserEntity } from "@/server/domain/entities";
import { ConflictError, ValidationError } from "@/server/domain/errors";
import { userRepository } from "@/server/repositories";

export interface SignUpInput {
  email: string;
  name: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

function toAuthResult(entity: UserEntity) {
  return {
    id: entity.id,
    email: entity.email,
    name: entity.name,
    image: entity.image,
  };
}

export const authService = {
  async signUp(data: SignUpInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError("Invalid email format");
    }

    if (data.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      image: null,
      provider: "credentials",
      providerId: null,
    });

    return toAuthResult(user);
  },

  async signIn(data: SignInInput) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new ValidationError("Invalid credentials");
    }

    if (!user.password) {
      throw new ValidationError("Please sign in with your OAuth provider");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new ValidationError("Invalid credentials");
    }

    return toAuthResult(user);
  },

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) return null;
    return toAuthResult(user);
  },
};
