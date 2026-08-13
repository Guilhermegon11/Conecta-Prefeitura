export type PrefeituraBindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
};

const RUNTIME_KEY = "__PREFEITURA_CONNECTA_BINDINGS__";

export function setRuntimeBindings(bindings: PrefeituraBindings) {
  (globalThis as typeof globalThis & Record<string, unknown>)[RUNTIME_KEY] = bindings;
}

export function getRuntimeBindings(): PrefeituraBindings {
  const bindings = (globalThis as typeof globalThis & Record<string, unknown>)[RUNTIME_KEY] as PrefeituraBindings | undefined;
  if (!bindings?.DB || !bindings?.BUCKET) throw new Error("Os serviços de armazenamento ainda não estão disponíveis.");
  return bindings;
}
