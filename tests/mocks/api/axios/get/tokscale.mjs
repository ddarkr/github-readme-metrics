import { tokscaleResponses } from "../../../tokscale.mjs"

/** Mocked data */
export default function({url}) {
  if (/^https:..tokscale.ai.api.users.*$/.test(url)) {
    console.debug(`metrics/compute/mocks > mocking tokscale api result > ${url}`)
    return {
      status: 200,
      data: structuredClone(tokscaleResponses.valid),
    }
  }
}
