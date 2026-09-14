console.log("sandbox ok");
let canReadEnv = false;
let canReadEtc = false;
try { Deno.env.get("HOME"); canReadEnv = true; } catch {}
try { await Deno.readTextFile("/etc/passwd"); canReadEtc = true; } catch {}
console.log({
  canReadEnv,
  canReadEtc,
});
