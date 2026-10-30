import fs from 'node:fs';
import path from 'node:path';
import fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { validateVenueModel } from './validator.js';
import { createStandardHallTemplate } from './templates/standard-hall.js';

export interface ServerOptions {
  port?: number | undefined;
  host?: string | undefined;
  pispaceUrl?: string | undefined;
}

export function createMapperServer(options: ServerOptions = {}): FastifyInstance {
  const app = fastify({ logger: false });
  const pispaceUrl = options.pispaceUrl ?? process.env.PISPACE_URL ?? 'http://127.0.0.1:3108';

  const webDir = path.resolve('src/web');
  const threeDir = path.resolve('node_modules/three');

  // Serve Three.js vendor files offline
  if (fs.existsSync(threeDir)) {
    app.register(fastifyStatic, {
      root: threeDir,
      prefix: '/vendor/three/',
      decorateReply: false
    });
  }

  // Serve static UI assets
  app.get('/', async (_req, reply) => {
    reply.header('Content-Type', 'text/html');
    return fs.readFileSync(path.join(webDir, 'index.html'), 'utf8');
  });

  app.get('/style.css', async (_req, reply) => {
    reply.header('Content-Type', 'text/css');
    return fs.readFileSync(path.join(webDir, 'style.css'), 'utf8');
  });

  app.get('/app.js', async (_req, reply) => {
    reply.header('Content-Type', 'application/javascript');
    return fs.readFileSync(path.join(webDir, 'app.js'), 'utf8');
  });

  // Health check
  app.get('/health', async () => {
    return { ok: true, service: 'church-3d-mapper', version: '0.1.0' };
  });

  // Validate a venue model
  app.post<{ Body: unknown }>('/api/validate', async (req) => {
    return validateVenueModel(req.body);
  });

  // Get pre-built venue template
  app.get<{ Params: { name: string } }>('/api/templates/:name', async (req, reply) => {
    const { name } = req.params;
    if (name === 'standard-hall') {
      return createStandardHallTemplate();
    }
    return reply.code(404).send({ error: 'Template not found' });
  });

  // Fetch live scene snapshot from PiSpace
  app.get('/api/pispace-scene', async (_req, reply) => {
    try {
      const targetUrl = `${pispaceUrl.replace(/\/+$/, '')}/api/v1/scene`;
      const res = await fetch(targetUrl);
      if (!res.ok) {
        return reply.code(res.status).send({ error: `PiSpace returned ${res.status}` });
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      return reply.code(502).send({ error: `Failed to connect to PiSpace: ${err.message}` });
    }
  });

  // Triangulate 3D point via PiSpace
  app.post<{ Body: unknown }>('/api/triangulate', async (req, reply) => {
    try {
      const targetUrl = `${pispaceUrl.replace(/\/+$/, '')}/api/v1/triangulate`;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      if (!res.ok) {
        const text = await res.text();
        return reply.code(res.status).send({ error: `PiSpace triangulation failed: ${text}` });
      }

      const data = await res.json();
      return data;
    } catch (err: any) {
      return reply.code(502).send({ error: `Failed to connect to PiSpace: ${err.message}` });
    }
  });

  // Push directly to PiSpace
  app.post<{ Body: unknown }>('/api/push', async (req, reply) => {
    try {
      const targetUrl = `${pispaceUrl.replace(/\/+$/, '')}/api/v1/venue`;
      const res = await fetch(targetUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      if (!res.ok) {
        const text = await res.text();
        return reply.code(res.status).send({ error: `PiSpace rejected: ${text}` });
      }

      return { ok: true, message: 'Successfully pushed venue model to PiSpace' };
    } catch (err: any) {
      return reply.code(502).send({ error: `Failed to connect to PiSpace: ${err.message}` });
    }
  });

  return app;
}
