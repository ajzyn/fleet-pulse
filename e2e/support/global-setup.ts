import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createBranch, deleteBranch } from "./neon";
import { seedMinimal } from "./seed-e2e";

const globalSetup = async () => {
  const isCi = process.env.CI === "true";
  let connectionUri: string;
  let branchId: string | null = null;

  if (isCi) {
    console.log("[e2e] using DATABASE_URL provided by CI");
    connectionUri = process.env.DATABASE_URL ?? "";
    if (!connectionUri) throw new Error("DATABASE_URL not set in CI");
  } else {
    const name = `e2e-${Date.now().toString()}`;
    console.log(`[e2e] creating neon branch: ${name}`);
    const created = await createBranch(name);
    connectionUri = created.connectionUri;
    branchId = created.branchId;
    writeFileSync(".e2e-state.json", JSON.stringify({ branchId }));
  }

  try {
    process.env.DATABASE_URL = connectionUri;
    console.log("[e2e] pushing schema");
    execSync("npm run db:push", {
      env: { ...process.env, DATABASE_URL: connectionUri },
      stdio: "inherit",
    });
    console.log("[e2e] seeding minimal dataset");
    await seedMinimal(connectionUri);
    console.log("[e2e] ready");
  } catch (err) {
    if (branchId) await deleteBranch(branchId);
    throw err;
  }
};

export default globalSetup;
