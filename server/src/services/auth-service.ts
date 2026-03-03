import type { LoginDTO } from "../dto/auth/login-dto.js";
import type { RegisterDTO } from "../dto/auth/register-dto.js";
import type { User } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";

export interface AuthService {
  register: (
    registerDTO: RegisterDTO,
  ) => Promise<Omit<User, "password" | "updated_at">>;

  login: (loginDTO: LoginDTO) => Promise<{ accessToken: string }>;
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

  const login = async (loginDTO: LoginDTO) => {
    const user = await prisma.user.findUnique({
      where: {
        username: loginDTO.username,
      },
    });

    if (!user) throw new Error("Invalid Credentials");

    const comparePassword = await bcrypt.compare(
      loginDTO.password,
      user.password,
    );

    if (!comparePassword) throw new Error("Invalid Credentials");

    const token = randomBytes(30).toString("hex");
    const hashToken = await bcrypt.hash(token, 9);

    await prisma.session.updateMany({
      where: {
        user_id: user.id,
      },
      data: {
        is_revoked: true,
      },
    });

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 7);

    await prisma.session.create({
      data: {
        user_id: user.id,
        expires_at: expDate,
        token: hashToken,
      },
    });

    return {
      accessToken: token,
    };
  };

  return { register, login };
}
