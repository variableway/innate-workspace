import { isAbsolute, relative, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const script = resolve(process.argv[2] ?? "sandbox/demo.ts");
const timeoutMs = Number(process.env.SANDBOX_TIMEOUT_MS ?? 10_000);

if (!Bun.which("deno")) {
  throw new Error("Deno is required. Install it with: curl -fsSL https://deno.land/install.sh | sh");
}

const relativeScript = relative(root, script);
if (relativeScript.startsWith("..") || isAbsolute(relativeScript)) {
  throw new Error(`script must be inside ${root}`);
}

let timedOut = false;
const proc = Bun.spawn([
  "deno", "run", "--no-prompt", script,
], {
  cwd: root,
  stdout: "pipe",
  stderr: "pipe",
});

const timeout = setTimeout(() => {
  timedOut = true;
  proc.kill("SIGKILL");
}, timeoutMs);
const [stdout, stderr, exitCode] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
  proc.exited,
]);
clearTimeout(timeout);

const status = timedOut ? "timed_out" : exitCode === 0 ? "succeeded" : "failed";
console.log(JSON.stringify({ script, status, exitCode, stdout, stderr }, null, 2));
process.exitCode = exitCode === 0 ? 0 : 1;
