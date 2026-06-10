const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '..');
const lockPath = path.join(appDir, 'package-lock.json');

if (!fs.existsSync(lockPath)) {
  console.error('package-lock.json not found at ' + lockPath);
  process.exit(1);
}

const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const packages = lock.packages || {};

const results = [];
const errors = [];

for (const pkgPath of Object.keys(packages)) {
  if (pkgPath === '') continue; // root package
  
  const parts = pkgPath.split('node_modules/');
  const name = parts[parts.length - 1];
  
  const fullPkgJsonPath = path.join(appDir, pkgPath, 'package.json');
  
  let license = 'Unknown';
  let version = packages[pkgPath].version || 'Unknown';
  
  if (fs.existsSync(fullPkgJsonPath)) {
    try {
      const depPkg = JSON.parse(fs.readFileSync(fullPkgJsonPath, 'utf8'));
      license = depPkg.license || (depPkg.licenses ? depPkg.licenses.map(l => l.type || l).join(', ') : 'Unknown');
      version = depPkg.version || version;
    } catch (e) {
      errors.push(`Error reading ${fullPkgJsonPath}: ${e.message}`);
    }
  } else {
    if (packages[pkgPath].license) {
      license = packages[pkgPath].license;
    }
  }
  
  results.push({
    path: pkgPath,
    name,
    version,
    license
  });
}

const uniqueMap = new Map();
for (const r of results) {
  const key = `${r.name}@${r.version}`;
  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, r);
  }
}

const uniqueResults = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));

console.log(`Scan Date: ${new Date().toISOString()}`);
console.log(`Lockfile basis: Fertility-support/ai-business-group10/package-lock.json`);
console.log(`Total unique dependencies scanned: ${uniqueResults.length}`);
console.log();
console.log('| Package | Version | License | Status |');
console.log('| --- | --- | --- | --- |');

for (const r of uniqueResults) {
  let status = 'Safe';
  let licStr = 'Unknown';
  
  if (r.license) {
    if (typeof r.license === 'object') {
      licStr = r.license.type || JSON.stringify(r.license);
    } else {
      licStr = String(r.license);
    }
  }
  
  const lic = licStr.toUpperCase();
  const safeLicenses = [
    'MIT', 'ISC', 'BSD-3-CLAUSE', 'BSD-2-CLAUSE', 'APACHE-2.0', 'APACHE-2.0 WITH LLVM-EXCEPTION',
    'CC0-1.0', 'UNLICENSE', 'WTFPL', 'CC-BY-3.0', 'CC-BY-4.0', 'BLUEOAK-1.0.0', '0BSD'
  ];
  
  const isSafe = safeLicenses.some(safe => {
    return lic === safe || lic.includes(`(${safe}`) || lic.includes(`${safe})`) || lic.includes(` ${safe} `) || lic.startsWith(`${safe} `) || lic.endsWith(` ${safe}`);
  });
  
  if (lic === 'UNKNOWN') {
    status = 'Needs review';
  } else if (!isSafe) {
    status = 'Needs review';
  }
  
  console.log(`| ${r.name} | ${r.version} | ${licStr} | ${status} |`);
}

if (errors.length > 0) {
  console.log('\n### Scan Warnings/Errors');
  for (const err of errors) {
    console.log(`- ${err}`);
  }
}
