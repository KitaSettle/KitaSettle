"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  BrainActivityItem,
  ExecutiveBrainData,
  ExecutiveMemoryItem,
  ResearchQueueItem,
} from "@/lib/types";
import { BRAIN_SEARCH_KEYWORDS } from "@/lib/executive-brain/static-config";
import { KITA_EMPTY } from "@/lib/copy/kita-messages";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { BrainToast } from "./BrainToast";
import { ExecutiveBrainOverview } from "./ExecutiveBrainOverview";
import { ResearchQueueCard } from "./ResearchQueueCard";

interface ExecutiveBrainContentProps {
  data: ExecutiveBrainData;
}

function matchesSearch(
  query: string,
  searchTags: string[],
  ...fields: string[]
) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const tagMatch = searchTags.some(
    (tag) =>
      tag.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.includes(tag.toLowerCase()),
  );
  if (tagMatch) return true;

  return fields.some((field) =>
    field.toLowerCase().includes(normalizedQuery),
  );
}

function researchToMemory(item: ResearchQueueItem): ExecutiveMemoryItem {
  return {
    id: `mem-${Date.now()}-${item.id}`,
    title: item.title,
    snippet: item.summary,
    date: "Today",
    category: "Research",
    searchTags: item.searchTags,
  };
}

export function ExecutiveBrainContent({ data }: ExecutiveBrainContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [queue, setQueue] = useState<ResearchQueueItem[]>(data.researchQueue);
  const [memory, setMemory] = useState<ExecutiveMemoryItem[]>(data.memory);
  const [activity, setActivity] = useState<BrainActivityItem[]>(data.activity);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  function addActivity(action: string, target: string) {
    setActivity((current) => [
      {
        id: `act-${Date.now()}`,
        action,
        target,
        timestamp: "Just now",
      },
      ...current,
    ]);
  }

  async function persistResearchAction(
    id: string,
    action: "approve" | "reject" | "save-memory",
  ) {
    const response = await fetch(`/api/research-queue/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      throw new Error("Failed to save research action");
    }
  }

  async function handleApprove(id: string) {
    const item = queue.find((entry) => entry.id === id);
    if (!item) return;

    try {
      await persistResearchAction(id, "approve");
      setQueue((current) => current.filter((entry) => entry.id !== id));
      setMemory((current) => [researchToMemory(item), ...current]);
      addActivity("Saved to Executive Brain", item.title);
      setToastMessage("Saved into Executive Brain.");
    } catch {
      setToastMessage("Could not save approval. Try again.");
    }
  }

  async function handleReject(id: string) {
    const item = queue.find((entry) => entry.id === id);
    if (!item) return;

    try {
      await persistResearchAction(id, "reject");
      setQueue((current) => current.filter((entry) => entry.id !== id));
      addActivity("Discarded research", item.title);
      setToastMessage("Research discarded.");
    } catch {
      setToastMessage("Could not discard research. Try again.");
    }
  }

  async function handleSaveToMemory(id: string) {
    const item = queue.find((entry) => entry.id === id);
    if (!item) return;

    try {
      await persistResearchAction(id, "save-memory");
      setMemory((current) => [researchToMemory(item), ...current]);
      addActivity("Saved to memory", item.title);
    } catch {
      setToastMessage("Could not save to memory. Try again.");
    }
  }

  const filteredCategories = useMemo(() => {
    return data.categories.filter((item) =>
      matchesSearch(
        searchQuery,
        item.searchTags,
        item.name,
        item.description,
      ),
    );
  }, [data.categories, searchQuery]);

  const filteredSources = useMemo(() => {
    return data.trustedSources.filter((item) =>
      matchesSearch(
        searchQuery,
        item.searchTags,
        item.name,
        item.category,
        item.description,
      ),
    );
  }, [data.trustedSources, searchQuery]);

  const filteredQueue = useMemo(() => {
    return queue.filter((item) =>
      matchesSearch(
        searchQuery,
        item.searchTags,
        item.title,
        item.source,
        item.summary,
        item.whyItMatters,
        item.importance,
      ),
    );
  }, [queue, searchQuery]);

  const filteredMemory = useMemo(() => {
    return memory.filter((item) =>
      matchesSearch(
        searchQuery,
        item.searchTags,
        item.title,
        item.snippet,
        item.category,
      ),
    );
  }, [memory, searchQuery]);

  const filteredSkills = useMemo(() => {
    return data.skills.filter((item) =>
      matchesSearch(
        searchQuery,
        item.searchTags,
        item.name,
        item.description,
      ),
    );
  }, [data.skills, searchQuery]);

  const filteredActivity = useMemo(() => {
    if (!searchQuery.trim()) return activity;
    return activity.filter((item) =>
      matchesSearch(searchQuery, [], item.action, item.target, item.timestamp),
    );
  }, [activity, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;
  const hasVisibleResults =
    filteredCategories.length > 0 ||
    filteredSources.length > 0 ||
    filteredQueue.length > 0 ||
    filteredMemory.length > 0 ||
    filteredSkills.length > 0 ||
    filteredActivity.length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      {toastMessage && <BrainToast message={toastMessage} />}

      <header className="mb-10 kita-enter">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent">Executive Brain</p>
        <h1 className="font-display mt-3 text-3xl tracking-tight text-foreground sm:text-4xl">
          Everything you have entrusted to Kita
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Search, review, and preserve what matters — research, memory, and trusted sources in one
          calm place.
        </p>
      </header>

      <ExecutiveBrainOverview metrics={data.overview} />

      <Card className="mb-6 border-accent/10 bg-gradient-to-br from-surface to-accent/[0.03]">
        <label htmlFor="brain-search" className="block">
          <span className="text-base font-semibold text-foreground">
            Search Everything
          </span>
          <span className="mt-1 block text-sm text-muted">
            Try RVSM, CBTA, ICAO, CAAM, Proposal, Steelworks, Leadership, or
            Finance
          </span>
        </label>
        <div className="relative mt-4">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            id="brain-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search regulations, proposals, training notes, sources..."
            className="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {BRAIN_SEARCH_KEYWORDS.map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => setSearchQuery(keyword)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                searchQuery.toLowerCase() === keyword.toLowerCase()
                  ? "bg-accent text-white"
                  : "bg-surface-muted text-muted hover:text-foreground"
              }`}
            >
              {keyword}
            </button>
          ))}
        </div>
      </Card>

      {hasSearch && !hasVisibleResults && (
        <Card className="mb-6 p-8">
          <EmptyState>{KITA_EMPTY.search}</EmptyState>
        </Card>
      )}

      {(filteredQueue.length > 0 || !hasSearch) && (
        <SectionCard
          title="Research Queue"
          subtitle="Prepared findings awaiting your review"
          className="mb-6"
        >
          {filteredQueue.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredQueue.map((item) => (
                <ResearchQueueCard
                  key={item.id}
                  item={item}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSaveToMemory={handleSaveToMemory}
                />
              ))}
            </div>
          ) : (
            <EmptyState>
              {queue.length === 0 ? KITA_EMPTY.brainQueue : KITA_EMPTY.search}
            </EmptyState>
          )}
        </SectionCard>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {(filteredCategories.length > 0 || !hasSearch) && (
          <SectionCard
            title="Knowledge Categories"
            subtitle="Organised areas of your business memory"
          >
            <ul className="space-y-3">
              {filteredCategories.map((category) => (
                <li
                  key={category.id}
                  className="rounded-xl border border-border bg-surface-muted/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {category.name}
                    </p>
                    <Badge variant="muted">{category.itemCount} items</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {category.description}
                  </p>
                </li>
              ))}
              {filteredCategories.length === 0 && hasSearch && (
                <li className="text-sm text-muted">
                  No categories match your search.
                </li>
              )}
            </ul>
          </SectionCard>
        )}

        {(filteredSources.length > 0 || !hasSearch) && (
          <SectionCard
            title="Trusted Sources"
            subtitle="Authoritative feeds your brain monitors"
          >
            <ul className="space-y-3">
              {filteredSources.map((source) => (
                <li
                  key={source.id}
                  className="flex gap-3 rounded-xl bg-surface-muted/60 p-3"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {source.name}
                      </p>
                      <Badge variant="muted">{source.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted">{source.description}</p>
                  </div>
                </li>
              ))}
              {filteredSources.length === 0 && hasSearch && (
                <li className="text-sm text-muted">No sources match your search.</li>
              )}
            </ul>
          </SectionCard>
        )}

        {(filteredMemory.length > 0 || !hasSearch) && (
          <SectionCard
            title="Executive Memory"
            subtitle="Decisions, notes, and captured context"
          >
            <ul className="space-y-3">
              {filteredMemory.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border bg-surface-muted/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <span className="text-xs text-muted">{item.date}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {item.snippet}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-accent">
                    {item.category}
                  </p>
                </li>
              ))}
              {filteredMemory.length === 0 && hasSearch && (
                <li className="text-sm text-muted">
                  No memory items match your search.
                </li>
              )}
              {filteredMemory.length === 0 && !hasSearch && (
                <EmptyState>{KITA_EMPTY.brainMemory}</EmptyState>
              )}
            </ul>
          </SectionCard>
        )}

        {(filteredSkills.length > 0 || !hasSearch) && (
          <SectionCard title="Skills" subtitle="Capabilities your brain can apply">
            <ul className="space-y-3">
              {filteredSkills.map((skill) => (
                <li
                  key={skill.id}
                  className="rounded-xl bg-surface-muted/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {skill.name}
                    </p>
                    <Badge variant={skill.status === "active" ? "success" : "muted"}>
                      {skill.status === "active" ? "Active" : "Available"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {skill.description}
                  </p>
                </li>
              ))}
              {filteredSkills.length === 0 && hasSearch && (
                <li className="text-sm text-muted">No skills match your search.</li>
              )}
            </ul>
          </SectionCard>
        )}

        {(filteredActivity.length > 0 || !hasSearch) && (
          <SectionCard
            title="Latest Activity"
            subtitle="Recent actions across your Executive Brain"
            className="md:col-span-2"
          >
            <ul className="divide-y divide-border">
              {filteredActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.action}
                    </p>
                    <p className="mt-1 text-sm text-muted">{item.target}</p>
                  </div>
                  <span className="text-xs text-muted">{item.timestamp}</span>
                </li>
              ))}
              {filteredActivity.length === 0 && hasSearch && (
                <li className="py-4 text-sm text-muted">
                  No activity matches your search.
                </li>
              )}
            </ul>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
