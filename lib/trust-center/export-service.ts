import type { Repositories } from "@/lib/repositories";
import type { TransparencyRepository } from "@/lib/repositories/transparency-repository";
import { nowIso } from "@/lib/utils";

export interface UserExportBundle {
  exportedAt: string;
  user: { name: string; email: string };
  knowledge: unknown[];
  memory: unknown[];
  executiveDna: unknown;
  uploadedDocuments: unknown[];
  decisionHistory: {
    timeline: unknown[];
    weights: unknown;
  };
  settings: {
    themePreference: string | null;
  };
}

export class ExportService {
  constructor(
    private repos: Repositories,
    private transparency: TransparencyRepository,
  ) {}

  async buildExport(userId: string): Promise<UserExportBundle> {
    const [meta, knowledge, memory, dna, intake, timeline, weights] = await Promise.all([
      this.transparency.getUserMeta(userId),
      this.repos.knowledge.getAll(userId),
      this.repos.memory.getAll(userId),
      this.repos.executiveDna.ensureProfile(userId),
      this.repos.intake.list(userId, 500),
      this.repos.decisions.getTimeline(userId, 200),
      this.repos.decisions.getWeights(userId),
    ]);

    return {
      exportedAt: nowIso(),
      user: { name: meta.name, email: meta.email },
      knowledge,
      memory,
      executiveDna: dna,
      uploadedDocuments: intake,
      decisionHistory: { timeline, weights },
      settings: {
        themePreference: null,
      },
    };
  }

  async buildJson(userId: string): Promise<string> {
    const bundle = await this.buildExport(userId);
    return JSON.stringify(bundle, null, 2);
  }

  async buildZip(userId: string): Promise<Buffer> {
    const JSZip = (await import("jszip")).default;
    const bundle = await this.buildExport(userId);
    const zip = new JSZip();

    zip.file("kitasettle-export.json", JSON.stringify(bundle, null, 2));
    zip.file("knowledge.json", JSON.stringify(bundle.knowledge, null, 2));
    zip.file("memory.json", JSON.stringify(bundle.memory, null, 2));
    zip.file("executive-dna.json", JSON.stringify(bundle.executiveDna, null, 2));
    zip.file("uploaded-documents.json", JSON.stringify(bundle.uploadedDocuments, null, 2));
    zip.file("decision-history.json", JSON.stringify(bundle.decisionHistory, null, 2));
    zip.file(
      "README.txt",
      [
        "KitaSettle Export",
        "=================",
        "",
        "This archive contains a copy of information you have shared with Kita.",
        "It is yours to keep, review, or move elsewhere.",
      ].join("\n"),
    );

    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  }
}

export function createExportService(
  repos: Repositories,
  transparency: TransparencyRepository,
): ExportService {
  return new ExportService(repos, transparency);
}
