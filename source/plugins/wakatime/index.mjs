//Setup
export default async function({login, q, imports, data, account}, {enabled = false, token, extras = false} = {}) {
  //Plugin execution
  try {
    //Check if plugin is enabled and requirements are met
    if ((!q.wakatime) || (!imports.metadata.plugins.wakatime.enabled(enabled, {extras})))
      return null

    //Load inputs
    let {sections, days, limit, url, user, "languages.other": others, "languages.ignored": _ignored, "repositories.visibility": repositoriesVisibility} = imports.metadata.plugins.wakatime.inputs({data, account, q})

    if (!limit)
      limit = void limit

    const showOnlyGitHubPublicRepos = repositoriesVisibility === "public"

    const range = {
      "7": "last_7_days",
      "30": "last_30_days",
      "180": "last_6_months",
      "365": "last_year",
    }[days] ?? "last_7_days"
    console.debug(`metrics/compute/${login}/plugins > wakatime > range: ${range}`)

    //Querying api and format result (https://wakatime.com/developers#stats)
    console.debug(`metrics/compute/${login}/plugins > wakatime > querying api`)
    const {data: {data: stats}} = await imports.axios.get(`${url}/api/v1/users/${user}/stats/${range}?api_key=${token}`)

    // Deduplicate entries from WakaTime API that share the same name
    function deduplicate(entries) {
      if (!entries) return undefined
      const map = new Map()
      for (const {name, percent, total_seconds: total} of entries) {
        const existing = map.get(name)
        if (existing) {
          existing.percent += percent
          existing.total += total
        } else {
          map.set(name, {name, percent: percent / 100, total})
        }
      }
      return [...map.values()].sort((a, b) => b.percent - a.percent)
    }

    const projectStats = deduplicate(stats.projects)
    const projects = showOnlyGitHubPublicRepos ? await pickOnlyGitHubPublicRepos({limit, login, axios: imports.axios, projects: projectStats}) : projectStats?.slice(0, limit)

    const result = {
      sections,
      days,
      projects,
      time: {
        total: (others ? stats.total_seconds_including_other_language : stats.total_seconds) / (60 * 60),
        daily: (others ? stats.daily_average_including_other_language : stats.daily_average) / (60 * 60),
      },
      languages: deduplicate(stats.languages)?.filter(({name}) => imports.filters.text(name, _ignored)).slice(0, limit),
      os: deduplicate(stats.operating_systems)?.slice(0, limit),
      editors: deduplicate(stats.editors)?.slice(0, limit),
    }

    //Result
    return result
  }
  //Handle errors
  catch (error) {
    throw imports.format.error(error)
  }
}

async function pickOnlyGitHubPublicRepos({projects, axios, login, limit}) {
  const result = []

  for await (const project of projects) {
    if (result.length >= limit)
      break
    try {
      console.debug(`metrics/compute/${login}/plugins > wakatime > checking 'https://github.com/${login}/${project.name}'`)
      await axios.head(`https://github.com/${login}/${project.name}`)

      result.push(project)
    }
    catch {
      continue
    }
  }

  if (result.length === 0)
    return undefined
  return result
}
