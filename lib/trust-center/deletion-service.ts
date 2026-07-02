import type { TransparencyRepository } from "@/lib/repositories/transparency-repository";
import type { TrustDeleteResult, TrustDeleteScope } from "@/lib/types/trust-center";

export class DeletionService {
  constructor(private transparency: TransparencyRepository) {}

  async delete(userId: string, scope: TrustDeleteScope): Promise<TrustDeleteResult> {
    switch (scope) {
      case "documents": {
        const deletedCount = await this.transparency.deleteAllDocuments(userId);
        return {
          scope,
          deletedCount,
          message:
            deletedCount > 0
              ? "Your uploaded documents have been removed from Kita."
              : "There were no uploaded documents to remove.",
        };
      }
      case "knowledge": {
        const deletedCount = await this.transparency.deleteAllKnowledge(userId);
        return {
          scope,
          deletedCount,
          message:
            deletedCount > 0
              ? "Your saved knowledge has been removed."
              : "There was no saved knowledge to remove.",
        };
      }
      case "memory": {
        const deletedCount = await this.transparency.deleteAllMemory(userId);
        return {
          scope,
          deletedCount,
          message:
            deletedCount > 0
              ? "Your Executive Memory has been cleared."
              : "Your Executive Memory was already empty.",
        };
      }
      case "account": {
        await this.transparency.deleteAccount(userId);
        return {
          scope,
          deletedCount: 1,
          message:
            "Your account and associated data have been scheduled for removal. You will be signed out.",
        };
      }
      default:
        throw new Error("Unsupported delete scope.");
    }
  }
}

export function createDeletionService(transparency: TransparencyRepository): DeletionService {
  return new DeletionService(transparency);
}
