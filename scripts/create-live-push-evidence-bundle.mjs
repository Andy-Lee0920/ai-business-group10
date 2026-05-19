#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = parseArgs(process.argv.slice(2));
const folderName = `${args.platform}-live-push-evidence`;
const bundleDir = join(args.outDir, folderName);
mkdirSync(bundleDir, { recursive: true });
writeFileSync(join(bundleDir, 'README.md'), renderReadme(args.platform));
writeFileSync(join(bundleDir, 'evidence.json'), '{\n  "replace": "paste npm run smoke:push:evidence JSON output here"\n}\n');

console.log(`Created ${folderName} at ${bundleDir}`);

function renderReadme(platform) {
  const isIos = platform === 'ios';
  const issue = isIos ? '#383' : '#382';
  const installLine = isIos ? '- `ios-homescreen.png` — Home Screen install / standalone launch evidence\n' : '';
  const closureCommand = isIos
    ? 'npm run verify:push:closure -- --platform ios --evidence-json evidence.json --ios-install-media ios-homescreen.png --l3-media l3-notification.png --l4-media l4-home.png --l6-media l6-lockscreen.mov'
    : 'npm run verify:push:closure -- --platform android --evidence-json evidence.json --l3-media l3-notification.png --l4-media l4-home.png --l6-media l6-lockscreen.mov';
  const commentCommand = `npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler --format github-comment --platform ${platform}`;
  const finalCompletionCommand = [
    'npm run verify:mvp:complete -- \\',
    '  --android-evidence-json android-live-push-evidence/evidence.json \\',
    '  --android-l3-media android-live-push-evidence/l3-notification.png \\',
    '  --android-l4-media android-live-push-evidence/l4-home.png \\',
    '  --android-l6-media android-live-push-evidence/l6-lockscreen.mov \\',
    '  --ios-evidence-json ios-live-push-evidence/evidence.json \\',
    '  --ios-install-media ios-live-push-evidence/ios-homescreen.png \\',
    '  --ios-l3-media ios-live-push-evidence/l3-notification.png \\',
    '  --ios-l4-media ios-live-push-evidence/l4-home.png \\',
    '  --ios-l6-media ios-live-push-evidence/l6-lockscreen.mov',
  ].join('\n');

  return `# Fevio ${platform.toUpperCase()} live push evidence bundle

Do not close ${issue} until every required file below exists, the closure guard passes, and the generated GitHub comment is posted with media attached.

## Required files

- \`evidence.json\` — JSON output from \`npm run smoke:push:evidence\`
${installLine}- \`l3-notification.png\` — OS notification receipt/tray screenshot
- \`l4-home.png\` — notification tap-through to /home screenshot
- \`l6-lockscreen.mov\` — background or lock-screen delivery video/screenshot

## Commands

1. Production prerequisite smoke:

\`\`\`bash
npm run smoke:pwa:production
\`\`\`

2. Prepare a synthetic card if needed:

\`\`\`bash
npm run smoke:push:prepare -- --user-id <user-id> --offset-minutes 15
\`\`\`

3. Collect masked DB evidence:

\`\`\`bash
npm run smoke:push:evidence -- --user-id <user-id> --card-id <card-id> --rerun-scheduler > evidence.json
\`\`\`

4. Generate the GitHub comment after media files are present:

\`\`\`bash
${commentCommand}
\`\`\`

5. Verify the closure bundle:

\`\`\`bash
${closureCommand}
\`\`\`

6. Verify final MVP completion after both Android and iOS bundles exist:

\`\`\`bash
${finalCompletionCommand}
\`\`\`

7. Cleanup only the synthetic smoke card after evidence is posted:

\`\`\`bash
npm run smoke:push:archive -- --card-id <card-id>
\`\`\`
`;
}

function parseArgs(argv) {
  const parsed = { platform: 'android', outDir: 'tmp/live-push-evidence' };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--platform' && next && ['android', 'ios'].includes(next)) { parsed.platform = next; index += 1; continue; }
    if (arg === '--out-dir' && next) { parsed.outDir = next; index += 1; continue; }
    fail(`Unknown or incomplete argument: ${arg}`);
  }
  return parsed;
}

function fail(message) {
  console.error(`create-live-push-evidence-bundle: ${message}`);
  process.exit(1);
}
