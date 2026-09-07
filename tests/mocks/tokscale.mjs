export const tokscaleResponses = {
  valid: {
    user: {
      id: "a4c656c0-7795-4529-9bb4-8fcd59d2ea34",
      username: "ddarkr",
      displayName: "Doda",
      avatarUrl: "https://example.test/avatar.png",
      rank: 42,
    },
    stats: {
      totalTokens: 735000000,
      totalCost: 2865.75,
      inputTokens: 183750000,
      outputTokens: 7350000,
      submissionCount: 28,
      activeDays: 57,
    },
    dateRange: {
      start: "2025-09-01",
      end: "2026-09-01",
    },
    updatedAt: "2026-09-01T12:00:00.000Z",
    submissionFreshness: {
      lastUpdated: "2026-09-01T11:00:00.000Z",
    },
    modelUsage: [
      {model: "claude-opus-4-5-thinking", tokens: 250000000, cost: 980.25, percentage: 34.01},
      {model: "gpt-5.3-codex", tokens: 300000000, cost: 1100.5, percentage: 40.82},
      {model: "gemini-3-pro-preview", tokens: 120000000, cost: 520, percentage: 16.33},
      {model: "claude-sonnet-4-5", tokens: 50000000, cost: 210, percentage: 6.8},
      {model: "gpt-5.2", tokens: 15000000, cost: 55, percentage: 2.04},
    ],
  },
  malformedUser: {
    user: null,
    stats: {},
  },
}
