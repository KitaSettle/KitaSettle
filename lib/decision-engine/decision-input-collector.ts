import type { Repositories } from "@/lib/repositories";
import type { ExecutiveConnectSnapshot } from "@/lib/types/executive-connect";
import type {
  DecisionCandidate,
  DecisionFactors,
  DecisionInputSource,
} from "@/lib/types/decision-engine";
import type { ExecutiveDNAProfile } from "@/lib/types/executive-dna";
import type { ResearchQueueRecord } from "@/lib/types/research";

function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function learningValueForSource(source: DecisionInputSource): number {
  switch (source) {
    case "approval":
    case "research":
      return 80;
    case "knowledge":
      return 72;
    case "memory":
      return 68;
    case "document":
      return 58;
    case "project":
      return 62;
    case "executive_dna":
      return 70;
    default:
      return 45;
  }
}

function boostForDna(factors: DecisionFactors, dna: ExecutiveDNAProfile | null, haystack: string): DecisionFactors {
  if (!dna) return factors;
  const emphasis = [...dna.profile.focusAreas, ...dna.profile.goals, ...dna.profile.importantTopics]
    .join(" ")
    .toLowerCase();
  const match = emphasis.split(/\s+/).some((word) => word.length > 3 && haystack.toLowerCase().includes(word));
  return {
    ...factors,
    strategicImportance: clamp(factors.strategicImportance + (match ? 15 : 0)),
    learningValue: clamp(factors.learningValue + (match ? 8 : 0)),
  };
}

function buildFactors(
  partial: Omit<DecisionFactors, "learningValue">,
  source: DecisionInputSource,
  dna: ExecutiveDNAProfile | null,
  haystack: string,
): DecisionFactors {
  return boostForDna(
    { ...partial, learningValue: clamp(learningValueForSource(source)) },
    dna,
    haystack,
  );
}

export async function collectDecisionCandidates(
  userId: string,
  repos: Repositories,
  connect: ExecutiveConnectSnapshot,
  dnaProfile: ExecutiveDNAProfile | null,
): Promise<DecisionCandidate[]> {
  const [research, memory, knowledge] = await Promise.all([
    repos.researchQueue.list(userId),
    repos.memory.getAll(userId),
    repos.knowledge.getAll(userId),
  ]);

  const candidates: DecisionCandidate[] = [];

  for (const meeting of connect.todayMeetings.filter((item) => item.category === "meeting")) {
    const hours = hoursUntil(meeting.startAt);
    candidates.push({
      externalKey: `calendar:${meeting.externalId}`,
      title: meeting.title,
      actionLabel: `Prepare for ${meeting.title}`,
      source: "calendar",
      sourceRef: meeting.id,
      factors: buildFactors(
        {
          impact: clamp(70),
          urgency: clamp(hours <= 2 ? 95 : hours <= 6 ? 80 : 55),
          risk: clamp(40),
          confidence: 88,
          dependencies: clamp(50),
          estimatedTime: clamp(35),
          energyRequired: clamp(45),
          financialEffect: clamp(35),
          strategicImportance: clamp(60),
        },
        "calendar",
        dnaProfile,
        meeting.title,
      ),
      metadata: { startAt: meeting.startAt, location: meeting.location },
    });
  }

  for (const email of connect.importantEmails.slice(0, 8)) {
    const isApproval = email.classification === "approvals";
    const isUrgent = email.classification === "urgent" || email.isImportant;
    candidates.push({
      externalKey: `email:${email.externalId}`,
      title: email.subject,
      actionLabel: isApproval ? `Approve or respond: ${email.subject}` : `Review email: ${email.subject}`,
      source: "email",
      sourceRef: email.id,
      factors: buildFactors(
        {
          impact: clamp(isApproval ? 85 : 60),
          urgency: clamp(isUrgent ? 90 : 55),
          risk: clamp(isUrgent ? 70 : 40),
          confidence: clamp(isApproval ? 92 : 78),
          dependencies: clamp(isApproval ? 75 : 35),
          estimatedTime: clamp(25),
          energyRequired: clamp(30),
          financialEffect: clamp(email.classification === "finance" ? 88 : isApproval ? 80 : 40),
          strategicImportance: clamp(isApproval ? 70 : 45),
        },
        "email",
        dnaProfile,
        `${email.subject} ${email.snippet ?? ""}`,
      ),
      metadata: { sender: email.sender, classification: email.classification },
    });
  }

  for (const item of research.filter((row) => row.status === "Ready").slice(0, 6)) {
    candidates.push(buildResearchCandidate(item, dnaProfile));
  }

  for (const doc of connect.documentsToReview.slice(0, 6)) {
    candidates.push({
      externalKey: `document:${doc.externalId}`,
      title: doc.name,
      actionLabel: `Review document: ${doc.name}`,
      source: "document",
      sourceRef: doc.id,
      factors: buildFactors(
        {
          impact: clamp(75),
          urgency: clamp(65),
          risk: clamp(55),
          confidence: 84,
          dependencies: clamp(60),
          estimatedTime: clamp(40),
          energyRequired: clamp(50),
          financialEffect: clamp(/proposal|contract|commercial/i.test(doc.name) ? 90 : 50),
          strategicImportance: clamp(70),
        },
        "document",
        dnaProfile,
        `${doc.name} ${doc.summary ?? ""}`,
      ),
      metadata: { webViewLink: doc.webViewLink },
    });
  }

  for (const deadline of connect.deadlines.slice(0, 5)) {
    const hours = hoursUntil(deadline.startAt);
    candidates.push({
      externalKey: `deadline:${deadline.externalId}`,
      title: deadline.title,
      actionLabel: `Act before deadline: ${deadline.title}`,
      source: "deadline",
      sourceRef: deadline.id,
      factors: buildFactors(
        {
          impact: clamp(80),
          urgency: clamp(hours <= 24 ? 98 : hours <= 72 ? 85 : 65),
          risk: clamp(hours <= 24 ? 85 : 60),
          confidence: 90,
          dependencies: clamp(70),
          estimatedTime: clamp(45),
          energyRequired: clamp(55),
          financialEffect: clamp(/proposal|invoice|contract/i.test(deadline.title) ? 88 : 45),
          strategicImportance: clamp(75),
        },
        "deadline",
        dnaProfile,
        deadline.title,
      ),
      metadata: { dueAt: deadline.startAt },
    });
  }

  for (const item of memory.slice(0, 3)) {
    candidates.push({
      externalKey: `memory:${item.id}`,
      title: item.title,
      actionLabel: `Follow up on memory: ${item.title}`,
      source: "memory",
      sourceRef: item.id,
      factors: buildFactors(
        {
          impact: clamp(55),
          urgency: clamp(50),
          risk: clamp(35),
          confidence: 72,
          dependencies: clamp(30),
          estimatedTime: clamp(20),
          energyRequired: clamp(25),
          financialEffect: clamp(30),
          strategicImportance: clamp(50),
        },
        "memory",
        dnaProfile,
        item.title,
      ),
      metadata: { category: item.category },
    });
  }

  if (dnaProfile?.profile.currentProjects.length) {
    for (const project of dnaProfile.profile.currentProjects.slice(0, 3)) {
      candidates.push({
        externalKey: `project:${project.toLowerCase().replace(/\s+/g, "-")}`,
        title: project,
        actionLabel: `Advance project: ${project}`,
        source: "project",
        factors: buildFactors(
          {
            impact: clamp(78),
            urgency: clamp(60),
            risk: clamp(50),
            confidence: 82,
            dependencies: clamp(55),
            estimatedTime: clamp(50),
            energyRequired: clamp(60),
            financialEffect: clamp(65),
            strategicImportance: clamp(85),
          },
          "project",
          dnaProfile,
          project,
        ),
      });
    }
  }

  if (knowledge.length > 0) {
    const top = knowledge[0];
    candidates.push({
      externalKey: `knowledge:${top.id}`,
      title: top.title,
      actionLabel: `Apply knowledge: ${top.title}`,
      source: "knowledge",
      sourceRef: top.id,
      factors: buildFactors(
        {
          impact: clamp(50),
          urgency: clamp(35),
          risk: clamp(25),
          confidence: 70,
          dependencies: clamp(20),
          estimatedTime: clamp(15),
          energyRequired: clamp(20),
          financialEffect: clamp(30),
          strategicImportance: clamp(45),
        },
        "knowledge",
        dnaProfile,
        top.title,
      ),
    });
  }

  return candidates;
}

function buildResearchCandidate(item: ResearchQueueRecord, dnaProfile: ExecutiveDNAProfile | null): DecisionCandidate {
  return {
    externalKey: `research:${item.id}`,
    title: item.title,
    actionLabel: `Approve research: ${item.title}`,
    source: "approval",
    sourceRef: item.id,
    factors: buildFactors(
      {
        impact: clamp(72),
        urgency: clamp(68),
        risk: clamp(item.importance === "High" ? 75 : 45),
        confidence: clamp(item.confidence),
        dependencies: clamp(40),
        estimatedTime: clamp(20),
        energyRequired: clamp(25),
        financialEffect: clamp(35),
        strategicImportance: clamp(60),
      },
      "approval",
      dnaProfile,
      `${item.title} ${item.tags.join(" ")}`,
    ),
    metadata: { source: item.source, tags: item.tags },
  };
}
