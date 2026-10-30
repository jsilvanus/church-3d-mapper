#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0] ?? 'help';

  switch (command) {
    case 'editor':
    case 'serve': {
      const port = flags.port ?? process.env.MAPPER_PORT ?? '3109';
      console.log(`Starting church-3d-mapper visual editor on port ${port}...`);
      const tsx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const child = spawn(tsx, ['tsx', path.join(rootDir, 'src/main.ts')], {
        stdio: 'inherit',
        env: { ...process.env, MAPPER_PORT: port }
      });
      child.on('exit', (code) => process.exit(code ?? 0));
      break;
    }

    case 'validate': {
      const filePath = positional[1];
      if (!filePath) {
        console.error('Usage: church-3d-mapper validate <path-to-venue.json>');
        process.exit(1);
      }
      try {
        const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
        const json = JSON.parse(raw);
        
        // Dynamically import compiled validator
        const validatorPath = fs.existsSync(path.join(rootDir, 'dist/validator.js'))
          ? `file://${path.join(rootDir, 'dist/validator.js').replace(/\\/g, '/')}`
          : `file://${path.join(rootDir, 'src/validator.js').replace(/\\/g, '/')}`;
        const { validateVenueModel } = await import(validatorPath);
        const res = validateVenueModel(json);

        if (res.valid) {
          console.log(`✓ Venue model "${json.name}" is valid!`);
          if (res.issues.length > 0) {
            console.log('\nWarnings:');
            for (const issue of res.issues) {
              console.log(`  ⚠ [${issue.path}] ${issue.message}`);
            }
          }
        } else {
          console.error(`✗ Validation failed with ${res.issues.length} issue(s):`);
          for (const issue of res.issues) {
            console.error(`  ${issue.severity === 'error' ? '❌' : '⚠'} [${issue.path}] ${issue.message}`);
          }
          process.exit(1);
        }
      } catch (err) {
        console.error(`Failed to read/parse ${filePath}: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'init': {
      const name = positional[1] ?? 'New Sanctuary';
      const outFile = flags.out ?? 'venue.json';
      const templatePath = fs.existsSync(path.join(rootDir, 'dist/templates/standard-hall.js'))
        ? `file://${path.join(rootDir, 'dist/templates/standard-hall.js').replace(/\\/g, '/')}`
        : `file://${path.join(rootDir, 'src/templates/standard-hall.js').replace(/\\/g, '/')}`;
      const { createStandardHallTemplate } = await import(templatePath);
      const model = createStandardHallTemplate(name);
      fs.writeFileSync(path.resolve(outFile), JSON.stringify(model, null, 2), 'utf8');
      console.log(`✓ Initialized new venue model template at ${outFile}`);
      break;
    }

    case 'push': {
      const filePath = positional[1];
      const pispaceUrl = flags['pispace-url'] ?? process.env.PISPACE_URL ?? 'http://127.0.0.1:3108';
      if (!filePath) {
        console.error('Usage: church-3d-mapper push <path-to-venue.json> [--pispace-url http://127.0.0.1:3108]');
        process.exit(1);
      }
      try {
        const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
        const json = JSON.parse(raw);
        const targetUrl = `${pispaceUrl.replace(/\/+$/, '')}/api/v1/venue`;
        const res = await fetch(targetUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (res.ok) {
          console.log(`✓ Successfully pushed venue "${json.name}" to PiSpace at ${pispaceUrl}`);
        } else {
          const err = await res.text();
          console.error(`✗ PiSpace returned error HTTP ${res.status}: ${err}`);
          process.exit(1);
        }
      } catch (err) {
        console.error(`✗ Failed to connect to PiSpace: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'help':
    default:
      console.log(`
church-3d-mapper - Visual 3D venue authoring tool for PiSpace

Usage:
  church-3d-mapper editor [--port 3109]               Launch interactive web editor
  church-3d-mapper validate <venue.json>              Validate venue JSON model
  church-3d-mapper init <name> [--out <file.json>]    Create standard template model
  church-3d-mapper push <venue.json> [--pispace-url]  Push venue model to PiSpace
      `);
      break;
  }
}

main();
