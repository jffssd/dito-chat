# Go Backend

Simple Go backend that broadcasts incoming messages to all connected clients using Websockets. Also, persists the last 1000 messages in Redis and exposes a json API to retrieve it.

## Environment Variables

You must setup these env vars to correctly build and run the backend:

- `ALLOWED_ORIGIN`: allows requests from this origin. Ex: http://localhost:3000
- `REDIS_ADDR`: connection string to Redis. Ex: localhost:6379
