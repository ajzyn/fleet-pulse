import { env } from "./env";

const NEON_API = "https://console.neon.tech/api/v2";

const headers = () => ({
  Authorization: `Bearer ${env.NEON_API_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
});

interface BranchResponse {
  branch: { id: string; current_state: string };
  endpoints: { id: string; host: string; current_state: string }[];
}

interface BranchStatus {
  branch: { current_state: string };
}

interface EndpointsResponse {
  endpoints: { current_state: string }[];
}

const pollUntilReady = async (branchId: string, timeoutMs = 90_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const [bRes, eRes] = await Promise.all([
      fetch(`${NEON_API}/projects/${env.NEON_PROJECT_ID}/branches/${branchId}`, {
        headers: headers(),
      }),
      fetch(`${NEON_API}/projects/${env.NEON_PROJECT_ID}/branches/${branchId}/endpoints`, {
        headers: headers(),
      }),
    ]);
    if (!bRes.ok) throw new Error(`Neon branch poll failed: ${await bRes.text()}`);
    if (!eRes.ok) throw new Error(`Neon endpoints poll failed: ${await eRes.text()}`);
    const b = (await bRes.json()) as BranchStatus;
    const e = (await eRes.json()) as EndpointsResponse;
    if (
      b.branch.current_state === "ready" &&
      e.endpoints.every((ep) => ep.current_state === "active")
    )
      return;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Branch ${branchId} did not become ready in ${timeoutMs.toString()}ms`);
};

const buildBranchUrl = (parentUrl: string, newHost: string): string => {
  const u = new URL(parentUrl);
  u.host = newHost;
  return u.toString();
};

export const createBranch = async (name: string) => {
  const res = await fetch(`${NEON_API}/projects/${env.NEON_PROJECT_ID}/branches`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      branch: { name, parent_id: env.NEON_PARENT_BRANCH_ID },
      endpoints: [{ type: "read_write" }],
    }),
  });
  if (!res.ok) throw new Error(`Neon create branch failed: ${await res.text()}`);
  const data = (await res.json()) as BranchResponse;
  const host = data.endpoints[0]?.host;
  if (!host) throw new Error("Neon response missing endpoint host");

  await pollUntilReady(data.branch.id);

  return {
    branchId: data.branch.id,
    connectionUri: buildBranchUrl(env.DATABASE_URL, host),
  };
};

export const deleteBranch = async (branchId: string) => {
  const res = await fetch(`${NEON_API}/projects/${env.NEON_PROJECT_ID}/branches/${branchId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) console.warn(`Neon delete branch failed: ${await res.text()}`);
};
