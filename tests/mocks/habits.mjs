//Fixtures for habits push-event regressions: current before/head event shape vs legacy embedded commits
const now = new Date().toISOString()

const patch = `@@ -0,0 +1,2 @@
+console.log(1)
+console.log(2)`

const legacyPatch = `@@ -0,0 +1,2 @@
+const x = 1
+console.log(x)`

export default {
  repo: "o/r",
  before: "BEFORE_SHA",
  head: "HEAD_SHA",
  patch,
  legacyPatch,
  //Current events API shape: payload carries only the before/head range, no commits
  currentEvent: {
    id: "10000000011",
    type: "PushEvent",
    actor: {login: "ddarkr"},
    repo: {name: "o/r"},
    payload: {push_id: 1, size: 1, before: "BEFORE_SHA", head: "HEAD_SHA", ref: "refs/heads/main", repository_id: 1},
    created_at: now,
    public: true,
  },
  //Legacy events API shape: commits embedded in payload
  legacyEvent: {
    id: "10000000012",
    type: "PushEvent",
    actor: {login: "ddarkr"},
    repo: {name: "o/r"},
    payload: {
      size: 1,
      ref: "refs/heads/master",
      commits: [{sha: "MOCKED_SHA", url: "https://api.github.com/repos/o/r/commits/MOCKED_SHA", author: {email: "ddarkr@example.com"}}],
    },
    created_at: now,
    public: true,
  },
  //Branch creation: before is all zeros so no compare range exists
  branchEvent: {
    id: "10000000013",
    type: "PushEvent",
    actor: {login: "ddarkr"},
    repo: {name: "o/r"},
    payload: {push_id: 2, size: 1, before: "0000000000000000000000000000000000000000", head: "HEAD_SHA", ref: "refs/heads/feature", repository_id: 1},
    created_at: now,
    public: true,
  },
  //Real compare-commits API entry shape: git identity lives under commit.author, not top-level author
  compare: {
    sha: "HEAD_SHA",
    url: "https://api.github.com/repos/o/r/commits/HEAD_SHA",
    commit: {
      message: "feat: mocked commit",
      author: {name: "ddarkr", email: "ddarkr@example.com", date: now},
      committer: {name: "ddarkr", email: "ddarkr@example.com", date: now},
    },
    author: {login: "ddarkr"},
    committer: {login: "ddarkr"},
    parents: [{sha: "BEFORE_SHA"}],
  },
  //Full commit detail behind rest.request, with real newlines in patch
  detail: {
    sha: "HEAD_SHA",
    commit: {message: "feat: mocked commit", author: {name: "ddarkr", email: "ddarkr@example.com", date: now}, committer: {name: "ddarkr", email: "ddarkr@example.com", date: now}},
    author: {login: "ddarkr"},
    committer: {login: "ddarkr"},
    files: [{filename: "src/app.mjs", patch}],
    parents: [{sha: "BEFORE_SHA"}],
    verification: {verified: false},
  },
  legacyDetail: {
    sha: "MOCKED_SHA",
    commit: {message: "feat: legacy mocked commit", author: {name: "ddarkr", email: "ddarkr@example.com", date: now}, committer: {name: "ddarkr", email: "ddarkr@example.com", date: now}},
    author: {login: "ddarkr"},
    committer: {login: "ddarkr"},
    files: [{filename: "src/app.mjs", patch: legacyPatch}],
    parents: [{sha: "PARENT_SHA"}],
    verification: {verified: false},
  },
}
