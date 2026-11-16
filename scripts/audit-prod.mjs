// CI: `yarn audit --json --groups dependencies | node scripts/audit-prod.mjs`
// Yarn 1 không audit riêng từng workspace → lọc theo đường dẫn ("web>next>sharp").
// Fail khi có lỗ hổng critical trong app chạy production (api, web); high chỉ in cảnh báo.
// apps/mobile (Expo mẫu, chưa phát triển) bỏ qua.
import { readFileSync } from 'node:fs';

const PROD_WORKSPACES = ['api', 'web'];

/**
 * Đã xem xét, không khai thác được trong dự án (vẫn in ra, không làm đỏ CI). Ghi lý do khi thêm.
 * shortcut: nâng maplibre-gl lên 6.x (đổi major) khi có thời gian kiểm tra lại bản đồ.
 */
const REVIEWED = {
  // XSS qua DOM.sanitize: chỉ chạy với Popup.setHTML / attribution của style — web chỉ dùng
  // setText / setDOMContent và style tự khai báo (vietnamMapStyle.ts)
  'maplibre-gl': 'không dùng setHTML',
};

const advisories = new Map();
for (const line of readFileSync(0, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  const entry = JSON.parse(line);
  if (entry.type !== 'auditAdvisory') continue;
  const { advisory, resolution } = entry.data;
  const workspace = resolution.path.split('>')[0];
  if (!PROD_WORKSPACES.includes(workspace)) continue;
  const key = `${advisory.module_name}@${advisory.id}`;
  if (!advisories.has(key)) {
    advisories.set(key, { ...advisory, path: resolution.path });
  }
}

const list = [...advisories.values()];
const print = (severity) =>
  list
    .filter((item) => item.severity === severity)
    .forEach((item) =>
      console.log(
        `${severity.toUpperCase()} ${item.module_name} (${item.path}) — ${item.title} → sửa: ${item.patched_versions}` +
          (REVIEWED[item.module_name] ? ` [đã xem xét: ${REVIEWED[item.module_name]}]` : ''),
      ),
    );
print('critical');
print('high');

const critical = list.filter(
  (item) => item.severity === 'critical' && !REVIEWED[item.module_name],
).length;
console.log(
  `\napi/web: ${critical} critical, ${list.filter((item) => item.severity === 'high').length} high`,
);
process.exit(critical > 0 ? 1 : 0);
