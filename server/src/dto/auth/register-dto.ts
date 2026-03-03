import z from "zod";

export const registerDTO = z.object({
  name: z.string().min(3).max(255),
  username: z.string().min(3).max(150),
  email: z.email().max(255),
  password: z.string().min(5).max(255),
});

export type RegisterDTO = z.infer<typeof registerDTO>;
