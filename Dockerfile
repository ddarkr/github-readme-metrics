FROM node:24-bookworm-slim

WORKDIR /metrics

# Use Debian Chromium for rendering instead of downloading Puppeteer's browser.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_BROWSER_PATH=/usr/bin/chromium

# Install runtime dependencies before installing Node modules.
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates curl unzip ruby-full fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf git g++ make xz-utils cmake pkg-config libssl-dev python3 \
  && curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=/usr/local sh \
  && gem install licensed \
  && rm -rf /var/lib/apt/lists/*

# Copy the lockfile first so dependency installation is cacheable and deterministic.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Tests and the action load fixtures from the repository, so retain the full source tree.
COPY . .

ENTRYPOINT ["node", "/metrics/source/app/action/index.mjs"]
