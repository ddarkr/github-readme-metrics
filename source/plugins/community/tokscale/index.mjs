const statsFields = ["totalTokens", "totalCost", "inputTokens", "outputTokens", "submissionCount", "activeDays"]

function invalid(field) {
  throw {error: {message: `Tokscale API response is invalid: ${field}`}}
}

function record(value, field) {
  if ((!value) || (typeof value !== "object") || Array.isArray(value))
    invalid(`${field} must be an object`)
  return value
}

function requiredString(value, field) {
  if ((typeof value !== "string") || (!value.trim()))
    invalid(`${field} must be a non-empty string`)
  return value.trim()
}

function optionalString(value, field) {
  if ((value === undefined) || (value === null) || (value === ""))
    return undefined
  return requiredString(value, field)
}

function optionalNumber(value, field) {
  if ((value === undefined) || (value === null))
    return undefined
  if ((!Number.isFinite(value)) || (value < 0))
    invalid(`${field} must be a non-negative finite number`)
  return value
}

function optionalDate(value, field) {
  if ((value === undefined) || (value === null) || (value === ""))
    return undefined
  if ((typeof value !== "string") || (!Number.isFinite(Date.parse(value))))
    invalid(`${field} must be a valid date string`)
  return value
}

function optionalDateRange(value) {
  if ((value === undefined) || (value === null))
    return undefined
  const range = record(value, "dateRange")
  const start = optionalDate(range.start, "dateRange.start")
  const end = optionalDate(range.end, "dateRange.end")
  return (start || end) ? {...start && {start}, ...end && {end}} : undefined
}

//Setup
export default async function({login, q, imports, data, account}, {enabled = false, extras = false} = {}) {
  //Plugin execution
  try {
    //Check if plugin is enabled and requirements are met
    if ((!q.tokscale) || (!imports.metadata.plugins.tokscale.enabled(enabled, {extras})))
      return null

    //Load inputs
    const {user, sections, "models.limit": modelsLimit} = imports.metadata.plugins.tokscale.inputs({data, account, q})
    const requestedUser = requiredString(user, "configured username")
    if ((!Number.isInteger(modelsLimit)) || (modelsLimit < 0))
      invalid("configured models limit must be a non-negative integer")

    //Querying api
    console.debug(`metrics/compute/${login}/plugins > tokscale > querying api for ${requestedUser}`)
    const {data: response} = await imports.axios.get(`https://tokscale.ai/api/users/${encodeURIComponent(requestedUser)}`)
    record(response, "root")
    const apiUser = record(response.user, "user")
    const apiStats = record(response.stats, "stats")

    //Process models without mutating the API response
    if ((response.modelUsage !== undefined) && (response.modelUsage !== null) && (!Array.isArray(response.modelUsage)))
      invalid("modelUsage must be an array")
    const models = (response.modelUsage ?? [])
      .map((usage, index) => {
        usage = record(usage, `modelUsage[${index}]`)
        const name = requiredString(usage.model, `modelUsage[${index}].model`)
        const tokens = optionalNumber(usage.tokens, `modelUsage[${index}].tokens`)
        const cost = optionalNumber(usage.cost, `modelUsage[${index}].cost`)
        const percentage = optionalNumber(usage.percentage, `modelUsage[${index}].percentage`)
        if ((percentage !== undefined) && (percentage > 100))
          invalid(`modelUsage[${index}].percentage must not exceed 100`)
        return {name, ...tokens !== undefined && {tokens}, ...cost !== undefined && {cost}, ...percentage !== undefined && {percentage: percentage / 100}}
      })
      .sort((a, b) => (b.tokens ?? -1) - (a.tokens ?? -1))
      .slice(0, modelsLimit)

    //Normalize optional stats rather than manufacturing zero values
    const stats = Object.fromEntries(
      statsFields
        .map(field => [field, optionalNumber(apiStats[field], `stats.${field}`)])
        .filter(([, value]) => value !== undefined),
    )

    const username = requiredString(apiUser.username, "user.username")
    const displayName = optionalString(apiUser.displayName, "user.displayName")
    const avatarUrl = optionalString(apiUser.avatarUrl, "user.avatarUrl")
    const rank = optionalNumber(apiUser.rank, "user.rank")
    const dateRange = optionalDateRange(response.dateRange)
    const lastSubmit = optionalDate(response.submissionFreshness?.lastUpdated, "submissionFreshness.lastUpdated")
    const updatedAt = optionalDate(response.updatedAt, "updatedAt")

    //Result
    return {
      sections,
      user: {username, ...displayName && {displayName}, ...avatarUrl && {avatarUrl}, ...rank !== undefined && {rank}},
      stats,
      models,
      dateRange,
      lastSubmit,
      updatedAt,
    }
  }
  //Handle errors
  catch (error) {
    throw imports.format.error(error)
  }
}
