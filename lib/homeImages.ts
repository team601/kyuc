// Chỉ dùng trong server component (đọc thư mục public lúc render).
import fs from 'node:fs';
import path from 'node:path';

// Ảnh trang chủ được gọi theo tên, không kèm đuôi file. Thả file mới (webp/png/jpg) vào
// public/images/home với đúng tên là trang tự nhận; webp và png được ưu tiên hơn ảnh jpg tạm.
const PRIORITY = ['.webp', '.png', '.jpg', '.jpeg', '.avif'];

export function getHomeImages(): Record<string, string> {
  const dir = path.join(process.cwd(), 'public', 'images', 'home');
  const map: Record<string, string> = {};
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return map;
  }
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!PRIORITY.includes(ext)) continue;
    const name = file.slice(0, -ext.length);
    const current = map[name];
    if (!current || PRIORITY.indexOf(ext) < PRIORITY.indexOf(path.extname(current))) {
      map[name] = `/images/home/${file}`;
    }
  }
  return map;
}
