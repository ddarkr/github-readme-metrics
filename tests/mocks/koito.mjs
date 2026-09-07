export const koitoResponses = {
  recent: {
    items: [
      {
        time: "2026-09-01T12:00:00.000Z",
        track: {
          id: 1,
          title: "A deterministic track",
          artists: [{id: 2, name: "A deterministic artist"}],
          image: {xs: "/image/xs/track-1", small: "/image/small/track-1", medium: "/image/medium/track-1", large: "/image/large/track-1", xl: "/image/xl/track-1"},
        },
      },
    ],
    total_record_count: 1,
    items_per_page: 1,
    has_next_page: false,
    current_page: 1,
  },
  topArtists: {
    items: [
      {
        rank: 1,
        item: {
          id: 2,
          name: "A deterministic artist",
          listen_count: 42,
          image: {xs: "/image/xs/artist-2", small: "/image/small/artist-2", medium: "/image/medium/artist-2", large: "/image/large/artist-2", xl: "/image/xl/artist-2"},
        },
      },
    ],
    total_record_count: 1,
    items_per_page: 1,
    has_next_page: false,
    current_page: 1,
  },
  topTracks: {
    items: [
      {
        rank: 1,
        item: {
          id: 1,
          title: "A deterministic track",
          artists: [{id: 2, name: "A deterministic artist"}],
          image: {xs: "/image/xs/track-1", small: "/image/small/track-1", medium: "/image/medium/track-1", large: "/image/large/track-1", xl: "/image/xl/track-1"},
        },
      },
    ],
    total_record_count: 1,
    items_per_page: 1,
    has_next_page: false,
    current_page: 1,
  },
  malformed: {items: null},
  unauthorized: {
    isAxiosError: true,
    message: "Request failed with status code 401",
    response: {
      status: 401,
      data: {error: "unauthorized"},
    },
  },
}
