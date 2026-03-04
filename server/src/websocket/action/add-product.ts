import { prisma } from "../../lib/prisma.js";
import type { AddProductDTO } from "../dto/add-product.dto.js";

export const addProduct = async (addProduct: AddProductDTO) => {
  return await prisma.product.create({
    data: addProduct,
  });
};
