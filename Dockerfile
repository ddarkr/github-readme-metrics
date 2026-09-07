# Base image
FROM node:24-bookworm-slim

# Copy repository
COPY . /metrics
WORKDIR /metrics

# Use the system browser during installation and rendering.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_BROWSER_PATH=/usr/bin/chromium

# Setup
RUN chmod +x /metrics/source/app/action/index.mjs \
  # Install Chromium from Debian for both amd64 and arm64.
  && apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
  # Install deno for miscellaneous scripts
  && apt-get install -y curl unzip \
  && curl -fsSL https://deno.land/x/install/install.sh | DENO_INSTALL=/usr/local sh \
  # Install ruby to support github licensed gem
  && apt-get install -y ruby-full git g++ cmake pkg-config libssl-dev \
  && gem install licensed \
  # Install python for node-gyp
  && apt-get install -y python3 \
  # Clean apt/lists
  && rm -rf /var/lib/apt/lists/* \
  # Install node modules and rebuild indexes
  && npm ci \
  && npm run build


# Execute GitHub action
ENTRYPOINT node /metrics/source/app/action/index.mjs
