import { createMapperServer } from './server.js';

async function main(): Promise<void> {
  const port = Number(process.env.MAPPER_PORT ?? 3109);
  const host = process.env.MAPPER_HOST ?? '0.0.0.0';

  const server = createMapperServer({ port, host });

  try {
    const address = await server.listen({ port, host });
    console.log(`[church-3d-mapper] Visual 3D venue editor listening at ${address}`);
    console.log(`[church-3d-mapper] Open your browser to start mapping church sanctuaries.`);
  } catch (err) {
    console.error('[church-3d-mapper] Failed to start server:', err);
    process.exit(1);
  }

  const shutdown = async () => {
    console.log('[church-3d-mapper] Shutting down...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[church-3d-mapper] Fatal error:', err);
  process.exit(1);
});
