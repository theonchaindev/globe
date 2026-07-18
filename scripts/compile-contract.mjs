// Compile contracts/MissionToken.sol → src/lib/evm/MissionToken.json
// Run: node scripts/compile-contract.mjs
import solc from "solc";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const name of ["MissionToken", "MissionERC20"]) {
  const source = readFileSync(join(root, `contracts/${name}.sol`), "utf8");
  const input = {
    language: "Solidity",
    sources: { [`${name}.sol`]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (out.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length) {
    console.error(errors.map((e) => e.formattedMessage).join("\n"));
    process.exit(1);
  }
  for (const w of (out.errors ?? []).filter((e) => e.severity === "warning")) {
    console.warn(w.formattedMessage);
  }
  const c = out.contracts[`${name}.sol`][name];
  writeFileSync(
    join(root, `src/lib/evm/${name}.json`),
    JSON.stringify({ contractName: name, abi: c.abi, bytecode: "0x" + c.evm.bytecode.object }, null, 2),
  );
  console.log(`compiled ${name} — ${c.abi.length} ABI entries, ${(c.evm.bytecode.object.length / 2 / 1024).toFixed(1)} KB bytecode`);
}
