import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const lock = fs.readFileSync("yarn.lock", "utf8");

// Lockfile entry headers are the non-indented lines ending in ":".
// A single header can list several comma-separated specs.
const keys = new Set();
for (const raw of lock.split(/\r?\n/)) {
	if (!raw || raw.startsWith("#") || /^\s/.test(raw)) continue;
	if (!raw.trimEnd().endsWith(":")) continue;
	const header = raw.trimEnd().slice(0, -1);
	for (const part of header.split(",")) {
		keys.add(part.trim().replace(/^"|"$/g, ""));
	}
}

const groups = {
	dependencies: pkg.dependencies || {},
	devDependencies: pkg.devDependencies || {},
};

const missing = [];
for (const [group, deps] of Object.entries(groups)) {
	for (const [name, range] of Object.entries(deps)) {
		const spec = `${name}@${range}`;
		if (!keys.has(spec)) missing.push(`${group}: ${spec}`);
	}
}

console.log(`lockfile entry headers parsed: ${keys.size}`);
console.log(
	`package.json specs: ${Object.keys(groups.dependencies).length} deps, ${Object.keys(groups.devDependencies).length} devDeps`
);
console.log("");
if (missing.length === 0) {
	console.log("Every package.json spec has a matching lockfile entry.");
} else {
	console.log(`SPECS WITH NO MATCHING LOCKFILE ENTRY (${missing.length}):`);
	for (const m of missing) console.log("  " + m);
}
