/**Mocked data */
export default function({faker, url, options, login = faker.internet.userName()}) {
  //Tokscale API
  if (/^https:..tokscale.ai.api.users.*$/.test(url)) {
    console.debug(`metrics/compute/mocks > mocking tokscale api result > ${url}`)

    //Generate model usage data
    const modelUsage = [
      {
        model: "claude-opus-4-5-thinking",
        tokens: faker.number.int({min: 100000000, max: 500000000}),
        cost: faker.number.float({min: 500, max: 2000, fractionDigits: 2}),
        percentage: faker.number.float({min: 20, max: 40, fractionDigits: 2}),
      },
      {
        model: "gpt-5.3-codex",
        tokens: faker.number.int({min: 50000000, max: 300000000}),
        cost: faker.number.float({min: 200, max: 1000, fractionDigits: 2}),
        percentage: faker.number.float({min: 10, max: 25, fractionDigits: 2}),
      },
      {
        model: "gemini-3-pro-preview",
        tokens: faker.number.int({min: 30000000, max: 200000000}),
        cost: faker.number.float({min: 100, max: 500, fractionDigits: 2}),
        percentage: faker.number.float({min: 5, max: 15, fractionDigits: 2}),
      },
      {
        model: "claude-sonnet-4-5",
        tokens: faker.number.int({min: 10000000, max: 100000000}),
        cost: faker.number.float({min: 50, max: 300, fractionDigits: 2}),
        percentage: faker.number.float({min: 3, max: 10, fractionDigits: 2}),
      },
      {
        model: "gpt-5.2",
        tokens: faker.number.int({min: 5000000, max: 50000000}),
        cost: faker.number.float({min: 20, max: 150, fractionDigits: 2}),
        percentage: faker.number.float({min: 1, max: 5, fractionDigits: 2}),
      },
    ]

    //Calculate totals
    const totalTokens = modelUsage.reduce((sum, m) => sum + m.tokens, 0)
    const totalCost = modelUsage.reduce((sum, m) => sum + m.cost, 0)

    return ({
      status: 200,
      data: {
        user: {
          id: faker.string.uuid(),
          username: login,
          displayName: faker.person.fullName(),
          avatarUrl: faker.image.avatar(),
          createdAt: faker.date.past({years: 1}).toISOString(),
          rank: faker.number.int({min: 1, max: 500}),
        },
        stats: {
          totalTokens,
          totalCost,
          inputTokens: Math.round(totalTokens * 0.25),
          outputTokens: Math.round(totalTokens * 0.01),
          cacheReadTokens: Math.round(totalTokens * 0.73),
          cacheWriteTokens: faker.number.int({min: 100000, max: 1000000}),
          reasoningTokens: faker.number.int({min: 1000000, max: 20000000}),
          submissionCount: faker.number.int({min: 5, max: 50}),
          activeDays: faker.number.int({min: 10, max: 100}),
        },
        dateRange: {
          start: faker.date.past({years: 1}).toISOString().split("T")[0],
          end: faker.date.recent().toISOString().split("T")[0],
        },
        updatedAt: faker.date.recent().toISOString(),
        submissionFreshness: {
          lastUpdated: faker.date.recent().toISOString(),
          cliVersion: "2.0.0",
          schemaVersion: 1,
          isStale: false,
        },
        clients: ["opencode", "codex", "claude"],
        models: modelUsage.map(m => m.model),
        modelUsage,
      },
    })
  }
}
