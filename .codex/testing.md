# 测试记录

- 日期: 2026-02-09
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm test`：通过
2. `npm run build`：通过（存在版本与体积警告）

## npm test 输出

```

---

- 日期: 2026-02-10
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm --prefix app/client run test -- --run`：失败（Login 页面语法错误导致构建失败）
2. `npm --prefix app/client run test -- --run`：通过（修复语法后，存在既有控制台警告）
3. `npm --prefix app/client run build`：通过（存在体积告警）

## npm --prefix app/client run test -- --run 失败输出（摘录）

```
FAIL  src/test/Login.test.tsx
Error: Transform failed with 1 error:
.../client/src/pages/Login.tsx:55:8: ERROR: Expected ";" but found "]"
```

## npm --prefix app/client run test -- --run 输出

```
> client@0.0.0 test
> vitest --run

 RUN  v2.1.9  C:/Users/sikuai/Downloads/SOLO开发/百名英才档案管理/app/client

 ✓ src/test/Login.test.tsx (1 test) 254ms
 ✓ src/test/Admin.test.tsx (1 test) 137ms
 ✓ src/test/NotFound.test.tsx (1 test) 224ms
 ✓ src/test/NoAccess.test.tsx (1 test) 236ms
 ✓ src/test/Meetings.test.tsx (1 test) 394ms
   ✓ Meetings > renders meeting list and handles selection 392ms
 ✓ src/test/Certificates.test.tsx (1 test) 686ms
   ✓ Certificates > renders certificate list 684ms
 ✓ src/test/Dashboard.test.tsx (1 test) 263ms
 ✓ src/test/Growth.test.tsx (1 test) 1218ms
   ✓ Growth > submits growth form 1216ms
 ✓ src/test/Evaluations.test.tsx (1 test) 1487ms
   ✓ Evaluations > submits evaluation form 1486ms
 ✓ src/test/AppLayout.test.tsx (1 test) 208ms
 ✓ src/test/ArchiveList.test.tsx (1 test) 280ms

 Test Files  11 passed (11)
      Tests  11 passed (11)
```

## npm --prefix app/client run build 输出

```
> client@0.0.0 build
> vite build

vite v7.3.1 building client environment for production...
transforming...
✓ 3739 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                            0.68 kB │ gzip:   0.42 kB
dist/assets/Login-bJcxpcB1.js              4.50 kB │ gzip:   1.75 kB
dist/assets/Admin-BWcxV5V9.js            262.36 kB │ gzip:  81.32 kB
dist/assets/Dashboard-B2n3l_tu.js        348.53 kB │ gzip: 104.52 kB
dist/assets/index-B0NcA0r-.js            605.75 kB │ gzip: 203.28 kB
✓ built in 15.04s

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
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

---

- 日期: 2026-02-10
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm --prefix app/client run test -- --run`：通过（存在既有控制台警告）
2. `npm --prefix app/client run build`：通过（存在体积告警）

## npm --prefix app/client run test -- --run 输出

```
> client@0.0.0 test
> vitest --run

 RUN  v2.1.9  C:/Users/sikuai/Downloads/SOLO开发/百名英才档案管理/app/client

 ✓ src/test/Login.test.tsx (1 test) 284ms
 ✓ src/test/Admin.test.tsx (1 test) 132ms
 ✓ src/test/NotFound.test.tsx (1 test) 248ms
 ✓ src/test/NoAccess.test.tsx (1 test) 250ms
 ✓ src/test/Meetings.test.tsx (1 test) 365ms
   ✓ Meetings > renders meeting list and handles selection 363ms
 ✓ src/test/Certificates.test.tsx (1 test) 644ms
   ✓ Certificates > renders certificate list 643ms
 ✓ src/test/Dashboard.test.tsx (1 test) 221ms
 ✓ src/test/Growth.test.tsx (1 test) 1109ms
   ✓ Growth > submits growth form 1108ms
 ✓ src/test/Evaluations.test.tsx (1 test) 1394ms
   ✓ Evaluations > submits evaluation form 1392ms
 ✓ src/test/AppLayout.test.tsx (1 test) 200ms
 ✓ src/test/ArchiveList.test.tsx (1 test) 282ms

 Test Files  11 passed (11)
      Tests  11 passed (11)
   Start at  11:24:37
   Duration  10.55s (transform 1.92s, setup 5.95s, collect 42.50s, tests 5.13s, environment 18.35s, prepare 3.02s)

stderr | src/test/Login.test.tsx > Login > submits login form
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/Admin.test.tsx > Admin > renders admin dashboard tabs
Warning: Received `true` for a non-boolean attribute `danger`.

If you want to write it to the DOM, pass a string instead: danger="true" or danger={value.toString()}.
    at button
    at Button (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\test\Admin.test.tsx:10:21)
    at div
    at td
    at tr
    at tbody
    at table
    at Table (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\test\Admin.test.tsx:55:20)
    at div
    at div
    at div
    at Tabs (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\test\Admin.test.tsx:89:19)
    at div
    at Admin (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\pages\Admin.tsx:62:59)
    at Router (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\node_modules\react-router\dist\umd\react-router.development.js:1207:17)
    at MemoryRouter (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\node_modules\react-router\dist\umd\react-router.development.js:1101:7)
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/NotFound.test.tsx > NotFound > renders not found message
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/NoAccess.test.tsx > NoAccess > renders no access message
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/Meetings.test.tsx > Meetings > renders meeting list and handles selection
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/Certificates.test.tsx > Certificates > renders certificate list
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/Dashboard.test.tsx > Dashboard > renders overview metrics and trending list
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.

stderr | src/test/Growth.test.tsx > Growth > submits growth form
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/Evaluations.test.tsx > Evaluations > submits evaluation form
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/AppLayout.test.tsx > AppLayout > renders mobile tab bar when media query matches
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/ArchiveList.test.tsx > ArchiveList > renders list and masks sensitive fields by default
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
```

## npm --prefix app/client run build 输出

```
> client@0.0.0 build
> vite build

vite v7.3.1 building client environment for production...
transforming...
✓ 3739 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                            0.68 kB │ gzip:   0.42 kB
dist/assets/Login-BeUxL8n7.css             4.57 kB │ gzip:   1.46 kB
dist/assets/index-DiOzEkVT.css            21.25 kB │ gzip:   4.85 kB
dist/assets/useLocale-hzG3FblQ.js          0.36 kB │ gzip:   0.27 kB
dist/assets/SectionHeader-DpcxMyA8.js      0.36 kB │ gzip:   0.23 kB
dist/assets/fade-CByLOzVz.js               0.45 kB │ gzip:   0.28 kB
dist/assets/CheckOutlined-CUpKNlVd.js      0.48 kB │ gzip:   0.38 kB
dist/assets/NotFound-PPT1m4j8.js           0.59 kB │ gzip:   0.42 kB
dist/assets/NoAccess-CpO2f401.js           0.59 kB │ gzip:   0.42 kB
dist/assets/DownloadOutlined-Pz72UvFv.js   1.17 kB │ gzip:   0.61 kB
dist/assets/PersonSelector-BJSdLRWH.js     1.42 kB │ gzip:   0.75 kB
dist/assets/index-Dn6gMvXl.js              1.95 kB │ gzip:   0.82 kB
dist/assets/Evaluations-BJUvGdho.js        3.13 kB │ gzip:   1.42 kB
dist/assets/Growth-DiuGezs4.js             3.54 kB │ gzip:   1.51 kB
dist/assets/ReadingZone-Dn0KzxWz.js        4.42 kB │ gzip:   1.79 kB
dist/assets/Meetings-D564cQbT.js           4.66 kB │ gzip:   1.77 kB
dist/assets/Login-BUteY_UZ.js              5.15 kB │ gzip:   1.98 kB
dist/assets/Certificates-OG6sKcL8.js       5.47 kB │ gzip:   2.29 kB
dist/assets/format-Boy12-dr.js             6.96 kB │ gzip:   2.79 kB
dist/assets/ArchiveList-CwdXy3WN.js        9.33 kB │ gzip:   3.23 kB
dist/assets/readingZone-B3UQBwXu.js       28.34 kB │ gzip:   9.52 kB
dist/assets/index-izQGRwA5.js             40.73 kB │ gzip:  14.66 kB
dist/assets/index-Bt1u05fd.js             51.04 kB │ gzip:  17.61 kB
dist/assets/index-BVJ7shQc.js             51.12 kB │ gzip:  15.25 kB
dist/assets/index-mmV3Xec5.js             76.53 kB │ gzip:  25.34 kB
dist/assets/Admin-BdLb-JkG.js            262.36 kB │ gzip:  81.33 kB
dist/assets/Dashboard-wMIPEPzu.js        348.53 kB │ gzip: 104.52 kB
dist/assets/index-COQALoRf.js            605.72 kB │ gzip: 203.27 kB
✓ built in 14.88s

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

1. `npm --prefix app/client run test -- --run`：通过（存在既有控制台警告）
2. `npm --prefix app/client run build`：通过（存在体积告警）

## npm --prefix app/client run test -- --run 输出（摘要）

```
Test Files  11 passed (11)
Tests       11 passed (11)
```

## npm --prefix app/client run build 输出（摘要）

```
✓ built in 15.52s
(!) Some chunks are larger than 500 kB after minification.
```

---

- 日期: 2026-02-10
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm run test:server`：通过

## npm run test:server 输出

```
> bainyingcai-dashboard@1.0.0 test:server
> node --test server/__tests__

TAP version 13
# [dotenv@17.2.3] injecting env (0) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
# [dotenv@17.2.3] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
# 人才档案服务已启动: http://localhost:0
# Subtest: bootstrap admin and import datasets
ok 1 - bootstrap admin and import datasets
  ---
  duration_ms: 179.3611
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1394.3001
```

---

- 日期: 2026-02-10
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm --prefix app/client run test -- --run`：通过（存在既有控制台警告）
2. `npm --prefix app/client run build`：通过（存在体积告警）

## npm --prefix app/client run test -- --run 输出（摘要）

```
Test Files  11 passed (11)
Tests       11 passed (11)
```

## npm --prefix app/client run build 输出（摘要）

```
✓ built in 15.52s
(!) Some chunks are larger than 500 kB after minification.
```

---

- 日期: 2026-02-10
- 执行者: Codex
- 工作目录: c:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app

## 执行命令与结果

1. `npm --prefix app/client run test -- --run`：通过（存在既有控制台警告）
2. `npm --prefix app/client run build`：通过（存在体积告警）

## npm --prefix app/client run test -- --run 输出

```
> client@0.0.0 test
> vitest --run

 RUN  v2.1.9  C:/Users/sikuai/Downloads/SOLO开发/百名英才档案管理/app/client

 ✓ src/test/Login.test.tsx (1 test) 276ms
 ✓ src/test/Admin.test.tsx (1 test) 109ms
 ✓ src/test/NoAccess.test.tsx (1 test) 224ms
 ✓ src/test/NotFound.test.tsx (1 test) 238ms
 ✓ src/test/Meetings.test.tsx (1 test) 319ms
   ✓ Meetings > renders meeting list and handles selection 318ms
 ✓ src/test/Certificates.test.tsx (1 test) 621ms
   ✓ Certificates > renders certificate list 619ms
 ✓ src/test/Dashboard.test.tsx (1 test) 214ms
 ✓ src/test/Growth.test.tsx (1 test) 1072ms
   ✓ Growth > submits growth form 1070ms
 ✓ src/test/Evaluations.test.tsx (1 test) 1349ms
   ✓ Evaluations > submits evaluation form 1347ms
 ✓ src/test/AppLayout.test.tsx (1 test) 212ms
 ✓ src/test/ArchiveList.test.tsx (1 test) 313ms
   ✓ ArchiveList > renders list and masks sensitive fields by default 311ms

 Test Files  11 passed (11)
      Tests  11 passed (11)
   Start at  11:31:32
   Duration  10.41s (transform 1.78s, setup 6.11s, collect 41.98s, tests 4.95s, environment 18.14s, prepare 3.04s)

stderr | src/test/Login.test.tsx > Login > submits login form
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/Admin.test.tsx > Admin > renders admin dashboard tabs
Warning: Received `true` for a non-boolean attribute `danger`.

If you want to write it to the DOM, pass a string instead: danger="true" or danger={value.toString()}.
    at button
    at Button (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\test\Admin.test.tsx:10:21)
    at div
    at td
    at tr
    at tbody
    at table
    at Table (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\test\Admin.test.tsx:55:20)
    at div
    at div
    at div
    at Tabs (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\test\Admin.test.tsx:89:19)
    at div
    at Admin (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\src\pages\Admin.tsx:62:59)
    at Router (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\node_modules\react-router\dist\umd\react-router.development.js:1207:17)
    at MemoryRouter (C:\Users\sikuai\Downloads\SOLO开发\百名英才档案管理\app\client\node_modules\react-router\dist\umd\react-router.development.js:1101:7)
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

stderr | src/test/Dashboard.test.tsx > Dashboard > renders overview metrics and trending list
The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.
⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.
The width(0) and height(0) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
```

## npm --prefix app/client run build 输出

```
> client@0.0.0 build
> vite build

vite v7.3.1 building client environment for production...
transforming...
✓ 3739 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                            0.68 kB │ gzip:   0.42 kB
dist/assets/Login-BeUxL8n7.css             4.57 kB │ gzip:   1.46 kB
dist/assets/index-DiOzEkVT.css            21.25 kB │ gzip:   4.85 kB
dist/assets/useLocale-IZYy7iUe.js          0.36 kB │ gzip:   0.26 kB
dist/assets/SectionHeader-_4lvEkIT.js      0.36 kB │ gzip:   0.23 kB
dist/assets/fade-DwrvmJPf.js               0.45 kB │ gzip:   0.28 kB
dist/assets/CheckOutlined-CZxKrZMQ.js      0.48 kB │ gzip:   0.37 kB
dist/assets/NotFound-DDZ0T4Ye.js           0.59 kB │ gzip:   0.42 kB
dist/assets/NoAccess-C6mwOxZ4.js           0.59 kB │ gzip:   0.42 kB
dist/assets/DownloadOutlined-CbpLo6ZV.js   1.17 kB │ gzip:   0.61 kB
dist/assets/PersonSelector-5hujuYpi.js     1.42 kB │ gzip:   0.75 kB
dist/assets/index-DYWQWOCO.js              1.95 kB │ gzip:   0.81 kB
dist/assets/Evaluations-Bw6FBc49.js        3.13 kB │ gzip:   1.42 kB
dist/assets/Growth-3_AlIVbv.js             3.54 kB │ gzip:   1.51 kB
dist/assets/ReadingZone-mutwT4lh.js        4.42 kB │ gzip:   1.80 kB
dist/assets/Meetings-BARA41pY.js           4.66 kB │ gzip:   1.77 kB
dist/assets/Login-DlUKbMfH.js              5.15 kB │ gzip:   1.98 kB
dist/assets/Certificates-DUR4Nspv.js       5.47 kB │ gzip:   2.29 kB
dist/assets/format-hOQtUqaD.js             6.96 kB │ gzip:   2.79 kB
dist/assets/ArchiveList-BY1CHqT6.js        9.33 kB │ gzip:   3.23 kB
dist/assets/readingZone-BJQq_mVB.js       28.34 kB │ gzip:   9.52 kB
dist/assets/index-IX9Ia7d9.js             40.73 kB │ gzip:  14.66 kB
dist/assets/index-BXocnMX7.js             51.04 kB │ gzip:  17.60 kB
dist/assets/index-CbLB227h.js             51.12 kB │ gzip:  15.25 kB
dist/assets/index-CaYXfAEU.js             76.53 kB │ gzip:  25.35 kB
dist/assets/Admin-BIupawQI.js            262.36 kB │ gzip:  81.33 kB
dist/assets/Dashboard-D3HeikAC.js        348.53 kB │ gzip: 104.52 kB
dist/assets/index-DRqgMnMh.js            605.75 kB │ gzip: 203.28 kB
✓ built in 15.69s

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```
