const fs = require('fs');
const path = require('path');

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

module.exports = { logAction };
