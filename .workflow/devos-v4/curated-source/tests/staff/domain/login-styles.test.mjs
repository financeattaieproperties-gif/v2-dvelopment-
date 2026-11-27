import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Admin Login page preserves required auth selectors and uses UI Variant 1 palette without purple styling", () => {
  const loginPath = path.resolve("admin-panel/src/pages/Login.tsx");
  assert.ok(fs.existsSync(loginPath), "admin-panel/src/pages/Login.tsx must exist");

  const code = fs.readFileSync(loginPath, "utf8");
  assert.ok(code.includes('id="admin-login-username"'), "Must preserve #admin-login-username");
  assert.ok(code.includes('id="admin-login-password"'), "Must preserve #admin-login-password");
  assert.ok(code.includes("#F8FAFC") && code.includes("#FFFFFF") && code.includes("#0072BC"), "Must use UI Variant 1 palette");
  assert.equal(/purple|#6b21a8|#7e22ce|#4c1d95/i.test(code), false, "Must not use purple palette from reference screenshot");
});

test("Staff Login screen preserves required auth selectors and uses UI Variant 1 palette without purple styling", () => {
  const mainPath = path.resolve("apps/staff/src/components/StaffLoginView.tsx");
  const cssPath = path.resolve("apps/staff/src/styles.css");

  const mainCode = fs.readFileSync(mainPath, "utf8");
  const cssCode = fs.readFileSync(cssPath, "utf8");
  const shellCode = fs.readFileSync(path.resolve("apps/staff/src/main.tsx"), "utf8");
  assert.ok(shellCode.includes('from "./components/StaffLoginView"') && shellCode.includes("<Login"), "Staff shell must compose extracted login view");

  assert.ok(mainCode.includes('id="staff-login-username"'), "Must preserve #staff-login-username");
  assert.ok(mainCode.includes('className="remember-label"'), "Must include Remember me control");
  assert.ok(mainCode.includes('className="forgot-link-btn"'), "Must include Forgot password control");

  assert.ok(cssCode.includes("#F8FAFC") || cssCode.includes("#0072BC"), "styles.css login must use UI Variant 1 palette");
  assert.equal(/\.login-(screen|card)[^}]*(purple|#6b21a8|#7e22ce|#4c1d95)/is.test(cssCode), false, "Login styles must not use purple palette");
});
