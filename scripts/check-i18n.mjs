import fs from 'fs';
import path from 'path';

function getFlatKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getFlatKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enPath = path.resolve('messages/en.json');
const urPath = path.resolve('messages/ur.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const urJson = JSON.parse(fs.readFileSync(urPath, 'utf8'));

const enKeys = new Set(getFlatKeys(enJson));
const urKeys = new Set(getFlatKeys(urJson));

let hasError = false;

// Check missing in ur
for (let key of enKeys) {
  if (!urKeys.has(key)) {
    console.error(`Key missing in ur.json: ${key}`);
    hasError = true;
  }
}

// Check missing in en
for (let key of urKeys) {
  if (!enKeys.has(key)) {
    console.error(`Key missing in en.json: ${key}`);
    hasError = true;
  }
}

// Scan files
function scanDirectory(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const filesToScan = [
  ...scanDirectory('app'),
  ...scanDirectory('components'),
  ...scanDirectory('lib')
];

for (let file of filesToScan) {
  const content = fs.readFileSync(file, 'utf8');
  
  let match;
  const tVars = {};
  
  // A simpler regex to find all variable assignments from useTranslations or getTranslations
  const regexUseSimple = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\((?:['"]([^'"]+)['"])?\)/g;
  while ((match = regexUseSimple.exec(content)) !== null) {
    const varName = match[1];
    const namespace = match[2] || '';
    tVars[varName] = namespace;
  }

  // Handle destructuring { t } = useTranslations() ?
  // Rare, but if it exists we can add it later if needed.

  for (let [varName, namespace] of Object.entries(tVars)) {
    // Find varName("key") or varName.rich("key")
    const regexT = new RegExp(`\\b${varName}(?:\\.(?:rich|markup|raw))?\\(\\s*['"]([^'"]+)['"]`, 'g');
    let tMatch;
    while ((tMatch = regexT.exec(content)) !== null) {
      let key = tMatch[1];
      let fullKey = namespace ? `${namespace}.${key}` : key;
      if (!enKeys.has(fullKey)) {
        console.error(`Missing translation key used in ${file}: ${fullKey}`);
        hasError = true;
      }
    }
  }
}

if (hasError) {
  process.exit(1);
} else {
  console.log('i18n check passed.');
}
