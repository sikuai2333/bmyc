# 测试记录

- 日期: 2026-02-09
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm test`：通过
2. `npm run build`：通过（存在版本与体积警告）

## npm test 输出

```
> bainyingcai-dashboard@1.0.0 test
> npm run test:server

> bainyingcai-dashboard@1.0.0 test:server
> node --test server/__tests__

TAP version 13
# [dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
# [dotenv@17.2.3] injecting env (0) from .env -- tip: ✅ audit secrets and track compliance: https://dotenvx.com/ops
# 人才档案服务已启动: http://localhost:0
# Subtest: bootstrap admin and import datasets
ok 1 - bootstrap admin and import datasets
  ---
  duration_ms: 257.2554
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2593.643
```

## npm run build 输出

```
> bainyingcai-dashboard@1.0.0 build
> npm --prefix client run build

> client@0.0.0 build
> vite build

vite v7.3.1 building client environment for production...
transforming...
✓ 3738 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                            0.66 kB │ gzip:   0.41 kB
dist/assets/Login-BeUxL8n7.css             4.57 kB │ gzip:   1.46 kB
dist/assets/index-ByyKp6R5.css            20.70 kB │ gzip:   4.71 kB
dist/assets/format-BacrAOIH.js             0.19 kB │ gzip:   0.17 kB
dist/assets/useLocale-Bda-eM0x.js          0.36 kB │ gzip:   0.27 kB
dist/assets/SectionHeader-zEHxyPTz.js      0.36 kB │ gzip:   0.23 kB
dist/assets/CheckOutlined-THAlkS4-.js      0.48 kB │ gzip:   0.37 kB
dist/assets/NotFound-DZS7pB2o.js           0.59 kB │ gzip:   0.42 kB
dist/assets/NoAccess-CYLvFAJO.js           0.59 kB │ gzip:   0.43 kB
dist/assets/DownloadOutlined-w6rbSquv.js   1.17 kB │ gzip:   0.61 kB
dist/assets/PersonSelector-Cyjp_PtS.js     1.42 kB │ gzip:   0.75 kB
dist/assets/Evaluations-Ca_DhK_c.js        3.10 kB │ gzip:   1.40 kB
dist/assets/Growth-CNzRsI9C.js             3.51 kB │ gzip:   1.49 kB
dist/assets/Meetings-zuGufsOo.js           4.70 kB │ gzip:   1.78 kB
dist/assets/Login-Np2TbH26.js              5.15 kB │ gzip:   1.97 kB
dist/assets/Certificates-DEwG9pju.js       5.42 kB │ gzip:   2.26 kB
dist/assets/index-BfIWvRNE.js              6.78 kB │ gzip:   2.69 kB
dist/assets/ArchiveList-D76F6590.js        8.34 kB │ gzip:   2.92 kB
dist/assets/index-DvEkD2yw.js             42.58 kB │ gzip:  15.20 kB
dist/assets/index-vJC931fD.js             51.12 kB │ gzip:  15.25 kB
dist/assets/index-BYpFYCoH.js             51.41 kB │ gzip:  17.73 kB
dist/assets/index-Be9t3W8T.js             76.53 kB │ gzip:  25.34 kB
dist/assets/Admin-CS46DkJb.js            285.53 kB │ gzip:  88.57 kB
dist/assets/Dashboard-OS31ZnmL.js        348.53 kB │ gzip: 104.52 kB
dist/assets/index-4KKtHPfI.js            603.07 kB │ gzip: 202.45 kB
✓ built in 14.45s
You are using Node.js 20.18.0. Vite requires Node.js version 20.19+ or 22.12+. Please upgrade your Node.js version.

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

---

- 日期: 2026-02-10
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm --prefix app run test:server`：通过

## npm --prefix app run test:server 输出

```
> bainyingcai-dashboard@1.0.0 test:server
> node --test server/__tests__

TAP version 13
# [dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com
# [dotenv@17.2.3] injecting env (0) from .env -- tip: ✅ audit secrets and track compliance: https://dotenvx.com/ops
# 人才档案服务已启动: http://localhost:0
# Subtest: bootstrap admin and import datasets
ok 1 - bootstrap admin and import datasets
  ---
  duration_ms: 257.5258
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 2361.9495
```

---

- 日期: 2026-02-10
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm --prefix app/client run test -- --run`：通过（存在既有控制台警告）

## npm --prefix app/client run test -- --run 输出

```
> client@0.0.0 test
> vitest --run

 RUN  v2.1.9  C:/Users/sikuai/Downloads/SOLO开发/百名英才档案管理/app/client

 ✓ src/test/Login.test.tsx (1 test)
 ✓ src/test/Admin.test.tsx (1 test)
 ✓ src/test/NotFound.test.tsx (1 test)
 ✓ src/test/NoAccess.test.tsx (1 test)
 ✓ src/test/Meetings.test.tsx (1 test)
 ✓ src/test/Certificates.test.tsx (1 test)
 ✓ src/test/Growth.test.tsx (1 test)
 ✓ src/test/Dashboard.test.tsx (1 test)
 ✓ src/test/Evaluations.test.tsx (1 test)
 ✓ src/test/AppLayout.test.tsx (1 test)
 ✓ src/test/ArchiveList.test.tsx (1 test)

 Test Files  11 passed (11)
      Tests  11 passed (11)
```
