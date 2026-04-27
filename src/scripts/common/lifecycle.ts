type Cleanup = () => void;
type Initializer = () => void | Cleanup;

const registeredInitializers = new WeakSet<Initializer>();
const cleanupByInitializer = new WeakMap<Initializer, Cleanup>();

const cleanupInitializer = (initializer: Initializer) => {
  const cleanup = cleanupByInitializer.get(initializer);

  if (!cleanup) {
    return;
  }

  cleanup();
  cleanupByInitializer.delete(initializer);
};

export const runOnPageLoad = (initializer: Initializer) => {
  if (registeredInitializers.has(initializer)) {
    return;
  }

  registeredInitializers.add(initializer);

  const run = () => {
    cleanupInitializer(initializer);
    const cleanup = initializer();

    if (typeof cleanup === "function") {
      cleanupByInitializer.set(initializer, cleanup);
    }
  };

  document.addEventListener("astro:after-swap", run);
  document.addEventListener("astro:before-swap", () =>
    cleanupInitializer(initializer),
  );
  run();
};
