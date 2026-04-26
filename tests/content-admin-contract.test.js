const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  CONTENT_ADMIN_TEXT_FIELD_KEYS,
  CONTENT_ADMIN_PATHS,
} = require("../src/api/contentAdmin/contentAdminContract");
const { TEXT_FIELD_WHITELIST } = require("../src/api/contentAdmin/contentAdminService");

test("contentAdminService text whitelist matches contract", () => {
  const fromContract = new Set(CONTENT_ADMIN_TEXT_FIELD_KEYS);
  assert.deepEqual(
    [...TEXT_FIELD_WHITELIST].sort(),
    [...fromContract].sort(),
  );
});

test("content admin path helpers are non-empty", () => {
  assert.match(CONTENT_ADMIN_PATHS.blockText("abc-1"), /abc-1\/text$/);
  assert.match(CONTENT_ADMIN_PATHS.blockImages("x"), /x\/images$/);
  assert.match(CONTENT_ADMIN_PATHS.blockMedia("y"), /y\/media$/);
  assert.match(CONTENT_ADMIN_PATHS.blockElements("z"), /z\/elements$/);
});
