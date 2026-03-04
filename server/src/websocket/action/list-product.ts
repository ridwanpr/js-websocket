import { prisma } from "../../lib/prisma.js";

export const listProduct = async () => {
  return await prisma.product.findMany();
};
