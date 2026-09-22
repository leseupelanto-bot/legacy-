# Favicon PNG-only redeploy trigger
# Legacy avatar/frontend redeploy trigger
# syntax=docker/dockerfile:1.4
ARG NODE_VERSION="20.6-bookworm-slim"
ARG WHIPPY_REF="v4.3.1+whippy"

FROM ghcr.io/moritzheiber/ruby-jemalloc:3.2.2-slim AS ruby

FROM node:${NODE_VERSION} AS build
ARG WHIPPY_REF
COPY --link --from=ruby /opt/ruby /opt/ruby
ENV DEBIAN_FRONTEND="noninteractive" PATH="${PATH}:/opt/ruby/bin"
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update && apt-get -yq dist-upgrade && \
    apt-get install -y --no-install-recommends \
      build-essential git libicu-dev libidn-dev libpq-dev libjemalloc-dev \
      zlib1g-dev libgdbm-dev libgmp-dev libssl-dev libyaml-0-2 ca-certificates \
      libreadline8 python3 shared-mime-info && \
    git clone --depth 1 --branch "${WHIPPY_REF}" https://github.com/whippyshou/mastodon.git /opt/mastodon

# Legacy custom themes:
# keep Whippy Edition functionality, replace only the visual theme layer.
COPY app/javascript/styles/legacy-light.scss /opt/mastodon/app/javascript/styles/legacy-light.scss
COPY app/javascript/styles/legacy-dark.scss /opt/mastodon/app/javascript/styles/legacy-dark.scss
COPY config/themes.yml /opt/mastodon/config/themes.yml
COPY config/locales/zz_legacy_ko.yml /opt/mastodon/config/locales/zz_legacy_ko.yml
COPY ["public/Legacy Light.png", "/opt/mastodon/app/javascript/images/legacy-light-bg.png"]
COPY ["public/Legacy Dark.png", "/opt/mastodon/app/javascript/images/legacy-dark-bg.png"]
COPY ["app/javascript/images/logos/Logo-Light.png", "/opt/mastodon/app/javascript/images/logos/Logo-Light.png"]
COPY ["app/javascript/images/logos/Logo-Dark.png", "/opt/mastodon/app/javascript/images/logos/Logo-Dark.png"]
COPY ["app/javascript/images/logos/Header-Logo-Light.png", "/opt/mastodon/app/javascript/images/logos/Header-Logo-Light.png"]
COPY ["app/javascript/images/logos/Header-Logo-Dark.png", "/opt/mastodon/app/javascript/images/logos/Header-Logo-Dark.png"]
COPY app/javascript/mastodon/components/logo.tsx /opt/mastodon/app/javascript/mastodon/components/logo.tsx
COPY ["app/javascript/images/avatars/legacy-raven.png", "/opt/mastodon/app/javascript/images/avatars/legacy-raven.png"]
COPY app/javascript/mastodon/components/avatar.tsx /opt/mastodon/app/javascript/mastodon/components/avatar.tsx
COPY app/javascript/types/resources.ts /opt/mastodon/app/javascript/types/resources.ts
COPY app/serializers/rest/account_serializer.rb /opt/mastodon/app/serializers/rest/account_serializer.rb
COPY app/serializers/initial_state_serializer.rb /opt/mastodon/app/serializers/initial_state_serializer.rb
COPY app/views/settings/profiles/show.html.haml /opt/mastodon/app/views/settings/profiles/show.html.haml
COPY app/views/layouts/application.html.haml /opt/mastodon/app/views/layouts/application.html.haml
COPY app/models/concerns/account_avatar.rb /opt/mastodon/app/models/concerns/account_avatar.rb
COPY public/ /tmp/legacy-public/
RUN cp -a /tmp/legacy-public/. /opt/mastodon/public/

WORKDIR /opt/mastodon
RUN bundle config set --local deployment 'true' && \
    bundle config set --local without 'development test' && \
    bundle config set silence_root_warning true && \
    bundle install -j"$(nproc)" && \
    yarn install --pure-lockfile --production --network-timeout 600000 && \
    yarn cache clean

FROM node:${NODE_VERSION}
ARG UID="991"
ARG GID="991"
COPY --link --from=ruby /opt/ruby /opt/ruby
ENV DEBIAN_FRONTEND="noninteractive" \
    PATH="${PATH}:/opt/ruby/bin:/opt/mastodon/bin" \
    RAILS_ENV="production" \
    NODE_ENV="production" \
    RAILS_SERVE_STATIC_FILES="true" \
    BIND="0.0.0.0"
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apt-get update && \
    echo "Etc/UTC" > /etc/localtime && \
    groupadd -g "${GID}" mastodon && \
    useradd -l -u "${UID}" -g "${GID}" -m -d /opt/mastodon mastodon && \
    apt-get -y --no-install-recommends install \
      whois wget procps libssl3 libpq5 imagemagick ffmpeg libjemalloc2 libicu72 \
      libidn12 libyaml-0-2 file ca-certificates tzdata libreadline8 tini && \
    ln -s /opt/mastodon /mastodon

COPY --chown=mastodon:mastodon --from=build /opt/mastodon /opt/mastodon

USER mastodon
WORKDIR /opt/mastodon
RUN OTP_SECRET=precompile_placeholder SECRET_KEY_BASE=precompile_placeholder rails assets:precompile

ENTRYPOINT ["/usr/bin/tini", "--"]
EXPOSE 3000 4000
