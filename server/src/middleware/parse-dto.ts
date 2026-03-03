import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";

export const parseDTO = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: z.flattenError(result.error),
      });
    }

    req.body = result.data;
    next();
  };
};
