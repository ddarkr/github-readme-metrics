//Setup
export default async function({login, q, imports, data, account}, {enabled = false, extras = false} = {}) {
  //Plugin execution
  try {
    //Check if plugin is enabled and requirements are met
    if ((!q.tokscale) || (!imports.metadata.plugins.tokscale.enabled(enabled, {extras})))
      return null

    //Load inputs
    let {user, sections, "models.limit": _models_limit} = imports.metadata.plugins.tokscale.inputs({data, account, q})

    //Querying api
    console.debug(`metrics/compute/${login}/plugins > tokscale > querying api for ${user}`)
    const {data: response} = await imports.axios.get(`https://tokscale.ai/api/users/${user}`)

    //Process models
    const models = response.modelUsage
      ?.sort((a, b) => b.tokens - a.tokens)
      .slice(0, _models_limit || Infinity)
      .map(({model, tokens, cost, percentage}) => ({
        name: model,
        tokens,
        cost,
        percentage: percentage / 100,
      }))

    //Result
    return {
      sections,
      user: {
        username: response.user.username,
        displayName: response.user.displayName,
        avatarUrl: response.user.avatarUrl,
        rank: response.user.rank,
      },
      stats: {
        totalTokens: response.stats.totalTokens,
        totalCost: response.stats.totalCost,
        inputTokens: response.stats.inputTokens,
        outputTokens: response.stats.outputTokens,
        submissionCount: response.stats.submissionCount,
        activeDays: response.stats.activeDays,
      },
      models,
      dateRange: response.dateRange,
      lastSubmit: response.submissionFreshness?.lastUpdated,
      updatedAt: response.updatedAt,
    }
  }
  //Handle errors
  catch (error) {
    throw imports.format.error(error)
  }
}
