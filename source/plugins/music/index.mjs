//Imports
import crypto from "crypto"

//Supported providers
const providers = {
  apple: {
    name: "Apple Music",
    embed: /^https:..embed.music.apple.com.\w+.playlist/,
  },
  spotify: {
    name: "Spotify",
    embed: /^https:..open.spotify.com.embed.playlist/,
  },
  lastfm: {
    name: "Last.fm",
    embed: /^\b$/,
  },
  youtube: {
    name: "YouTube Music",
    embed: /^https:..music.youtube.com.playlist/,
  },
  koito: {
    name: "Koito",
    embed: /^\b$/,
  },
}
//Supported modes
const modes = {
  playlist: "Suggested tracks",
  recent: "Recently played",
  top: "Top played",
}

//Setup
export default async function({login, imports, data, q, account}, {enabled = false, token = "", sandbox = false, extras = false} = {}) {
  //Plugin execution
  try {
    //Check if plugin is enabled and requirements are met
    if ((!q.music) || (!imports.metadata.plugins.music.enabled(enabled, {extras})))
      return null

    //Initialization
    const raw = {
      get provider() {
        return providers[provider]?.name ?? ""
      },
      get mode() {
        return modes[mode] ?? "Unconfigured music plugin"
      },
    }
    let tracks = null

    //Load inputs
    let {provider, mode, playlist, limit, user, "played.at": played_at, "time.range": time_range, "top.type": top_type, token: _token} = imports.metadata.plugins.music.inputs({data, account, q})
    if ((sandbox) && (_token)) {
      token = _token
      console.debug(`metrics/compute/${login}/plugins > music > overridden token value through user inputs as sandbox mode is enabled`)
    }
    if (!imports.metadata.plugins.music.extras("token", {extras, error: false}))
      token = ""

    //Auto-guess parameters
    if (!mode) {
      if (playlist) {
        mode = "playlist"
        if (!provider) {
          for (const [name, {embed}] of Object.entries(providers)) {
            if (embed.test(playlist))
              provider = name
          }
        }
      }
      else if ("music.top.type" in q || "music.time.range" in q)
        mode = "top"
      else
        mode = "recent"
    }
    //Provider
    if (!(provider in providers))
      throw {error: {message: provider ? `Unsupported provider "${provider}"` : "Provider is not set"}, ...raw}
    //Mode
    if (!(mode in modes))
      throw {error: {message: `Unsupported mode "${mode}"`}, ...raw}
    //Playlist mode
    if (mode === "playlist") {
      if (!playlist)
        throw {error: {message: "Playlist URL is not set"}, ...raw}
      if (!providers[provider].embed.test(playlist))
        throw {error: {message: "Unsupported playlist URL format"}, ...raw}
    }
    //Limit
    limit = Math.max(1, Math.min(100, Number(limit)))

    //Handle mode
    console.debug(`metrics/compute/${login}/plugins > music > processing mode ${mode} with provider ${provider}`)
    switch (mode) {
      //Playlist mode
      case "playlist": {
        //Start puppeteer and navigate to playlist
        console.debug(`metrics/compute/${login}/plugins > music > starting browser`)
        const browser = await imports.puppeteer.launch()
        console.debug(`metrics/compute/${login}/plugins > music > started ${await browser.version()}`)
        const page = await browser.newPage()
        console.debug(`metrics/compute/${login}/plugins > music > loading page`)
        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.55 Safari/537.36 Edg/96.0.1054.34")
        await page.goto(playlist)
        const frame = page.mainFrame()
        //Handle provider
        switch (provider) {
          //Apple music
          case "apple": {
            //Parse tracklist
            await frame.waitForFunction(() => !!document.querySelector("embed-root").shadowRoot.querySelector(".audio-tracklist"))
            //Apple music do a lot of lazy-loading preventing the use of networkIdle
            await new Promise(solve => setTimeout(solve, 10 * 1000))
            tracks = [
              ...await frame.evaluate(() => {
                const tracklist = document.querySelector("embed-root").shadowRoot.querySelector(".audio-tracklist")
                return [...tracklist.querySelectorAll("embed-audio-tracklist-item")].map(item => ({
                  name: item.querySelector(".audio-tracklist-item__metadata h3").innerText,
                  artist: item.querySelector(".audio-tracklist-item__metadata h4").innerText,
                  artwork: item.querySelector("apple-music-artwork")?.shadowRoot?.querySelector("picture source")?.srcset?.split(",")?.[0]?.replace(/\s+\d+x$/, ""),
                }))
              }),
            ]
            break
          }
          //Spotify
          case "spotify": {
            //Parse tracklist
            await frame.waitForSelector("ol")
            tracks = [
              ...await frame.evaluate(() =>
                [...document.querySelectorAll("ol li")].map(tr => ({
                  name: tr.querySelector("h3").innerText,
                  artist: tr.querySelector("h4").innerText,
                  //Spotify doesn't provide artworks so we fallback on playlist artwork instead
                  artwork: window.getComputedStyle(document.querySelector("div[style^='--image-src:']") ?? null)?.backgroundImage.match(/^url\("(?<url>https:...+)"\)$/)?.groups?.url ?? null,
                }))
              ),
            ]
            break
          }
          //YouTube Music
          case "youtube": {
            while (await frame.evaluate(() => document.querySelector("yt-next-continuation")?.children.length ?? 0))
              await frame.evaluate(() => window.scrollBy(0, window.innerHeight))
            //Parse tracklist
            tracks = [
              ...await frame.evaluate(() =>
                [...document.querySelectorAll("ytmusic-playlist-shelf-renderer ytmusic-responsive-list-item-renderer")].map(item => ({
                  name: item.querySelector("yt-formatted-string.title > a")?.innerText ?? "",
                  artist: item.querySelector(".secondary-flex-columns > yt-formatted-string > a")?.innerText ?? "",
                  artwork: item.querySelector("img").src,
                }))
              ),
            ]
            break
          }
          //Unsupported
          default:
            throw {error: {message: `Unsupported mode "${mode}" for provider "${provider}"`}, ...raw}
        }
        //Close browser
        console.debug(`metrics/compute/${login}/plugins > music > closing browser`)
        await browser.close()
        //Format tracks
        if (Array.isArray(tracks)) {
          //Tracks
          console.debug(`metrics/compute/${login}/plugins > music > found ${tracks.length} tracks`)
          console.debug(imports.util.inspect(tracks, {depth: Infinity, maxStringLength: 256}))
          //Shuffle tracks
          tracks = imports.shuffle(tracks)
        }
        break
      }
      //Recently played
      case "recent": {
        //Handle provider
        switch (provider) {
          //Spotify
          case "spotify": {
            //Prepare credentials
            const [client_id, client_secret, refresh_token] = token.split(",").map(part => part.trim())
            if ((!client_id) || (!client_secret) || (!refresh_token))
              throw {error: {message: "Token must contain client id, client secret and refresh token"}}
            //API call and parse tracklist
            try {
              //Request access token
              console.debug(`metrics/compute/${login}/plugins > music > requesting access token with spotify refresh token`)
              const {data: {access_token: access}} = await imports.axios.post("https://accounts.spotify.com/api/token", `${new imports.url.URLSearchParams({grant_type: "refresh_token", refresh_token, client_id, client_secret})}`, {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              })
              console.debug(`metrics/compute/${login}/plugins > music > got access token`)
              //Retrieve tracks
              console.debug(`metrics/compute/${login}/plugins > music > querying spotify api`)
              tracks = []
              for (let hours = .5; hours <= 24; hours++) {
                //Load track half-hour by half-hour
                const timestamp = Date.now() - hours * 60 * 60 * 1000
                const loaded = (await imports.axios.get(`https://api.spotify.com/v1/me/player/recently-played?after=${timestamp}`, {
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${access}`,
                  },
                })).data.items.map(({track, played_at}) => ({
                  name: track.name,
                  artist: track.artists[0].name,
                  artwork: track.album.images[0].url,
                  played_at: played_at ? `${imports.format.date(played_at, {time: true})} on ${imports.format.date(played_at, {date: true})}` : null,
                }))
                //Ensure no duplicate are added
                for (const track of loaded) {
                  if (!tracks.map(({name}) => name).includes(track.name))
                    tracks.push(track)
                }
                //Early break
                if (tracks.length >= limit)
                  break
              }
            }
            //Handle errors
            catch (error) {
              if (error.isAxiosError) {
                const status = error.response?.status
                const description = error.response.data?.error_description ?? null
                const message = `API returned ${status}${description ? ` (${description})` : ""}`
                error = error.response?.data ?? null
                throw {error: {message, instance: error}, ...raw}
              }
              throw error
            }
            break
          }
          //Last.fm
          case "lastfm": {
            //API call and parse tracklist
            try {
              console.debug(`metrics/compute/${login}/plugins > music > querying lastfm api`)
              tracks = (await imports.axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${token}&limit=${limit}&format=json`, {
                headers: {
                  "User-Agent": "ddarkr/metrics",
                  Accept: "application/json",
                },
              })).data.recenttracks.track.map(track => ({
                name: track.name,
                artist: track.artist["#text"],
                artwork: track.image.reverse()[0]["#text"],
              }))
            }
            //Handle errors
            catch (error) {
              if (error.isAxiosError) {
                const status = error.response?.status
                const description = error.response.data?.message ?? null
                const message = `API returned ${status}${description ? ` (${description})` : ""}`
                error = error.response?.data ?? null
                throw {error: {message, instance: error}, ...raw}
              }
              throw error
            }
            break
          }
          case "youtube": {
            //Prepare credentials
            let date = new Date().getTime()
            let [, cookie] = token.split("; ").find(part => part.startsWith("SAPISID=")).split("=")
            let sha1 = str => crypto.createHash("sha1").update(str).digest("hex")
            let SAPISIDHASH = `SAPISIDHASH ${date}_${sha1(`${date} ${cookie} https://music.youtube.com`)}`
            //API call and parse tracklist
            try {
              //Request access token
              console.debug(`metrics/compute/${login}/plugins > music > requesting access token with youtube refresh token`)
              const res = await imports.axios.post("https://music.youtube.com/youtubei/v1/browse?alt=json&key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30", {
                browseEndpointContextSupportedConfigs: {
                  browseEndpointContextMusicConfig: {
                    pageType: "MUSIC_PAGE_TYPE_PLAYLIST",
                  },
                },
                context: {
                  client: {
                    clientName: "WEB_REMIX",
                    clientVersion: "1.20211129.00.01",
                    gl: "US",
                    hl: "en",
                  },
                },
                browseId: "FEmusic_history",
              }, {
                headers: {
                  Authorization: SAPISIDHASH,
                  Cookie: token,
                  "x-origin": "https://music.youtube.com",
                },
              })
              //Retrieve tracks
              console.debug(`metrics/compute/${login}/plugins > music > querying youtube api`)
              tracks = []
              let parsedHistory = get_all_with_key(res.data, "musicResponsiveListItemRenderer")

              for (let i = 0; i < parsedHistory.length; i++) {
                let track = parsedHistory[i]
                tracks.push({
                  name: track.flexColumns[0].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
                  artist: track.flexColumns[1].musicResponsiveListItemFlexColumnRenderer.text.runs[0].text,
                  artwork: track.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
                })
                //Early break
                if (tracks.length >= limit)
                  break
              }
            }
            //Handle errors
            catch (error) {
              throw imports.format.error(error)
            }
            break
          }
          //Koito
          case "koito": {
            const {url: koitoUrl, headers} = koitoCredentials({user, token})

            try {
              console.debug(`metrics/compute/${login}/plugins > music > querying koito api`)
              const {data: response} = await imports.axios.get(`${koitoUrl}/apis/web/v1/listens?limit=${limit}`, {
                headers: {
                  ...headers,
                  "Content-Type": "application/json",
                },
              })
              tracks = koitoItems(response).map((listen, index) => koitoRecentTrack(listen, {index, url: koitoUrl, format: imports.format}))
            }
            catch (error) {
              throw koitoError(error, raw)
            }
            break
          }
          //Unsupported
          default:
            throw {error: {message: `Unsupported mode "${mode}" for provider "${provider}"`}, ...raw}
        }
        break
      }
      case "top": {
        let time_msg
        switch (time_range) {
          case "short":
            time_msg = "from the last month"
            break
          case "medium":
            time_msg = "from the last 6 months"
            break
          case "long":
            time_msg = "overall"
            break
          default:
            throw {error: {message: `Unsupported time range "${time_range}"`}, ...raw}
        }

        if (top_type === "artists") {
          Object.defineProperty(modes, "top", {
            get() {
              return `Top played artists ${time_msg}`
            },
          })
        }
        else {
          Object.defineProperty(modes, "top", {
            get() {
              return `Top played tracks ${time_msg}`
            },
          })
        }

        //Handle provider
        switch (provider) {
          //Spotify
          case "spotify": {
            //Prepare credentials
            const [client_id, client_secret, refresh_token] = token.split(",").map(part => part.trim())
            if ((!client_id) || (!client_secret) || (!refresh_token))
              throw {error: {message: "Token must contain client id, client secret and refresh token"}}
            else if (limit > 50)
              throw {error: {message: "Top limit cannot exceed 50 for this provider"}}

            //API call and parse tracklist
            try {
              //Request access token
              console.debug(`metrics/compute/${login}/plugins > music > requesting access token with spotify refresh token`)
              const {data: {access_token: access}} = await imports.axios.post("https://accounts.spotify.com/api/token", `${new imports.url.URLSearchParams({grant_type: "refresh_token", refresh_token, client_id, client_secret})}`, {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              })
              console.debug(`metrics/compute/${login}/plugins > music > got access token`)
              //Retrieve tracks
              console.debug(`metrics/compute/${login}/plugins > music > querying spotify api`)
              tracks = []
              const loaded = top_type === "artists"
                ? (
                  await imports.axios.get(
                    `https://api.spotify.com/v1/me/top/artists?time_range=${time_range}_term&limit=${limit}`,
                    {
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${access}`,
                      },
                    },
                  )
                ).data.items.map(({name, genres, images}) => ({
                  name,
                  artist: genres.join(" • "),
                  artwork: images[0].url,
                }))
                : (
                  await imports.axios.get(
                    `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}_term&limit=${limit}`,
                    {
                      headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${access}`,
                      },
                    },
                  )
                ).data.items.map(({name, artists, album}) => ({
                  name,
                  artist: artists[0].name,
                  artwork: album.images[0].url,
                }))
              //Ensure no duplicate are added
              for (const track of loaded) {
                if (!tracks.map(({name}) => name).includes(track.name))
                  tracks.push(track)
              }
            }
            //Handle errors
            catch (error) {
              throw imports.format.error(error)
            }
            break
          }
          //Last.fm
          case "lastfm": {
            //API call and parse tracklist
            try {
              console.debug(`metrics/compute/${login}/plugins > music > querying lastfm api`)
              const period = time_range === "short" ? "1month" : time_range === "medium" ? "6month" : "overall"
              tracks = top_type === "artists"
                ? (
                  await imports.axios.get(
                    `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${user}&api_key=${token}&limit=${limit}&period=${period}&format=json`,
                    {
                      headers: {
                        "User-Agent": "ddarkr/metrics",
                        Accept: "application/json",
                      },
                    },
                  )
                ).data.topartists.artist.map(artist => ({
                  name: artist.name,
                  artist: `Play count: ${artist.playcount}`,
                  artwork: artist.image.reverse()[0]["#text"],
                }))
                : (
                  await imports.axios.get(
                    `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${user}&api_key=${token}&limit=${limit}&period=${period}&format=json`,
                    {
                      headers: {
                        "User-Agent": "ddarkr/metrics",
                        Accept: "application/json",
                      },
                    },
                  )
                ).data.toptracks.track.map(track => ({
                  name: track.name,
                  artist: track.artist.name,
                  artwork: track.image.reverse()[0]["#text"],
                }))
            }
            //Handle errors
            catch (error) {
              throw imports.format.error(error)
            }
            break
          }
          //Koito
          case "koito": {
            const {url: koitoUrl, headers} = koitoCredentials({user, token})
            const query = koitoTopQuery({limit, timeRange: time_range})
            const endpoint = top_type === "artists" ? "artists" : "tracks"

            try {
              console.debug(`metrics/compute/${login}/plugins > music > querying koito api`)
              const {data: response} = await imports.axios.get(`${koitoUrl}/apis/web/v1/top/${endpoint}?${query}`, {
                headers: {
                  ...headers,
                  "Content-Type": "application/json",
                },
              })
              const items = koitoItems(response)
              tracks = top_type === "artists"
                ? items.map((item, index) => koitoTopArtist(item, {index, url: koitoUrl}))
                : items.map((item, index) => koitoTopTrack(item, {index, url: koitoUrl}))
            }
            catch (error) {
              throw koitoError(error, raw)
            }
            break
          }
          //Unsupported
          default:
            throw {error: {message: `Unsupported mode "${mode}" for provider "${provider}"`}, ...raw}
        }
        break
      }
      //Unsupported
      default:
        throw {error: {message: `Unsupported mode "${mode}"`}, ...raw}
    }

    //Format tracks
    if (Array.isArray(tracks)) {
      //Limit tracklist
      if (limit > 0) {
        console.debug(`metrics/compute/${login}/plugins > music > keeping only ${limit} tracks`)
        tracks.splice(limit)
      }
      //Convert artworks to base64
      console.debug(`metrics/compute/${login}/plugins > music > loading artworks`)
      for (const track of tracks) {
        console.debug(`metrics/compute/${login}/plugins > music > processing ${track.name}`)
        track.artwork = await imports.imgb64(track.artwork)
      }
      //Save results
      return {...raw, user, tracks, played_at}
    }

    //Unhandled error
    throw {error: {message: "Failed to retrieve tracks"}}
  }
  //Handle errors
  catch (error) {
    throw imports.format.error(error)
  }
}

//get all objects that have the given key name with recursively
function get_all_with_key(obj, key) {
  const result = []
  if (obj instanceof Object) {
    if (key in obj)
      result.push(obj[key])
    for (const i in obj)
      result.push(...get_all_with_key(obj[i], key))
  }
  return result
}

function koitoInvalid(field) {
  throw {error: {message: `Koito API response is invalid: ${field}`}}
}

function koitoRecord(value, field) {
  if ((!value) || (typeof value !== "object") || Array.isArray(value))
    koitoInvalid(`${field} must be an object`)
  return value
}

function koitoString(value, field) {
  if ((typeof value !== "string") || (!value.trim()))
    koitoInvalid(`${field} must be a non-empty string`)
  return value.trim()
}

function koitoItems(response) {
  const data = koitoRecord(response, "root")
  if (!Array.isArray(data.items))
    koitoInvalid("items must be an array")
  return data.items
}

function koitoCredentials({user, token}) {
  let instance
  try {
    instance = new URL(koitoString(user, "configured instance URL"))
  }
  catch {
    koitoInvalid("configured instance URL must be an absolute HTTP(S) URL")
  }
  if ((!instance) || (!["http:", "https:"].includes(instance.protocol)))
    koitoInvalid("configured instance URL must be an absolute HTTP(S) URL")
  instance.username = ""
  instance.password = ""
  instance.search = ""
  instance.hash = ""
  const url = instance.href.replace(/\/+$/, "")
  const apiKey = typeof token === "string" ? token.trim() : ""
  return {url, headers: apiKey ? {Authorization: `Token ${apiKey}`} : {}}
}

function koitoTopQuery({limit, timeRange}) {
  const query = new URLSearchParams({limit: `${limit}`})
  switch (timeRange) {
    case "short":
      query.set("period", "month")
      break
    case "medium": {
      const start = new Date()
      start.setMonth(start.getMonth() - 6)
      query.set("from", `${Math.floor(start.getTime() / 1000)}`)
      break
    }
    case "long":
      query.set("period", "all_time")
      break
    default:
      koitoInvalid(`unsupported time range "${timeRange}"`)
  }
  return query
}

function koitoArtwork(image, {field, url}) {
  if ((image === undefined) || (image === null))
    return null
  image = koitoRecord(image, field)
  if ((image.small === undefined) || (image.small === null) || (image.small === ""))
    return null
  try {
    return new URL(koitoString(image.small, `${field}.small`), `${url}/`).href
  }
  catch {
    koitoInvalid(`${field}.small must be a valid URL path`)
  }
}

function koitoArtist(artists, field) {
  if ((artists === undefined) || (artists === null))
    return "Unknown"
  if (!Array.isArray(artists))
    koitoInvalid(`${field} must be an array`)
  if (!artists.length)
    return "Unknown"
  const artist = koitoRecord(artists[0], `${field}[0]`)
  return koitoString(artist.name, `${field}[0].name`)
}

function koitoTrack(track, {field, url}) {
  track = koitoRecord(track, field)
  return {
    name: koitoString(track.title, `${field}.title`),
    artist: koitoArtist(track.artists, `${field}.artists`),
    artwork: koitoArtwork(track.image, {field: `${field}.image`, url}),
  }
}

function koitoRecentTrack(listen, {index, url, format}) {
  listen = koitoRecord(listen, `items[${index}]`)
  const track = koitoTrack(listen.track, {field: `items[${index}].track`, url})
  if ((listen.time === undefined) || (listen.time === null) || (listen.time === ""))
    return {...track, played_at: null}
  const time = koitoString(listen.time, `items[${index}].time`)
  if (!Number.isFinite(Date.parse(time)))
    koitoInvalid(`items[${index}].time must be a valid date string`)
  return {
    ...track,
    played_at: `${format.date(new Date(time), {time: true})} on ${format.date(new Date(time), {date: true})}`,
  }
}

function koitoRankedItem(value, index) {
  value = koitoRecord(value, `items[${index}]`)
  return koitoRecord(value.item, `items[${index}].item`)
}

function koitoTopArtist(value, {index, url}) {
  const artist = koitoRankedItem(value, index)
  if ((!Number.isFinite(artist.listen_count)) || (artist.listen_count < 0))
    koitoInvalid(`items[${index}].item.listen_count must be a non-negative finite number`)
  return {
    name: koitoString(artist.name, `items[${index}].item.name`),
    artist: `Play count: ${artist.listen_count}`,
    artwork: koitoArtwork(artist.image, {field: `items[${index}].item.image`, url}),
  }
}

function koitoTopTrack(value, {index, url}) {
  return koitoTrack(koitoRankedItem(value, index), {field: `items[${index}].item`, url})
}

function koitoError(error, raw) {
  if (error?.error?.message)
    return error
  if (error?.isAxiosError) {
    const {response} = error
    const detail = response?.data?.error ?? response?.data?.message ?? response?.data?.error_description
    const status = response?.status ?? "request failure"
    return {
      error: {
        message: `Koito API returned ${status}${typeof detail === "string" && detail ? ` (${detail})` : ""}`,
        instance: response?.data ?? error.message,
      },
      ...raw,
    }
  }
  return error
}
