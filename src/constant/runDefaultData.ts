import { createDefaultMainCategories, initializeDefaultData } from "./default";

export default async function runMainDefaultInitialize() {
  // await initializeDefaultData();
  await createDefaultMainCategories();
}