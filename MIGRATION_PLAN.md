# TypeScript Migration Plan

> **Historical proposal — not implemented.** This document is retained as a design reference, not an installation guide or an active migration checklist. The maintained application uses Node.js 24 and JavaScript ES modules (`.mjs`). See [ARCHITECTURE.md](ARCHITECTURE.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for the current structure and workflow. Do not run the migration commands as part of normal setup.

> **Project**: metrics (GitHub metrics infographics generator)
> **Stack assumed by this proposal**: Node.js 20, ES Modules (.mjs), Express, Puppeteer
> **Target Stack**: TypeScript 5.x, esbuild, tsx
> **Scope estimated by this proposal**: 73 .mjs files + 2 existing .ts files

---

## Phase 0: 사전 준비

### 0.1 백업 및 브랜치
```bash
git checkout -b feat/typescript-migration
git push -u origin feat/typescript-migration
```

### 0.2 현재 상태 스냅샷
```bash
# 테스트 통과 확인
npm test

# 빌드 확인
npm run build

# 현재 파일 목록 저장
find source -name "*.mjs" > .migration-backup-filelist.txt
```

---

## Phase 1: 인프라 설정

### 1.1 패키지 설치
```bash
npm install -D typescript esbuild tsx @types/node ts-jest @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

| 패키지 | 역할 | 버전 |
|---|---|---|
| `typescript` | 타입 체크 (빌드는 esbuild) | ^5.3.0 |
| `esbuild` | 빌드 (JS 변환) | ^0.19.0 |
| `tsx` | 개발 시 TS 직접 실행 | ^4.7.0 |
| `@types/node` | Node.js 타입 | ^20.10.0 |
| `ts-jest` | Jest TypeScript 지원 | ^29.1.0 |
| `@typescript-eslint/*` | ESLint TypeScript 규칙 | ^6.13.0 |

### 1.2 tsconfig.json 생성
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./source",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["source/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**설정 설명**:
- `noEmit: true` — 타입 체크만, 빌드는 esbuild가 담당
- `allowImportingTsExtensions: true` — `.ts` 확장자로 import 허용
- `moduleResolution: "bundler"` — esbuild와 호환

### 1.3 esbuild 빌드 스크립트

**파일**: `scripts/build-ts.mjs` (신규)
```javascript
import * as esbuild from 'esbuild'
import { glob } from 'fs/promises'

const entryPoints = [
  'source/app/web/index.ts',
  'source/app/action/index.ts',
  'source/app/metrics/index.ts',
]

await esbuild.build({
  entryPoints,
  bundle: false,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  target: 'node20',
  sourcemap: true,
  // .mjs 확장자를 가진 외부 모듈 유지
  outExtension: { '.js': '.mjs' },
})
```

### 1.4 package.json 스크립트 변경

```json
{
  "scripts": {
    "start": "node dist/app/web/index.mjs",
    "dev": "tsx watch source/app/web/index.ts",
    "build": "node .github/scripts/build.mjs && node scripts/build-ts.mjs",
    "build:ts": "node scripts/build-ts.mjs",
    "typecheck": "tsc --noEmit",
    "linter": "eslint source/**/*.ts --quiet",
    "test": "jest --runInBand",
    "test:ts": "NODE_OPTIONS='--loader ts-jest' jest --runInBand"
  }
}
```

---

## Phase 2: 타입 정의 파일

### 2.1 공통 타입 정의

**파일**: `source/types/index.ts` (신규)

```typescript
// ============================================
// 플러그인 공통 타입
// ============================================

/** 플러그인 컨텍스트 (모든 플러그인에 전달) */
export interface PluginContext {
  login: string
  q: Record<string, any>                     // 쿼리 파라미터
  data: MetricsData                           // 공유 데이터 객체 (직접 변형)
  imports: PluginImports                      // 유틸리티/메타데이터
  rest: GitHubREST                            // GitHub REST API 클라이언트
  graphql: GitHubGraphQL                      // GitHub GraphQL API 클라이언트
  queries: Record<string, any>                // 미리 정의된 쿼리 함수
  account: 'user' | 'organization' | 'repository' | 'bypass'
  computed?: ComputedMetrics                  // 코어 플러그인 계산값
  plugins?: Record<string, PluginFunction>    // 플러그인 레지스트리
  callbacks?: PluginCallbacks                 // 콜백 함수
}

/** 플러그인 옵션 (플러그인별 설정) */
export interface PluginOptions {
  enabled?: boolean
  extras?: boolean | string[] | Record<string, any>
  sandbox?: boolean
  [key: string]: any                          // 플러그인별 옵션
}

/** 플러그인 함수 시그니처 */
export type PluginFunction<T = any> = (
  context: PluginContext,
  options: PluginOptions
) => Promise<PluginResult<T> | null>

/** 플러그인 결과 */
export interface PluginResult<T = any> {
  error?: boolean | string
  [key: string]: T
}

/** 플러그인 imports 객체 */
export interface PluginImports {
  plugins: Record<string, PluginFunction>
  templates: Record<string, TemplateFunction>
  metadata: MetadataService
  utils: UtilsService
  formatters: FormattersService
  imgb64: (url: string, options?: any) => string
  puppeteer: PuppeteerService
  [key: string]: any
}

/** 플러그인 콜백 */
export interface PluginCallbacks {
  plugin?: (login: string, name: string, status: boolean, data: any) => Promise<void>
  [key: string]: any
}

// ============================================
// 메트릭스 데이터 타입
// ============================================

/** 메트릭스 데이터 객체 (플러그인이 변형하는 공유 객체) */
export interface MetricsData {
  q: Record<string, any>
  animated: boolean
  large: boolean
  columns?: boolean
  base: Record<string, boolean>               // base.header, base.activity 등
  config: Record<string, any>
  errors: string[]
  warnings: string[]
  plugins: Record<string, PluginResult>       // 플러그인 결과 저장
  computed: ComputedMetrics                    // 코어 플러그인 계산값
  extras: { css: string; js: string }
  postscripts: string[]
  partials?: Set<string>
  user?: GitHubUser
  account?: string
}

/** 계산된 메트릭스 (코어 플러그인 출력) */
export interface ComputedMetrics {
  commits: number
  sponsorships: number
  licenses: { favorite: string; used: Record<string, number>; about: Record<string, any> }
  token: { scopes?: string[] }
  repositories: {
    watchers: number; stargazers: number
    issues_open: number; issues_closed: number
    pr_open: number; pr_closed: number; pr_merged: number
    forks: number; forked: number
    releases: number; deployments: number; environments: number
    diskUsage?: string
  }
  registered?: { years: number; months: number }
  registration?: string
  cakeday?: boolean
  calendar?: number[]
  avatar?: string                              // Base64 인코딩
}

/** GitHub 사용자 데이터 */
export interface GitHubUser {
  databaseId?: number
  login: string
  name?: string | null
  avatarUrl: string
  bio?: string | null
  company?: string | null
  location?: string | null
  websiteUrl?: string | null
  twitterUsername?: string | null
  isHireable?: boolean
  isVerified?: boolean
  followers?: { totalCount: number }
  following?: { totalCount: number }
  repositories?: {
    totalCount: number
    totalDiskUsage?: number
    nodes?: GitHubRepository[]
  }
  repositoriesContributedTo?: { totalCount: number; nodes?: GitHubRepository[] }
  packages?: { totalCount: number }
  sponsorshipsAsSponsor?: { totalCount: number }
  sponsorshipsAsMaintainer?: { totalCount: number }
  watching?: { totalCount: number }
  issueComments?: { totalCount: number }
  organizations?: { totalCount: number }
  contributionsCollection?: {
    totalRepositoriesWithContributedCommits: number
    totalCommitContributions: number
    restrictedContributionsCount: number
    totalIssueContributions: number
    totalPullRequestContributions: number
    totalPullRequestReviewContributions: number
  }
  calendar?: { contributionCalendar: { weeks: GitHubContributionWeek[] } }
  [key: string]: any
}

/** GitHub 저장소 */
export interface GitHubRepository {
  name: string
  description?: string | null
  fork: boolean
  forkCount: number
  stargazers: { totalCount: number }
  watchers: { totalCount: number }
  language?: string | null
  licenseInfo?: { spdxId: string | null; name: string | null; url: string | null }
  createdAt: string
  pushedAt: string
  updatedAt: string
  issues?: { totalCount: number }
  pullRequests?: { totalCount: number }
  releases?: { totalCount: number }
  [key: string]: any
}

/** GitHub 기여 주/일 */
export interface GitHubContributionWeek {
  contributionDays: { contributionCount: number; date: string; color: string }[]
}

// ============================================
// API 클라이언트 타입
// ============================================

/** GitHub GraphQL 클라이언트 */
export type GitHubGraphQL = (query: string, variables?: Record<string, any>) => Promise<any>

/** GitHub REST 클라이언트 */
export interface GitHubREST {
  request: (endpoint: string, options?: any) => Promise<any>
  activity?: any
  repos?: any
  [key: string]: any
}

// ============================================
// 템플릿 타입
// ============================================

/** 템플릿 함수 시그니처 */
export type TemplateFunction = (
  context: { login: string; q: Record<string, any> },
  config: {
    conf: MetricsConfig
    data: MetricsData
    rest: GitHubREST
    graphql: GitHubGraphQL
    plugins: Record<string, PluginFunction>
    queries: Record<string, any>
    account?: string
    convert?: string | null
    template: string
    callbacks?: PluginCallbacks
  },
  extras: {
    pending: Promise<any>[]
    imports: PluginImports
  }
) => Promise<void>

// ============================================
// 메타데이터 타입
// ============================================

/** 메타데이터 서비스 */
export interface MetadataService {
  plugins: Record<string, PluginMetadata>
  templates: Record<string, TemplateMetadata>
  packaged?: any
  descriptor?: any
  env?: { ghactions: boolean }
  [key: string]: any
}

/** 플러그인 메타데이터 */
export interface PluginMetadata {
  name: string
  icon?: string
  category: 'core' | 'github' | 'social' | 'community'
  description?: string
  disclaimer?: string
  deprecated?: boolean
  index?: number
  supports?: ('user' | 'organization' | 'repository')[]
  scopes?: string[]
  inputs: Record<string, InputDefinition>
  // 런타임 메서드
  inputs: (params: { data?: any; q?: any; account?: string }) => Record<string, any>
  enabled?: (enabled: boolean, opts?: any) => boolean
  extras?: (name: string, opts?: any) => any
}

/** 템플릿 메타데이터 */
export interface TemplateMetadata {
  name: string
  description?: string
  index?: number
  formats?: ('svg' | 'png' | 'jpeg' | 'json' | 'markdown' | 'markdown-pdf')[]
  supports?: ('user' | 'organization' | 'repository')[]
  check?: (params: any) => void
}

/** 입력 정의 (metadata.yml 기반) */
export interface InputDefinition {
  type: 'boolean' | 'number' | 'array' | 'string' | 'json' | 'token'
  format?: 'comma-separated' | 'space-separated' | 'newline-separated'
  default?: any
  min?: number
  max?: number
  values?: string[]
  inherits?: string
  required?: boolean
  global?: boolean
  preset?: boolean
  testing?: boolean
  description?: string
  example?: string
  zero?: string
  extras?: string[]
}

// ============================================
// 서비스 타입
// ============================================

/** 유틸리티 서비스 */
export interface UtilsService {
  inspect: (obj: any, opts?: any) => string
  [key: string]: any
}

/** 포맷터 서비스 */
export interface FormattersService {
  date: (date: Date, opts: { date: boolean; time: boolean }) => string
  bytes: (bytes: number) => string
  s: (count: number) => string
  [key: string]: any
}

/** Puppeteer 서비스 */
export interface PuppeteerService {
  headless?: boolean
  events?: string[]
  launch: () => Promise<any>
  [key: string]: any
}

// ============================================
// 설정 타입
// ============================================

/** 메트릭스 설정 */
export interface MetricsConfig {
  settings: {
    debug?: boolean
    repositories?: number
    notoken?: boolean
    sandbox?: boolean
    plugins: Record<string, any>
    templates: { default: string; enabled: string[] }
    [key: string]: any
  }
  templates: Record<string, TemplateConfig>
  metadata: MetadataService
  queries: Record<string, any>
  authenticated?: string
  paths: { statics: string; [key: string]: string }
}

/** 템플릿 설정 */
export interface TemplateConfig {
  image: string
  style: string
  fonts: string[]
  views: string
  partials: string[]
}

// ============================================
// Express/GitHub Action 타입
// ============================================

/** Express 설정 */
export interface ExpressConfig {
  port: number
  sandbox?: boolean
  [key: string]: any
}

/** Action 입력값 */
export interface ActionInputs {
  token: string
  user: string
  template: string
  filename: string
  [key: string]: string
}
```

### 2.2 외부 라이브러리 타입

**확인된 타입 지원**:
| 라이브러리 | 타입 지원 | 비고 |
|---|---|---|
| `express` | ✅ `@types/express` | 설치 필요 |
| `@octokit/rest` | ✅ 내장 | 추가 설치 불필요 |
| `@octokit/graphql` | ✅ 내장 | 추가 설치 불필요 |
| `@actions/core` | ✅ 내장 | 추가 설치 불필요 |
| `@actions/github` | ✅ 내장 | 추가 설치 불필요 |
| `puppeteer` | ✅ 내장 | 추가 설치 불필요 |
| `axios` | ✅ 내장 | 추가 설치 불필요 |
| `d3` | ✅ `@types/d3` | 설치 필요 |
| `ejs` | ✅ `@types/ejs` | 설치 필요 |
| `js-yaml` | ✅ `@types/js-yaml` | 설치 필요 |
| `sharp` | ✅ 내장 | 추가 설치 불필요 |
| `marked` | ✅ 내장 | 추가 설치 불필요 |
| `compression` | ✅ `@types/compression` | 설치 필요 |
| `express-rate-limit` | ✅ 내장 | 추가 설치 불필요 |

**추가 설치**:
```bash
npm install -D @types/express @types/d3 @types/ejs @types/js-yaml @types/compression
```

---

## Phase 3: 변환 순서 및 파일별 가이드

### 3.1 변환 우선순위

```
Level 1 (독립적, 즉시 변환 가능):
├── source/app/metrics/utils.mjs           → utils.ts (20+ named exports)
├── source/app/metrics/metadata.mjs        → metadata.ts (1 named export)
└── source/app/metrics/presets.mjs         → presets.ts (default export only)

Level 2 (Level 1에 의존):
├── source/app/metrics/setup.mjs           → setup.ts ⚠️ 동적 import 2개
└── source/app/metrics/index.mjs           → index.ts ⚠️ 동적 import 1개

Level 3 (플러그인 - 40개 코어):
├── source/plugins/base/index.mjs          → index.ts (default export only)
├── source/plugins/core/index.mjs          → index.ts (default export only)
├── source/plugins/activity/index.mjs      → index.ts (default export only)
├── source/plugins/languages/index.mjs     → index.ts ⚠️ analyzer 하위 4개 파일
└── ... (나머지 36개)

Level 4 (커뮤니티 플러그인 - 9개):
├── source/plugins/community/*/index.mjs   → index.ts

Level 5 (템플릿 - 5개):
├── source/templates/classic/template.mjs  → template.ts
├── source/templates/terminal/template.mjs → template.ts
└── ... (나머지 3개)

Level 6 (엔트리 포인트):
├── source/app/web/index.mjs               → index.ts
├── source/app/web/instance.mjs            → instance.ts ⚠️ import.meta.url
└── source/app/action/index.mjs            → index.ts ⚠️ 동적 import 1개

Level 7 (빌드 스크립트):
└── .github/scripts/build.mjs              → build.ts (선택적)
```

### 3.2 파일 변환 패턴

#### 패턴 A: 유틸리티 함수
```typescript
// Before (.mjs)
export function imgb64(url) {
  // ...
}

// After (.ts)
export function imgb64(url: string): string {
  // ...
}
```

#### 패턴 B: 플러그인 함수
```typescript
// Before (.mjs)
export default async function({login, q, data, graphql, rest, ...}, conf) {
  // ...
  return {computed: result}
}

// After (.ts)
import type { PluginContext, PluginConfig } from "../../types/index.ts"

export default async function plugin(
  {login, q, data, graphql, rest}: PluginContext,
  conf: PluginConfig
): Promise<{ computed: any }> {
  // ...
  return {computed: result}
}
```

#### 패턴 C: 동적 import (8개 파일)
```typescript
// Before (.mjs)
const module = (await import("./path/index.mjs")).default

// After (.ts)
const module = (await import("./path/index.ts")).default
```

**동적 import 사용 파일** (분석 완료):
| 파일 | 동적 import 대상 | 비고 |
|---|---|---|
| `setup.mjs` | 플러그인/템플릿 (동적 경로) | `url.pathToFileURL()` 사용 |
| `utils.mjs` | gifencoder | 선택적 의존성 |
| `index.mjs` | libxmljs2 | SVG 검증용 |
| `action/index.mjs` | utils.mjs | fallback import |
| `stargazers/index.mjs` | worldmap/index.mjs | 서브모듈 |
| `languages/analyzer/cli.mjs` | setup.mjs, utils.mjs | 2개 동적 import |

### 3.3 import.meta.url 사용 위치 (8개)

| 파일 | 라인 | 용도 |
|---|---|---|
| `setup.mjs` | 18 | `__metrics` 경로 계산 |
| `metadata.mjs` | 20 | `__metrics` 경로 계산 |
| `utils.mjs` | 499 | CSS 파일 로드 |
| `stargazers/worldmap/index.mjs` | 43 | GeoJSON 파일 로드 |
| `languages/index.mjs` | 38 | colorsets.json 로드 |
| `community/splatoon/index.mjs` | 17, 52, 58-59 | 프로필/데이터 파일 로드 |

**해결책**: `__module()` 유틸리티 함수 활용 (utils.mjs에 이미 구현됨)
```
Level 1 (독립적, 즉시 변환 가능):
├── source/app/metrics/utils.mjs           → utils.ts
├── source/app/metrics/metadata.mjs        → metadata.ts
└── source/app/metrics/presets.mjs         → presets.ts

Level 2 (Level 1에 의존):
├── source/app/metrics/setup.mjs           → setup.ts
└── source/app/metrics/index.mjs           → index.ts

Level 3 (플러그인 - 40개 코어):
├── source/plugins/base/index.mjs          → index.ts
├── source/plugins/core/index.mjs          → index.ts
├── source/plugins/activity/index.mjs      → index.ts
├── source/plugins/languages/index.mjs     → index.ts
└── ... (나머지 36개)

Level 4 (커뮤니티 플러그인 - 9개):
├── source/plugins/community/*/index.mjs   → index.ts

Level 5 (템플릿 - 5개):
├── source/templates/classic/template.mjs  → template.ts
├── source/templates/terminal/template.mjs → template.ts
└── ... (나머지 3개)

Level 6 (엔트리 포인트):
├── source/app/web/index.mjs               → index.ts
├── source/app/web/instance.mjs            → instance.ts
└── source/app/action/index.mjs            → index.ts

Level 7 (빌드 스크립트):
└── .github/scripts/build.mjs              → build.ts (선택적)
```

### 3.2 파일 변환 패턴

#### 패턴 A: 유틸리티 함수
```typescript
// Before (.mjs)
export function imgb64(url) {
  // ...
}

// After (.ts)
export function imgb64(url: string): string {
  // ...
}
```

#### 패턴 B: 플러그인 함수
```typescript
// Before (.mjs)
export default async function({login, q, data, graphql, rest, ...}, conf) {
  // ...
  return {computed: result}
}

// After (.ts)
import type { PluginContext, PluginConfig } from "../../types/index.ts"

export default async function plugin(
  {login, q, data, graphql, rest}: PluginContext,
  conf: PluginConfig
): Promise<{ computed: any }> {
  // ...
  return {computed: result}
}
```

#### 패턴 C: 동적 import (8개 파일)
```typescript
// Before (.mjs)
const module = (await import("./path/index.mjs")).default

// After (.ts)
const module = (await import("./path/index.ts")).default
```

**동적 import 사용 파일**:
1. `source/app/metrics/setup.mjs` — 플러그인/템플릿 동적 로드
2. `source/app/metrics/utils.mjs` — gifencoder
3. `source/app/metrics/index.mjs` — libxmljs2
4. `source/app/action/index.mjs` — utils
5. `source/plugins/stargazers/index.mjs` — worldmap
6. `source/plugins/languages/analyzer/cli.mjs` — setup, utils

---

## Phase 4: 코어 엔진 변환 (5개 파일)

### 4.1 변환 파일 목록

| 파일 | 복잡도 | 동적 import | 비고 |
|---|---|---|---|
| `app/metrics/utils.mjs` | 중 | 있음 (gifencoder) | 유틸리티 함수 집합 |
| `app/metrics/metadata.mjs` | 중 | 없음 | YAML 파싱, 플러그인 등록 |
| `app/metrics/presets.mjs` | 낮 | 없음 | 프리셋 관리 |
| `app/metrics/setup.mjs` | 높 | 있음 (플러그인/템플릿) | 설정 로드, 동적 import |
| `app/metrics/index.mjs` | 높 | 있음 (libxmljs2) | 렌더링 엔진 |

### 4.2 주의사항

1. **import.meta.url**: `setup.mjs`에서 `url.pathToFileURL()`과 함께 사용
2. **동적 import 경로**: `.mjs` → `.ts` 확장자 변경 필요
3. **process.env**: 타입 정의 필요 (`@types/node` 포함)

---

## Phase 5: 플러그인 변환 (49개)

### 5.1 일괄 변환 스크립트

```bash
# .mjs → .ts 확장자 변경
for f in source/plugins/*/index.mjs source/plugins/community/*/index.mjs; do
  mv "$f" "${f%.mjs}.ts"
done
```

### 5.2 공통 변환 패턴

모든 플러그인은 동일한 인터페이스를 따르므로, 타입 정의를 한 번만 추가:

```typescript
// 각 플러그인 상단에 추가
import type { PluginContext, PluginConfig } from "../../../types/index.ts"
```

### 5.3 특수 케이스

| 플러그인 | 특수 처리 |
|---|---|
| `languages/` | analyzer 하위 디렉토리 (4개 서브파일) |
| `achievements/` | list 하위 디렉토리 (3개 서브파일) |
| `stargazers/` | worldmap 동적 import |
| `community/splatoon/` | 이미 .ts 파일 2개 포함 |

### 5.4 플러그인 인터페이스 분석 결과

플러그인 아키텍처 분석 완료. 핵심 발견사항:

#### 플러그인 호출 패턴

**표준 호출** (대부분의 플러그인):
```javascript
// source/app/metrics/index.mjs 에서 호출
data.plugins[name] = await imports.plugins[name](
  {login, q, imports, data, computed, rest, graphql, queries, account},
  {extras, sandbox: conf.settings?.sandbox ?? false, ...plugins[name]}
)
```

**플러그인별 시그니처 차이**:

| 플러그인 | 1번째 인자 | 2번째 인자 | 반환값 |
|---|---|---|---|
| `base` | `{login, graphql, rest, data, q, queries, imports, callbacks}` | `conf` | `{}` (data 직접 변형) |
| `core` | `{login, q}` | `{conf, data, rest, graphql, plugins, queries, account, convert, template, callbacks}` | `null` (data.computed에 저장) |
| `languages` | `{login, data, imports, q, rest, account}` | `{enabled, extras}` | `languages` 객체 또는 `null` |
| `activity` | `{login, data, rest, q, account, imports}` | `{enabled, markdown, extras}` | `{timestamps, events}` 또는 `null` |

#### 특수 플러그인 타입 정의

```typescript
// Base 플러그인 (data 직접 변형)
export type BasePlugin = (
  context: Omit<PluginContext, 'account' | 'computed' | 'plugins'> 
    & { graphql: GitHubGraphQL; callbacks?: PluginCallbacks },
  conf: MetricsConfig
) => Promise<{}>

// Core 플러그인 (전역 설정, data.computed 저장)
export type CorePlugin = (
  context: Pick<PluginContext, 'login' | 'q'>,
  config: {
    conf: MetricsConfig; data: MetricsData; rest: GitHubREST; graphql: GitHubGraphQL
    plugins: Record<string, PluginFunction>; queries: Record<string, any>
    account: string; convert?: string | null; template: string
    callbacks?: PluginCallbacks
  },
  extras: { pending: Promise<any>[]; imports: PluginImports }
) => Promise<null>

// 표준 플러그인 (결과 반환)
export type StandardPlugin = (
  context: Pick<PluginContext, 'login' | 'data' | 'imports' | 'q' | 'rest' | 'account'>,
  options: { enabled?: boolean; extras?: boolean | string[]; [key: string]: any }
) => Promise<any>
```

#### 테스트 구조

- **테스트 케이스**: YAML 파일 (`tests/cases/*.yml`)
- **목 데이터**: `tests/mocks/` 디렉토리 (axios 인터셉터 기반)
- **실행 모드**: GitHub Action, web instance, web instance placeholder
- **faker.js**: 테스트 데이터 생성에 사용

---

## Phase 6: 템플릿 변환 (5개)

### 6.1 변환 파일

| 템플릿 | 파일 |
|---|---|
| classic | `source/templates/classic/template.mjs` |
| terminal | `source/templates/terminal/template.mjs` |
| repository | `source/templates/repository/template.mjs` |
| markdown | `source/templates/markdown/template.mjs` |
| modern-terminal | `source/templates/modern-terminal/template.mjs` |

### 6.2 템플릿 인터페이스

```typescript
export default async function template(
  context: { login: string; q: Record<string, any> },
  config: {
    conf: MetricsConfig
    data: MetricsData
    rest: RestClient
    graphql: GraphQLClient
    plugins: Record<string, PluginFunction>
    queries: Record<string, any>
    account?: string
    convert?: string | null
    template: string
  },
  extras: {
    pending: Promise<any>[]
    imports: PluginImports
  }
): Promise<void>
```

---

## Phase 7: 엔트리 포인트 변환

### 7.1 GitHub Action (`source/app/action/index.mjs`)

**특수 처리**:
- Dockerfile ENTRYPOINT 경로 업데이트
- `import.meta.url` 사용 부분 처리
- child_process 타입 정의

**Dockerfile 변경**:
```dockerfile
# Before
ENTRYPOINT node /metrics/source/app/action/index.mjs

# After (빌드 후 dist 사용)
ENTRYPOINT node /metrics/dist/app/action/index.mjs

# Or (tsx 직접 실행)
ENTRYPOINT npx tsx /metrics/source/app/action/index.ts
```

### 7.2 Web Server (`source/app/web/`)

**변환 파일**:
- `index.mjs` → `index.ts`
- `instance.mjs` → `instance.ts`

**Express 타입**:
```typescript
import express, { Request, Response, NextFunction } from "express"
```

---

## Phase 8: 테스트 마이그레이션

### 8.1 Jest 설정 변경

**파일**: `jest.config.ts` (신규)
```typescript
import type { Config } from "jest"

const config: Config = {
  testEnvironment: "node",
  testTimeout: 60000,
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.ts$": "$1",
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true }],
  },
}

export default config
```

### 8.2 테스트 파일 변환

기존 테스트는 `.js`로 유지하거나, 변환 가능:
- `tests/metrics.test.js` → `tests/metrics.test.ts`
- `tests/mocks/` 디렉토리 유지

---

## Phase 9: CI/CD 업데이트

### 9.1 GitHub Actions 워크플로우

**`.github/workflows/test.yml` 변경**:
```yaml
- name: Type check
  run: npm run typecheck

- name: Lint
  run: npm run linter

- name: Test
  run: npm test
```

### 9.2 Dockerfile 변경

```dockerfile
# TypeScript 빌드 단계 추가
RUN npm ci
RUN npm run typecheck
RUN npm run build
```

---

## Phase 10: 검증 체크리스트

| 검증 항목 | 명령어 | 기대 결과 |
|---|---|---|
| 타입 체크 | `npm run typecheck` | 에러 없음 |
| 빌드 | `npm run build` | dist/ 생성 |
| 린트 | `npm run linter` | 에러 없음 |
| 테스트 | `npm test` | 전체 통과 |
| 서버 기동 | `npm start` | 정상 동작 |
| 개발 모드 | `npm run dev` | 핫 리로드 동작 |
| Docker 빌드 | `docker build .` | 이미지 생성 |
| GitHub Action | 테스트 워크플로우 | 정상 실행 |

---

## 예상 작업량

| Phase | 파일 수 | 예상 시간 | 난이도 |
|---|---|---|---|
| Phase 0: 사전 준비 | - | 30분 | ⬜⬜⬜⬜⬜ |
| Phase 1: 인프라 | 설정 5개 | 1시간 | ⬛⬛⬜⬜⬜ |
| Phase 2: 타입 정의 | 1개 | 1시간 | ⬛⬛⬛⬜⬜ |
| Phase 3: 코어 엔진 | 5개 | 2시간 | ⬛⬛⬛⬛⬜ |
| Phase 4: 플러그인 | 49개 | 3시간 | ⬛⬛⬛⬜⬜ |
| Phase 5: 템플릿 | 5개 | 1시간 | ⬛⬛⬜⬜⬜ |
| Phase 6: 엔트리 포인트 | 3개 | 1시간 | ⬛⬛⬛⬜⬜ |
| Phase 7: 테스트 | 3개 | 1시간 | ⬛⬛⬜⬜⬜ |
| Phase 8: CI/CD | 3개 | 30분 | ⬛⬛⬜⬜⬜ |
| Phase 9: 검증 | - | 1시간 | ⬛⬛⬜⬜⬜ |
| **합계** | **~78개** | **~12시간** | - |

---

## 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 동적 import 경로 깨짐 | 높 | import 경로 일괄 변경 스크립트 |
| 외부 라이브러리 타입 부재 | 중 | `@types/*` 패키지 설치 또는 `any` 사용 |
| Docker 빌드 실패 | 중 | ENTRYPOINT 경로 수정, 빌드 단계 추가 |
| 테스트 깨짐 | 중 | ts-jest 설정, mock 타입 추가 |
| 플러그인 동적 로드 실패 | 높 | `import.meta.url` + `pathToFileURL` 패턴 유지 |

---

## 롤백 계획

마이그레이션 중 문제 발생 시:
1. `git stash` 또는 브랜치 삭제
2. 원본 브랜치로 복귀
3. 부분 변환된 파일을 수동으로 복원

---

## 부록 A: Import/Export 패턴 분석 결과

### Import 패턴 (73개 파일 분석)

| 패턴 | 파일 수 | 예시 |
|---|---|---|
| Named imports | 13개 | `import { marked } from "marked"` |
| Default imports | 19개 | `import axios from "axios"` |
| Namespace imports | 2개 | `import * as d3 from "d3"` |
| Dynamic imports | 7개 | `await import("libxmljs2")` |
| Side-effect imports | 0개 | - |

### Export 패턴

| 패턴 | 파일 수 | 비고 |
|---|---|---|
| Default export (async function) | 73개 | 모든 플러그인/템플릿 |
| Named exports | 1개 | `utils.mjs`만 (20+ exports) |
| Re-exports | 0개 | - |

### 의존성 분석

**핵심 모듈 (다른 파일에서 많이 참조)**:
1. `utils.mjs` — 15+ 파일에서 import
2. `index.mjs` — 5 파일에서 import
3. `setup.mjs` — 5 파일에서 import
4. `metadata.mjs` — 5 파일에서 import
5. `presets.mjs` — 4 파일에서 import

**순환 의존성**: ❌ 발견되지 않음 (의존성 흐름이 단방향)

### 동적 import 상세 (마이그레이션 주의)

| 파일 | 라인 | 대상 | 용도 |
|---|---|---|---|
| `setup.mjs` | 162 | 템플릿 (동적 경로) | `url.pathToFileURL()` |
| `setup.mjs` | 239 | 플러그인 (동적 경로) | `url.pathToFileURL()` |
| `index.mjs` | ~214 | libxmljs2 | SVG 검증 |
| `utils.mjs` | ~768 | gifencoder | GIF 생성 |
| `action/index.mjs` | ~443 | utils.mjs | fallback |
| `stargazers/index.mjs` | ~80 | worldmap | 서브모듈 |
| `languages/analyzer/cli.mjs` | ~20, ~49 | setup, utils | CLI 도구 |

### import.meta.url 사용 위치 (8개)

| 파일 | 용도 |
|---|---|
| `setup.mjs` (2곳) | `__metrics` 경로 계산 |
| `metadata.mjs` | `__metrics` 경로 계산 |
| `utils.mjs` | CSS 파일 로드 |
| `stargazers/worldmap/index.mjs` | GeoJSON 파일 로드 |
| `languages/index.mjs` | colorsets.json 로드 |
| `community/splatoon/index.mjs` (3곳) | 프로필/데이터 파일 로드 |

**해결 방법**: `__module()` 유틸리티 함수 활용 (utils.mjs에 이미 구현됨)
