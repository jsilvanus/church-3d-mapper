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
  /** pispace PISPACE_EDIT_KEY, sent as a Bearer token on push */
  editKey?: string | undefined;
  /** Path to default venue file, e.g. from PISPACE_VENUE_FILE or VENUE_FILE */
  venueFile?: string | undefined;
}

export function createMapperServer(options: ServerOptions = {}): FastifyInstance {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile();
    } catch {
      // .env is optional
    }
  }

  const app = fastify({ logger: false });
  const pispaceUrl = options.pispaceUrl ?? process.env.PISPACE_URL ?? 'http://127.0.0.1:3203';
  const editKey = options.editKey ?? process.env.PISPACE_EDIT_KEY?.trim() ?? '';
  const configuredVenueFile = options.venueFile ?? process.env.PISPACE_VENUE_FILE ?? process.env.VENUE_FILE;

  const webDir = path.resolve('src/web');
  const threeDir = path.resolve('node_modules/three');
  const modelsDir = path.resolve('models');

  // Serve Three.js vendor files offline
  if (fs.existsSync(threeDir)) {
    app.register(fastifyStatic, {
      root: threeDir,
      prefix: '/vendor/three/',
      decorateReply: false
    });
  }

  // Serve 3D mesh model assets (e.g. photogrammetry scan, occluders)
  if (fs.existsSync(modelsDir)) {
    app.register(fastifyStatic, {
      root: modelsDir,
      prefix: '/models/',
      decorateReply: false
    });
  }

  // Local venue folder: the venue JSON and its meshes stay in a private checkout next to this
  // repo (e.g. ../<site>/apps/pispace). The browser keeps the path in localStorage and passes it
  // on each request. Only requests from this machine, and only .json/.glb/.gltf files.
  const isLoopback = (ip: string): boolean => ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  const localFile = (venuePath: unknown, rel?: unknown): string | { code: number; error: string } => {
    if (typeof venuePath !== 'string' || !venuePath.trim()) return { code: 400, error: 'venue path is required' };
    const venueFile = path.resolve(venuePath.trim());
    if (path.extname(venueFile).toLowerCase() !== '.json') return { code: 400, error: 'venue path must be a .json file' };
    if (rel === undefined) return venueFile;
    if (typeof rel !== 'string' || !rel) return { code: 400, error: 'file is required' };
    const dir = path.dirname(venueFile);
    const target = path.resolve(dir, rel.replace(/^\/+/, ''));
    if (target !== dir && !target.startsWith(dir + path.sep)) return { code: 400, error: 'file must be inside the venue folder' };
    if (!['.glb', '.gltf', '.json'].includes(path.extname(target).toLowerCase())) return { code: 400, error: 'only .glb, .gltf and .json files' };
    return target;
  };
  const MIME: Record<string, string> = { '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.json': 'application/json' };

  app.get<{ Querystring: { venue?: string; file?: string } }>('/api/local/file', async (req, reply) => {
    if (!isLoopback(req.ip)) return reply.code(403).send({ error: 'local files are only served to this machine' });
    const target = localFile(req.query.venue, req.query.file ?? path.basename(String(req.query.venue ?? '')));
    if (typeof target !== 'string') return reply.code(target.code).send({ error: target.error });
    if (!fs.existsSync(target)) return reply.code(404).send({ error: `not found: ${target}` });
    reply.header('Content-Type', MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream');
    return reply.send(fs.createReadStream(target));
  });

  app.put<{ Querystring: { venue?: string }; Body: unknown }>('/api/local/venue', async (req, reply) => {
    if (!isLoopback(req.ip)) return reply.code(403).send({ error: 'local files are only written from this machine' });
    const target = localFile(req.query.venue);
    if (typeof target !== 'string') return reply.code(target.code).send({ error: target.error });
    if (!fs.existsSync(path.dirname(target))) return reply.code(404).send({ error: 'venue folder does not exist' });
    const result = validateVenueModel(req.body);
    if (!result.valid) return reply.code(400).send({ error: 'invalid venue', issues: result.issues });
    fs.writeFileSync(target, JSON.stringify(req.body, null, 2) + '\n');
    return { ok: true, path: target };
  });

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

  const resolveDefaultVenue = (): { venuePath: string; venue: unknown } | null => {
    const candidates = [
      configuredVenueFile,
      path.resolve('../keskuskirkko/apps/pispace/keskuskirkko-venue.json'),
      path.resolve('venues/keskuskirkko.json'),
    ].filter(Boolean) as string[];

    for (const cand of candidates) {
      const resolved = path.resolve(cand);
      if (fs.existsSync(resolved) && path.extname(resolved).toLowerCase() === '.json') {
        try {
          const content = fs.readFileSync(resolved, 'utf8');
          const venue = JSON.parse(content);
          return { venuePath: resolved, venue };
        } catch {
          // continue checking candidates
        }
      }
    }
    return null;
  };

  // Get default venue from .env or local site repo
  app.get('/api/default-venue', async (_req, reply) => {
    const def = resolveDefaultVenue();
    if (!def) {
      return reply.code(404).send({ error: 'No default venue file configured or found' });
    }
    return def;
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
        headers: {
          'Content-Type': 'application/json',
          ...(editKey ? { Authorization: `Bearer ${editKey}` } : {}),
        },
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

  // Switch the layout PiSpace uses (preflight or live during a service)
  app.post<{ Body: { layoutId?: unknown } }>('/api/pispace-layout', async (req, reply) => {
    const layoutId = req.body?.layoutId;
    if (typeof layoutId !== 'string' || !layoutId) return reply.code(400).send({ error: 'layoutId is required' });
    try {
      const res = await fetch(`${pispaceUrl.replace(/\/+$/, '')}/api/v1/venue/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(editKey ? { Authorization: `Bearer ${editKey}` } : {}) },
        body: JSON.stringify({ layoutId }),
      });
      const text = await res.text();
      if (!res.ok) return reply.code(res.status).send({ error: `PiSpace rejected: ${text}` });
      return { ok: true, active: layoutId };
    } catch (err: any) {
      return reply.code(502).send({ error: `Failed to connect to PiSpace: ${err.message}` });
    }
  });

  return app;
}
