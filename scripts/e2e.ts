import { execSync, spawnSync } from "node:child_process";
import { createBranch, deleteBranch } from "../e2e/support/neon";
import { seedMinimal } from "../e2e/support/seed-e2e";

const main = async () => {
  const branchName = `e2e-${Date.now().toString()}`;
  console.log(`[e2e] creating neon branch: ${branchName}`);
  const { branchId, connectionUri } = await createBranch(branchName);

  const cleanup = async () => {
    console.log(`[e2e] deleting neon branch: ${branchId}`);
    await deleteBranch(branchId);
  };

  process.on("SIGINT", () => {
    void cleanup().finally(() => process.exit(130));
  });
  process.on("SIGTERM", () => {
    void cleanup().finally(() => process.exit(143));
  });

  let exitCode = 0;
  try {
    process.env.DATABASE_URL = connectionUri;

    console.log("[e2e] pushing schema");
    execSync("npm run db:push", { stdio: "inherit" });

    console.log("[e2e] seeding minimal dataset");
    await seedMinimal(connectionUri);

    console.log("[e2e] running playwright");
    const result = spawnSync("npx", ["playwright", "test", ...process.argv.slice(2)], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    exitCode = result.status ?? 1;
  } finally {
    await cleanup();
  }

  process.exit(exitCode);
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
