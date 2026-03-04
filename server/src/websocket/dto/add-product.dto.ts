import z from "zod";

export const addProductDTO = z.object({
  name: z.string().min(3).max(255),
  price: z.number(),
});

export type AddProductDTO = z.infer<typeof addProductDTO>;
