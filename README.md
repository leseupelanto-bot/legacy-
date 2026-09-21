# legacy- Mastodon

Railway deployment wrapper for the Whippy Edition of Mastodon.

Upstream source:
- https://github.com/whippyshou/mastodon
- branch/tag: `v4.3.1+whippy`

This repository does not vendor the whole Mastodon source tree. The Docker build clones the upstream Whippy Edition source and builds it into the deployment image.

## Services

The Railway project is intended to run:
- web
- streaming
- sidekiq
- PostgreSQL
- Redis

Whippy Edition and Mastodon are distributed under AGPLv3. Upstream source and license notices remain available from the upstream repository.
