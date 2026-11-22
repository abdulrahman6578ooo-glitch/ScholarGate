// Placeholder so Vercel detects the function. `pnpm build:vercel` overwrites this file
// with the bundled Express app built from server/vercel.ts.
export default function handler(_req, res) {
  res.status(503).send("API not built");
}
