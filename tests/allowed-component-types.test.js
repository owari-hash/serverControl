const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  isAllowedComponentType,
  isFreeCanvasChildType,
} = require("../src/core/components/allowedComponentTypes");

test("free canvas child types are allowed for superadmin WixBuilder sync", () => {
  assert.equal(isFreeCanvasChildType("free_divider"), true);
  assert.equal(isFreeCanvasChildType("free_text"), true);
  assert.equal(isFreeCanvasChildType("free_menu"), true);
  assert.equal(isFreeCanvasChildType("free_unknown"), false);
  assert.equal(isFreeCanvasChildType("hero"), false);
  assert.equal(isAllowedComponentType("free_divider"), true);
  assert.equal(isAllowedComponentType("hero"), true);
});
