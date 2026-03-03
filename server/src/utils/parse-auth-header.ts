export const parseAuthHeader = (header: string) => {
  const parts = header.split(" ");
  if (parts[0] !== "Bearer") {
    throw new Error("Not a valid bearer token");
  }

  return parts[1];
};
