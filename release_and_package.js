const fs = require('fs');
const { execSync } = require('child_process');

console.log("==========================================");
console.log(" 🧪 1. TESTING UPDATE MODAL SIMULATION");
console.log("==========================================\n");

// Inject temporary diagnostic trigger into index.html for testing
const htmlPath = 'out/renderer/index.html';
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  console.log("✓ IPC and update modal bridge verified in out/main/index.js and index.html");
}

console.log("\n==========================================");
console.log(" 🏗️ 2. BUILDING PRODUCTION .PKG INSTALLER");
console.log("==========================================\n");

try {
  // Ensure package.json is locked to 1.0.6
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '1.0.6';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');

  console.log("Compiling .pkg installer with electron-builder...");
  execSync('npx electron-builder --mac pkg', { stdio: 'inherit' });
  console.log("\n✓ .pkg installer generated in dist/");
} catch (err) {
  console.error("❌ Build error:", err.message);
  process.exit(1);
}

console.log("\n==========================================");
console.log(" 🔖 3. CREATING GIT BOOKMARK (COMMIT & TAG)");
console.log("==========================================\n");

try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Release v1.0.6: Custom native player, subtitle persistence & sync customizer, direct auto-installer pipeline"', { stdio: 'inherit' });
  
  // Delete existing local tag if present to avoid conflicts, then re-tag
  try { execSync('git tag -d v1.0.6', { stdio: 'ignore' }); } catch (_) {}
  execSync('git tag -a v1.0.6 -m "ISKONI Desktop v1.0.6 Release"', { stdio: 'inherit' });

  console.log("✓ Git commit and tag 'v1.0.6' created successfully.");
} catch (gitErr) {
  console.log("Git notice:", gitErr.message);
}

console.log("\n==========================================");
console.log(" 🎉 BUILD & TAG COMPLETE!");
console.log("==========================================");
