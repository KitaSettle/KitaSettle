export type ProviderName = string;

export interface ProviderMetadata {
  name: ProviderName;
  implementation: "mock" | "adapter";
  ready: boolean;
}

export class ProviderNotConfiguredError extends Error {
  constructor(providerName: string, adapterName: string) {
    super(
      `${adapterName} (${providerName}) is not configured yet. Wire API credentials in a future sprint.`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}

export abstract class FutureAdapter implements ProviderMetadata {
  abstract readonly name: ProviderName;
  abstract readonly implementation: "adapter";
  readonly ready = false;

  protected notConfigured(): never {
    throw new ProviderNotConfiguredError(this.name, this.constructor.name);
  }
}
