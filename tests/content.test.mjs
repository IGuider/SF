import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const contentDir = path.join(rootDir, "src", "content");
const orderedCollections = [
  "blog-posts",
  "clients",
  "faq",
  "feature-cards",
  "footer-links",
  "home-directions",
  "home-facts",
  "home-faq",
  "home-stats",
  "home-trust-items",
  "products",
  "social-links",
  "steps",
  "turnover-options",
];

const readCollection = async (collection) => {
  const dir = path.join(contentDir, collection);
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));

  return Promise.all(
    files.map(async (file) => ({
      file,
      data: JSON.parse(await readFile(path.join(dir, file), "utf8")),
    })),
  );
};

test("ordered content collections use unique positive integer order values", async () => {
  for (const collection of orderedCollections) {
    const entries = await readCollection(collection);
    const orders = entries.map((entry) => entry.data.order);

    assert.ok(entries.length > 0, `${collection} should not be empty`);
    assert.deepEqual(
      orders,
      orders.map((order) => {
        assert.equal(
          Number.isInteger(order),
          true,
          `${collection} has non-integer order`,
        );
        assert.equal(order > 0, true, `${collection} has non-positive order`);
        return order;
      }),
    );
    assert.equal(
      new Set(orders).size,
      orders.length,
      `${collection} has duplicate order values`,
    );
  }
});

test("social links declare valid display contexts", async () => {
  const allowedContexts = new Set(["header", "footer", "blog"]);
  const entries = await readCollection("social-links");

  for (const entry of entries) {
    const contexts = entry.data.contexts ?? ["header", "footer", "blog"];

    assert.ok(
      contexts.length > 0,
      `${entry.file} should have at least one context`,
    );
    for (const context of contexts) {
      assert.equal(
        allowedContexts.has(context),
        true,
        `${entry.file} has invalid context ${context}`,
      );
    }
  }
});
