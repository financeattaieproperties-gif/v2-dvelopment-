import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("apps/staff/src/api.ts authenticates via MySQL session endpoint without Firebase Auth", () => {
  const apiCode = read("apps/staff/src/api.ts");
  assert.doesNotMatch(apiCode, /firebase\.mjs|googleWorkspaceAuth|identitytoolkit|loginWithGoogle|resetPassword/);
  assert.match(apiCode, /request<Session>\("auth\/login",\s*"POST"/);
  assert.match(apiCode, /updateStaff:\s*\(\s*id:\s*number/);
  assert.match(apiCode, /request<\{\s*success:\s*boolean\s*\}>\(`staff\/\$\{id\}`/s);
});

test("staff-service/src/App.php uses MySQL password_verify and PHP sessions without FirebaseAuth", () => {
  const appPhp = read("staff-service/src/App.php");
  assert.doesNotMatch(appPhp, /FirebaseAuth/);
  assert.match(appPhp, /LOWER\(username\)\s*=\s*\?/);
  assert.match(appPhp, /password_verify\(/);
  assert.match(appPhp, /password_hash\(/);
  assert.match(appPhp, /PASSWORD_BCRYPT/);
  assert.match(appPhp, /updateStaff\(/);
  assert.match(appPhp, /auth_version\s*=\s*auth_version\s*\+\s*1/);
});

test("115-mysql-staff-auth.sql adds password_hash and makes firebase_uid nullable", () => {
  const sql = read("staff-service/database/115-mysql-staff-auth.sql");
  assert.match(sql, /ALTER TABLE core_users/i);
  assert.match(sql, /MODIFY COLUMN firebase_uid VARCHAR\(128\)[^;]*NULL/i);
  assert.match(sql, /ADD COLUMN password_hash VARCHAR\(255\) NULL/i);
});

test("04-seed-all-staff-users.sql seeds all 12 staff users with bcrypt hashes and no plaintext passwords", () => {
  const sql = read("staff-service/database/04-seed-all-staff-users.sql");
  assert.doesNotMatch(sql, /^\s*USE\s+/im);
  assert.doesNotMatch(sql, /'123456'/);
  const expectedUsers = [
    ["Ceo@attaieproperties.com", "ceo"],
    ["emalkarimi@attaieproperties.com", "sales"],
    ["attaullah@attaieproperties.com", "callcenter"],
    ["Basirwahidi@attaieproperties.com", "sales_leader"],
    ["sameerkakar@attaieproperties.com", "marketing_manager"],
    ["samimyousufi@attaieproperties.com", "editor"],
    ["ekrammalik@attaieproperties.com", "videographer"],
    ["azamsadat@attaieproperties.com", "finance_manager"],
    ["Milad@attaieproperties.com", "architect"],
    ["samim@attaieproperties.com", "graphic_designer"],
    ["shaheerahmadi@attaieproperties.com", "visual_designer_3d"],
    ["erfanmalik@attaieproperties.com", "manager"],
  ];
  for (const [email, role] of expectedUsers) {
    assert.ok(sql.includes(`'${email}'`), `Missing user ${email}`);
    assert.ok(sql.includes(`'${role}'`), `Missing role ${role}`);
  }
  const hashes = [...sql.matchAll(/\$2y\$10\$[./A-Za-z0-9]{53}/g)].map((m) => m[0]);
  assert.equal(hashes.length, 12, "Expected 12 valid bcrypt $2y$10$ hashes");
});

test("set-staff-password.php CLI hashes passwords with PASSWORD_BCRYPT and bumps auth_version", () => {
  const cli = read("staff-service/bin/set-staff-password.php");
  assert.match(cli, /PHP_SAPI !== 'cli'/);
  assert.match(cli, /password_hash\(\$password,\s*PASSWORD_BCRYPT\)/);
  assert.match(cli, /auth_version\s*=\s*auth_version\s*\+\s*1/);
  assert.match(cli, /LOWER\(username\)\s*=\s*LOWER/);
});
