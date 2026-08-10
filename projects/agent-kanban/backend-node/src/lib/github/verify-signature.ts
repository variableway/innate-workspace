import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify GitHub webhook HMAC-SHA256 signature.
 *
 * @param body - Raw request body as string or Buffer
 * @param signature - X-Hub-Signature-256 header value (e.g. "sha256=abc123...")
 * @param secret - Webhook secret configured in GitHub
 * @returns true if signature is valid
 */
export function verifyGitHubSignature(
  body: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expectedMAC = signature.slice(7); // Remove "sha256=" prefix
  const bodyBuf = typeof body === "string" ? Buffer.from(body) : body;

  const mac = createHmac("sha256", secret);
  mac.update(bodyBuf);
  const expected = mac.digest("hex");

  // Timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(Buffer.from(expectedMAC), Buffer.from(expected));
  } catch {
    return false;
  }
}
