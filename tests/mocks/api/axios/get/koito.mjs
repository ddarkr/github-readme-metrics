import { koitoResponses } from "../../../koito.mjs"

/** Mocked data */
export default function({url}) {
  if (/^https:..music-stats.doda.im.*$/.test(url)) {
    if (/\/apis\/web\/v1\/listens/.test(url)) {
      console.debug(`metrics/compute/mocks > mocking koito api result > ${url}`)
      return {status: 200, data: structuredClone(koitoResponses.recent)}
    }
    if (/\/apis\/web\/v1\/top\/artists/.test(url)) {
      console.debug(`metrics/compute/mocks > mocking koito api result > ${url}`)
      return {status: 200, data: structuredClone(koitoResponses.topArtists)}
    }
    if (/\/apis\/web\/v1\/top\/tracks/.test(url)) {
      console.debug(`metrics/compute/mocks > mocking koito api result > ${url}`)
      return {status: 200, data: structuredClone(koitoResponses.topTracks)}
    }
  }
}
