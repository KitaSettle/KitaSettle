import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbSkill } from "@/lib/database/types";
import type { SkillDefinition } from "@/lib/types/skills";
import type { EntityId } from "@/lib/types/common";

export interface SkillRepository {
  listSkills(userId: string): Promise<SkillDefinition[]>;
  getSkill(userId: string, id: EntityId): Promise<SkillDefinition | null>;
  getEnabledSkills(userId: string): Promise<SkillDefinition[]>;
  create(userId: string, skill: Omit<SkillDefinition, "id">): Promise<SkillDefinition>;
  update(
    userId: string,
    id: EntityId,
    patch: Partial<SkillDefinition>,
  ): Promise<SkillDefinition | null>;
  delete(userId: string, id: EntityId): Promise<boolean>;
}

export function mapSkillRow(row: DbSkill): SkillDefinition {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    input: row.input_description,
    output: row.output_description,
    enabled: row.enabled,
    searchTags: row.search_tags,
  };
}

export class SupabaseSkillRepository implements SkillRepository {
  constructor(private client: SupabaseClient) {}

  async listSkills(userId: string): Promise<SkillDefinition[]> {
    const { data, error } = await this.client
      .from("skills")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as DbSkill[]).map(mapSkillRow);
  }

  async getSkill(userId: string, id: EntityId): Promise<SkillDefinition | null> {
    const { data, error } = await this.client
      .from("skills")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapSkillRow(data as DbSkill) : null;
  }

  async getEnabledSkills(userId: string): Promise<SkillDefinition[]> {
    const skills = await this.listSkills(userId);
    return skills.filter((skill) => skill.enabled);
  }

  async create(
    userId: string,
    skill: Omit<SkillDefinition, "id">,
  ): Promise<SkillDefinition> {
    const { data, error } = await this.client
      .from("skills")
      .insert({
        user_id: userId,
        name: skill.name,
        description: skill.description,
        input_description: skill.input,
        output_description: skill.output,
        enabled: skill.enabled,
      })
      .select("*")
      .single();

    if (error) throw error;
    return mapSkillRow(data as DbSkill);
  }

  async update(
    userId: string,
    id: EntityId,
    patch: Partial<SkillDefinition>,
  ): Promise<SkillDefinition | null> {
    const existing = await this.getSkill(userId, id);
    if (!existing) return null;

    const merged = { ...existing, ...patch, id };
    const { data, error } = await this.client
      .from("skills")
      .update({
        name: merged.name,
        description: merged.description,
        input_description: merged.input,
        output_description: merged.output,
        enabled: merged.enabled,
      })
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    return data ? mapSkillRow(data as DbSkill) : null;
  }

  async delete(userId: string, id: EntityId): Promise<boolean> {
    const { error, count } = await this.client
      .from("skills")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("id", id);

    if (error) throw error;
    return (count ?? 0) > 0;
  }
}
