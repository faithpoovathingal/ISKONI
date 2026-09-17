const fs = require('fs');
const path = require('path');

const targetVersion = process.argv[2];
if (!targetVersion) {
  console.error('Usage: node scripts/bump-version.js <version>');
  process.exit(1);
}

const cleanVer = targetVersion.replace(/^v/, '');

// 1. Update package.json
const pkgPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const oldVer = pkg.version;
  pkg.version = cleanVer;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`Updated package.json: ${oldVer} -> ${cleanVer}`);
}

// 2. Update version.json
const versionJsonPath = path.join(__dirname, '..', 'version.json');
if (fs.existsSync(versionJsonPath)) {
  const vData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  vData.version = cleanVer;
  vData.name = `ISKONI Desktop v${cleanVer}`;
  fs.writeFileSync(versionJsonPath, JSON.stringify(vData, null, 2) + '\n', 'utf8');
  console.log(`Updated version.json to v${cleanVer}`);
}

// 3. Patch hardcoded versions across src/ and out/
function replaceInDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      replaceInDir(full);
    } else if (/\.(js|ts|tsx|json|html)$/.test(file) && !file.endsWith('.bak')) {
      let content = fs.readFileSync(full, 'utf8');
      // Replaces occurrences like "1.0.8" or 'v1.0.8'
      const regex = /\b1\.\d+\.\d+(-beta\.\d+)?\b/g;
      if (regex.test(content)) {
        content = content.replace(regex, cleanVer);
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  });
}

replaceInDir(path.join(__dirname, '..', 'src'));
replaceInDir(path.join(__dirname, '..', 'out'));
console.log(`Synchronized all version strings to ${cleanVer}`);
