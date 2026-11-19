import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("Admin Login page preserves required auth selectors and uses app navy palette without purple styling", () => {
  const loginPath = path.resolve("admin-panel/src/pages/Login.tsx");
  assert.ok(fs.existsSync(loginPath), "admin-panel/src/pages/Login.tsx must exist");

  const code = fs.readFileSync(loginPath, "utf8");
  assert.ok(code.includes('id="admin-login-username"'), "Must preserve #admin-login-username");
  assert.ok(code.includes('id="admin-login-password"'), "Must preserve #admin-login-password");
  assert.ok(code.includes('data-testid="admin-google-signin-btn"'), "Must preserve Google sign-in button");
  assert.ok(code.includes("#010826") && code.includes("#020E3A") && code.includes("#0A1F5C"), "Must use app navy gradient palette");
  assert.ok(code.includes("#0145F2"), "Must use app brand cobalt accent");
  assert.equal(/purple|#6b21a8|#7e22ce|#4c1d95/i.test(code), false, "Must not use purple palette from reference screenshot");
});

test("Staff Login screen preserves required auth selectors and uses app navy palette without purple styling", () => {
  const mainPath = path.resolve("apps/staff/src/main.tsx");
  const cssPath = path.resolve("apps/staff/src/styles.css");

  const mainCode = fs.readFileSync(mainPath, "utf8");
  const cssCode = fs.readFileSync(cssPath, "utf8");

  assert.ok(mainCode.includes('id="staff-login-username"'), "Must preserve #staff-login-username");
  assert.ok(!mainCode.includes('data-testid="staff-google-signin-btn"'), "Must not render Google Sign-In button");
  assert.ok(mainCode.includes('htmlFor="staff-login-username"'), "Must associate label with #staff-login-username");
  assert.ok(mainCode.includes('data-testid="login-forgot-panel"'), "Must include CEO/Admin forgot password notice");
  assert.ok(mainCode.includes('className="remember-label"'), "Must include Remember me control");
  assert.ok(mainCode.includes('className="forgot-link-btn"'), "Must include Forgot password control");

  assert.ok(cssCode.includes("#010826") && cssCode.includes("#020E3A") && cssCode.includes("#0A1F5C"), "styles.css login must use app navy gradient palette");
  assert.ok(cssCode.includes("#0145F2"), "styles.css login must use app brand cobalt accent");
  assert.equal(/\.login-(screen|card)[^}]*(purple|#6b21a8|#7e22ce|#4c1d95)/is.test(cssCode), false, "Login styles must not use purple palette");
});
