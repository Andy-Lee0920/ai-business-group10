# Dependency License Inventory

This document lists the open-source license audit of Fevio's dependencies.

## Audit Summary
- **Scan Date**: 2026-06-08T08:12:52.639Z
- **Active Package Manager**: npm
- **Lockfile Basis**: `Fertility-support/ai-business-group10/package-lock.json`
- **Scan Command Used**: `node scripts/check-licenses.js`
- **Limitations**: Direct and indirect dependencies resolved under the `Fertility-support/ai-business-group10` workspace. Local developer setups may differ if lockfiles are updated.
- **Status Classification**:
  - `Safe`: Licenses matching common permissive licenses (MIT, ISC, BSD, Apache-2.0, CC0, Unlicense, 0BSD).
  - `Needs review`: Copyleft or less common licenses (LGPL, MPL) requiring manual developer/legal policy check.

## License Inventory Table

| Package | Version | License | Status |
| --- | --- | --- | --- |
| @babel/helper-string-parser | 7.29.7 | MIT | Safe |
| @babel/helper-validator-identifier | 7.29.7 | MIT | Safe |
| @babel/parser | 7.29.7 | MIT | Safe |
| @babel/types | 7.29.7 | MIT | Safe |
| @bcoe/v8-coverage | 1.0.2 | MIT | Safe |
| @date-fns/tz | 1.4.1 | MIT | Safe |
| @emnapi/core | 1.10.0 | MIT | Safe |
| @emnapi/runtime | 1.10.0 | MIT | Safe |
| @emnapi/wasi-threads | 1.2.1 | MIT | Safe |
| @img/colour | 1.1.0 | MIT | Safe |
| @img/sharp-darwin-arm64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-darwin-x64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-libvips-darwin-arm64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-darwin-x64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linux-arm | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linux-arm64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linux-ppc64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linux-riscv64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linux-s390x | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linux-x64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linuxmusl-arm64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-libvips-linuxmusl-x64 | 1.2.4 | LGPL-3.0-or-later | Needs review |
| @img/sharp-linux-arm | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-linux-arm64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-linux-ppc64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-linux-riscv64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-linux-s390x | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-linux-x64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-linuxmusl-arm64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-linuxmusl-x64 | 0.34.5 | Apache-2.0 | Safe |
| @img/sharp-wasm32 | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later AND MIT | Safe |
| @img/sharp-win32-arm64 | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later | Safe |
| @img/sharp-win32-ia32 | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later | Safe |
| @img/sharp-win32-x64 | 0.34.5 | Apache-2.0 AND LGPL-3.0-or-later | Safe |
| @jridgewell/resolve-uri | 3.1.2 | MIT | Safe |
| @jridgewell/sourcemap-codec | 1.5.5 | MIT | Safe |
| @jridgewell/trace-mapping | 0.3.31 | MIT | Safe |
| @napi-rs/wasm-runtime | 1.1.4 | MIT | Safe |
| @next/env | 16.2.6 | MIT | Safe |
| @next/swc-darwin-arm64 | 16.2.6 | MIT | Safe |
| @next/swc-darwin-x64 | 16.2.6 | MIT | Safe |
| @next/swc-linux-arm64-gnu | 16.2.6 | MIT | Safe |
| @next/swc-linux-arm64-musl | 16.2.6 | MIT | Safe |
| @next/swc-linux-x64-gnu | 16.2.6 | MIT | Safe |
| @next/swc-linux-x64-musl | 16.2.6 | MIT | Safe |
| @next/swc-win32-arm64-msvc | 16.2.6 | MIT | Safe |
| @next/swc-win32-x64-msvc | 16.2.6 | MIT | Safe |
| @oxc-project/types | 0.128.0 | MIT | Safe |
| @playwright/test | 1.59.1 | Apache-2.0 | Safe |
| @rolldown/binding-android-arm64 | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-darwin-arm64 | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-darwin-x64 | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-freebsd-x64 | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-linux-arm-gnueabihf | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-linux-arm64-gnu | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-linux-arm64-musl | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-linux-ppc64-gnu | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-linux-s390x-gnu | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-linux-x64-gnu | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-linux-x64-musl | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-openharmony-arm64 | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-wasm32-wasi | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-win32-arm64-msvc | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/binding-win32-x64-msvc | 1.0.0-rc.18 | MIT | Safe |
| @rolldown/pluginutils | 1.0.0-rc.18 | MIT | Safe |
| @standard-schema/spec | 1.1.0 | MIT | Safe |
| @supabase/auth-js | 2.105.4 | MIT | Safe |
| @supabase/functions-js | 2.105.4 | MIT | Safe |
| @supabase/phoenix | 0.4.2 | MIT | Safe |
| @supabase/postgrest-js | 2.105.4 | MIT | Safe |
| @supabase/realtime-js | 2.105.4 | MIT | Safe |
| @supabase/ssr | 0.10.3 | MIT | Safe |
| @supabase/storage-js | 2.105.4 | MIT | Safe |
| @supabase/supabase-js | 2.105.4 | MIT | Safe |
| @swc/helpers | 0.5.15 | Apache-2.0 | Safe |
| @tabby_ai/hijri-converter | 1.0.5 | MIT | Safe |
| @tybys/wasm-util | 0.10.2 | MIT | Safe |
| @types/chai | 5.2.3 | MIT | Safe |
| @types/deep-eql | 4.0.2 | MIT | Safe |
| @types/estree | 1.0.9 | MIT | Safe |
| @types/node | 25.6.2 | MIT | Safe |
| @types/react | 19.2.14 | MIT | Safe |
| @types/react-dom | 19.2.3 | MIT | Safe |
| @types/web-push | 3.6.4 | MIT | Safe |
| @vitest/coverage-v8 | 4.1.5 | MIT | Safe |
| @vitest/expect | 4.1.5 | MIT | Safe |
| @vitest/mocker | 4.1.5 | MIT | Safe |
| @vitest/pretty-format | 4.1.5 | MIT | Safe |
| @vitest/runner | 4.1.5 | MIT | Safe |
| @vitest/snapshot | 4.1.5 | MIT | Safe |
| @vitest/spy | 4.1.5 | MIT | Safe |
| @vitest/utils | 4.1.5 | MIT | Safe |
| agent-base | 7.1.4 | MIT | Safe |
| asn1.js | 5.4.1 | MIT | Safe |
| assertion-error | 2.0.1 | MIT | Safe |
| ast-v8-to-istanbul | 1.0.2 | MIT | Safe |
| baseline-browser-mapping | 2.10.29 | Apache-2.0 | Safe |
| bn.js | 4.12.3 | MIT | Safe |
| buffer-equal-constant-time | 1.0.1 | BSD-3-Clause | Safe |
| caniuse-lite | 1.0.30001792 | CC-BY-4.0 | Safe |
| chai | 6.2.2 | MIT | Safe |
| client-only | 0.0.1 | MIT | Safe |
| convert-source-map | 2.0.0 | MIT | Safe |
| cookie | 1.1.1 | MIT | Safe |
| csstype | 3.2.3 | MIT | Safe |
| date-fns | 4.1.0 | MIT | Safe |
| date-fns-jalali | 4.1.0-0 | MIT | Safe |
| debug | 4.4.3 | MIT | Safe |
| dequal | 2.0.3 | MIT | Safe |
| detect-libc | 2.1.2 | Apache-2.0 | Safe |
| ecdsa-sig-formatter | 1.0.11 | Apache-2.0 | Safe |
| es-module-lexer | 2.1.0 | MIT | Safe |
| estree-walker | 3.0.3 | MIT | Safe |
| expect-type | 1.3.0 | Apache-2.0 | Safe |
| fdir | 6.5.0 | MIT | Safe |
| fsevents | 2.3.2 | MIT | Safe |
| fsevents | 2.3.3 | MIT | Safe |
| has-flag | 4.0.0 | MIT | Safe |
| html-escaper | 2.0.2 | MIT | Safe |
| http_ece | 1.2.0 | MIT | Safe |
| https-proxy-agent | 7.0.6 | MIT | Safe |
| iceberg-js | 0.8.1 | MIT | Safe |
| inherits | 2.0.4 | ISC | Safe |
| istanbul-lib-coverage | 3.2.2 | BSD-3-Clause | Safe |
| istanbul-lib-report | 3.0.1 | BSD-3-Clause | Safe |
| istanbul-reports | 3.2.0 | BSD-3-Clause | Safe |
| js-tokens | 10.0.0 | MIT | Safe |
| jwa | 2.0.1 | MIT | Safe |
| jws | 4.0.1 | MIT | Safe |
| lightningcss | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-android-arm64 | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-darwin-arm64 | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-darwin-x64 | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-freebsd-x64 | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-linux-arm-gnueabihf | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-linux-arm64-gnu | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-linux-arm64-musl | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-linux-x64-gnu | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-linux-x64-musl | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-win32-arm64-msvc | 1.32.0 | MPL-2.0 | Needs review |
| lightningcss-win32-x64-msvc | 1.32.0 | MPL-2.0 | Needs review |
| lucide-react | 1.14.0 | ISC | Safe |
| magic-string | 0.30.21 | MIT | Safe |
| magicast | 0.5.3 | MIT | Safe |
| make-dir | 4.0.0 | MIT | Safe |
| minimalistic-assert | 1.0.1 | ISC | Safe |
| minimist | 1.2.8 | MIT | Safe |
| ms | 2.1.3 | MIT | Safe |
| nanoid | 3.3.12 | MIT | Safe |
| next | 16.2.6 | MIT | Safe |
| obug | 2.1.1 | MIT | Safe |
| pathe | 2.0.3 | MIT | Safe |
| picocolors | 1.1.1 | ISC | Safe |
| picomatch | 4.0.4 | MIT | Safe |
| playwright | 1.59.1 | Apache-2.0 | Safe |
| playwright-core | 1.59.1 | Apache-2.0 | Safe |
| postcss | 8.5.14 | MIT | Safe |
| react | 19.2.6 | MIT | Safe |
| react-day-picker | 9.14.0 | MIT | Safe |
| react-dom | 19.2.6 | MIT | Safe |
| rolldown | 1.0.0-rc.18 | MIT | Safe |
| safe-buffer | 5.2.1 | MIT | Safe |
| safer-buffer | 2.1.2 | MIT | Safe |
| scheduler | 0.27.0 | MIT | Safe |
| semver | 7.8.0 | ISC | Safe |
| sharp | 0.34.5 | Apache-2.0 | Safe |
| siginfo | 2.0.0 | ISC | Safe |
| source-map-js | 1.2.1 | BSD-3-Clause | Safe |
| stackback | 0.0.2 | MIT | Safe |
| std-env | 4.1.0 | MIT | Safe |
| styled-jsx | 5.1.6 | MIT | Safe |
| supports-color | 7.2.0 | MIT | Safe |
| swr | 2.4.1 | MIT | Safe |
| tinybench | 2.9.0 | MIT | Safe |
| tinyexec | 1.1.2 | MIT | Safe |
| tinyglobby | 0.2.16 | MIT | Safe |
| tinyrainbow | 3.1.0 | MIT | Safe |
| tslib | 2.8.1 | 0BSD | Safe |
| typescript | 6.0.3 | Apache-2.0 | Safe |
| undici-types | 7.19.2 | MIT | Safe |
| use-sync-external-store | 1.6.0 | MIT | Safe |
| vite | 8.0.11 | MIT | Safe |
| vitest | 4.1.5 | MIT | Safe |
| web-push | 3.6.7 | MPL-2.0 | Needs review |
| why-is-node-running | 2.3.0 | MIT | Safe |
| zod | 4.4.3 | MIT | Safe |
