import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'audit.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function logAction(action, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    data,
  };
  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
}
export { logAction }; 