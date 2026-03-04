import { z, type ZodType } from "zod";

export const zParseDTO = async <T extends ZodType>(
  schema: T,
  data: unknown,
): Promise<z.infer<T>> => {
  return await schema.parseAsync(data);
};
