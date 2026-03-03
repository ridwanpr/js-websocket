import z from "zod";

export const loginDTO = z.object({
  username: z.string().min(3).max(150),
  password: z.string().min(5).max(255),
});

export type LoginDTO = z.infer<typeof loginDTO>;
