import { productEventEmitter } from "../../lib/event-emitter.js";
import { prisma } from "../../lib/prisma.js";
import type { AddProductDTO } from "../dto/add-product.dto.js";

export const addProduct = async (addProduct: AddProductDTO) => {
  const result = await prisma.product.create({
    data: addProduct,
  });

  const listener = serializeBigInt(result);
  productEventEmitter.emit("product_change", listener);

  return result;
};

const serializeBigInt = (data: unknown) =>
  JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
