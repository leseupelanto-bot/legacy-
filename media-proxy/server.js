import http from 'node:http';
import { pipeline } from 'node:stream/promises';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const port = Number(process.env.PORT || 3000);
const bucket = process.env.S3_BUCKET;
const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || 'auto';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

for (const [name, value] of Object.entries({ bucket, endpoint, accessKeyId, secretAccessKey })) {
  if (!value) {
    throw new Error(`Missing required environment variable for ${name}`);
  }
}

const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: false,
  credentials: { accessKeyId, secretAccessKey },
});

const commonHeaders = {
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Content-Length, Content-Range, ETag, Last-Modified',
};

function send(res, status, body = '') {
  res.writeHead(status, {
    ...commonHeaders,
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(body);
}

function keyFromPath(pathname) {
  const raw = pathname.replace(/^\/+/, '');
  if (!raw) return '';
  let decoded;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const parts = decoded.split('/');
  if (parts.some((part) => part === '..' || part === '.')) return null;
  return decoded;
}

function objectHeaders(meta, isRange = false) {
  const headers = {
    ...commonHeaders,
    'cache-control': meta.CacheControl || 'public, max-age=31536000, immutable',
    'accept-ranges': 'bytes',
  };

  if (meta.ContentType) headers['content-type'] = meta.ContentType;
  if (meta.ContentLength != null) headers['content-length'] = String(meta.ContentLength);
  if (meta.ETag) headers.etag = meta.ETag;
  if (meta.LastModified) headers['last-modified'] = meta.LastModified.toUTCString();
  if (meta.ContentDisposition) headers['content-disposition'] = meta.ContentDisposition;
  if (isRange && meta.ContentRange) headers['content-range'] = meta.ContentRange;

  return headers;
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/__health') {
    send(res, 200, 'ok');
    return;
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
    send(res, 405, 'method not allowed');
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      ...commonHeaders,
      'access-control-allow-methods': 'GET, HEAD, OPTIONS',
      'access-control-allow-headers': 'Range, If-None-Match, If-Modified-Since',
      'access-control-max-age': '86400',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const key = keyFromPath(url.pathname);

  if (key === null) {
    send(res, 400, 'invalid key');
    return;
  }
  if (!key) {
    send(res, 404, 'not found');
    return;
  }

  try {
    if (req.method === 'HEAD') {
      const out = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      res.writeHead(200, objectHeaders(out));
      res.end();
      return;
    }

    const range = req.headers.range;
    const out = await s3.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(range ? { Range: range } : {}),
    }));

    const status = range && out.ContentRange ? 206 : 200;
    res.writeHead(status, objectHeaders(out, status === 206));

    if (!out.Body) {
      res.end();
      return;
    }

    await pipeline(out.Body, res);
  } catch (error) {
    const statusCode = error?.$metadata?.httpStatusCode;
    if (statusCode === 404 || error?.name === 'NoSuchKey' || error?.name === 'NotFound') {
      send(res, 404, 'not found');
      return;
    }

    if (statusCode === 416) {
      send(res, 416, 'range not satisfiable');
      return;
    }

    console.error('media proxy error', error);
    send(res, 502, 'media backend error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`mastodon media proxy listening on ${port}`);
});
