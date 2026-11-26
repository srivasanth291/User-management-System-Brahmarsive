import test from "node:test";
import assert from "node:assert/strict";
import { api } from "../src/api/client.js";

test("API client surfaces validation, expired sessions and network errors", async t => {
  t.mock.method(globalThis, "fetch", async () => Response.json({
    detail: [{msg: "Name is required"}]
  }, {status: 422}));
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {configurable: true, value: {getItem: () => "test-token"}});
  globalThis.window = new EventTarget();
  t.after(() => {
    delete globalThis.window;
    if (previousStorage) Object.defineProperty(globalThis, "sessionStorage", previousStorage);
    else delete globalThis.sessionStorage;
  });
  await assert.rejects(api("/example"), /Name is required/);
  let expired = false;
  window.addEventListener("skillhub-session-expired", () => { expired = true; });
  fetch.mock.mockImplementation(async () => Response.json({detail: "Session expired"}, {status: 401}));
  await assert.rejects(api("/example"), /Session expired/);
  assert.equal(expired, true);
  fetch.mock.mockImplementation(async () => { throw new TypeError("offline"); });
  await assert.rejects(api("/example"), /Cannot connect/);
});
