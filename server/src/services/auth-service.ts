import type { RegisterDTO } from "../dto/auth/register-dto.js";
import type { User } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";

export interface AuthService {
  register: (
    registerDTO: RegisterDTO,
  ) => Promise<Omit<User, "password" | "updated_at">>;
}

export function createAuthService(): AuthService {
  const register = async (registerDTO: RegisterDTO) => {
    const [isUsernameExists, isEmailExists] = await Promise.all([
      prisma.user.findUnique({
        where: {
          username: registerDTO.username,
        },
      }),
      prisma.user.findUnique({
        where: {
          email: registerDTO.email,
        },
      }),
    ]);

    if (isUsernameExists) {
      throw new Error("Username already exists");
    }
    if (isEmailExists) {
      throw new Error("Email already exists");
    }

    registerDTO.password = await bcrypt.hash(registerDTO.password, 12);
    const createUser = await prisma.user.create({
      data: registerDTO,
      omit: {
        password: true,
        updated_at: true,
      },
    });

    return createUser;
  };

  return { register };
}
