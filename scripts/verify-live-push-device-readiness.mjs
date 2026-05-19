#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? '';
}

function runCommand(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    return `${stdout}${stderr}`;
  }
}

function getAndroidOutput() {
  const injected = readArg('--android-output');
  if (injected !== null) return injected;
  return runCommand('adb', ['devices']);
}

function getIosOutput() {
  const injected = readArg('--ios-output');
  if (injected !== null) return injected;
  return runCommand('xcrun', ['xctrace', 'list', 'devices']);
}

function hasAndroidPhysicalDevice(output) {
  return output
    .split(/\r?\n/)
    .some((line) => /^\S+\s+device$/.test(line.trim()));
}

function hasIosPhysicalDevice(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => {
      if (!line || /simulator/i.test(line)) return false;
      if (/^Mac/i.test(line)) return false;
      return /\b(iPhone|iPad)\b/.test(line) && /\([0-9A-Fa-f-]{8,}\)$/.test(line);
    });
}

const androidOutput = getAndroidOutput();
const iosOutput = getIosOutput();
const androidReady = hasAndroidPhysicalDevice(androidOutput);
const iosReady = hasIosPhysicalDevice(iosOutput);

console.log(`Android physical device: ${androidReady ? 'READY' : 'MISSING'}`);
console.log(`iOS physical device: ${iosReady ? 'READY' : 'MISSING'}`);

if (!androidReady || !iosReady) {
  if (!androidReady) console.error('#382 blocked: no Android physical device detected');
  if (!iosReady) console.error('#383 blocked: no iOS physical device detected');
  console.error('Live PWA push closure still requires physical L3/L4/L6/L7 evidence.');
  process.exit(1);
}

console.log('live push device readiness passed');
