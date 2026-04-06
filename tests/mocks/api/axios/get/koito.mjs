/**Mocked data */
export default function({faker, url, options, login = faker.internet.userName()}) {
  //Koito api
  if (/^https:..music-stats.doda.im.*$/.test(url)) {
    //Get recently played tracks
    if (/\/apis\/web\/v1\/listens/.test(url)) {
      console.debug(`metrics/compute/mocks > mocking koito api result > ${url}`)
      const artist = faker.lorem.word()
      const track = faker.lorem.words(5)
      const date = faker.date.recent()
      return ({
        status: 200,
        data: {
          items: [
            {
              time: date.toISOString(),
              track: {
                id: faker.random.number(),
                title: track,
                artists: [{id: faker.random.number(), name: artist}],
                musicbrainz_id: null,
                listen_count: 0,
                duration: 0,
                image: faker.random.uuid(),
                album_id: 0,
                time_listened: 0,
                first_listen: 0,
              },
            },
          ],
          total_record_count: 100,
          items_per_page: 1,
          has_next_page: true,
          current_page: 1,
        },
      })
    }
    //Get top artists
    else if (/\/apis\/web\/v1\/top-artists/.test(url)) {
      console.debug(`metrics/compute/mocks > mocking koito api result > ${url}`)
      const artist = faker.lorem.word()
      const playcount = faker.random.number()
      return ({
        status: 200,
        data: {
          items: [
            {
              id: faker.random.number(),
              musicbrainz_id: null,
              name: artist,
              aliases: null,
              image: faker.random.uuid(),
              listen_count: playcount,
              time_listened: 0,
              first_listen: 0,
            },
          ],
          total_record_count: 100,
          items_per_page: 1,
          has_next_page: true,
          current_page: 1,
        },
      })
    }
    //Get top tracks
    else if (/\/apis\/web\/v1\/top-tracks/.test(url)) {
      console.debug(`metrics/compute/mocks > mocking koito api result > ${url}`)
      const artist = faker.lorem.word()
      const track = faker.lorem.words(5)
      const playcount = faker.random.number()
      return ({
        status: 200,
        data: {
          items: [
            {
              id: faker.random.number(),
              title: track,
              artists: [{id: faker.random.number(), name: artist}],
              musicbrainz_id: null,
              listen_count: playcount,
              duration: 0,
              image: faker.random.uuid(),
              album_id: 0,
              time_listened: 0,
              first_listen: 0,
            },
          ],
          total_record_count: 100,
          items_per_page: 1,
          has_next_page: true,
          current_page: 1,
        },
      })
    }
  }
}