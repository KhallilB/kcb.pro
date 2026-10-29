import { expect, test } from "bun:test";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import config from "../renovate.json";

// Run with Renovate 44.192.2 binaries on PATH; use npm exec --package=renovate@44.192.2.
const binary = Bun.which("renovate-config-validator");
if (!binary) throw new Error("Run tests with Renovate 44.192.2 on PATH");
// Bun cannot load V8 addons; the Node validator checks RE2 syntax.
process.env.RENOVATE_X_IGNORE_RE2 = "true";
const root = new URL("./", pathToFileURL(realpathSync(binary)));
const { applyPackageRules } = await import(new URL("util/package-rules/index.js", root).href);
const { extractPackageFile } = await import(new URL("modules/manager/custom/regex/index.js", root).href);
const { compile } = await import(new URL("util/template/index.js", root).href);

for (const manager of ["bun", "npm"]) {
  for (const name of ["@kb.ui/react", "@kb.ui/css", "@kb.ui/tokens"]) {
    for (const [type, merge] of [["patch", true], ["minor", false], ["major", false], ["replacement", false]] as const) {
      test(`${manager} ${name} ${type}: automerge=${merge}`, async () => {
        const result = await applyPackageRules({ ...config, manager, depName: name, packageName: name, currentVersion: "0.10.2", updateType: type });
        expect(result.enabled).toBe(true);
        expect(result.automerge).toBe(merge);
        expect(result.groupName).toBe("kbui");
        expect(result.platformAutomerge).toBe(false);
        expect(result.ignoreTests).toBe(false);
        expect(result.separateMinorPatch).toBe(true);
      });
    }
  }
}

test("unrelated dependencies stay disabled", async () => {
  const result = await applyPackageRules({ ...config, manager: "bun", depName: "react", packageName: "react", updateType: "patch" });
  expect(result.enabled).toBe(false);
  expect(result.automerge).toBe(false);
});

for (const name of ["react", "css", "tokens"]) {
  test(`legacy ${name}: migration keeps human review`, async () => {
    const content = JSON.stringify({ dependencies: { [`@kbui/${name}`]: `https://github.com/KhallilB/kbui/releases/download/v0.8.0/kbui-${name}-0.8.0.tgz` } });
    const manager = config.customManagers[0];
    const extracted = extractPackageFile(content, "package.json", manager);
    expect(extracted.deps).toHaveLength(1);
    const dep = extracted.deps[0];
    expect(dep.depName).toBe(`@kb.ui/${name}`);
    expect(dep.currentValue).toBe("0.8.0");
    const replacement = compile(manager.autoReplaceStringTemplate, { ...dep, newValue: "0.10.2" });
    const updated = JSON.parse(content.replace(dep.replaceString, replacement));
    expect(updated.dependencies).toEqual({ [`@kb.ui/${name}`]: "0.10.2" });
    for (const type of ["patch", "minor", "major"]) {
      const result = await applyPackageRules({ ...config, ...dep, manager: "custom.regex", updateType: type });
      expect(result.enabled).toBe(true);
      expect(result.automerge).toBe(false);
    }
  });
}

test("local paths and existing npm dependencies skip migration", () => {
  const content = JSON.stringify({ dependencies: { "@kbui/react": "../kbui/packages/react", "@kb.ui/css": "0.10.2" } });
  expect(extractPackageFile(content, "package.json", config.customManagers[0])).toBeNull();
});
