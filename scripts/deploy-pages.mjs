// 部署 web/dist 到 GitHub Pages（gh-pages 分支）
// 前置：已运行 `npm run build:pages` 生成静态产物
// 用法：node scripts/deploy-pages.mjs
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNER = process.env.GH_OWNER || 'kolbyzhu5';
const REPO = process.env.GH_REPO || 'kefu-tax-risk-cockpit';
const REMOTE = `https://github.com/${OWNER}/${REPO}.git`;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'web', 'dist');

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('❌ 未找到 web/dist/index.html，请先运行 npm run build:pages');
  process.exit(1);
}

const tmp = mkdtempSync(path.join(tmpdir(), 'kefu-ghpages-'));
try {
  cpSync(dist, tmp, { recursive: true });
  writeFileSync(path.join(tmp, '.nojekyll'), ''); // 禁用 Jekyll 处理，确保静态资源原样发布

  const run = (cmd) => execSync(cmd, { stdio: 'inherit', cwd: tmp });
  run('git init -q -b gh-pages');
  run('git add -A');
  run(`git -c user.name="${OWNER}" -c user.email="${OWNER}@users.noreply.github.com" commit -q -m "deploy: GitHub Pages ${new Date().toISOString()}"`);
  run(`git remote add origin ${REMOTE}`);
  run('git push origin gh-pages --force');
  console.log(`\n✅ 已发布到 gh-pages 分支：https://${OWNER}.github.io/${REPO}/`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
