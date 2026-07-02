export const KITA_LOADING_MESSAGES = {
  default: [
    "Kita is getting things ready...",
    "One moment while I settle in...",
  ],
  auth: ["Checking your session...", "Welcome back..."],
  executive: [
    "Kita is reviewing today's priorities...",
    "I'm preparing your Executive Brief...",
    "Pulling together what deserves your attention...",
  ],
  discovery: [
    "Kita is preparing your conversation...",
    "I'm learning how you work best...",
  ],
  brain: [
    "Opening your Executive Brain...",
    "Gathering what you've entrusted to me...",
  ],
  intake: [
    "I'm understanding your document...",
    "Reading and organising what you shared...",
    "Adding this to your Executive Brain...",
  ],
  missionControl: [
    "Loading operational overview...",
    "Reviewing platform health...",
  ],
  settings: ["Loading your preferences..."],
  landing: ["Opening KitaSettle..."],
} as const;

export type KitaLoadingContext = keyof typeof KITA_LOADING_MESSAGES;

export const KITA_EMPTY = {
  decisions:
    "Give something to Kita and I'll start building your Executive Brain — your top decision will appear here.",
  meetings: "Your calendar is clear today. A good day for deep work.",
  emails: "Nothing urgent in your inbox right now.",
  deadlines: "No pressing deadlines on the horizon.",
  travel: "No upcoming travel — you're grounded for now.",
  documents: "Nothing flagged for review at the moment.",
  research: "When Kita finds something worth your attention, it will appear here.",
  pendingApprovals: "You're all caught up on research reviews.",
  brainMemory:
    "Give something to Kita and I'll start building your Executive Brain.",
  brainQueue:
    "Your review queue is clear. New findings will land here when they're ready.",
  search: "Try a different search — or browse the suggested topics above.",
} as const;
