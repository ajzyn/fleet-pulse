import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createBranch } from "./neon";
import { seedMinimal } from "./seed-e2e";

const globalSetup = async () => {
  const name = `e2e-${process.env.GITHUB_RUN_ID ?? Date.now().toString()}`;
  console.log(`[e2e] creating neon branch: ${name}`);
  const { branchId, connectionUri } = await createBranch(name);
  writeFileSync(".e2e-state.json", JSON.stringify({ branchId }));

  try {
    process.env.DATABASE_URL = connectionUri;
    execSync("npm run db:push", {
      env: { ...process.env, DATABASE_URL: connectionUri },
      stdio: "inherit",
    });
    await seedMinimal(connectionUri);
  } catch (err) {
    const { deleteBranch } = await import("./neon");
    await deleteBranch(branchId);
    throw err;
  }

  console.log("[e2e] seeding minimal dataset");
  await seedMinimal(connectionUri);

  console.log("[e2e] ready");
};

export default globalSetup;
