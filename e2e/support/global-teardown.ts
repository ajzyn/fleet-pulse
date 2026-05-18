import { readFileSync, unlinkSync } from "node:fs";
import { deleteBranch } from "./neon";

const globalTeardown = async () => {
  try {
    const raw = readFileSync(".e2e-state.json", "utf8");
    const { branchId } = JSON.parse(raw) as { branchId: string };
    console.log(`[e2e] deleting Neon branch ${branchId}`);
    await deleteBranch(branchId);
    unlinkSync(".e2e-state.json");
  } catch (e) {
    console.warn("[e2e] teardown skipped:", e);
  }
};

export default globalTeardown;
