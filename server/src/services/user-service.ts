import { prisma } from "../lib/prisma.js";

export const findOneByid = (userId: bigint) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
};
