# Toss Mini / Apps-in-Toss 개발문서 통합본

- 통합 대상: WebView / React Native / iOS / 샌드박스 / 토스앱 테스트 / mTLS / 토스 로그인 / 토스 인증 / Firebase / Sentry / AI 개발 가이드
- 추가 포함: TDS Mobile Foundation > Typography
- 목적: 분산된 개발문서를 하나의 참조 문서로 정리

## 목차

1. [Typography (TDS Mobile Foundation)](#1-typography-tds-mobile-foundation)
2. [WebView 튜토리얼](#2-webview-튜토리얼)
3. [React Native 튜토리얼](#3-react-native-튜토리얼)
4. [iOS 환경설정](#4-ios-환경설정)
5. [샌드박스 테스트앱](#5-샌드박스-테스트앱)
6. [토스앱 테스트/배포](#6-토스앱-테스트배포)
7. [API 사용하기 (mTLS)](#7-api-사용하기-mtls)
8. [토스 로그인 소개](#8-토스-로그인-소개)
9. [토스 로그인 콘솔](#9-토스-로그인-콘솔)
10. [토스 로그인 개발](#10-토스-로그인-개발)
11. [토스 로그인 QA](#11-토스-로그인-qa)
12. [토스 인증 소개](#12-토스-인증-소개)
13. [토스 인증 개발](#13-토스-인증-개발)
14. [토스 인증 테스트](#14-토스-인증-테스트)
15. [Firebase 연동](#15-firebase-연동)
16. [Sentry 모니터링](#16-sentry-모니터링)
17. [AI 개발 가이드](#17-ai-개발-가이드)

---

# 1. Typography (TDS Mobile Foundation)

## Typography

> Source: https://tossmini-docs.toss.im/tds-mobile/foundation/typography/

Typography는 디자인 시스템의 핵심 요소로, 텍스트의 가독성을 보장하고 일관된 방향성을 유지하며 브랜드 아이덴티티를 전달하는 역할을 합니다.  
폰트 크기와 라인 높이를 통해 정보 계층을 명확히 하고, Android/iOS/Web 전반에서 최대한 일관된 경험을 제공하도록 설계되어 있습니다.

### 규칙 알아보기

#### 토큰

Typography 토큰은 계층 구조를 가지며, 토큰을 그대로 사용하는 것을 권장합니다.  
문서의 숫자를 직접 하드코딩하기보다 토큰 기반으로 사용하는 것이 좋습니다. 특히 접근성의 **더 큰 텍스트** 설정이 적용될 때 하드코딩은 대응을 어렵게 만듭니다.

| Token | Font Size | Line Height | Usage |
|---|---:|---:|---|
| Typography 1 | 30 | 40 | 매우 큰 제목 |
| sub Typography 1 | 29 | 38 |  |
| sub Typography 2 | 28 | 37 |  |
| sub Typography 3 | 27 | 36 |  |
| Typography 2 | 26 | 35 | 큰 제목 |
| sub Typography 4 | 25 | 34 |  |
| sub Typography 5 | 24 | 33 | 조금 큰 제목 |
| sub Typography 6 | 23 | 32 |  |
| Typography 3 | 22 | 31 | 일반 제목 |
| sub Typography 7 | 21 | 30 |  |
| Typography 4 | 20 | 29 | 작은 제목 |
| sub Typography 8 | 19 | 28 | 조금 큰 본문 |
| sub Typography 9 | 18 | 27 |  |
| Typography 5 | 17 | 25.5 | 일반 본문 |
| sub Typography 10 | 16 | 24 |  |
| Typography 6 | 15 | 22.5 | 작은 본문 |
| sub Typography 11 | 14 | 21 |  |
| Typography 7 | 13 | 19.5 | 안 읽어도 됨 |
| sub Typography 12 | 12 | 18 |  |
| sub Typography 13 | 11 | 16.5 | 아예 안읽어도 됨 |

### 더 큰 텍스트

더 큰 텍스트는 iOS/Android 접근성 설정에 따라 텍스트 크기를 키우는 기능입니다.  
네이티브뿐 아니라 앱 내부 웹 페이지에도 동일한 방향성이 적용되어야 합니다.  
TDS는 플랫폼별 차이를 완전히 없애지는 못하더라도, 최대한 근사한 규칙으로 맞추는 방식을 제안합니다.

#### iOS

iOS는 제한된 단계의 larger text를 제공하므로, 이를 비율로 추상화해 Android/iOS/Web 간 규칙을 정렬합니다.

| 비율 | iOS 단계 |
|---:|---|
| 100% | Large |
| 110% | xLarge |
| 120% | xxLarge |
| 135% | xxxLarge |
| 160% | A11y_Medium |
| 190% | A11y_Large |
| 235% | A11y_xLarge |
| 275% | A11y_xxLarge |
| 310% | A11y_xxxLarge |

| Token | 100% | 110% | 120% | 135% | 160% | 190% | 235% | 275% | 310% |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Typography 1 | 30 | 32 | 34 | 36 | 40 | 41 | 41 | 42 | 42 |
| sub Typography 1 | 29 | 31 | 33 | 35 | 39 | 40 | 41 | 42 | 42 |
| sub Typography 2 | 28 | 30 | 32 | 34 | 38 | 39 | 40 | 41 | 41 |
| sub Typography 3 | 27 | 29 | 31 | 33 | 37 | 38 | 40 | 41 | 41 |
| Typography 2 | 26 | 28 | 30 | 32 | 36 | 38 | 40 | 41 | 41 |
| sub Typography 4 | 25 | 27 | 29 | 31 | 36 | 38 | 40 | 41 | 41 |
| sub Typography 5 | 24 | 26 | 28 | 30 | 35 | 37 | 39 | 40 | 40 |
| sub Typography 6 | 23 | 25 | 27 | 29 | 34 | 37 | 39 | 40 | 40 |
| Typography 3 | 22 | 24 | 26 | 28 | 33 | 36 | 39 | 40 | 40 |
| sub Typography 7 | 21 | 23 | 25 | 27 | 32 | 36 | 39 | 40 | 40 |
| Typography 4 | 20 | 22 | 24 | 26 | 31 | 35 | 38 | 39 | 40 |
| sub Typography 8 | 19 | 21 | 23 | 25 | 30 | 34 | 38 | 39 | 40 |
| sub Typography 9 | 18 | 20 | 22 | 24 | 28 | 33 | 37 | 38 | 39 |
| Typography 5 | 17 | 19 | 21 | 23 | 27 | 32 | 36 | 38 | 39 |
| sub Typography 10 | 16 | 18 | 20 | 22 | 26 | 30 | 34 | 37 | 39 |
| Typography 6 | 15 | 17 | 19 | 21 | 24 | 28 | 31 | 34 | 37 |
| sub Typography 11 | 14 | 16 | 18 | 20 | 23 | 26 | 29 | 32 | 36 |
| Typography 7 | 13 | 15 | 17 | 19 | 21 | 24 | 27 | 30 | 34 |
| sub Typography 12 | 12 | 14 | 16 | 18 | 20 | 22 | 25 | 28 | 32 |
| sub Typography 13 | 11 | 13 | 15 | 17 | 19 | 21 | 24 | 27 | 31 |

#### Android

Android는 100% 이상의 연속적인 비율을 지원합니다.  
따라서 각 토큰에 대해 `기본값 × NN × 0.01` 공식을 적용하고, 토큰별 최대값(Max)을 둡니다.

| Token | 100% | NN% 적용 공식 | Max |
|---|---:|---|---:|
| Typography 1 | 30 | `30 * NN * 0.01` | 42 |
| sub Typography 1 | 29 | `29 * NN * 0.01` | 42 |
| sub Typography 2 | 28 | `28 * NN * 0.01` | 41 |
| sub Typography 3 | 27 | `27 * NN * 0.01` | 41 |
| Typography 2 | 26 | `26 * NN * 0.01` | 41 |
| sub Typography 4 | 25 | `25 * NN * 0.01` | 41 |
| sub Typography 5 | 24 | `24 * NN * 0.01` | 40 |
| sub Typography 6 | 23 | `23 * NN * 0.01` | 40 |
| Typography 3 | 22 | `22 * NN * 0.01` | 40 |
| sub Typography 7 | 21 | `21 * NN * 0.01` | 40 |
| Typography 4 | 20 | `20 * NN * 0.01` | 40 |
| sub Typography 8 | 19 | `19 * NN * 0.01` | 40 |
| sub Typography 9 | 18 | `18 * NN * 0.01` | 39 |
| Typography 5 | 17 | `17 * NN * 0.01` | 39 |
| sub Typography 10 | 16 | `16 * NN * 0.01` | 39 |
| Typography 6 | 15 | `15 * NN * 0.01` | 37 |
| sub Typography 11 | 14 | `14 * NN * 0.01` | 36 |
| Typography 7 | 13 | `13 * NN * 0.01` | 34 |
| sub Typography 12 | 12 | `12 * NN * 0.01` | 32 |
| sub Typography 13 | 11 | `11 * NN * 0.01` | 31 |

---

# 2. WebView 튜토리얼

> Source: https://developers-apps-in-toss.toss.im/tutorials/webview.md

> Description: 앱인토스 미니앱을 WebView로 개발 시작할 때 사용하는 튜토리얼입니다. WebView로 프로젝트를 스캐폴딩하는 방법들을 담고 있습니다.

::: tip SDK 2.x 마이그레이션 안내
앱인토스 파트너사는 **SDK 2.x으로 반드시 마이그레이션해 주세요.**\
2026년 3월 23일 이후에는 SDK 1.x로 빌드한 번들을 콘솔에 업로드할 수 없어요.\
RN 0.84 테스트는 **2026년 3월 6일 업로드된 최신 샌드박스 앱**에서 진행해 주세요.\
자세한 내용은 [SDK 2.x 마이그레이션 가이드](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/SDK2.0.1.html)를 참고해 주세요.
:::

::: details 새 웹 프로젝트를 시작하시나요?
이 가이드에서는 이해를 돕기 위해 **Vite(React + TypeScript)** 기준으로 설명합니다.\
다른 빌드 환경을 사용하셔도 괜찮아요.

:::code-group

```bash[npm]
npm create vite@latest {project명} -- --template react-ts
cd {project명}
npm install
npm run dev
```

```bash[yarn]
yarn create vite {project명} --template react-ts
cd {project명}
yarn
yarn dev
```

```bash[pnpm]
pnpm create vite@latest {project명} --template react-ts
cd {project명}
pnpm install
pnpm dev
```

기존 웹 서비스가 이미 있으시다면, 아래 가이드에 따라 `@apps-in-toss/web-framework`를 설치해주세요.

:::

기존 웹 프로젝트에 `@apps-in-toss/web-framework`를 설치하면 앱인토스 샌드박스에서 바로 개발하고 배포할 수 있어요.

### 설치하기

기존 웹 프로젝트에 아래 명령어 중 사용하는 패키지 매니저에 맞는 명령어를 실행하세요.

::: code-group

```sh [npm]
npm install @apps-in-toss/web-framework
```

```sh [pnpm]
pnpm install @apps-in-toss/web-framework
```

```sh [yarn]
yarn add @apps-in-toss/web-framework
```

:::

### 환경 구성하기

`ait init` 명령어를 실행해 환경을 구성할 수 있어요.

1. `ait init` 명령어를 실행하세요.

::: code-group

```sh [npm]
npx ait init
```

```sh [pnpm]
pnpm ait init
```

```sh [yarn]
yarn ait init
```

:::

::: tip Cannot set properties of undefined (setting 'dev') 오류가 발생한다면?

package.json scripts 필드의 dev 필드에, 원래 사용하던 번들러의 개발 모드를 띄우는 커맨드를 입력 후 다시 시도해주세요.

:::

2. `web-framework`를 선택하세요.
3. 앱 이름(`appName`)을 입력하세요.

::: tip appName 입력 시 주의하세요

* 이 이름은 앱인토스 콘솔에서 앱을 만들 때 사용한 이름과 같아야 해요.
* 앱 이름은 각 앱을 식별하는 **고유한 키**로 사용돼요.
* appName은 `intoss://{appName}/path` 형태의 딥링크 경로나 테스트·배포 시 사용하는 앱 전용 주소 등에서도 사용돼요.
* 샌드박스 앱에서 테스트할 때도 `intoss://{appName}`으로 접근해요.\
  단, 출시하기 메뉴의 QR 코드로 테스트할 때는 `intoss-private://{appName}`이 사용돼요.
  :::

4. 웹 번들러의 dev 명령어를 입력해주세요.
5. 웹 번들러의 build 명령어를 입력해주세요.
6. 웹 개발 서버에서 사용할 포트 번호를 입력하세요.

#### 설정 파일 확인하기

설정을 완료하면 설정 파일인 `granite.config.ts` 파일이 생성돼요.\
자세한 설정 방법은 [공통 설정](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html) 문서를 확인해 주세요.

::: code-group

```ts [granite.config.ts]
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ping-pong', // 앱인토스 콘솔에서 설정한 앱 이름
  brand: {
    displayName: '%%appName%%', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: https://static.toss.im/appsintoss/0000/granite.png, // 콘솔에서 업로드한 이미지의 URL(콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어주세요)
  },
  web: {
    host: 'localhost', // 앱 내 웹뷰에 사용될 host
    port: 5173,
    commands: {
      dev: 'vite', // 개발 모드 실행 (webpack serve도 가능)
      build: 'vite build', // 빌드 명령어 (webpack도 가능)
    },
  },
  permissions: [],
});
```

:::

* `brand`: 앱 브랜드와 관련된 구성이에요.
  * `displayName`: 브릿지 뷰에 표시할 앱 이름이에요. 미니앱 이름과 동일하게 넣어주세요.
  * `icon`: 앱의 로고 이미지 URL을 입력해 주세요. 콘솔의 앱 정보에서 업로드한 이미지를 우클릭해 링크 복사 후 넣어 주세요.
  * `primaryColor`: Toss 디자인 시스템(TDS) 컴포넌트에서 사용할 대표 색상이에요. RGB HEX 형식(eg. `#3182F6`)으로 지정해요.
* `web.commands.dev` 필드는 `granite dev` 명령어 실행 시 함께 실행할 명령어예요. 번들러의 개발 모드를 시작하는 명령어를 입력해주세요.
* `web.commands.build` 필드는 `granite build` 명령어 실행 시 함께 실행할 명령어예요. 번들러의 빌드 명령어를 입력해주세요.
* `webViewProps.type` 미니앱에 맞게 내비게이션 바를 설정할 수 있어요.
  * `partner`: 비게임 파트너사 콘텐츠에 사용하는 기본 웹뷰예요. 다른 값을 설정하지 않으면 이 값이 기본으로 사용돼요.
  * `game`: 게임 미니앱에서 사용해요.

::: tip 웹 빌드 시 주의사항

`granite build`를 실행하면 `web.commands.build`가 실행되고, 이 과정에서 생성된 결과물을 바탕으로 `.ait` 파일을 만들어요. `web.commands.build`의 결과물은 `granite.config.ts`의 `outdir` 경로와 같아야 해요.

`outdir`의 기본값은 프로젝트 경로의 `dist` 폴더지만, 필요하면 `granite.config.ts`에서 수정할 수 있어요. 만약 빌드 결과물이 `outdir`과 다른 경로에 저장되면 배포가 정상적으로 이루어지지 않을 수 있으니 주의하세요.

:::

#### WebView TDS 패키지 설치하기

**TDS (Toss Design System)** 패키지는 웹뷰 기반 미니앱이 일관된 UI/UX를 유지하도록 돕는 토스의 디자인 시스템이에요.\
`@apps-in-toss/web-framework`를 사용하려면 TDS WebView 패키지를 추가로 설치해야 해요.\
모든 비게임 WebView 미니앱은 TDS 사용이 필수이며, 검수 승인 기준에도 포함돼요.

| @apps-in-toss/web-framework 버전 | 사용할 패키지              |
| -------------------------------- | -------------------------- |
| < 1.0.0                          | @toss-design-system/mobile |
| >= 1.0.0                         | @toss/tds-mobile           |

TDS에 대한 자세한 가이드는 [WebView TDS](https://tossmini-docs.toss.im/tds-mobile/)를 참고해주세요.

:::tip TDS 테스트
로컬 브라우저에서는 TDS가 동작하지 않아, 테스트할 수 없어요.\
번거로우시더라도 [샌드박스앱](https://developers-apps-in-toss.toss.im/development/test/sandbox)을 통한 테스트를 부탁드려요.
:::

### 서버 실행하기

#### 로컬 개발 서버 실행하기

로컬 개발 서버를 실행하면 웹 개발 서버와 React Native 개발 서버가 함께 실행돼요.
웹 개발 서버는 `granite.config.ts` 파일의 `web.commands.dev` 필드에 설정한 명령어를 사용해 실행돼요.

또, HMR(Hot Module Replacement)을 지원해서 코드 변경 사항을 실시간으로 반영할 수 있어요.

다음은 개발 서버를 실행하는 명령어에요.

Granite으로 스캐폴딩된 서비스는 `dev` 스크립트를 사용해서 로컬 서버를 실행할 수 있어요. 서비스의 루트 디렉터리에서 아래 명령어를 실행해 주세요.

::: code-group

```sh [npm]
npm run dev
```

```sh [pnpm]
pnpm run dev
```

```sh [yarn]
yarn dev
```

명령어를 실행하면 아래와 같은 화면이 표시돼요.
![Metro 실행 예시](https://developers-apps-in-toss.toss.im/assets/local-develop-js-1.B_LK2Zlw.png)

::: tip 실행 혹은 빌드시 '\[Apps In Toss Plugin] 플러그인 옵션이 올바르지 않습니다' 에러가 발생한다면?
'\[Apps In Toss Plugin] 플러그인 옵션이 올바르지 않습니다. granite.config.ts 구성을 확인해주세요.'\
라는 메시지가 보인다면, `granite.config.ts`의 `icon` 설정을 확인해주세요.\
아이콘을 아직 정하지 않았다면 ''(빈 문자열)로 비워둔 상태로도 테스트할 수 있어요.

```ts
...
displayName: 'test-app', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
icon: '',// 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
...
```

:::

#### 개발 서버를 실기기에서 접근 가능하게 설정하기

실기기에서 테스트하려면 번들러를 실행할 때 `--host` 옵션을 활성화하고, `web.host`를 실 기기에서 접근할 수 있는 네트워크 주소로 설정해야 해요.

```ts [granite.config.ts]
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'ping-pong',
  web: {
    host: '192.168.0.100', // 실 기기에서 접근할 수 있는 IP 주소로 변경
    port: 5173,
    commands: {
      dev: 'vite --host', // --host 옵션 활성화
      build: 'vite build',
    },
  },
  permissions: [],
});
```

### 미니앱 실행하기(시뮬레이터·실기기)

:::info 준비가 필요해요
미니앱은 샌드박스 앱을 통해서만 실행되기때문에 **샌드박스 앱(테스트앱)** 설치가 필수입니다.\
개발 및 테스트를 위해 [샌드박스앱](https://developers-apps-in-toss.toss.im/development/test/sandbox)을 설치해주세요.
:::

#### iOS 시뮬레이터(샌드박스앱)에서 실행하기

1. **앱인토스 샌드박스 앱**을 실행해요.
2. 샌드박스 앱에서 스킴을 실행해요. 예를 들어 서비스 이름이 `kingtoss`라면, `intoss://kingtoss`를 입력하고 "스키마 열기" 버튼을 눌러주세요.

아래는 로컬 서버를 실행한 후, iOS 시뮬레이터의 샌드박스앱에서 서버에 연결하는 예시예요.

#### iOS 실기기에서 실행하기

#### 서버 주소 입력하기

아이폰에서 **앱인토스 샌드박스 앱**을 실행하려면 로컬 서버와 같은 와이파이에 연결되어 있어야 해요. 아래 단계를 따라 설정하세요.

1. **샌드박스 앱**을 실행하면 **"로컬 네트워크" 권한 요청 메시지**가 표시돼요. 이때 **"허용"** 버튼을 눌러주세요.

2) **샌드박스 앱**에서 서버 주소를 입력하는 화면이 나타나요.

3) 컴퓨터에서 로컬 서버 IP 주소를 확인하고, 해당 주소를 입력한 뒤 저장해주세요.
   * IP 주소는 한 번 저장하면 앱을 다시 실행해도 변경되지 않아요.
   * macOS를 사용하는 경우, 터미널에서 `ipconfig getifaddr en0` 명령어로 로컬 서버의 IP 주소를 확인할 수 있어요.

4) **"스키마 열기"** 버튼을 눌러주세요.

5) 화면 상단에 `Bundling {n}%...` 텍스트가 표시되면 로컬 서버에 성공적으로 연결된 거예요.

::: details "로컬 네트워크"를 수동으로 허용하는 방법
**"로컬 네트워크" 권한을 허용하지 못한 경우, 아래 방법으로 수동 설정이 가능해요.**

1. 아이폰의 \[설정] 앱에서 **"앱인토스"** 를 검색해 이동해요.
2. **"로컬 네트워크"** 옵션을 찾아 켜주세요.

:::

***

#### Android 실기기 또는 에뮬레이터 연결하기

1. Android 실기기(휴대폰 또는 태블릿)를 컴퓨터와 USB로 연결하세요. ([USB 연결 가이드](https://developers-apps-in-toss.toss.im/development/client/android.html#기기-연결하기))

2. `adb` 명령어를 사용해서 `8081` 포트와 `5173`포트를 연결하고 연결 상태를 확인해요.

   **8081 포트, 5173 포트 연결하기**

   기기가 하나만 연결되어 있다면 아래 명령어만 실행해도 돼요.

   ```shell
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:5173 tcp:5173
   ```

   특정 기기를 연결하려면 `-s` 옵션과 디바이스 아이디를 추가해요.

   ```shell
   adb -s {디바이스아이디} reverse tcp:8081 tcp:8081
   # 예시: adb -s R3CX30039GZ reverse tcp:8081 tcp:8081
   adb -s {디바이스아이디} reverse tcp:5173 tcp:5173
   # 예시: adb -s R3CX30039GZ reverse tcp:5173 tcp:5173
   ```

   **연결 상태 확인하기**

   연결된 기기와 포트를 확인하려면 아래 명령어를 사용하세요.

   ```shell
   adb reverse --list
   # 연결된 경우 예시: UsbFfs tcp:8081 tcp:8081

   ```

   특정 기기를 확인하려면 `-s` 옵션을 추가해요.

   ```shell
   adb -s {디바이스아이디} reverse --list
   # 예시: adb -s R3CX30039GZ reverse --list

   # 연결된 경우 예시: UsbFfs tcp:8081 tcp:8081
   ```

3. **앱인토스 샌드박스 앱**에서 스킴을 실행하세요. 예를 들어, 서비스 이름이 `kingtoss`라면 `intoss://kingtoss`를 입력하고 실행 버튼을 누르세요.

   아래는 Android 시뮬레이터에서 로컬 서버를 연결한 후 서비스를 표시하는 예시예요.

#### 자주 쓰는 `adb` 명령어 (Android)

개발 중에 자주 쓰는 `adb` 명령어를 정리했어요.

##### 연결 끊기

```shell
adb kill-server
```

##### 8081 포트 연결하기

```shell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5173 tcp:5173
## 특정 기기 연결: adb -s {디바이스아이디} reverse tcp:8081 tcp:8081
```

##### 연결 상태 확인하기

```shell
adb reverse --list
## 특정 기기 확인: adb -s {디바이스아이디} reverse --list
```

#### 트러블슈팅

::: details Q. `서버에 연결할 수 없습니다` 에러가 발생해요.

`granite.config.ts` 의 `web.commands`에 '--host'를 추가 후, 서비스를 실행하여 어떤 호스트 주소로 서비스가 실행되는지 확인해요

```tsx
// granite.config.ts
  web: {
    ...
    commands: {
      dev: 'vite --host', // --host를 추가해요.
      build: 'tsc -b && vite build',
    },
    ...
  },
```

'--host' 추가 후, 서비스를 실행하여 주소를 확인해요

```tsx
// granite.config.ts
  web: {
     host: 'x.x.x.x', // 서비스가 실행되는 호스트 주소를 입력해요.
     ...
  },
```

샌드박스 앱에서 서비스 실행 전, metro 서버 주소도 호스트 주소로 변경해주세요.
:::

::: details Q. Metro 개발 서버가 열려 있는데 `잠시 문제가 생겼어요`라는 메시지가 표시돼요.

개발 서버에 제대로 연결되지 않은 문제일 수 있어요. `adb` 연결을 끊고 다시 `8081` 포트를 연결하세요.
:::

::: details Q. PC웹에서 Not Found 오류가 발생해요.

8081 포트는 샌드박스 내에서 인식하기 위한 포트예요.\
PC웹에서 8081 포트는 Not Found 오류가 발생해요.
:::

### 토스앱에서 테스트하기

토스앱에서 테스트하는 방법은 [토스앱](https://developers-apps-in-toss.toss.im/development/test/toss) 문서를 참고하세요.

### 출시하기

출시하는 방법은 [미니앱 출시](https://developers-apps-in-toss.toss.im/development/deploy) 문서를 참고하세요.

---

# 3. React Native 튜토리얼

> Source: https://developers-apps-in-toss.toss.im/tutorials/react-native.md

> Description: >-   앱인토스 미니앱을 React Native로 개발 시작할 때 사용하는 튜토리얼입니다. React Native로 프로젝트를 스캐폴딩하는 방법들을   담고 있습니다.

::: tip SDK 2.x 마이그레이션 안내
앱인토스 파트너사는 **SDK 2.x으로 반드시 마이그레이션해 주세요.**\
2026년 3월 23일 이후에는 SDK 1.x로 빌드한 번들을 콘솔에 업로드할 수 없어요.\
RN 0.84 테스트는 **2026년 3월 6일 업로드된 최신 샌드박스 앱**에서 진행해 주세요.\
자세한 내용은 [SDK 2.x 마이그레이션 가이드](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/SDK2.0.1.html)를 참고해 주세요.
:::

:::tip 기존 RN 프로젝트가 있는 경우
이미 React Native로 만든 서비스가 있어도 앱인토스에서 동작하려면 **Granite 기반으로 스캐폴딩** 해야 해요.\
:::

Granite을 사용해 "Welcome!"페이지가 표시되는 서비스를 만들어볼게요.\
이를 통해 로컬 서버를 연결하는 방법과 파일 기반 라우팅을 배울 수 있어요.

### 스캐폴딩

앱을 만들 위치에서 다음 명령어를 실행하세요.

이 명령어는 프로젝트를 초기화하고 필요한 파일과 디렉토리를 자동으로 생성해요.

::: code-group

```sh [npm]
$ npm create granite-app
```

```sh [pnpm]
$ pnpm create granite-app
```

```sh [yarn]
$ yarn create granite-app
```

:::

#### 1. 앱 이름 지정하기

앱 이름은 [kebab-case](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case) 형식으로 만들어 주세요.
예를 들어, 아래와 같이 입력해요.

```shell
## 예시
my-granite-app
```

#### 2. 도구 선택하기

`granite`에서는 프로젝트를 생성할 때 필요한 도구를 선택할 수 있어요. 현재 제공되는 선택지는 다음 두 가지예요. 둘 중 한 가지 방법을 선택해서 개발 환경을 세팅하세요.

* `prettier` + `eslint`: 코드 포맷팅과 린팅을 각각 담당하며, 세밀한 설정과 다양한 플러그인으로 유연한 코드 품질 관리를 지원해요.
* `biome`: Rust 기반의 빠르고 통합적인 코드 포맷팅과 린팅 도구로, 간단한 설정으로 효율적인 작업이 가능해요.

#### 3. 의존성 설치하기

프로젝트 디렉터리로 이동한 뒤, 사용 중인 패키지 관리자에 따라 의존성을 설치하세요.

::: code-group

```sh [npm]
$ cd my-granite-app
$ npm install
```

```sh [pnpm]
$ cd my-granite-app
$ pnpm install
```

```sh [yarn]
$ cd my-granite-app
$ yarn install
```

:::

#### 스캐폴딩 전체 예시

아래는 `my-granite-app`이라는 이름으로 새로운 앱을 스캐폴딩한 결과예요.

스캐폴딩을 마쳤다면 프로젝트 구조가 생성돼요.

### 환경 구성하기

ReactNative SDK를 이용해 번들 파일을 생성하고 출시하는 방법을 소개해요.

#### 설치하기

앱인토스 미니앱을 개발하려면 `@apps-in-toss/framework` 패키지를 설치해야 해요. 사용하는 패키지 매니저에 따라 아래 명령어를 실행하세요.

::: code-group

```sh [npm]
$ npm install @apps-in-toss/framework
```

```sh [pnpm]
$ pnpm install @apps-in-toss/framework
```

```sh [yarn]
$ yarn add @apps-in-toss/framework
```

:::

#### 설정파일 구성하기

`ait init` 명령어로 앱 개발에 필요한 기본 환경을 구성할 수 있어요.\
자세한 설정 방법은 [공통 설정](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html) 문서를 확인해 주세요.

1. 아래 명령어 중 사용하는 패키지 관리자에 맞는 명령어를 실행하세요.\
   ::: code-group

   ```sh [npm]
    npx ait init
   ```

   ```sh [pnpm]
    pnpm ait init
   ```

   ```sh [yarn]
    yarn ait init
   ```

   :::

2. 프레임워크를 선택하세요.

3. 앱 이름(`appName`)을 입력하세요.

   이 이름은 앱인토스 콘솔에서 앱을 만들 때 사용한 이름과 같아야 해요. 앱인토스 콘솔에서 앱 이름을 확인할 수 있어요.

모든 과정을 완료하면 프로젝트 루트에 `granite.config.ts` 파일이 생성돼요. 이 파일은 앱 설정을 관리하는 데 사용돼요.\
자세한 설정 방법은 [공통 설정](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.html) 문서를 확인해 주세요.

::: code-group

```ts [granite.config.ts]
import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  appName: '<app-name>',
  plugins: [
    appsInToss({
      brand: {
        displayName: '%%appName%%', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
        primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
        icon: null, // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
      },
      permissions: [],
    }),
  ],
});
```

:::

* `<app-name>`: 앱인토스에서 만든 앱 이름이에요.
* `brand`: 앱 브랜드와 관련된 구성이에요.
  * `displayName`: 내비게이션 바에 표시할 앱 이름이에요.
  * `icon`: 앱 아이콘 이미지 주소예요. 사용자에게 앱 브랜드를 전달해요.
  * `primaryColor`: Toss 디자인 시스템(TDS) 컴포넌트에서 사용할 대표 색상이에요. RGB HEX 형식(eg. `#3182F6`)으로 지정해요.
* `permissions`: [권한이 필요한 함수 앱 설정하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/권한/permission) 문서를 참고해서 설정하세요.

#### React Native TDS 패키지 설치하기

**TDS (Toss Design System)** 패키지는 RN 기반 미니앱이 일관된 UI/UX를 유지하도록 돕는 토스의 디자인 시스템이에요.\
`@apps-in-toss/framework`를 사용하려면 TDS React Native 패키지를 추가로 설치해야 해요.\
모든 비게임 React Native 미니앱은 TDS 사용이 필수이며, 검수 승인 기준에도 포함돼요.

| @apps-in-toss/framework 버전 | 사용할 패키지                    |
| ---------------------------- | -------------------------------- |
| < 1.0.0                      | @toss-design-system/react-native |
| >= 1.0.0                     | @toss/tds-react-native           |

TDS에 대한 자세한 가이드는 [React Native TDS](https://tossmini-docs.toss.im/tds-react-native/)를 참고해 주세요.

:::tip TDS 테스트
로컬 브라우저에서는 TDS가 동작하지 않아, 테스트할 수 없어요.\
번거로우시더라도 [샌드박스앱](https://developers-apps-in-toss.toss.im/development/test/sandbox)을 통한 테스트를 부탁드려요.
:::

#### 번들 파일 생성하기

번들 파일은 `.ait` 확장자를 가진 파일로, 빌드된 프로젝트를 패키징한 결과물이에요. 이를 생성하려면 아래 명령어를 실행하세요.

::: code-group

```sh [npm]
npm run build
```

```sh [pnpm]
pnpm build
```

```sh [yarn]
yarn build
```

:::

위 명령어를 실행하면 프로젝트 루트 디렉터리에 `<서비스명>.ait` 파일이 생성돼요. 해당 파일은 앱을 출시할 때 사용해요.

#### 앱 출시하기

앱을 출시하는 방법은 [앱 출시하기](https://developers-apps-in-toss.toss.im/development/test/toss)문서를 참고하세요.

### 코드 확인해보기

프로젝트의 `_app.tsx` 파일에 다음과 같은 코드가 들어있을 거예요.

::: code-group

```tsx [_app.tsx]
import { AppsInToss } from '@apps-in-toss/framework';
import { PropsWithChildren } from 'react';
import { InitialProps } from '@granite-js/react-native';
import { context } from '../require.context';

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return <>{children}</>;
}

export default AppsInToss.registerApp(AppContainer, { context });
```

:::

#### 스캐폴딩 된 코드 알아보기

스캐폴딩 명령어를 실행하면 다음과 같은 파일이 생성돼요.

::: code-group

```tsx [/pages/index.tsx]
import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export const Route = createRoute('/', {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();

  const goToAboutPage = () => {
    navigation.navigate('/about');
  };

  return (
    <Container>
      <Text style={styles.title}>🎉 Welcome! 🎉</Text>
      <Text style={styles.subtitle}>
        This is a demo page for the <Text style={styles.brandText}>Granite</Text> Framework.
      </Text>
      <Text style={styles.description}>This page was created to showcase the features of the Granite.</Text>
      <TouchableOpacity style={styles.button} onPress={goToAboutPage}>
        <Text style={styles.buttonText}>Go to About Page</Text>
      </TouchableOpacity>
    </Container>
  );
}

function Container({ children }: { children: React.ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: '#0064FF',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 24,
    color: '#202632',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#0064FF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  codeContainer: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    width: '100%',
  },
  code: {
    color: 'white',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    fontSize: 14,
  },
});
```

:::

### 파일 기반 라우팅 이해하기

Granite 개발 환경은 Next.js와 비슷한 [파일 시스템 기반의 라우팅](https://nextjs.org/docs/app/building-your-application/routing#roles-of-folders-and-files)을 사용해요.

파일 기반 라우팅은 파일 구조에 따라 자동으로 경로(URL 또는 스킴)가 결정되는 시스템이에요. 예를 들어, pages라는 디렉토리에 `detail.ts` 파일이 있다면, 이 파일은 자동으로 `/detail` 경로로 연결돼요.

Granite 애플리케이션에서는 이 개념이 스킴과 연결돼요. 스킴은 특정 화면으로 연결되는 주소인데요. 예를 들어, `pages/detail.ts`라는 파일은 자동으로 `intoss://my-granite-app/detail` 이라는 스킴으로 접근할 수 있는 화면이에요. 모든 Granite 화면은 `intoss://` 스킴으로 시작해요.

```
my-granite-app
└─ pages
    ├─ index.tsx       // intoss://my-granite-app
    ├─ detail.tsx      // intoss://my-granite-app/detail
    └─ item
        ├─ index.tsx    // intoss://my-granite-app/item
        └─ detail.tsx    // intoss://my-granite-app/item/detail
```

* `index.tsx` 파일: `intoss://my-granite-app`
* `detail.tsx` 파일: `intoss://my-granite-app/detail`
* `item/index.tsx` 파일: `intoss://my-granite-app/item`
* `item/detail.tsx` 파일: `intoss://my-granite-app/item/detail`

```jsx
┌─ 모든 Granite 화면을 가리키는 스킴은
│  intoss:// 으로 시작해요
│
-------------
intoss://my-granite-app/detail
         ==============~~~~~~~
             │           └─ pages 하위에 있는 경로를 나타내요
             │
             └─ 서비스 이름을 나타내요
```

이렇게 개발자는 별도로 라우팅 설정을 하지 않아도, 파일을 추가하기만 하면 새로운 화면이 자동으로 설정돼요.

### 서버 실행하기

#### 로컬 개발 서버 실행하기

이제 여러분만의 Granite 페이지를 만들 준비가 끝났어요. 🎉
다음으로 로컬에서 `my-granite-app` 서비스를 실행해 볼게요.

::: tip 앱 실행 환경을 먼저 설정하세요.

* [iOS 환경설정](https://developers-apps-in-toss.toss.im/development/client/ios)
* [Android 환경설정](https://developers-apps-in-toss.toss.im/development/client/android)

:::

스캐폴딩된 프로젝트 디렉터리로 이동한 뒤, 선택한 패키지 매니저를 사용해 `dev` 스크립트를 실행하세요. 이렇게 하면 개발 서버가 시작돼요.

::: code-group

```sh [npm]
$ cd my-granite-app
$ npm run dev
```

```sh [pnpm]
$ cd my-granite-app
$ pnpm dev
```

```sh [yarn]
$ cd my-granite-app
$ yarn dev
```

:::

명령어를 실행하면 아래와 같은 화면이 표시돼요.
![Metro 실행 예시](https://developers-apps-in-toss.toss.im/assets/local-develop-js-1.B_LK2Zlw.png)

::: tip 참고하세요
개발 서버 실행 중 too many open files 에러가 발생한다면, node\_modules 디렉터리를 삭제한 뒤 다시 의존성을 설치해 보세요.

```sh
rm -rf node_modules
npm install  # 또는 yarn, pnpm에 맞게
```

:::

::: tip 실행 혹은 빌드시 '\[Apps In Toss Plugin] 플러그인 옵션이 올바르지 않습니다' 에러가 발생한다면?
'\[Apps In Toss Plugin] 플러그인 옵션이 올바르지 않습니다. granite.config.ts 구성을 확인해주세요.'\
라는 메시지가 보인다면, `granite.config.ts`의 `icon` 설정을 확인해주세요.\
아이콘을 아직 정하지 않았다면 ''(빈 문자열)로 비워둔 상태로도 테스트할 수 있어요.

```ts
...
displayName: 'test-app', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
icon: '',// 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
...
```

:::

### 미니앱 실행하기(시뮬레이터·실기기)

:::info 준비가 필요해요
미니앱은 샌드박스 앱을 통해서만 실행되기때문에 **샌드박스 앱(테스트앱)** 설치가 필수입니다.\
개발 및 테스트를 위해 [샌드박스앱](https://developers-apps-in-toss.toss.im/development/test/sandbox)을 설치해주세요.
:::

#### iOS 시뮬레이터(샌드박스앱)에서 실행하기

1. **앱인토스 샌드박스 앱**을 실행해요.
2. 샌드박스 앱에서 스킴을 실행해요. 예를 들어 서비스 이름이 `kingtoss`라면, `intoss://kingtoss`를 입력하고 "스키마 열기" 버튼을 눌러주세요.
3. Metro 서버가 실행 중이라면 시뮬레이터와 자동으로 연결돼요. 화면 상단에 `Bundling {n}%...`가 표시되면 연결이 성공한 거예요.

아래는 iOS 시뮬레이터에서 로컬 서버를 연결한 후 "Welcome!" 페이지를 표시하는 예시예요.

#### iOS 실기기에서 실행하기

#### 서버 주소 입력하기

아이폰에서 **앱인토스 샌드박스 앱**을 실행하려면 로컬 서버와 같은 와이파이에 연결되어 있어야 해요. 아래 단계를 따라 설정하세요.

1. **샌드박스 앱**을 실행하면 **"로컬 네트워크" 권한 요청 메시지**가 표시돼요. 이때 **"허용"** 버튼을 눌러주세요.

2) **샌드박스 앱**에서 서버 주소를 입력하는 화면이 나타나요.

3) 컴퓨터에서 로컬 서버 IP 주소를 확인하고, 해당 주소를 입력한 뒤 저장해주세요.
   * IP 주소는 한 번 저장하면 앱을 다시 실행해도 변경되지 않아요.
   * macOS를 사용하는 경우, 터미널에서 `ipconfig getifaddr en0` 명령어로 로컬 서버의 IP 주소를 확인할 수 있어요.

4) **"스키마 열기"** 버튼을 눌러주세요.

5) 화면 상단에 `Bundling {n}%...` 텍스트가 표시되면 로컬 서버에 성공적으로 연결된 거예요.

::: details "로컬 네트워크"를 수동으로 허용하는 방법
**"로컬 네트워크" 권한을 허용하지 못한 경우, 아래 방법으로 수동 설정이 가능해요.**

1. 아이폰의 \[설정] 앱에서 **"앱인토스"** 를 검색해 이동해요.
2. **"로컬 네트워크"** 옵션을 찾아 켜주세요.

:::

***

#### Android 실기기 또는 에뮬레이터 연결하기

1. Android 실기기(휴대폰 또는 태블릿)를 컴퓨터와 USB로 연결하세요. ([USB 연결 가이드](https://developers-apps-in-toss.toss.im/development/client/android.html#기기-연결하기))

2. `adb` 명령어를 사용해서 `8081` 포트와 `5173`포트를 연결하고 연결 상태를 확인해요.

   **8081 포트, 5173 포트 연결하기**

   기기가 하나만 연결되어 있다면 아래 명령어만 실행해도 돼요.

   ```shell
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:5173 tcp:5173
   ```

   특정 기기를 연결하려면 `-s` 옵션과 디바이스 아이디를 추가해요.

   ```shell
   adb -s {디바이스아이디} reverse tcp:8081 tcp:8081
   # 예시: adb -s R3CX30039GZ reverse tcp:8081 tcp:8081
   adb -s {디바이스아이디} reverse tcp:5173 tcp:5173
   # 예시: adb -s R3CX30039GZ reverse tcp:5173 tcp:5173
   ```

   **연결 상태 확인하기**

   연결된 기기와 포트를 확인하려면 아래 명령어를 사용하세요.

   ```shell
   adb reverse --list
   # 연결된 경우 예시: UsbFfs tcp:8081 tcp:8081

   ```

   특정 기기를 확인하려면 `-s` 옵션을 추가해요.

   ```shell
   adb -s {디바이스아이디} reverse --list
   # 예시: adb -s R3CX30039GZ reverse --list

   # 연결된 경우 예시: UsbFfs tcp:8081 tcp:8081
   ```

3. **앱인토스 샌드박스 앱**에서 스킴을 실행하세요. 예를 들어, 서비스 이름이 `kingtoss`라면 `intoss://kingtoss`를 입력하고 실행 버튼을 누르세요.

4. Metro 서버가 실행 중이라면 실기기 또는 에뮬레이터와 자동으로 연결돼요. 화면 상단에 번들링 프로세스가 진행 중이면 연결이 완료된 거예요.

   아래는 Android 시뮬레이터에서 로컬 서버를 연결한 후 "Welcome!" 페이지를 표시하는 예시예요.

#### 자주 쓰는 `adb` 명령어(Android)

개발 중에 자주 쓰는 `adb` 명령어를 정리했어요.

##### 연결 끊기

```shell
adb kill-server
```

##### 8081 포트 연결하기

```shell
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5173 tcp:5173
## 특정 기기 연결: adb -s {디바이스아이디} reverse tcp:8081 tcp:8081
```

##### 연결 상태 확인하기

```shell
adb reverse --list
## 특정 기기 확인: adb -s {디바이스아이디} reverse --list
```

#### 트러블슈팅

::: details Q. Metro 개발 서버가 열려 있는데 `잠시 문제가 생겼어요`라는 메시지가 표시돼요.

개발 서버에 제대로 연결되지 않은 문제일 수 있어요. `adb` 연결을 끊고 다시 `8081` 포트를 연결하세요.
:::

::: details Q. PC웹에서 Not Found 오류가 발생해요.

8081 포트는 샌드박스 내에서 인식하기 위한 포트예요.\
PC웹에서 8081 포트는 Not Found 오류가 발생해요.
:::

::: details 연결 가능한 기기가 없다고 떠요

React Native View가 나타나는 시점에 개발 서버와 기기가 연결됩니다. 만약 연결 가능한 기기가 없다고 뜬다면, 개발 서버가 제대로 빌드되고 있는지 확인해 보세요. 다음 화면처럼 개발 서버가 빌드를 시작했다면 기기와의 연결이 정상적으로 이루어진 것입니다.

![개발 서버 연결 상태 확인 이미지](https://developers-apps-in-toss.toss.im/assets/debugging-22.B1aIn4qo.png)
:::

::: details REPL가 동작하지 않아요

React Native의 버그로 인해 가끔 REPL이 멈추는 현상이 발생할 수 있어요. 이 문제를 해결하려면, 콘솔 탭 옆에 있는 눈 모양 아이콘을 클릭하고 입력 필드에 임의의 코드를 작성하고 평가해 보세요. 예를 들어 `__DEV__`, `1`, `undefined` 등의 코드를 입력하면 돼요.

![REPL 프리징 해결 방법 이미지](https://developers-apps-in-toss.toss.im/resources/learn-more/debugging/debugging-23.png)

:::

::: details 네트워크 인스펙터가 동작하지 않아요

React Native 애플리케이션에서 여러 개의 인스턴스가 생성될 수 있는데, 현재 네트워크 인스펙터는 다중 인스턴스를 지원하지 않아요. 따라서 가장 최근에 생성된 인스턴스와만 데이터를 주고받게 됩니다. 이로 인해 소켓 커넥션이 꼬여 네이티브에서 전송하는 데이터를 인스펙터가 받지 못할 수 있어요.

이 문제를 해결하려면 다음을 시도해 보세요.

1. 앱을 완전히 종료해요.
2. 개발 서버를 중단하고 네트워크 인스펙터를 닫아요.
3. 앱을 다시 시작하고 `dev` 스크립트를 실행해 개발 서버를 재실행해요.

이 절차로도 문제가 해결되지 않으면, 담당자에게 제보해 주세요.

:::

### 토스앱에서 테스트하기

토스앱에서 테스트하는 방법은 [토스앱](https://developers-apps-in-toss.toss.im/development/test/toss) 문서를 참고하세요.

### 출시하기

출시하는 방법은 [미니앱 출시](https://developers-apps-in-toss.toss.im/development/deploy) 문서를 참고하세요.

---

# 4. iOS 환경설정

> Source: https://developers-apps-in-toss.toss.im/development/client/ios.md

> Description: >-   React Native 앱인토스 개발을 위한 iOS 환경 설정 가이드입니다. Xcode 설치, Command Line Tools 설정,   시뮬레이터 실행 및 샌드박스 앱 설치 방법을 확인하세요.

React Native 앱을 개발하기 위해 **iOS 개발 환경 설정 방법**을 안내해요.

::: tip iOS의 서드파티 쿠키 차단 정책
iOS/iPadOS 13.4 이상에서는 **서드파티 쿠키가 완전히 차단**돼요.\
앱인토스 도메인이 아닌 파트너사 도메인에서 **쿠키 기반 로그인**을 구현하면 정상 동작하지 않아요.

* 공식 안내: [Full third-party cookie blocking](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
* **토큰 기반 등 대체 인증 방식**을 적용해주세요.
  :::

### 1. XCode 설치

iOS에서 React Native 앱을 테스트하려면 iOS 시뮬레이터가 필요해요. 시뮬레이터를 사용하려면 먼저 **Xcode**를 설치해 주세요.

* [XCode 최신버전 다운로드 링크](https://apps.apple.com/kr/app/xcode/id497799835?mt=12)를 클릭해서 Mac App Store에서 설치해 주세요.

### 2. iOS 컴포넌트 설치

Xcode를 처음 설치한 경우, iOS 시뮬레이터를 사용하려면 iOS 15 이상의 컴포넌트를 추가로 설치해야 해요.\
아래와 같은 창이 표시되면 iOS를 선택해 설치해 주세요.

### 3. XCode Command Line Tools 설치

Xcode를 제대로 사용하려면 **Xcode Command Line Tools**가 설치되어야 하며, **Xcode 본체와 버전이 동일해야** 해요. 아래 단계를 따라 확인해 보세요.

**XCode 버전 확인하기**

1. XCode를 열고 상단 메뉴에서 \[XCode] > \[About XCode] 를 클릭하세요.
2. 화면에 표시된 버전을 확인하세요.

**XCode Command Line Tools 버전 확인하기**

1. XCode에서 \[XCode] > \[Settings] 를 클릭하세요.
2. \[Locations] 탭으로 이동한 뒤, Command Line Tools 항목의 버전을 확인하세요.

### 4. 시뮬레이터 실행

Xcode 설치와 설정이 끝났다면 시뮬레이터를 실행해서 테스트 환경이 준비되었는지 확인해 보세요.

1. XCode 상단 메뉴에서 \[XCode] > \[Open Developer Tool] > \[Simulator] 를 선택하세요.
2. 실행된 시뮬레이터에서 iOS 15 이상의 버전을 사용할 수 있는지 확인하세요.

::: details **시뮬레이터가 보이지 않는다면?**
시뮬레이터가 실행되지 않거나 보이지 않을 경우, 아래 단계를 따라 실행해 보세요.

1. Simulator 앱을 열어요.
2. 상단 메뉴에서 \[File] > \[Open Simulator] 를 클릭하세요.
3. iOS 15 이상 버전을 선택한 뒤, 원하는 기기를 선택하세요.

### 5. 앱인토스 샌드박스 앱 설치

#### 1. 앱인토스 샌드박스 앱 다운로드 받기

* [앱인토스 샌드박스 앱 다운로드](https://developers-apps-in-toss.toss.im/development/test/sandbox)

#### 2. 앱 설치하기

1. 다운로드한 **앱인토스 샌드박스 앱 파일을 시뮬레이터 화면으로 드래그 앤드 드롭**하세요.
2. 설치가 완료되면 앱이 시뮬레이터 홈 화면에 표시돼요.

앱 설치 후 완료되기까지 약간의 시간이 걸릴 수 있어요. 잠시 기다려 주세요.

### 6. 실기기 설치

앱인토스 샌드박스 앱은 **앱스토어에서 다운로드받을 수 있어요.**\
아래 가이드를 따라 iOS 실기기에 설치해 주세요.

* [앱인토스 샌드박스 앱 다운로드](https://developers-apps-in-toss.toss.im/development/test/sandbox)

---

# 5. 샌드박스 테스트앱

> Source: https://developers-apps-in-toss.toss.im/development/test/sandbox.md

> Description: 앱인토스 샌드박스 앱을 이용한 개발 및 테스트 가이드입니다. 샌드박스 앱 설치, 로그인, 앱 선택, 로컬 서버 연결 방법을 확인하세요.

앱인토스는 개발용 토스앱을 별도로 제공하지 않아요.\
대신 **전용 샌드박스 앱**을 통해 개발·테스트 환경을 구성할 수 있어요.

::: tip SDK 2.x 마이그레이션 안내
앱인토스 파트너사는 **SDK 2.x으로 반드시 마이그레이션해 주세요.**\
2026년 3월 23일 이후에는 SDK 1.x로 빌드한 번들을 콘솔에 업로드할 수 없어요.\
RN 0.84 테스트는 **2026년 3월 6일 업로드된 최신 샌드박스 앱**에서 진행해 주세요.\
자세한 내용은 [SDK 2.x 마이그레이션 가이드](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/SDK2.0.1.html)를 참고해 주세요.
:::

::: tip 반드시 확인해주세요
실서비스 출시 전, 샌드박스 앱에서 기능 검증을 완료해야 해요.\
샌드박스 앱에서 테스트를 완료했더라도, 출시 검수에서 가이드에 위반한 사항이 있다면 반려될 수 있어요.
:::

### 샌드박스 앱이란?

앱인토스는 토스앱 안에서 파트너사의 서비스를 **앱인앱(App-in-App)** 형태로 제공해요.\
별도의 개발용 토스앱 대신, **개발·QA 전용 샌드박스 앱**을 통해 연동 테스트를 진행할 수 있어요.

샌드박스 앱을 설치한 뒤 아래 순서로 개발을 시작하세요.

1. 로그인
2. 앱 선택
3. 스킴(URL) 접속

| 구분        | 빌드번호   | 샌드박스 앱 다운로드                                                                                                                            |
| ----------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Android     | 2026-03-20 | 다운로드                             |
| iOS         | 2026-03-26 | 다운로드                             |
| iOS(실기기) | 2026-03-11 |  |

::: tip App Transport Security (ATS)
App Transport Security(ATS) 정책 위반을 방지하기 위해 **샌드박스 앱에서는 http 통신이 허용**돼요.\
단, 라이브 환경에서는 **https만 지원**되므로, http 기반 기능은 샌드박스에서만 정상 동작해요.
:::

#### 지원 OS 버전

OS의 최신 기능과 보안 개선 사항을 적용하기 위해, 최신 버전 환경 사용을 권장합니다.
| 구분 | 버전 |
|-----|-----|
|Android|Android 7|
|iOS|iOS 16|

### 샌드박스 앱 사용하기

#### 1. 최신 버전 설치

샌드박스 앱은 수시로 업데이트돼요. 오류가 보이면 **최신 버전으로 업데이트**해 주세요.

#### 2. 개발자 로그인

콘솔에서 사용하는 토스 비즈니스 계정으로 로그인하세요.\
토스 비즈니스 가입이 필요하다면 [콘솔에서 앱 등록하기](https://developers-apps-in-toss.toss.im/prepare/console-workspace)를 확인해 주세요.

#### 3. 앱 선택

소속된 워크스페이스의 앱 목록이 노출돼요. **테스트할 앱**을 선택하세요.

#### 4. 토스 인증

콘솔에 등록한 **토스 계정**으로 본인 인증을 진행해요.\
해당 계정의 **토스앱이 설치된 스마트폰**에서 푸시를 열어 인증을 완료해 주세요.

#### 5. 앱 스킴(URL)로 접속

접속할 스킴을 입력하면 미니앱이 실행돼요.

```
intoss://{appName}
```

### 샌드박스에서 테스트 가능한 기능

샌드박스에서 바로 확인 가능한 항목이에요.\
샌드박스에서 미지원인 경우에는 콘솔 ‘출시하기’의 QR 코드로 토스앱에서 테스트해 주세요.

| 기능                   | 테스트 가능 여부                 |
| ---------------------- | -------------------------------- |
| 토스 로그인            | ✅ 가능                          |
| 게임 로그인            | ✅ 가능 (단, mock 데이터 내려감) |
| 토스 페이              | ✅ 가능                          |
| 인앱 결제              | ✅ 가능                          |
| 게임 프로필 & 리더보드 | ✅ 가능                          |
| 분석                   | ❌ 불가능                        |
| 공유 리워드            | ❌ 불가능                        |
| 인앱 광고              | ❌ 불가능                        |
| 가로 버전 게임         | ❌ 불가능                        |
| 내비게이션 바 공유하기 | ❌ 불가능                        |

### 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: "샌드박스에서 테스트 진행이 잘 안돼요.",
a: \`샌드박스 개발자 로그인을 진행해 주세요.

---

# 6. 토스앱 테스트/배포

> Source: https://developers-apps-in-toss.toss.im/development/test/toss.md

> Description: 토스 앱에서 미니앱을 테스트하는 방법을 안내합니다. 앱 번들 생성 및 업로드, QR 코드 테스트, 피처 테스트 방법을 확인하세요.

샌드박스 앱에서 테스트가 완료되었다면,\
**앱 번들(.ait)** 파일을 업로드하고 생성된 **테스트용 앱스킴**을 통해 **토스앱에서 최종 테스트**를 진행할 수 있어요.

### 1. 앱 번들 파일 생성

앱 번들은 `.ait` 확장자를 가진 파일로, 빌드된 프로젝트를 패키징한 결과물이에요.\
아래 명령어를 실행해 앱 번들을 생성하세요.\
빌드가 완료되면 프로젝트 루트 디렉토리에 `<서비스명>.ait` 파일이 생성돼요.

::: code-group

```sh [npm]
npm run build
```

```sh [pnpm]
pnpm build
```

```sh [yarn]
yarn build
```

:::

### 2. 앱 번들 업로드 및 토스앱 테스트

앱 번들을 업로드하고 토스앱에서 테스트하는 방법은 두 가지예요.

1. **콘솔에서 직접 업로드 + QR 코드 테스트**
2. **CI/CD 명령어를 통한 자동 업로드**

::: tip 앱 번들 용량 정책

* 앱 번들은 **압축 해제 기준 100MB 이하**만 업로드할 수 있어요.
* 모든 리소스(이미지, 사운드, 영상 등)을 포함하면 용량을 초과할 수 있어요.
* **리소스 파일은 빌드와 분리**하여 관리하세요.

**권장 사항**

1. 앱 실행에 필요한 최소 리소스만 번들에 포함하세요.
2. 대용량 리소스는 **외부 스토리지 또는 CDN**에서 다운로드하도록 구성해 주세요.
3. 추가 리소스는 **단계적 다운로드(Lazy Loading)** 방식을 적용하면 사용자 경험이 향상돼요.
   :::

#### ① 콘솔에서 앱 번들 업로드 및 QR 테스트하기

1. 콘솔에 **앱 번들(.ait)** 파일을 업로드하세요.

::: tip 앱 번들 파일 업로드가 안되시나요?
앱이 정상적으로 빌드되었는지 확인해 주세요.\
`npm run build` 로 생성된 번들이 아니거나 프로젝트 구조가 올바르지 않은 경우,\
앱 번들 컴파일이 실패하여 업로드가 되지 않아요.
:::

2. 업로드가 완료되면 **테스트용 스킴 및 QR 코드**가 자동으로 생성돼요.

> 접속 경로:\
> 워크스페이스 선택 → 앱 선택 → 좌측 메뉴에서 **앱 출시**

![이미지](https://developers-apps-in-toss.toss.im/resources/deploy/release/release-01.png)

앱 번들을 업로드한 후 **'테스트하기'** 버튼을 클릭하면 콘솔에서 **토스앱 테스트용 QR 코드**를 확인할 수 있어요.\
QR 코드를 스캔하면 **토스앱 내에서 미니앱이 실행**돼요.

QR 코드 테스트는 아래 조건을 충족해야 실행돼요.

* 토스앱에 로그인이 되어있어야 해요.
* 워크스페이스 멤버여야 해요.
* 만 19세 이상 사용자만 테스트 가능해요.

워크스페이스 멤버 전체에게 **푸시 알림을 발송**하여 테스트 참여를 유도할 수도 있어요.\
테스트 스킴(`intoss-private://`)을 직접 실행하여 테스트할 수도 있어요.

::: tip 테스트를 최소 1번 이상 완료해주세요
테스트를 최소 1회 이상 완료해야 검토 요청을 진행할 수 있어요.
:::

![이미지](https://developers-apps-in-toss.toss.im/assets/release-02.XDtaaPtX.png)

![이미지](https://developers-apps-in-toss.toss.im/assets/release-03.D65p_X95.png)

#### ② CI/CD 명령어 사용하기

콘솔에 접속하지 않고 CLI를 통해 앱 번들을 업로드할 수 있어요.

::: tip CI/CD 사용 가능한 SDK 버전
CI/CD 명령어를 통한 자동 업로드는 SDK v1.4.0 이상에서 지원돼요.\
이전 버전의 SDK를 사용 중이라면 먼저 SDK를 업그레이드 해주세요.
:::

먼저 콘솔에서 **API 키를 발급**해주세요.\
전체 앱 또는 특정 앱 단위로 접근 권한을 설정할 수 있어요.

> 접속 경로:\
> 워크스페이스 선택 → 좌측 메뉴에서 **키**

![이미지](https://developers-apps-in-toss.toss.im/assets/release-17.t7JOvIEG.png)

![이미지](https://developers-apps-in-toss.toss.im/assets/release-18.C62u5o8I.png)

아래 명령어를 실행해 앱 번들을 업로드하세요.\
정상적으로 업로드가 되었다면, 테스트용 앱스킴을 확인할 수 있어요.

```
npx ait deploy --api-key {API 키}
```

API 키를 등록해두면 반복 입력할 필요가 없어요.

```
npx ait token add
npx ait deploy
```

`-m` 옵션으로 번들 업로드시 메모를 같이 추가할 수 있어요.

```
npx ait deploy -m "출시메모"
```

필요에 따라 아래 명령어를 사용해보세요.

| 명령어                                      | 용도                 |
| ------------------------------------------- | -------------------- |
| npx ait token --help                        | 도움말 보기          |
| npx ait token add \[워크스페이스명] \[API 키] | 토큰 등록하기        |
| npx ait token remove \[워크스페이스명]       | 등록된 토큰 삭제하기 |
| npx ait deploy \[워크스페이스명] \[API 키]    | 번들 업로드하기      |

### 3. 앱 출시 전 피처 테스트

`intoss://` 스킴은 **앱이 정식 출시된 이후에만 접근 가능해요.**\
출시 전 기능 테스트를 위해서는 업로드 시 생성된 **테스트 스킴(QR 코드)** 를 활용해야 해요.

::: tip 테스트 시 디버깅이 필요하다면?
디버깅하기 문서를 확인하여 보다 빠르게 이슈를 해결하세요.

* [WebView](https://developers-apps-in-toss.toss.im/learn-more/debugging-webview.md)
* [React Native](https://developers-apps-in-toss.toss.im/learn-more/debugging.md)
  :::

#### ① QR 코드에서 `deploymentId` 확인하기

앱 번들을 업로드할 때마다 새로운 `deploymentId`가 발급돼요.\
테스트 스킴에서는 `_deploymentId` 는 필수 파라미터예요.

예시 :

```
intoss-private://appsintoss?_deploymentId=0198c000-68c3-7d2b-0000-2c00000005ec
```

#### ② 스킴에 path/query 적용하여 테스트하기

* 하위 path를 적용한 경우 :

```
intoss-private://appsintoss/path/pathpath?_deploymentId=0198c000-68c3-7d2b-0000-2c00000005ec
```

* 쿼리 파라미터를 적용한 경우 : queryParams는 반드시 URL-encoding이 필요해요.

```
intoss-private://appsintoss?_deploymentId=0198c000-68c3-7d2b-0000-2c00000005ec&queryParams=%7B%22categoryKey%22%3A%22
```

### 문제 해결 가이드

#### iOS에서 흰 화면이 보이나요?

샌드박스에서는 정상 동작하지만 토스앱 내에서 흰 화면이 표시된다면, 아래 항목을 순서대로 점검해보세요.

##### 1. Sentry로 오류를 감지하고 모니터링하세요

런타임 에러가 발생했지만 바로 확인되지 않는 경우가 있어요.\
Sentry를 통해 에러를 수집하고, 실제 사용자 환경에서 발생하는 오류를 추적해보세요.\
[Sentry 가이드 확인하기](https://developers-apps-in-toss.toss.im/learn-more/sentry-monitoring.html)

##### 2. 메모리 및 리소스 사용량을 점검하세요

토스앱 내에서는 메모리 제약으로 인해 앱이 정상적으로 렌더링되지 못하고 흰 화면이 표시될 수 있어요.

* 이미지, 폰트 등 리소스 용량을 줄여 빌드 파일을 최적화하세요.
* 분할 로딩 구조를 적용해 초기에는 반드시 필요한 파일만 로딩하고, 이후 필요한 리소스를 순차적으로 불러오도록 구성해보세요.
* 불필요한 객체 생성이나 메모리 누수가 없는지 점검하세요.

##### 3. Unity로 개발한 경우

Unity 기반 미니앱은 일반 웹앱보다 리소스 사용량이 높을 수 있어, 별도의 성능 최적화가 필요해요.\
아래 가이드를 참고해 토스앱 환경에 맞게 최적화해 주세요.

[Unity 최적화 가이드 확인하기](https://developers-apps-in-toss.toss.im/unity/optimization/perf-optimization.html)

Unity 최적화 가이드에서는 다음과 같은 항목을 다루고 있어요.

* 런타임 성능 최적화
* 시작 최적화
* 로딩 최적화
* 리소스 최적화 및 로딩 전략
* 성능 분석 도구 활용
* 플랫폼별 최적화
* 메모리 최적화
* 렌더링 최적화
* 파티클 시스템 최적화

#### 토스앱에서 통신이 되지 않는 경우

##### 1. CORS 설정 확인

Origin 허용 목록에 다음 도메인을 등록하세요.

* `https://<appName>.apps.tossmini.com` : 실제 서비스 환경
* `https://<appName>.private-apps.tossmini.com` : 콘솔 QR 테스트 환경

##### 2. App Transport Security (ATS) 설정 확인

샌드박스에서는 HTTP 요청이 허용되지만, **라이브 환경에서는 HTTPS만 허용**됩니다.\
HTTP 기반 API는 토스앱 내에서 차단됩니다.

##### 3. iOS 서드파티 쿠키 차단 정책 확인

iOS/iPadOS 13.4 이상에서는 **서드파티 쿠키가 완전히 차단**돼요.\
쿠키 기반 로그인 대신 **토큰 기반 인증 방식**을 적용하세요.

### 자주 묻는 질문

---

# 7. API 사용하기 (mTLS)

> Source: https://developers-apps-in-toss.toss.im/development/integration-process.md

> Description: >-   앱인토스 API 사용을 위한 mTLS 기반 서버 간 통신 설정 가이드입니다. 인증서 발급, 통신 구조, 언어별 API 요청 예제를   확인하세요.

앱인토스 API를 사용하려면 **mTLS 기반의 서버 간(Server-to-Server) 통신 설정이 반드시 필요해요.**\
mTLS 인증서는 파트너사 서버와 앱인토스 서버 간 통신을 **암호화**하고 **쌍방 신원을 상호 검증**하는 데 사용됩니다.

::: tip 아래 기능은 반드시 mTLS 인증서를 통한 통신이 필요해요

* [토스 로그인](https://developers-apps-in-toss.toss.im/login/intro.md)
* [토스 페이](https://developers-apps-in-toss.toss.im/tosspay/intro.md)
* [인앱 결제](https://developers-apps-in-toss.toss.im/iap/intro.md)
* [기능성 푸시, 알림](https://developers-apps-in-toss.toss.im/smart-message/intro.md)
* [프로모션(토스 포인트)](https://developers-apps-in-toss.toss.im/promotion/intro.md)
  :::

### 통신 구조

앱인토스 API는 파트너사 서버에서 앱인토스 서버로 요청을 전송하고,\
앱인토스 서버가 토스 서버에 연동 요청을 전달하는 구조로 동작해요.

![](https://developers-apps-in-toss.toss.im/assets/appintoss_process_2.DkmHrB4Z.png)

![](https://developers-apps-in-toss.toss.im/resources/prepare/appintoss_process.png)

### mTLS 인증서 발급 방법

서버용 mTLS 인증서는 **콘솔에서 직접 발급**할 수 있어요.

#### 1. 앱 선택하기

앱인토스 콘솔에 접속해 인증서를 발급받을 앱을 선택하세요.\
왼쪽 메뉴에서 **mTLS 인증서** 탭을 클릭한 뒤, **+ 발급받기** 버튼을 눌러 발급을 진행해요.

![](https://developers-apps-in-toss.toss.im/assets/mtls.C_guSa2X.png)

#### 2. 인증서 다운로드 및 보관

mTLS 인증서가 발급되면 **인증서 파일과 키 파일**을 다운로드할 수 있어요.

::: tip 보관 시 주의하세요

* 인증서와 키 파일은 유출되지 않도록 **안전한 위치에 보관**하세요.
* 인증서가 **만료되기 전에 반드시 재발급**해 주세요.

:::

![](https://developers-apps-in-toss.toss.im/assets/mtls-2._GxAfDcf.png)

콘솔에서 발급된 인증서는 아래와 같이 확인할 수 있어요.

![](https://developers-apps-in-toss.toss.im/assets/mtls-3.CkETJCHm.png)

인증서는 일반적으로 하나만 사용하지만, **무중단 교체**를 위해 **두 개 이상 등록해 둘 수도 있어요.**\
콘솔에서는 이를 위해 **다중 인증서 관리 기능을** 제공해요.

### API 요청 시 인증서 설정

앱인토스 서버에 요청하려면, 발급받은 **인증서/키 파일**을 서버 애플리케이션에 등록해야 해요.

아래는 주요 언어별 mTLS 요청 예제예요.\
환경에 맞게 경로, 알고리즘, TLS 버전 등을 조정하세요.

::: details Kotlin 예제

```kotlin
import java.security.KeyStore
import java.security.cert.X509Certificate
import java.security.KeyFactory
import java.security.spec.PKCS8EncodedKeySpec
import java.io.FileReader
import java.io.ByteArrayInputStream
import java.util.Base64
import javax.net.ssl.*

class TLSClient {
    fun createSSLContext(certPath: String, keyPath: String): SSLContext {
        val cert = loadCertificate(certPath)
        val key = loadPrivateKey(keyPath)

        val keyStore = KeyStore.getInstance(KeyStore.getDefaultType())
        keyStore.load(null, null)
        keyStore.setCertificateEntry("client-cert", cert)
        keyStore.setKeyEntry("client-key", key, "".toCharArray(), arrayOf(cert))

        val kmf = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm())
        kmf.init(keyStore, "".toCharArray())

        return SSLContext.getInstance("TLS").apply {
            init(kmf.keyManagers, null, null)
        }
    }

    private fun loadCertificate(path: String): X509Certificate {
        val content = FileReader(path).readText()
            .replace("-----BEGIN CERTIFICATE-----", "")
            .replace("-----END CERTIFICATE-----", "")
            .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(content)
        return CertificateFactory.getInstance("X.509")
            .generateCertificate(ByteArrayInputStream(bytes)) as X509Certificate
    }

    private fun loadPrivateKey(path: String): java.security.PrivateKey {
        val content = FileReader(path).readText()
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("\\s".toRegex(), "")
        val bytes = Base64.getDecoder().decode(content)
        val spec = PKCS8EncodedKeySpec(bytes)
        return KeyFactory.getInstance("RSA").generatePrivate(spec)
    }

    fun makeRequest(url: String, context: SSLContext): String {
        val connection = (URL(url).openConnection() as HttpsURLConnection).apply {
            sslSocketFactory = context.socketFactory
            requestMethod = "GET"
            connectTimeout = 5000
            readTimeout = 5000
        }

        return connection.inputStream.bufferedReader().use { it.readText() }.also {
            connection.disconnect()
        }
    }
}

fun main() {
    val client = TLSClient()
    val context = client.createSSLContext("/path/to/client-cert.pem", "/path/to/client-key.pem")
    val response = client.makeRequest("https://apps-in-toss-api.toss.im/endpoint", context)
    println(response)
}
```

:::

::: details Python 예제

```python
import requests

class TLSClient:
    def __init__(self, cert_path, key_path):
        self.cert_path = cert_path
        self.key_path = key_path

    def make_request(self, url):
        response = requests.get(
            url,
            cert=(self.cert_path, self.key_path),
            headers={'Content-Type': 'application/json'}
        )
        return response.text

if __name__ == '__main__':
    client = TLSClient(
        cert_path='/path/to/client-cert.pem',
        key_path='/path/to/client-key.pem'
    )
    result = client.make_request('https://apps-in-toss-api.toss.im/endpoint')
    print(result)
```

:::

::: details JavaScript(Node.js) 예제

```js
const https = require('https');
const fs = require('fs');

const options = {
  cert: fs.readFileSync('/path/to/client-cert.pem'),
  key: fs.readFileSync('/path/to/client-key.pem'),
  rejectUnauthorized: true,
};

const req = https.request(
  'https://apps-in-toss-api.toss.im/endpoint',
  { method: 'GET', ...options },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      console.log('Response:', data);
    });
  }
);

req.on('error', (e) => console.error(e));
req.end();
```

:::

::: details C# 예제

```c#
using System;
using System.Net.Http;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;

class Program {
    static async Task Main(string[] args) {
        var handler = new HttpClientHandler();
        handler.ClientCertificates.Add(
            new X509Certificate2("/path/to/client-cert.pem")
        );

        using var client = new HttpClient(handler);
        var response = await client.GetAsync("https://apps-in-toss-api.toss.im/endpoint");
        string body = await response.Content.ReadAsStringAsync();
        Console.WriteLine(body);
    }
}
```

:::

::: details C++ 예제(libcurl 사용)

```cpp
#include <curl/curl.h>
#include <iostream>
#include <string>

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* userp) {
    userp->append((char*)contents, size * nmemb);
    return size * nmemb;
}

int main() {
    CURL* curl = curl_easy_init();
    if (curl) {
        std::string response;
        curl_easy_setopt(curl, CURLOPT_URL, "https://apps-in-toss-api.toss.im/endpoint");
        curl_easy_setopt(curl, CURLOPT_SSLCERT, "/path/to/client-cert.pem");
        curl_easy_setopt(curl, CURLOPT_SSLKEY, "/path/to/client-key.pem");
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        CURLcode res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            std::cout << "Response: " << response << std::endl;
        } else {
            std::cerr << "Error: " << curl_easy_strerror(res) << std::endl;
        }

        curl_easy_cleanup(curl);
    }

    return 0;
}
```

:::

### 자주 묻는 질문

\<FaqAccordion :items='\[
{
q: "`ERR_NETWORK` 에러가 발생해요.",
a: \`mTLS 미적용 상태에서 API를 호출하면 발생해요.

---

# 8. 토스 로그인 소개

> Source: https://developers-apps-in-toss.toss.im/login/intro.md

> Description: 토스로그인 기능에 대한 개괄적인 소개입니다. 토스로그인에 대해 파악하기 위해 참고해주세요.

앱인토스에서 토스 회원을 한 번에 연동해 보세요.\
한 번의 동의로 가입부터 로그인, 정보 제공까지 이어져 토스 회원 연동을 간단하게 구현할 수 있어요.

:::tip 꼭 확인해 주세요

* 미니앱에서 로그인 기능은 토스 로그인만 사용할 수 있어요.
* 자사 로그인이나 다른 간편 로그인 방식은 사용할 수 없어요.
  :::

***

### 토스 로그인이란 무엇인가요

토스 로그인은 토스 계정으로 빠르고 안전하게 로그인할 수 있는 기능이에요.\
로그인 과정에서 사용자에게 어떤 정보 제공에 동의받을지 직접 설정할 수 있어요.\
또한 앱인토스 서비스를 운영하는 데 필요한 약관과 동의문, 연결 끊기 콜백 정보도 함께 등록할 수 있어요.

![](https://developers-apps-in-toss.toss.im/assets/login-intro-1.DDSZ-qGN.png)

***

### 토스 로그인을 사용하면 어떤 점이 좋나요

* 별도의 가입 폼 없이 바로 가입과 로그인이 이뤄져 매끄러운 회원가입 경험을 만들 수 있어요.
* 토스에서 직접 제공하는 신뢰도 높은 사용자 정보를 활용할 수 있어요.
* 재방문할 때 자동 로그인이나 원클릭 로그인이 가능해요.
* 앱을 다시 설치하거나 기기를 바꿔도 같은 사용자로 매칭돼 고객 문의 대응 부담이 줄어들어요.

***

### 참고해 주세요

아래 기능을 사용하려면 토스 로그인을 반드시 연동해야 해요.

* 기능성 푸시와 알림
* 프로모션
* 토스페이

***

### 자체 웹/앱에 토스 로그인을 사용하고 싶어요

자체 웹/앱에 토스 로그인을 적용하려면 토스 인증 부서와의 별도 계약이 필요해요.\
다만, 앱인토스에서 토스 로그인을 사용하는 파트너사의 경우에는 별도 계약 없이도 사용할 수 있어요.

#### 1) 앱인토스 콘솔에서 토스 로그인 신청하기

콘솔 가이드 문서를 확인한 뒤, 앱인토스 콘솔에서 토스 로그인을 먼저 신청해 주세요.

#### 2) 필요한 정보를 작성해 Client ID 발급 요청하기

아래 항목을 모두 작성해 토스 인증 부서(cert.support@toss.im) 로 이메일을 보내 주세요.

| 항목                           | 설명                                                                                                        | 예시                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 웹/앱 여부                     | 적용하려는 서비스 형태를 작성해 주세요 (웹, 앱, 또는 둘 다)                                                 | 웹, 앱                                      |
| 회원 식별 키                   | 사용자 식별에 사용할 키를 작성해 주세요                                                                     | CI, 이메일                                  |
| 필요한 개인정보 항목           | 제공받고자 하는 개인정보 항목을 작성해 주세요(앱인토스 콘솔 > 토스 로그인 > 동의 항목을 참고해 주세요) | 이름, 이메일 주소                           |
| 약관 목록                      | 사용할 약관의 제목, URL, 필수 여부를 작성해 주세요                                                          | 이용약관 (필수) - https://example.com/terms |
| redirect\_uri                   | 로그인 완료 후 이동할 URL을 작성해 주세요                                                                   | https://example.com/callback                |
| 연동 예정 앱 버전              | 제휴사 앱에도 도입하는 경우 앱 버전을 작성해 주세요                                                         | iOS 3.2.0, Android 2.8.1                    |
| 로그인 연결 끊기 API 사용 여부 | 해당 API 사용 여부를 작성해 주세요 (미작성 시 ‘사용 안 함’으로 설정돼요)                                    | 사용 안 함                                  |
| 네트워크 정보                  | VPN을 사용하거나 개발계 연동이 필요한 경우 별도 등록이 필요해요서버의 IP 또는 IP 대역을 작성해 주세요  | 123.45.67.89                                |

---

# 9. 토스 로그인 콘솔

> Source: https://developers-apps-in-toss.toss.im/login/console.md

> Description: 토스 로그인 콘솔 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.

토스 로그인을 원활히 사용하려면 **콘솔에서 계약 → 설정** 순서로 진행해 주세요.

### 1. 약관 동의

토스 로그인 사용을 위해서는 **약관에 동의해야 해요.**\
약관동의는 앱인토스 콘솔에서 진행이 가능하며, **대표관리자로 지정된 분**의 계정에서만 가능해요.

* 약관 동의 방법
  * 앱인토스 콘솔 접속 → 대표 관리자 계정 로그인 → 워크스페이스 선택 → 미니앱 선택 → 좌측 메뉴 중 ‘토스 로그인’ 선택 후 ‘약관 확인하기’ 를 클릭 하여 아래 화면에서 약관 동의 진행

![](https://developers-apps-in-toss.toss.im/assets/login_contract.Du9QUk58.png)

### 2. 설정하기

로그인 연동을 위해 콘솔에서 **사전 설정**을 완료해 주세요.\
입력한 정보를 기반으로 **사용자 약관 동의 화면**이 자동으로 구성됩니다.

![](https://developers-apps-in-toss.toss.im/assets/login_1._FWDtovF.png)

#### ① 연동할 서비스 : 기존 로그인과 연동하기

이미 토스 로그인을 사용 중인 서비스가 있을 경우 노출되는 영역이에요.\
기존 서비스의 회원 식별자(`userKey`)를 **앱인토스 토스 로그인과 동일하게 설정**할 수 있어요.\
목록에서 서비스 이름을 선택하면, 선택한 서비스의 `userKey` 값이 **동일하게 매핑돼요.**

::: tip 회원을 관리해보세요
토스 로그인을 연동하면 회원 정보를 쉽게 조회할 수 있어요.\
[사용자 정보 받기 API](https://developers-apps-in-toss.toss.im/login/develop.md#_4-사용자-정보-받기)를 통해 사용자 식별자 `userKey`를 전달받을 수 있으며, `userKey`는 회원별 유니크한 값으로 **통합 회원 관리**에 유용해요.\
단, 미니앱(서비스)마다 `userKey`는 다를 수 있어요.
:::

#### ② 동의 항목 : 사용자 권한 범위 설정

토스 로그인을 통해 수집할 **사용자 권한(스코프)** 을 선택해 주세요.

::: tip 꼭 확인해 주세요
이름, 이메일, 성별 외의 항목을 선택한 경우, **연결 끊기 콜백 정보**를 반드시 입력해야 해요.
:::

|항목|설명|
|---|----|
|이름 (USER\_NAME)|사용자의 이름이에요.|
|이메일 (USER\_EMAIL)|사용자의 이메일이에요. (토스 가입 시 필수가 아니어서 값이 없을 수 있고, 이 경우 null로 전달돼요.)|
|성별 (USER\_GENDER)|사용자의 성별이에요.|
|생일 (USER\_BIRTHDAY)|사용자의 생년월일이에요.|
|국적 (USER\_NATIONALITY)|사용자의 국적이에요.|
|전화번호 (USER\_PHONE)|사용자의 전화번호예요.|
|CI (USER\_CI)|사용자를 식별하는 고유한 KEY 값이에요. (Connection Information)|

::: tip CI란?
CI(Connection Information)는 본인인증 기관에서 발급하는 **고유 식별값**이에요.\
동일한 사용자가 여러 서비스에 가입하더라도, **같은 본인으로 식별할 수 있도록 생성되는 불변값**이에요.\
CI는 사용자 실명 인증이 필요한 서비스에서 **중복가입 방지나 본인 식별** 목적으로 자주 활용돼요.\
개인정보보호법상 **개인식별정보(PII)** 에 해당하므로, 저장하거나 사용할 때 반드시 **암호화 및 최소 수집 원칙**을 지켜야 해요.
:::

#### ③ 약관 등록

::: tip 주의해 주세요
이 영역은 **법적 요건을 충족해야 하는 부분**이에요.\
서비스 성격에 따라 내용이 달라질 수 있으니 **최신 법령과 가이드라인을 확인하고, 법률 자문을 받는 것**을 권장해요.
:::

앱인토스에서 서비스를 운영하려면 약관을 등록해야 해요.\
**토스 로그인 필수 약관(서비스 약관 / 개인정보 제3자 제공 동의)** 은 자동으로 포함되며,\
**파트너사 서비스 약관 / 개인정보 수집·이용 동의 / 마케팅 정보 수신 동의(선택)** 등은 직접 등록해야 해요.\
서비스 목적에 맞는 **정확한 약관 링크**를 첨부해 주세요.

약관 유형은 기본 제공 예시 중에서 선택하거나 직접 입력할 수 있어요.\
약관을 구분해서 관리하고 싶다면 직접 입력하는 걸 추천드려요.

**등록 가능한 약관 예시**

* **(1) 서비스 이용약관**: 권리·의무, 책임 범위, 중단/종료, 분쟁 해결, 약관 변경 고지, (유료 시) 결제/환불 규정
* **(2) 개인정보 수집·이용 동의**: 수집 항목, 이용 목적, 보유·이용 기간, 동의 거부 시 불이익
* **(3) 마케팅 정보 수신 동의(선택)**: 수집 항목, 이용 목적, 보유 기간, 거부 시 불이익, 전자적 전송매체 광고 수신 동의
* **(4) 야간 혜택 수신 동의(선택)**: 야간(21:00~08:00) 발송 여부 명시

모든 약관 링크가 **정확히 연결**되고, 화면에 **명확하게 노출**되는지 확인해 주세요.

#### ④ 연결 끊기 콜백 정보

사용자가 토스앱에서 **로그인 연결을 해제**하면, 등록한 **콜백 URL**로 이벤트를 받을 수 있어요.

::: tip 참고하세요
사용자가 연결 해제를 하면 토스는 **동의 약관·로그인 정보**를 모두 삭제해요.\
서비스에서도 세션이나 토큰 정리 등 후처리를 꼭 해 주세요.

또한, 사용자가 토스앱에서 로그인 연결을 해제하면 서비스에서도 **자동 로그아웃 처리** 또는 **재로그인 요청 안내**를 제공하는 걸 권장해요.\
예를 들어, "토스 연결이 해제되어 로그인이 필요합니다." 같은 문구를 노출해 주세요.
:::

|항목|설명|
|---|----|
|콜백 URL|사용자가 로그인연결을 해제했을 때 호출할 URL이에요.|
|HTTP 메서드|`GET` 또는 `POST` 중 하나를 선택해 주세요.|
|Basic Auth 헤더|호출 시 base64로 인코딩돼요. 디코딩 후 콘솔에 입력한 값과 일치하는지 검증해 주세요.|

##### 연결 끊기 이벤트 경로

사용자가 토스앱에서 로그인 연결을 해제하는 경로는 총 **3가지**예요.\
콜백 요청 시 `referrer`값으로 구분할 수 있어요.

|referrer|설명|
|--------|---|
|`UNLINK`|사용자가 **앱에서 직접 연결을 끊었을 때** 호출돼요. 미니앱에서는 이 이벤트를 받으면 **로그아웃 처리**를 해 주세요. (경로: 토스 앱 > 설정 > 인증 및 보안 > 토스로 로그인한 서비스 > '연결 끊기')|
|`WITHDRAWAL_TERMS`|사용자가 **로그인 서비스 약관을 철회할 때** 호출돼요. (경로: 토스 앱 > 설정 > 법적 정보 및 기타 > 약관 및 개인정보 처리 동의 > 서비스별 동의 내용 : "토스 로그인" > '동의 철회하기')|
|`WITHDRAWAL_TOSS`|사용자가 **토스 회원을 탈퇴할 때** 호출돼요.|

### 복호화 키 확인하기

![](https://developers-apps-in-toss.toss.im/assets/login_4.D76OHLbx.png)

토스 로그인 정보 등록이 완료되면 **복호화 키**를 확인할 수 있어요.\
이 키는 토스 로그인 응답 데이터를 복호화할 때 사용돼요.\
**‘이메일로 복호화 키 받기’** 버튼을 눌러 안전하게 받아보세요.

::: tip 유의사항
복호화 키는 **민감한 보안 정보**예요.

* 절대 외부에 노출하지 마세요.
* 안전한 내부 비밀 저장소(Secret Manager 등)에 보관해 주세요.
* 재발급이 필요한 경우, 채널톡으로 문의해 주세요.
  :::

---

# 10. 토스 로그인 개발

> Source: https://developers-apps-in-toss.toss.im/login/develop.md

> Description: 토스 로그인 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.

![](https://developers-apps-in-toss.toss.im/assets/login_flow.Dq_ZsON9.png)

::: tip BaseURL
`https://apps-in-toss-api.toss.im`
:::

### 1. 인가 코드 받기

**SDK를 통해 연동해주세요.**

사용자의 인증을 요청하고, 사용자가 인증에 성공하면 인가 코드를 메소드 응답으로 전달드려요.\
`appLogin` 함수를 사용해서 인가 코드(`authorizationCode`)와 `referrer`를 받을 수 있어요.\
[appLogin](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/로그인/appLogin.md)를 확인해 주세요.

* 샌드박스앱에서는 `referrer` 가 `sandbox`가 반환돼요
* 토스앱에서는 `referrer` 가 `DEFAULT` 가 반환돼요

::: tip 참고하세요

인가코드의 유효시간은 10분입니다.

:::

#### **토스 로그인을 처음 진행할 때**

`appLogin` 함수를 호출하면 토스 로그인 창이 열리고, 앱인토스 콘솔에서 등록한 약관 동의 화면이 노출돼요.\
사용자가 필수 약관에 동의하면 인가 코드가 반환돼요.

#### **토스 로그인을 이미 진행했을 때**

`appLogin` 함수를 호출하면 별도의 로그인 창 없이 바로 인가 코드가 반환돼요.

### 2. AccessToken 받기

사용자 정보 조회 API 호출을 위한 **접근 토큰을 발급해요.**

* Content-Type: `application/json`
* Method: `POST`
* URL: `/api-partner/v1/apps-in-toss/user/oauth2/generate-token`

::: tip 참고하세요
AccessToken의 유효시간은 1시간이에요.
:::

**요청**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|authorizationCode|string|Y|인가코드|
|referrer|string|Y|referrer|

**성공 응답**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|tokenType|string|Y|bearer 로 고정|
|accessToken|string|Y|accessToken|
|refreshToken|string|Y|refreshToken|
|expiresIn|string|Y|만료시간(초)|
|scope|string|Y|인가된 scope(구분)|

```json
{
  "resultType": "SUCCESS",
  "success": {
    "accessToken": "eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtMHVmMmhaUmpJTnNEQTdLNHVuVHhMb3IwcWNSa2JNPSIsImF1ZCI6IjNlenQ2ZTF0aDg2b2RheTlwOWN1eTg0dTRvdm5nNnNzIiwibmJmIjoxNzE4MjU0ODM2LCJzY29wZSI6WyJ1c2VyX2NpIiwidXNlcl9iaXJ0aGRheSIsInVzZXJfbmF0aW9uYWxpdHkiLCJ1c2VyX25hbWUiLCJ1c2VyX3Bob25lIiwidXNlcl9nZW5kZXIiXSwiaXNzIjoiaHR0cHM6Ly9jZXJ0LnRvc3MuaW0iLCJleHAiOjE3MTgyNTg0MzYsImlhdCI6MTcxODI1NDgzNiwianRpIjoiMTJkYjYwZjYtMjEzYS00NWQ3LTllOTItODBjMzBdseY2JkMGQ3In0.W1cjoeMN8pd3Jqgh6h8YzSVQ1PUNldulJJgy6bgH1AoDbv5xFTlBLzz9Slb_u52zUpyZbhglwblQmNJs7GT6-us7XtfxSGxTUY3ORqIhF_PPGQ6soi_Qgsi-hmX165CCAilf8cltSTTuTt8xOiEbLuSTY-cecxo7SkPUonQ_0v4_Ik0kwOiOBuYZyuch3KmlYQZTqsJmxlwJAPB8M9tZTtDpLOv9MEPU35YS7CZyN0l7lwn1EKrDHJdzA5CnstqEdz2I0eREmMgZoG9mSEybgD4NtPmVJos6AJerUGgSmzP_TwwlybVATuGpnAUmH1idaZJ-MHZJhUhR82z4zTn3bw",
    "refreshToken": "xNEYPASwWw0n1AxZUHU9KeGj8BitDyYo4wi8rpfkUcJwByVxpAdUzwtIaWGVL6vHdrXLCxIlHAQRPF9hHnFleTsHkqUXzc-_78sD_r1Uh5Ff9UCYfArx8LTn1Vk99dDb",
    "scope": "user_ci user_birthday user_nationality user_name user_phone user_gender",
    "tokenType": "Bearer",
    "expiresIn": 3599
  }
}
```

**실패 응답**\
인가 코드가 만료되었거나 동일한 인가 코드로 AccessToken 을 중복으로 요청할 경우

```json
{
  "error": "invalid_grant"
}
```

```json
{
  "resultType": "FAIL",
  "error": {
    "errorCode": "INTERNAL_ERROR",
    "reason": "요청을 처리하는 도중에 문제가 발생했습니다."
  }
}
```

### 3. AccessToken 재발급 받기

사용자 정보 조회 API를 호출하기 위한 접근 토큰을 재발급해요.

* Content-type : application/json
* Method : `POST`
* URL : `/api-partner/v1/apps-in-toss/user/oauth2/refresh-token`

::: tip 참고하세요

refreshToken 유효시간은 14일이에요.

:::

**요청**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|refreshToken|string|Y|발급받은 RefreshToken|

**성공 응답**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|tokenType|string|Y|bearer 로 고정|
|accessToken|string|Y|accessToken|
|refreshToken|string|Y|refreshToken|
|expiresIn|string|Y|만료시간(초)|
|scope|string|Y|인가된 scope(구분)|

**실패 응답**
| 이름 | 타입 | 필수값 여부 | 설명 |
|------|------|------|------|
|errorCode|string|Y|에러 코드|
|reason|string|Y|에러 메시지|

### 4. 사용자 정보 받기

사용자 정보를 조회해요.\
`DI`는 `null`로 내려오며, 횟수 제한 없이 호출할 수 있어요.\
개인정보 보호를 위해 모든 개인정보는 **암호화된 형태**로 제공돼요.

* Content-type : application/json
* Method : `GET`
* URL : `/api-partner/v1/apps-in-toss/user/oauth2/login-me`

::: tip `scope` 에 `user_key` 값이 추가될 예정이에요
`scope` 파라미터는 **콘솔에서 선택한 항목 중 사용자가 동의한 값만** 내려와요.\
**2026년 1월 2일부터 `scope` 값에 `user_key` 항목이 추가돼요.**\
신규 scope 추가로 인해 **기존에 정의되지 않은 값이 포함될 수 있으니,** scope 처리 시 예외가 발생하지 않도록 주의해주세요.
:::

**요청 헤더**
| 이름 | 타입 | 필수값 여부 | 설명 |
|---------------|---------|--------------|----------------------------------------------------------------------|
| Authorization | string | Y | AccessToken으로 인증 요청  `Authorization: Bearer ${AccessToken}` |

**성공 응답**
| 이름 | 타입 | 필수값 여부 | 암호화 여부 | 설명 |
|--------------|--------|--------------|--------------|--------------------------------------------------------------|
| userKey | number | Y | N | 사용자를 식별하기 위한 고유 값이에요. |
| scope | string | Y | N | 인가된 scope 목록이에요. 콘솔에서 선택한 항목 중 사용자가 동의한 값과 `user_key` 항목이 포함돼요. |
| agreedTerms | list | Y | N | 사용자가 동의한 약관 목록이에요. |
| name | string | N | Y | 사용자 이름이에요. |
| phone | string | N | Y | 사용자 휴대전화번호예요. |
| birthday | string | N | Y | 사용자 생년월일이에요.(yyyyMMdd) |
| ci | string | N | Y | 사용자 CI값이에요. |
| di | string | N | Y | 항상 `null` 값으로 내려와요. |
| gender | string | N | Y | 사용자 성별 정보예요.(MALE/FEMALE) |
| nationality | string | N | Y | 사용자 내/외국인 여부예요.(LOCAL/FOREIGNER) |
| email | string | N | Y | 사용자 이메일 정보예요. 점유 인증은 하지 않은 값이에요. |

```json
{
  "resultType": "SUCCESS",
  "success": {
    "userKey": 443731104,
    "scope": "user_ci,user_birthday,user_nationality,user_name,user_phone,user_gender, user_key",
    "agreedTerms": ["terms_tag1", "terms_tag2"],
    "name": "ENCRYPTED_VALUE",
    "phone": "ENCRYPTED_VALUE",
    "birthday": "ENCRYPTED_VALUE",
    "ci": "ENCRYPTED_VALUE",
    "di": null,
    "gender": "ENCRYPTED_VALUE",
    "nationality": "ENCRYPTED_VALUE",
    "email": null
  }
}
```

**실패 응답**\
유효하지 않은 토큰을 사용할 경우, 현재 사용 중인 access\_token의 유효시간을 확인하고 재발급을 진행해주세요.

```json
{
  "error": "invalid_grant"
}
```

**서버 에러 응답 예시**\
| errorCode | 설명 |
|----------------|---------------------------|
| INTERNAL\_ERROR | 내부 서버 에러 |
| USER\_KEY\_NOT\_FOUND | 로그인 서비스에 접속한 유저 키 값을 찾을 수 없음 |
| USER\_NOT\_FOUND | 토스 유저 정보를 찾을 수 없음 |
| BAD\_REQUEST\_RETRIEVE\_CERT\_RESULT\_EXCEEDED\_LIMIT | 조회 가능 횟수 초과  동일한 토큰으로 `/api/login/user/me/without-di` API 조회하면 정상적으로 조회되나, di 필드는 null 값으로 내려감 |

```json
{
  "resultType": "FAIL",
  "error": {
    "errorCode": "INTERNAL_ERROR",
    "reason": "요청을 처리하는 도중에 문제가 발생했습니다."
  }
}
```

### 5. 사용자 정보 복호화하기

콘솔을 통해 이메일로 받은 `복호화 키`와 `AAD(Additional Authenticated DATA)` 로 진행해주세요.

**암호화 알고리즘**

* AES 대칭키 암호화
* 키 길이 : 256비트
* 모드 : GCM
* AAD : 복호화 키와 함께 이메일로 전달드려요.

**데이터 교환방식**

* 암호화된 데이터의 앞 부분에는 IV(NONCE)가 포함돼 있어요.
* 복호화 시 암호문에서 IV를 추출해 사용해야 정상적으로 복호화돼요.

**복호화 샘플 코드**

::: details Kotlin 예제

```kotlin
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

class Test {
    fun decrypt(
        encryptedText: String,
        base64EncodedAesKey: String,
        add: String,
    ): String {
        val IV_LENGTH = 12
        val decoded = Base64.getDecoder().decode(encryptedText)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val keyByteArray = Base64.getDecoder().decode(base64EncodedAesKey)
        val key = SecretKeySpec(keyByteArray, "AES")
        val iv = decoded.copyOfRange(0, IV_LENGTH)
        val nonceSpec = GCMParameterSpec(16 * Byte.SIZE_BITS, iv)

        cipher.init(Cipher.DECRYPT_MODE, key, nonceSpec)
        cipher.updateAAD(add.toByteArray())

        return String(cipher.doFinal(decoded, IV_LENGTH, decoded.size - IV_LENGTH))
    }
}
```

:::

::: details PHP 예제

```php
<?php

class Test {
    public function decrypt($encryptedText, $base64EncodedAesKey, $add) {
        $IV_LENGTH = 12;
        $decoded = base64_decode($encryptedText);
        $keyByteArray = base64_decode($base64EncodedAesKey);
        $iv = substr($decoded, 0, $IV_LENGTH);
        $ciphertext = substr($decoded, $IV_LENGTH);

        $tag = substr($ciphertext, -16);
        $ciphertext = substr($ciphertext, 0, -16);

        $decrypted = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $keyByteArray,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            $add
        );

        return $decrypted;
    }
}


// 사용 예제
$test = new Test();
$encryptedText = "Encrypted Text"; // Encrypted Text 입력
$base64EncodedAesKey = "Key"; // Key 입력
$add = "TOSS";

$result = $test->decrypt($encryptedText, $base64EncodedAesKey, $add);
echo $result;

?>
```

:::

::: details JAVA 예제

```java
public class Test {
    public String decrypt(
        String encryptedText,
        String base64EncodedAesKey,
        String add
    ) throws Exception {
        final int IV_LENGTH = 12;
        byte[] decoded = Base64.getDecoder().decode(encryptedText);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        byte[] keyByteArray = Base64.getDecoder().decode(base64EncodedAesKey);
        SecretKeySpec key = new SecretKeySpec(keyByteArray, "AES");
        byte[] iv = new byte[IV_LENGTH];
        System.arraycopy(decoded, 0, iv, 0, IV_LENGTH);
        GCMParameterSpec nonceSpec = new GCMParameterSpec(16 * Byte.SIZE, iv);

        cipher.init(Cipher.DECRYPT_MODE, key, nonceSpec);
        cipher.updateAAD(add.getBytes());

        byte[] decrypted = cipher.doFinal(decoded, IV_LENGTH, decoded.length - IV_LENGTH);
        return new String(decrypted);
    }
}
```

:::

### 6. 로그인 끊기

발급받은 AccessToken을 더 이상 사용하지 않거나 사용자의 요청으로 토큰을 만료시켜야 할 경우 토큰을 삭제(만료)해주세요.

* Content-type : application/json
* Method : `POST`
* URL :
  * accessToken 으로 연결 끊기 : `/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token`
  * userKey 로 연결 끊기 : `/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key`

**AccessToken 으로 로그인 연결 끊기**

```
// 포맷
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $access_token'

// 예시
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-access-token' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer eyJraWQiOiJjZXJ0IizzYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJtMHVmMmhaUmpJTnNEQTdLNHVuVHhMb3IwcWNSa2JNPSIsImF1ZCI6IjNlenQ2ZTF0aDg2b2RheTlwOWN1eTg0dTRvdm5nNnNzIiwibmJmIjoxNzE4MjU0ODM2LCJzY29wZSI6WyJ1c2VyX2NpIiwidXNlcl9iaXJ0aGRheSIsInVzZXJfbmF0aW9uYWxpdHkiLCJ1c2VyX25hbWUiLCJ1c2VyX3Bob25lIiwidXNlcl9nZW5kZXIiXSwiaXNzIjoiaHR0cHM6Ly9jZXJ0LnRvc3MuaW0iLCJleHAiOjE3MTgyNTg0MzYsImlhdCI6MTcxODI1NDgzNiwianRpIjoiMTJkYjYwZjYtMjEzYS00NWQ3LTllOTItODBjMzBmY2JkMGQ3In0.W1cjoeMN8pd3Jqgh6h8YzSVQ1PUNldulJJgy6bgH1AoDbv5xFTlBLwk9Slb_u52zUpyZbhglwblQmNJs7GT6-us7XtfxSGxTUY3ORqIhF_PPGQ6soi_Qgsi-hmX165CCAilf8cltSTTuTt8xOiEbLuSTY-cecxo7SkPUonQ_0v4_Ik0kwOiOBuYZyuch3KmlYQZTqsJmxlwJAPB8M9tZTtDpLOv9MEPU35YS7CZyN0l7lwn1EKrDHJdzA5CnstqEdz2I0eREmMgZoG9mSEybgD4NtPmVJos6AJerUGgSmzP_TwwlybVATuGpnAUmH1idaZJ-MHZJhUhR82z4zTn3bw'
```

**userKey 로 로그인 연결 끊기**

::: tip 참고하세요

하나의 userKey에 연결된 AccessToken이 많을 경우 **readTimeout(3초)** 이 발생할 수 있어요.\
이 경우 요청을 재시도하지 말고, 일정 시간 후 다시 시도해 주세요.

:::

```
// 포맷
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer $access_token' \
--data '{"userKey": $user_key}'

// 예시
curl --request POST 'https://apps-in-toss-api.toss.im/api-partner/v1/apps-in-toss/user/oauth2/access/remove-by-user-key' \
--header 'Content-Type: application/json' \
--data '{"userKey": 443731103}'
```

```json
{
  "resultType": "SUCCESS",
  "success": {
    "userKey": 443731103
  }
}
```

### 7. 콜백을 통해 로그인 끊기

사용자가 토스앱 내에서 서비스와의 연결을 해제한 경우 가맹점 서버로 알려드려요.\
서비스에서 연결이 끊긴 사용자에 대한 처리가 필요한 경우 활용할 수 있어요.
콜백을 받을 URL과 basic Auth 헤더는 콘솔에서 입력할 수 있어요.

::: tip 꼭 확인해 주세요
서비스에서 직접 로그인 연결 끊기 API를 호출한 경우에는 **콜백이 호출되지 않아요.**
:::

**GET 방식**

* 요청 requestParam에 `userKey`와 `referrer`을 포함합니다.

```
// 포맷
curl --request GET '$callback_url?userKey=$userKey&referrer=$referrer'

// 예시
curl --request GET '$callback_url?userKey=443731103&referrer=UNLINK'
```

**POST 방식**

* 요청 body에 `userKey`와 `referrer`을 포함합니다.

```
// 포맷
curl --request POST '$callback_url' \
--header 'Content-Type: application/json' \
--data '{"userKey": $user_key, "referrer": $referrer}'

// 예시
curl --request POST '$callback_url' \
--header 'Content-Type: application/json' \
--data '{"userKey": 443731103, "referrer": "UNLINK"}'
```

referrer 은 연결 끊기 요청 경로에요.\
| referrer | 설명 |
|----------|------|
| `UNLINK` | 사용자가 토스앱에서 직접 연결을 끊었을 때 호출돼요.&#x20;
(경로: 토스앱 → 설정 → 인증 및 보안 → 토스로 로그인한 서비스 → ‘연결 끊기’) |
| `WITHDRAWAL_TERMS` | 사용자가 로그인 서비스 약관 동의를 철회할 때 호출돼요.&#x20;
(경로: 토스앱 → 설정 → 법적 정보 및 기타 → 약관 및 개인정보 처리 동의 → 서비스별 동의 내용 : "토스 로그인" → ‘동의 철회하기’) |
| `WITHDRAWAL_TOSS` | 사용자가 토스 회원을 탈퇴할 때 호출돼요. |

### 트러블슈팅

#### 로컬 개발 중 인증 에러가 발생할 때

로컬에서 개발할 때 인증 에러가 발생하는 원인은 주로 두가지예요.

1. 인증 토큰이 만료됨\
   기존에 발급받은 인증 토큰이 만료되었을 수 있어요. 새로운 토큰을 발급받아 다시 시도해보세요.

2. 개발자 로그인이 되지 않음
   샌드박스 환경에서 개발자 계정으로 로그인하지 않은 상태일 수 있어요. [샌드박스 앱 다운로드](https://developers-apps-in-toss.toss.im/development/test/sandbox)를 참고해 로그인을 진행한 뒤 다시 시도해보세요.

---

# 11. 토스 로그인 QA

> Source: https://developers-apps-in-toss.toss.im/login/qa.md

> Description: 토스 로그인 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

토스 로그인 연동을 마쳤다면 아래 항목을 **꼼꼼히 점검**해 주세요.

| 항목 | 내용 |
| ----|------|
| 사전 체크 | 콘솔 계약/설정이 승인 상태인지, 약관 링크가 정상 열리는지 확인해주세요. |
| 최초 로그인 | 인가 코드 수신 → 서버 교환 → 사용자 정보 복호화/저장 후 홈으로 진입되는지 확인해주세요. |
| 재로그인 | 약관 동의 없이 인가 코드를 즉시 수신하고 정상 진입하는지 확인해주세요. |
| 토큰 만료 직전 호출 | 자동 리프레시로 토큰이 갱신되고 재시도가 성공하는지(실패 시 재로그인 요구) 확인해주세요. |
| 로그인 끊기 콜백 | 서버에서 토큰이 즉시 폐기되고, 재진입 시 로그인 요구되는지 확인해주세요. |
|  | 콜백을 수신·검증해 세션을 해제하고 사용자에게 안내 후 재로그인을 유도하는지 확인해주세요. |
| 네트워크 장애 | 지수 백오프/재시도 적용, 사용자 안내 문구 노출, 복구 후 자동 재시도가 성공하는지 확인해주세요. |

---

# 12. 토스 인증 소개

> Source: https://developers-apps-in-toss.toss.im/tossauth/contract.md

> Description: 토스인증에 대한 소개입니다. 신원인증이 필요한 서비스인 경우 참고해주세요.

토스 인증은 사용자가 입력한 정보(또는 토스 앱 내 저장된 정보)를 기반으로\
**실명·생년월일·휴대전화번호 등**을 안전하게 확인하고, 토스 앱 인증을 통해 **신원을 검증하는 서비스**예요.

로그인, 가입, 조회 등 사용자 식별이 필요한 서비스에서 **CI(연계정보)** 를 포함한 식별자를 안정적으로 확보할 수 있어요.

::: tip 웹보드 게임은 본인 확인이 필수예요
관련 법령에 따라 **웹보드 게임은 본인 확인 절차가 반드시 필요**해요.\
토스 인증을 연동하면 간편하게 본인 확인(필요 시 성인 인증까지)을 진행할 수 있어요.
:::

### 토스 인증 유형

토스 인증은 두 가지 방식을 제공해요.\
두 방식 모두 최종적으로 **토스 앱 인증**을 통해 사용자를 확인한다는 점은 같으며,\
**클라이언트에서 개인정보를 입력받는지 여부**가 가장 큰 차이예요.

#### ① 개인정보 기반 인증

클라이언트에서 **이름·생년월일·휴대전화번호** 를 입력받아 암호화 후 전송하는 방식이에요.

* **권장 상황**
  * 가입 또는 전환 화면에서 이미 개인정보를 수집하고 있는 경우
  * 입력 값과 **실제 가입 정보의 일치 여부**를 즉시 검증해야 하는 경우

* **흐름**
  1. 사용자가 화면에서 개인정보 입력
  2. 입력값을 암호화하여 토스 인증으로 전송
  3. 토스 앱 인증(푸시 또는 생체인증 등)
  4. 결과 수신(CI, 이름, 휴대전화번호, 인증 시각 등)

* **특징**
  * 입력값 검증(형식, 오타 등)에 유리
  * 입력 과정이 있어 사용자의 이탈률이 다소 높을 수 있음

#### ② 원터치 인증

클라이언트에서 **개인정보를 입력받지 않고**, 토스 앱을 바로 호출해 한 번의 인증으로 절차를 완료하는 간소화된 방식이에요.

:::tip 원터치 인증 동작 방식
**원터치 인증**은 토스인증 서비스를 이용하는 것과 동일하고, 아래와 같이 동작해요.

* 기기에 토스인증서가 있다면, PIN 인증 또는 단말 생체 인증 (Face ID, 지문인증 등)

* 기기에 토스인증서가 없다면, 토스인증서 발급 후 PIN 인증 또는 단말 생체 인증
  :::

* **권장 상황**
  * **이탈 최소화 / 전환율 최적화**가 중요한 경우
  * 앱 내 간결한 로그인·재인증 UX가 필요한 경우

* **흐름**
  1. “본인 인증” 버튼 클릭
  2. 토스 앱 호출 → 사용자 인증
  3. 결과 수신(CI, 인증 시각 등)

* **특징**
  * 입력 단계가 없어 **UX가 매우 간결**
  * 기존 계정과의 매칭 로직(CI 등) 설계가 중요

### 운영 팁

* **웹보드·성인물 서비스**: 본인 확인 후 서비스 정책에 따라 **성인 여부(ageGroup 기반 정책)** 를 적용하세요.
* **재인증 정책**: 장기간 미사용 또는 주요 정보 변경(이름·번호 변경 등) 시 **재인증 주기**를 정의하면 안전해요.
* **개인정보 최소화**: 원터치 인증을 기본으로 검토하고, 필요한 경우에만 입력 기반 인증을 조합해 **개인정보 수집을 최소화**하세요.

### 계약하기

토스 인증을 사용하려면 **사전 계약**이 필요해요.\
계약 진행에는 **영업일 기준 7~14일**이 소요될 수 있어요.

::: tip '본인 확인' vs '토스 로그인'
앱인토스는 제휴사에 **토스 인증의 ‘본인 확인’ 기능**을 제공해요.\
‘본인 확인’은 사용자의 **이름·생년월일·휴대전화번호를 검증해 신원을 확인하는 서비스**예요.\
이 서비스는 **연령 확인, 실명 인증, 웹보드 게임 등 법적 신원 확인이 필요한 경우**에 사용됩니다.

반면, **‘토스 로그인’은 간편 인증 방식으로,**\
사용자가 별도의 정보 입력 없이 **토스앱을 통해 간편하게 로그인할 수 있는 기능**이에요.\
‘본인 확인’과는 **목적과 계약 구조가 다르며,**\
토스 로그인 연동을 원하신다면 [토스 로그인 가이드](https://developers-apps-in-toss.toss.im/login/intro.md) 문서를 참고해 주세요.

일부 파트너사에서 두 서비스를 혼동해 잘못 계약한 사례가 있었어요.\
**계약 전 반드시 요청하시는 서비스가 ‘본인 확인’인지 ‘토스 로그인’인지 확인해 주세요.**
:::

::: tip 콘솔에서 계약이 진행되지 않아요
토스 인증 계약은 인증팀에서 **직접** 진행하고 있어요.\
콘솔을 통해 계약할 수 없으니, 아래 절차를 참고해 주세요.
:::

#### 1) 서류 다운로드 및 작성

아래 서류를 다운로드해 작성해 주세요.

* 토스 전자 인증 서비스 이용 신청서, 개인(신용)정보 보안관리 약정서

#### 2) 어드민 권한 정보 준비

토스 전자 인증 서비스 제휴사 어드민을 통해 **정산 금액**을 확인할 수 있어요.\
어드민 접속 권한이 필요한 담당자의 **이메일 주소**와 **전화번호**를 준비해 주세요.

#### 3) 서류 제출

아래 항목을 모두 포함해 cert.support@toss.im 이메일로 제출해주세요.

* 작성 완료된 **신청서 및 약정서**
* 어드민 접속 권한이 필요한 담당자 **이메일 주소와 전화번호**

#### 4) 검토 및 안내

* 담당 부서에서 서류를 검토한 후 진행 절차를 안내드려요.
* 토스 전자 인증 서비스 계약은 내부 규정에 따라 **인감 날인된 하드카피 서류**로 진행돼요.
* 서류 검토 및 우편 송부 과정을 포함하여, **영업일 기준 7~14일** 정도 소요돼요.
* 계약서 내용 수정 요청이 있는 경우, 추가 검토로 인해 기간이 더 길어질 수 있어요.

#### 5) 계약 완료 및 키 발급

* 계약이 완료되면 인증팀에서 `client_id`와 `client_secret` 키를 이메일로 발급해 드려요.
* 메일 수신 후, 발급받은 키를 확인하여 개발 환경에 적용해 주세요.

---

# 13. 토스 인증 개발

> Source: https://developers-apps-in-toss.toss.im/tossauth/develop.md

> Description: 토스 인증 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.

::: tip 최소 버전을 확인하세요

* **SDK** : 1.2.1 이상
* **토스앱 (본인확인)** : 5.233.0 이상
* **토스앱 (원터치 인증)** : 5.236.0 이상

[getTossAppVersion](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/getTossAppVersion) 함수를 사용하여 토스앱 버전을 체크해보세요.
:::

![](https://developers-apps-in-toss.toss.im/assets/tossauth_flow.DcI87xBa.png)

### 1. AccessToken 받기

토스 본인확인을 위한 **Access Token**을 발급받아요.\
발급된 토큰은 이후 모든 API 호출의 **Authorization** 헤더에 사용돼요.

토큰에는 **만료 시간(`expires_in`)** 이 있어요. 만료 시 새 토큰을 발급해야 하고, **유효한 토큰이 있으면 재발급을 피해서** 불필요한 호출을 줄여 주세요.

* Base URL: `https://oauth2.cert.toss.im`
* Endpoint: `/token`
* Method: `POST`
* Content-Type: `application/x-www-form-urlencoded`

**요청 헤더**

| 이름 | 타입 | 필수값 여부 | 설명 |
|---------------|---------|--------------|---------------------------------------------|
| Content-Type | string | Y | `application/x-www-form-urlencoded` |

**요청 파라미터**

| 이름 | 타입 | 필수값 여부 | 설명 |
| --- | --- | --- | --- |
| grant\_type | string | Y | 고정 값: `client_credentials` |
| scope | string | Y | 인증 요청 범위 (예: `ca`) |
| client\_id | string | Y | 고객사에 발급된 클라이언트 아이디 |
| client\_secret | string | Y | 고객사에 발급된 클라이언트 시크릿 |

::: code-group

```bash [Shell(curl)]
curl --request POST 'https://oauth2.cert.toss.im/token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=client_credentials' \
--data-urlencode 'client_id=test_a8e23336d673ca70922b485fe806eb2d' \
--data-urlencode 'client_secret=test_418087247d66da09fda1964dc4734e453c7cf66a7a9e3' \
--data-urlencode 'scope=ca'
```

```java
URL url = new URL("https://oauth2.cert.toss.im/token");
HttpURLConnection httpConn = (HttpURLConnection) url.openConnection();
httpConn.setRequestMethod("POST"); 

httpConn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
httpConn.setDoOutput(true);
OutputStreamWriter writer = new OutputStreamWriter(httpConn.getOutputStream());
writer.write("grant_type=client_credentials&" +
        "client_id=test_a8e23336d673ca70922b485fe806eb2d&" +
        "client_secret=test_418087247d66da09fda1964dc4734e453c7cf66a7a9e3&" +
        "scope=ca");
writer.flush();
writer.close(); 

httpConn.getOutputStream().close();
InputStream responseStream = httpConn.getResponseCode() == 200
        ? httpConn.getInputStream()
        : httpConn.getErrorStream();
Scanner s = new Scanner(responseStream).useDelimiter("\A");
String response = s.hasNext() ? s.next() : "";
System.out.println(response);
```

```php
<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://oauth2.cert.toss.im/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type' : 'application/x-www-form-urlencoded',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'grant_type=client_credentials&client_id=test_a8e23336d673ca70922b485fe806eb2d&client_secret=test_418087247d66da09fda1964dc4734e453c7cf66a7a9e3&scope=ca');

$response = curl_exec($ch);

curl_close($ch);
```

:::

**응답**

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| access\_token | string | Access Token 값 |
| scope | string | 발급된 인증 범위 |
| token\_type | string | 토큰 타입 (항상 `Bearer`) |
| expires\_in | number | 토큰 만료 시간(초 단위) |

```json
{
  "access_token": "eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ",
  "scope": "ca",
  "token_type": "Bearer",
  "expires_in": 31536000
}
```

### 2. 인증 요청하기

토스 인증 서버에서 `txId`를 발급받아 본인확인 절차를 시작해요.

* BaseURL : `https://cert.toss.im`
* Endpoint : `/api/v2/sign/user/auth/id/request`
* Method : `POST`
* Content-type : `application/json`

### 2-1. 개인정보 기반 인증

고객의 **이름·생년월일·전화번호** 를 **암호화 후 전송**하는 방식이에요.\
보안을 위해 [세션키(sessionKey)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertSessionKey.html)는 매 요청마다 새로 생성하세요.

**요청 헤더**

| 이름 | 타입 | 필수값 여부 | 설명 |
|---------------|---------|--------------|---------------------------------------------|
| Authorization | string | Y | `Bearer {Access Token}` |
| Content-Type | string | Y | `application/json` |

**요청 파라미터**

| 이름 | 타입 | 필수값 여부 | 설명 |
| --- | --- | --- | --- |
| requestUrl | string | Y | 토스 본인확인 사용 시 돌아갈 고객사 앱스킴 |
| requestType | string | Y | `USER_PERSONAL` |
| triggerType | string | Y | `APP_SCHEME` |
| userName | string | Y | [암호화](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertEncrypt.html) 필수 |
| userPhone | string | Y | 숫자만, [암호화](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertEncrypt.html) 필수 |
| userBirthday | string | Y | `YYYYMMDD`, [암호화](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertEncrypt.html) 필수 |
| sessionKey | string | Y | AES 암복호화용, 매 요청마다 신규 생성 필요 [(생성 방법)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertSessionKey.html)|

#### 요청 예시

::: code-group

```bash [Shell(curl)]
curl --location --request POST 'https://cert.toss.im/api/v2/sign/user/auth/id/request' --header 'Authorization: Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ' --header 'Content-Type: application/json' # 세션 키는 매 요청 시 새로 생성해야 합니다.
--data-raw '{
       "requestType" : "USER_PERSONAL",
       "requestUrl" : "intoss://my-granite-app",
       "triggerType" : "APP_SCHEME",
       "userName" : "v1$cc575847-f549-4c1e-89c7-eff11743e05e$5AfwdVLSmDoxBERDIV8gDny2QLcOzYOqvgt1l4gqEA==",
       "userPhone" : "v1$cc575847-f549-4c1e-89c7-eff11743e05e$OKtwqMR/RI+N3vx0FNtcx8GAoejDq5lb3wIr",
       "userBirthday" : "v1$cc575847-f549-4c1e-89c7-eff11743e05e$OaNxoMR2RYaPiH7km5yJyZQ472+uWNEy",
       "sessionKey" : "v1$cc575847-f549-4c1e-89c7-eff11743e05e$XTTyBJntTja9NfUaTaO09bQCtEApnn3dd7lN8s+jPA6qn5q5kBbSJEptazpSMqGFyB7P0XhnJSkRwukAuunesbm+e0p5tdQ7wiOkauM44FvZj/IwETTA74iLZTNrwmE3aYXv8b1wbIfQx/oT8k9+XNEPkHA0foCFtjF8MRnyjwpzR4hoi2sFk33xhoJa46kLGxz7d3z6r/KYKMFbwkQFOm81Nk8W+oJkT0AjdlOD075QrJ4zm9VReVvE4fT4Q1jY/5VzROt4GkqVvrziYbWRp9/v1/ETVyi5Lf+MceWHLS1MGicqUXfrfnFdqvOcZZytUkvb0AAyg75Sr5tgja55ma3t5AEu65IrO1Cop4wS/XhIwKpWUrMav5JI5X1iZ1tRznE7VRT/dsRLjgIX/wtZajY2ATG+feld2mmxD/mP/ET3JXsYKfmN3DkO10fQZY9915eUyDYm7NMS/U3l+VP8wMzd5WpWVjfxUvYP5eRwPM83hG9wFhHXV4ykodiX0BLRoERXou416uKDJR61b8xFFX+iDPnOfaeROlFFWj6zbK4tPfjRzyaWVQMmSM8igq7iBglehFo+EyyQnAAcUeda+P/7fQmwFDE1a8bQuXFBCwxNOOyPiJLV2+29pzKELcHa+WCrvcbHkOgG4EwjHHWmd17vUVXZGXOERsRuLQMM3mM="
    }'
```

```java
URL url = new URL("https://cert.toss.im/api/v2/sign/user/auth/id/request");
HttpURLConnection httpConn = (HttpURLConnection) url.openConnection();
httpConn.setRequestMethod("POST");
httpConn.setRequestProperty("Authorization", "Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ");
httpConn.setRequestProperty("Content-Type", "application/json");
// 세션 키는 매 요청 시 새로 생성해야 합니다.
httpConn.setDoOutput(true);
OutputStreamWriter writer = new OutputStreamWriter(httpConn.getOutputStream());
writer.write("{" +
        "\"requestType\" : \"USER_PERSONAL\"," +
        "\"triggerType\" : \"APP_SCHEME\"," +
        "\"userName\" : \"v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$ZUyjGpmb/nL9W7//N1/VUN/F/947biU+1w==\"," +
        "\"userPhone\" : \"v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$v8QTxScwJ/NBA+Gp/TXerMWQp9BrQ45M7xaC\"," +
        "\"userBirthday\" : \"v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$vswaxSEyJf/J7Qndq2E7iOPJOmIWILby\"," +
        "\"sessionKey\" : \"v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$MdeifC7fngWC9qn/qia1Itp6jYulvhTH1JCln0oYp3xg95VpnqN5O5isZ58ZYD1WM03YooETiwQIjtLEMl2HSjxwlXZQ2yoyd/zH3mgCzlVDd/nOO0AI04Rzo/M7mvdfoN/k+DUBAeQ4NBIC9uqMt0JrkpuGvv3O1faYPBCV6OCMIcAOAbQb9fJx1bWFRLMkhd3meTD9wt2px46Kz7kW/FZXefMJr4qdnJEX9pZKz2QMJCMEnu0aW+AkJQUS5VfPSohrFTS8VeWoiNArFSESIxZhX3A+duAIJrYxTvXvOCM9ntO9xIMwTd+hp9L1UAYFOrqh6J2gmN1nI5ScBvtkLwRMFQ1D/eoSL/HD7Xb9cBAxMxPX4dn0OjLkUuO0y+KW4s+Prj9IYesDEkXUQpuQKz+4mLfX88lyplJ7o2x3uoecFlIBT92oY6BI+yxTATnwSIK249OwX2vuG6HLSOXlI3RScHjEDtzz1zPK6kjCGkFBM+5+gMyTIF4C130Uk4rlXpxYOGwPoBKBD2buGbBh7AHIaFgHlYjShdPiHMCF0ZDQnOubk139cRzoCVkKqdpPgVqIy8q6982UXzeoSIxqpSauqaL0IK2PPbMy3s9WH12NrDFDkg4NLAhnEgGNfOPjMl9lRMW+i4cCw0jhaCx1bu5GTEQzDCpc0DFT+/KPkKc=\"" +
        "}");
writer.flush();
writer.close();
httpConn.getOutputStream().close();
InputStream responseStream = httpConn.getResponseCode() == 200
        ? httpConn.getInputStream()
        : httpConn.getErrorStream();
Scanner s = new Scanner(responseStream).useDelimiter("\A");
String response = s.hasNext() ? s.next() : "";
System.out.println(response);
```

```php
<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://cert.toss.im/api/v2/sign/user/auth/id/request');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization' : 'Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ',
    'Content-Type' : 'application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{
       "requestType" : "USER_PERSONAL",
       "triggerType" : "APP_SCHEME",
       "userName" : "v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$ZUyjGpmb/nL9W7//N1/VUN/F/947biU+1w==",
       "userPhone" : "v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$v8QTxScwJ/NBA+Gp/TXerMWQp9BrQ45M7xaC",
       "userBirthday" : "v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$vswaxSEyJf/J7Qndq2E7iOPJOmIWILby",
       "sessionKey" : "v1$255f8cc3-7d1d-4667-b28b-03f44e09483f$MdeifC7fngWC9qn/qia1Itp6jYulvhTH1JCln0oYp3xg95VpnqN5O5isZ58ZYD1WM03YooETiwQIjtLEMl2HSjxwlXZQ2yoyd/zH3mgCzlVDd/nOO0AI04Rzo/M7mvdfoN/k+DUBAeQ4NBIC9uqMt0JrkpuGvv3O1faYPBCV6OCMIcAOAbQb9fJx1bWFRLMkhd3meTD9wt2px46Kz7kW/FZXefMJr4qdnJEX9pZKz2QMJCMEnu0aW+AkJQUS5VfPSohrFTS8VeWoiNArFSESIxZhX3A+duAIJrYxTvXvOCM9ntO9xIMwTd+hp9L1UAYFOrqh6J2gmN1nI5ScBvtkLwRMFQ1D/eoSL/HD7Xb9cBAxMxPX4dn0OjLkUuO0y+KW4s+Prj9IYesDEkXUQpuQKz+4mLfX88lyplJ7o2x3uoecFlIBT92oY6BI+yxTATnwSIK249OwX2vuG6HLSOXlI3RScHjEDtzz1zPK6kjCGkFBM+5+gMyTIF4C130Uk4rlXpxYOGwPoBKBD2buGbBh7AHIaFgHlYjShdPiHMCF0ZDQnOubk139cRzoCVkKqdpPgVqIy8q6982UXzeoSIxqpSauqaL0IK2PPbMy3s9WH12NrDFDkg4NLAhnEgGNfOPjMl9lRMW+i4cCw0jhaCx1bu5GTEQzDCpc0DFT+/KPkKc="
       }');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);

curl_close($ch);
```

:::

#### 응답 예시

**성공 응답**

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| resultType | string | 요청 결과 (성공 : `SUCCESS`, 실패 : `FAIL`) |
| success.txId | string | 인증 요청 트랜잭션 아이디로 거래를 고유할 수 있는 값. 특정 거래를 고유할 수 있는 값이므로 반드시 저장 관리해야 합니다. |
| success.requestedDt | string | 최초 요청 시각(`YYYY-MM-DDThh:mm:ss±hh:mm`) |
| success.appScheme | string | 토스 인증 화면을 띄울 수 있는 앱 스킴 정보  |
| success.androidAppUri | string | 안드로이드 인증 앱 스킴 값으로 appScheme과 같은 역할을 하지만, Chrome Intent를 사용하기 때문에 고객사의 추가 기능 구현없이 토스 앱 설치 유무를 판별할 수 있는 장점이 있습니다.  |
| success.iosAppUri | string |  iOS 인증 앱 스킴 값으로 appScheme과 같은 역할을 하지만, Universal Link를 사용하기 때문에 안드로이드와 마찬가지로 고객사의 추가 기능 구현 없이 토스 앱 설치 유무를 판별할 수 있는 장점이 있습니다.|

```json
{
    "resultType": "SUCCESS",
    "success": {
        "txId": "d7b7273b-407b-46be-a9d8-97d2e895b009",
        "appScheme": "null",
        "androidAppUri": "null",
        "iosAppUri": "null",
        "requestedDt": "2022-02-13T17:52:22+09:00"
    }
}
```

**실패 응답**

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| resultType | string | 실패 시 `FAIL` |
| error.errorType | number | 에러 유형 |
| error.errorCode | string | 에러 코드(예: `CE1000`) |
| error.reason | string | 에러 메시지 |
| error.data | object | 부가 데이터(있을 경우) |
| error.title | string | null | 에러 제목(있을 경우) |

```json
{
  "resultType": "FAIL",
  "error": {
    "errorType": 0,
    "errorCode": "CE1000",
    "reason": "토큰이 유효하지 않습니다.",
    "data": {},
    "title": null
  },
  "success": null
}

```

> 응답의 txId를 사용해 [appsInTossSignTossCert](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertRequest.html) 함수를 호출하면 토스앱 인증 화면이 실행됩니다.\
> [인증 화면 호출하기](https://developers-apps-in-toss.toss.im/tossauth/develop.html#_3-인증-화면-호출하기) 를 참고해주세요

### 2-2. 원터치 인증

클라이언트에서 **개인정보 입력 없이** 토스앱을 호출해 **한 번에 인증을 완료**해요.

| 이름            | 타입     | 필수 | 설명                      |
| ------------- | ------ | -- | ----------------------- |
| Authorization | string | Y  | `Bearer {Access Token}` |
| Content-Type  | string | Y  | `application/json`      |

| 이름          | 타입     | 필수 | 설명                     |
| ----------- | ------ | -- | ---------------------- |
| requestType | string | Y  | `"USER_NONE"`          |
| requestUrl  | string | Y  | 인증 완료 후 돌아올 앱스킴   |

#### 요청 예시

::: code-group

```bash [Shell(curl)]
curl --location --request POST 'https://cert.toss.im/api/v2/sign/user/auth/id/request' --header 'Authorization: Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ' --header 'Content-Type: application/json' # 세션 키는 매 요청 시 새로 생성해야 합니다.
--data-raw '{
       "requestType" : "USER_NONE",
       "requestUrl" : "intoss://my-granite-app",
    }'
```

```java
URL url = new URL("https://cert.toss.im/api/v2/sign/user/auth/id/request");
HttpURLConnection httpConn = (HttpURLConnection) url.openConnection();
httpConn.setRequestMethod("POST");
httpConn.setRequestProperty("Authorization", "Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ");
httpConn.setRequestProperty("Content-Type", "application/json");
// 세션 키는 매 요청 시 새로 생성해야 합니다.
httpConn.setDoOutput(true);
OutputStreamWriter writer = new OutputStreamWriter(httpConn.getOutputStream());
writer.write("{" +
        "\"requestType\" : \"USER_NONE\"," +
        "}");
writer.flush();
writer.close();
httpConn.getOutputStream().close();
InputStream responseStream = httpConn.getResponseCode() == 200
        ? httpConn.getInputStream()
        : httpConn.getErrorStream();
Scanner s = new Scanner(responseStream).useDelimiter("\A");
String response = s.hasNext() ? s.next() : "";
System.out.println(response);
```

```php
<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://cert.toss.im/api/v2/sign/user/auth/id/request');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ',
    'Content-Type: application/json',
]);


curl_setopt($ch, CURLOPT_POSTFIELDS, '{
    "requestType": "USER_NONE",
    "requestUrl": "intoss://my-granite-app"
}');

curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);

curl_close($ch);
```

:::

#### 응답 예시

**성공 응답**

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| resultType | string | 요청 결과 (성공 : `SUCCESS`, 실패 : `FAIL`) |
| success.txId | string | 인증 요청 트랜잭션 아이디로 거래를 고유할 수 있는 값. 특정 거래를 고유할 수 있는 값이므로 반드시 저장 관리해야 합니다. |
| success.requestedDt | string | 최초 요청 시각(`YYYY-MM-DDThh:mm:ss±hh:mm`) |

```json
{
    "resultType": "SUCCESS",
    "success": {
        "txId": "d7b7273b-407b-46be-a9d8-97d2e895b009",
        "requestedDt": "2022-02-13T17:52:22+09:00"
    }
}
```

**실패 응답**

| 이름 | 타입 | 설명 |
| --- | --- | --- |
| resultType | string | 실패 시 `FAIL` |
| error.errorType | number | 에러 유형 |
| error.errorCode | string | 에러 코드(예: `CE1000`) |
| error.reason | string | 에러 메시지 |
| error.data | object | 부가 데이터(있을 경우) |
| error.title | string | null | 에러 제목(있을 경우) |

```json
{
  "resultType": "FAIL",
  "error": {
    "errorType": 0,
    "errorCode": "CE1000",
    "reason": "토큰이 유효하지 않습니다.",
    "data": {},
    "title": null
  },
  "success": null
}

```

> 응답의 txId를 사용해 [appsInTossSignTossCert](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertRequest.html) 함수를 호출하면 토스앱 인증 화면이 실행됩니다.\
> [인증 화면 호출하기](https://developers-apps-in-toss.toss.im/tossauth/develop.html#_3-인증-화면-호출하기) 를 참고해주세요

### 3. 인증 화면 호출하기

**SDK를 통해 연동해주세요.**

응답에서 받은 `txId`를 사용해 `appsInTossSignTossCert` 함수를 호출하면, 토스앱 인증 화면이 실행돼요.
[appsInTossSignTossCert](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertRequest.md)를 확인해 주세요.

::: tip 토스앱 최소 버전을 확인하세요

* 토스 인증(requestType: USER\_PERSONAL): 토스앱 5.233.0 이상
* 토스 원터치 인증(requestType: USER\_NONE): 토스앱 5.236.0 이상

[getTossAppVersion](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/getTossAppVersion) 함수를 사용하여 토스앱 버전을 체크해보세요.
:::

### 4. 본인확인 상태 조회하기

사용자의 현재 인증 **진행 상태**를 조회해요.\
`txId`를 사용해 현재의 인증 단계 (`REQUESTED`, `IN_PROGRESS`, `COMPLETED`, `EXPIRED`)를 확인할 수 있어요.

::: tip 주의하세요
상태조회 API는 **진행 상태 확인용**이에요.\
최종 인증 성공 여부는 **결과조회 API**로 판별해야 해요.
:::

* BaseURL : `https://cert.toss.im`
* Endpoint : `/api/v2/sign/user/auth/id/status`
* Method : `POST`
* Content-type : `application/json`

**요청 헤더**

| 이름 | 타입 | 필수값 여부 | 설명 |
|---|---|---|---|
| Authorization | string | Y | `Bearer {Access Token}` |
| Content-Type | string | Y | `application/json` |

**요청 파라미터**

| 이름 | 타입 | 필수값 여부 | 설명 |
|---|---|---|---|
| txId | string | Y | 상태 확인이 필요한 인증 요청 트랜잭션 아이디 |

**요청 예시**

:::code-group

```bash [Shell(curl)]
curl --location --request POST 'https://cert.toss.im/api/v2/sign/user/auth/id/status' \
--header 'Authorization: Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ' \
--header 'Content-Type: application/json' \
--data-raw '{
      "txId": "633f3e1b-1a11-4e7c-9b35-dd391f440be4"
    }'
```

```java
URL url = new URL("https://cert.toss.im/api/v2/sign/user/auth/id/status");
HttpURLConnection httpConn = (HttpURLConnection) url.openConnection();
httpConn.setRequestMethod("POST"); 

httpConn.setRequestProperty("Authorization", "Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ");
httpConn.setRequestProperty("Content-Type", "application/json");
httpConn.setDoOutput(true);
OutputStreamWriter writer = new OutputStreamWriter(httpConn.getOutputStream());
writer.write("{\"txId\": \"633f3e1b-1a11-4e7c-9b35-dd391f440be4\"}");
writer.flush();
writer.close(); 

httpConn.getOutputStream().close();
InputStream responseStream = httpConn.getResponseCode() == 200
        ? httpConn.getInputStream()
        : httpConn.getErrorStream();
Scanner s = new Scanner(responseStream).useDelimiter("\A");
String response = s.hasNext() ? s.next() : "";
System.out.println(response);
```

```php
<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://cert.toss.im/api/v2/sign/user/auth/id/status');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization' : 'Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ',
    'Content-Type' : 'application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{"txId": "633f3e1b-1a11-4e7c-9b35-dd391f440be4"}');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);

curl_close($ch);
```

:::

**성공 응답**

| 이름 | 타입 | 설명 |
|---|---|---|
| resultType | string | 요청 결과. 성공 시 `SUCCESS` |
| success.txId | string | 조회한 인증 트랜잭션 ID |
| success.status | string | 인증 진행 상태 (아래 “status 값” 표 참고) |
| success.requestedDt | string | 최초 인증 요청 시각 (`YYYY-MM-DDThh:mm:ss±hh:mm`, ISO 8601) |

```json
{
  "resultType": "SUCCESS",
  "success": {
    "txId": "633f3e1b-1a11-4e7c-9b35-dd391f440be4",
    "status": "REQUESTED",
    "requestedDt": "2022-02-13T18:00:26+09:00"
  }
}
```

**실패 응답**

| 이름 | 타입 | 설명 |
|---|---|---|
| resultType | string | 실패 시 `FAIL` |
| error.errorType | number | 에러 유형 |
| error.errorCode | string | 에러 코드(예: `CE3100`) |
| error.reason | string | 에러 메시지 |
| error.data | object | 부가 데이터(있을 경우) |
| error.title | string | null | 에러 제목(있을 경우) |

```json
{
  "resultType": "FAIL",
  "error": {
    "errorType": 0,
    "errorCode": "CE3100",
    "reason": "존재하지 않는 요청입니다",
    "data": {},
    "title": null
  },
  "success": null
}
```

**status 값**

| 값 | 설명 |
|---|---|
| REQUESTED | 토스 인증서버에서 사용자의 토스 앱으로 인증이 요청된 상태 |
| IN\_PROGRESS | 사용자가 인증을 진행 중인 상태 |
| COMPLETED | 고객이 인증을 완료한 상태 *(최종 확정은 결과조회 API로 판단 해야해요)* |
| EXPIRED | 유효시간 만료로 인증 진행이 불가한 상태 |

### 5. 본인확인 결과 조회하기

인증이 완료된 사용자의 **결과 정보**를 조회해요.\
조회는 반드시 **서버-서버 통신**으로 진행해 주세요.\
본인확인 결과로 수집한 정보는 서버에 안전하게 저장하고, 이후 전자서명/간편인증 시 해당 정보와 비교·검증 해 주세요.

:::tip 주의하세요
결과조회 API는 성공 기준으로 **최대 2회**까지만 조회가 가능해요.\
사용자 인증을 끝마친 후 **60분(1시간) 이내** 결과 조회를 끝내야 해요.\
60분을 초과하면 결과 조회가 제한되며 인증 요청 API부터 다시 시작해야 해요.
:::

* BaseURL : `https://cert.toss.im`
* Endpoint : `/api/v2/sign/user/auth/id/result`
* Method : `POST`
* Content-type : `application/json`

**요청 헤더**

| 이름 | 타입 | 필수값 여부 | 설명 |
|---|---|---|---|
| Authorization | string | Y | `Bearer {Access Token}` |
| Content-Type | string | Y | `application/json` |

**요청 파라미터**

| 이름 | 타입 | 필수값 여부 | 설명 |
|---|---|---|---|
| txId | string | Y | 결과 확인이 필요한 인증 요청 트랜잭션 아이디 |
| sessionKey | string | Y | 결과조회에서는 인증수단과 무관하게 `txId`와 함께 필수로 전달. 요청/응답 AES 암·복호화용 세션 키로, 매 요청마다 새로 생성하고 인증요청에서 사용한 세션키는 재사용 금지 [(생성 방법)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertSessionKey.html)|

**요청 예시**
:::code-group

```bash [Shell(curl)]
curl --location --request POST 'https://cert.toss.im/api/v2/sign/user/auth/id/result' \
--header 'Authorization: Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ' \
--header 'Content-Type: application/json' \
## 세션 키는 매 요청 시 새로 생성해야 합니다.
--data-raw '{
       "txId" : "c1ce9214-9878-4751-b433-0c96641b0e13",
       "sessionKey" : "v1$71c3d6cd-6a74-48a8-8ab2-b48e6133ae6f$Q0U7Bdg4dWd0XXucjsM/mda89bFU7eHnoUhgQ3k+cGQ9gv37jvWC+8isrkO2CR4+qgoPg+U+K7/tQH2m+uU7L8Ab0gzbQo6ASX39NpcP6RHpI+VBi323ssYnBmJL7n0z4aNm6raUEsMoNwrOaMDe0DqfalgOeZgZUztWew1pfZul2Q3/WIBMdp+npS4sFnBRoBrzLroVsuNRTLK0XT6m5hak+ys+vBg5vZFoI0JN7j7zsr8lqGi6piSkygl1PLPugnSC9cOezxMoVN5c/csEVQxMsfkwqTIASaZVECnP50dO70TydYhBFCqxw3DpEDBHcXNDucOtdVOPslCPNx3NZv1i0IH0r92ULb3w2Y0Fncy4/xL1dPSS+TbA5540u2Wb3cxqVNHib7WwSMHBwQtXAnFSFZmcvQQPXtTeQ7SCvNnhA8k3gbboSpbDBg60RWn/1zF/ogBYRldO1BFtq7KP+jOm6I2OSSVpagH1Wu5MXhEtiTmsx7M8j/IM8EfnXbD9axJnlW2fKHZVvAj+5KNhqy90PUimBCKiXqjvUwOqb9hGGEzJ4JVKbIIiy1EYOaRkPTK9GurZwQaqM4o4c8pzOYRQR/3XIPWHxLv/jwsaMcfUIQFyKE+w898g+l1zO0jcck59/R64kZcirT9AsGFnRUWrsHGIkM95jdYlpUsnCXw="
  }'
```

```java
URL url = new URL("https://cert.toss.im/api/v2/sign/user/auth/id/result");
HttpURLConnection httpConn = (HttpURLConnection) url.openConnection();
httpConn.setRequestMethod("POST"); 

httpConn.setRequestProperty("Authorization", "Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ");
httpConn.setRequestProperty("Content-Type", "application/json"); 

// 세션 키는 매 요청 시 새로 생성해야 합니다.
httpConn.setDoOutput(true);
OutputStreamWriter writer = new OutputStreamWriter(httpConn.getOutputStream());
writer.write("{" +
        "\"txId\" : \"c1ce9214-9878-4751-b433-0c96641b0e13\"," +
        "\"sessionKey\" : \"v1$71c3d6cd-6a74-48a8-8ab2-b48e6133ae6f$Q0U7Bdg4dWd0XXucjsM/mda89bFU7eHnoUhgQ3k+cGQ9gv37jvWC+8isrkO2CR4+qgoPg+U+K7/tQH2m+uU7L8Ab0gzbQo6ASX39NpcP6RHpI+VBi323ssYnBmJL7n0z4aNm6raUEsMoNwrOaMDe0DqfalgOeZgZUztWew1pfZul2Q3/WIBMdp+npS4sFnBRoBrzLroVsuNRTLK0XT6m5hak+ys+vBg5vZFoI0JN7j7zsr8lqGi6piSkygl1PLPugnSC9cOezxMoVN5c/csEVQxMsfkwqTIASaZVECnP50dO70TydYhBFCqxw3DpEDBHcXNDucOtdVOPslCPNx3NZv1i0IH0r92ULb3w2Y0Fncy4/xL1dPSS+TbA5540u2Wb3cxqVNHib7WwSMHBwQtXAnFSFZmcvQQPXtTeQ7SCvNnhA8k3gbboSpbDBg60RWn/1zF/ogBYRldO1BFtq7KP+jOm6I2OSSVpagH1Wu5MXhEtiTmsx7M8j/IM8EfnXbD9axJnlW2fKHZVvAj+5KNhqy90PUimBCKiXqjvUwOqb9hGGEzJ4JVKbIIiy1EYOaRkPTK9GurZwQaqM4o4c8pzOYRQR/3XIPWHxLv/jwsaMcfUIQFyKE+w898g+l1zO0jcck59/R64kZcirT9AsGFnRUWrsHGIkM95jdYlpUsnCXw=\"" +
        "}");
writer.flush();
writer.close(); 

httpConn.getOutputStream().close();
InputStream responseStream = httpConn.getResponseCode() / 100 == 2
        ? httpConn.getInputStream()
        : httpConn.getErrorStream();
Scanner s = new Scanner(responseStream).useDelimiter("\A");
String response = s.hasNext() ? s.next() : "";
System.out.println(response);
```

```php
<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://cert.toss.im/api/v2/sign/user/auth/id/result');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization' : 'Bearer eyJraWQiOiJjZXJ0IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJ0ZXN0X2E4ZTIzMzM2ZDY3M2NhNzA5MjJiNDg1ZmU4MDZlYjJkIiwiYXVkIjoidGVzdF9hOGUyMzMzNmQ2NzNjYTcwOTIyYjQ4NWZlODA2ZWIyZCIsIm5iZiI6MTY0OTIyMjk3OCwic2NvcGUiOlsiY2EiXSwiaXNzIjoiaHR0cHM6XC9cL2NlcnQudG9zcy5pbSIsImV4cCI6MTY4MDc1ODk3OCwiaWF0IjoxNjQ5MjIyOTc4LCJqdGkiOiI4MDNjNDBjOC1iMzUxLTRmOGItYTIxNC1iNjc5MmNjMzBhYTcifQ.cjDZ0lAXbuf-KAgi3FlG1YGxvgvT3xrOYKDTstfbUz6CoNQgvd9TqI6RmsGZuona9jIP6H12Z1Xb07RIfAVoTK-J9iC5_Yp8ZDdcalsMNj51pPP8wso86rn-mKsrx1J5Rdi3GU58iKt0zGr4KzqSxUJkul9G4rY03KInwvl692HU19kYA9y8uTI4bBX--UPfQ02G0QH9HGTPHs7lZsISDtyD8sB2ikz5p7roua7U467xWy4BnRleCEWO2uUaNNGnwd7SvbjhmsRZqohs9KzDUsFjVhSiRNdHL53XJQ5zFHwDF92inRZFLu6Dw8xttPtNHwAD1kT84uXJcVMfEHtwkQ',
    'Content-Type' : 'application/json',
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, '{
       "txId" : "c1ce9214-9878-4751-b433-0c96641b0e13",
       "sessionKey" : "v1$71c3d6cd-6a74-48a8-8ab2-b48e6133ae6f$Q0U7Bdg4dWd0XXucjsM/mda89bFU7eHnoUhgQ3k+cGQ9gv37jvWC+8isrkO2CR4+qgoPg+U+K7/tQH2m+uU7L8Ab0gzbQo6ASX39NpcP6RHpI+VBi323ssYnBmJL7n0z4aNm6raUEsMoNwrOaMDe0DqfalgOeZgZUztWew1pfZul2Q3/WIBMdp+npS4sFnBRoBrzLroVsuNRTLK0XT6m5hak+ys+vBg5vZFoI0JN7j7zsr8lqGi6piSkygl1PLPugnSC9cOezxMoVN5c/csEVQxMsfkwqTIASaZVECnP50dO70TydYhBFCqxw3DpEDBHcXNDucOtdVOPslCPNx3NZv1i0IH0r92ULb3w2Y0Fncy4/xL1dPSS+TbA5540u2Wb3cxqVNHib7WwSMHBwQtXAnFSFZmcvQQPXtTeQ7SCvNnhA8k3gbboSpbDBg60RWn/1zF/ogBYRldO1BFtq7KP+jOm6I2OSSVpagH1Wu5MXhEtiTmsx7M8j/IM8EfnXbD9axJnlW2fKHZVvAj+5KNhqy90PUimBCKiXqjvUwOqb9hGGEzJ4JVKbIIiy1EYOaRkPTK9GurZwQaqM4o4c8pzOYRQR/3XIPWHxLv/jwsaMcfUIQFyKE+w898g+l1zO0jcck59/R64kZcirT9AsGFnRUWrsHGIkM95jdYlpUsnCXw="
       }');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

$response = curl_exec($ch);

curl_close($ch);
```

:::

**성공 응답**

| 이름 | 타입 | 설명 |
|---|---|---|
| resultType | string | 성공 시 `SUCCESS` |
| success.txId | string | 결과를 조회한 인증 트랜잭션 아이디 |
| success.status | string | `COMPLETED` *(결과 조회가 정상 처리된 상태)* |
| success.userIdentifier | string | null | 현재 버전 미사용 (`null`) |
| success.userCiToken | string | null | 현재 버전 미사용 (`null`) |
| success.signature | string | 사용자가 서명한 전자서명 값(**Base64 인코딩된 DER**). **txId와 함께 저장 관리 필수** |
| success.randomValue | string | null | 현재 버전 미사용 (`null`) |
| success.completedDt | string | 사용자 인증 완료 시각 (`YYYY-MM-DDThh:mm:ss±hh:mm`, ISO 8601) |
| success.requestedDt | string | 최초 인증 요청 시각 (`YYYY-MM-DDThh:mm:ss±hh:mm`, ISO 8601) |
| success.personalData | object | 인증에 사용된 **개인정보(암호화 값)**. 하위 필드 표 참고 |

**personalData(인증을 진행한 사용자 개인정보) Object**

| 이름 | 타입 | 설명 |
|---|---|---|
| ci | string | 암호화된 사용자의 CI |
| name | string | 암호화된 사용자의 이름 |
| birthday | string | 암호화된 생년월일 8자리 |
| gender | string | 암호화된 성별 정보 (`MALE` | `FEMALE`) |
| nationality | string | 암호화된 국적 (`LOCAL` | `FOREIGNER`) |
| ci2 | string | null | 예측 불가 상황에서 ci 유출 대응을 위한 임시 파라미터, `null` 고정 |
| di | string | 암호화된 사용자의 DI |
| ciUpdate | string | null | 예측 불가 상황에서 ci 유출 대응을 위한 임시 파라미터, `null` 고정 |
| ageGroup | string | 암호화된 성인여부 (`ADULT` | `MINOR`) |

```json
// 결과조회 응답에서는 인증을 호출하는 방식에 상관없이 동일한 바디 파라미터를 제공합니다.
{
  "resultType": "SUCCESS",
  "success": {
    "txId": "c1ce9214-9878-4751-b433-0c96641b0e13",
    "status": "COMPLETED",
    "userIdentifier": null,
    "userCiToken": null,
    "signature": "MIIJCAYJKoZIhvcN...(생략)...ghkgBZQMEAgEFADCBwwYJKoZIhvcNAQcBoIG1BIGyeyJ0eElkIjoiZGU1ZjVkNDItNTA4Yi00Njg2LWJiYzAtNDczNmJmZWJhY2FkIiwicGFydG5lckNvZGUiOiJURVNUMSIsInNlcnZpY2VUeXBlIjoi6rCE7Y647J247KadIiwiaWRlbnRpZmllciI6bnVsbCwidXNlcklkZW50aWZpZXIiOm51bGwsInJlcXVlc3RUcyI6IjIwMjItMDQtMjJUMDE6MDU6NDIrMDk6MDAifaCCBiUwggYhMIIECaADAgECAgN2Xf8wDQYJKoZIhvcNAQELBQAwUTELMAkGA1UEBgwCS1IxGzAZBgNVBAoMElZpdmEgUmVwdWJsaWNhIEluYzESMBAGA1UECwwJVG9zcyBDZXJ0MREwDwYDVQQDDAhUb3NzIENBMTAeFw0yMjA0MTQwMjM0MTFaFw0yNTA0MTMxNDU5NTlaMHwxCzAJBgNVBAYTAktSMRswGQYDVQQKDBJWaXZhIFJlcHVibGljYSBJbmMxEjAQBgNVBAsMCVRvc3MgQ2VydDEoMCYGCgmSJomT8ixkAQEMGDcwMDI3MjMyMDIxMTEzMDgwMjAwOTk5MTESMBAGA1UEAwwJ6rmA7IiY67mIMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAljEvPPqzfLIkulmJJ45z+1jfron60TSXRx9KWeVXt41yU7qgoWQkrhOVd4g/AGwS2jxStjJ2TU7AFEaTMhA6KLkMhrsE3l48B//AaTh2UA0NEVwa+/C2Aw7qh5rg170yEe0sRVs5syH3R4bEiGia0CmSGSRnVIgNuazVf/EpHAvAvkEcknn6VjrivylLsHlq2UYTZw7t8Ijva51tiS660XUOfeamJniUfyqiYZZGtrOtF1FCuOldECGt3C6oJytmg4R4MIIfouEUfWEeiZKL1//AiQ2i1I0zJDKqH7eB54534yuJFtQs4ocIlNg/VMbJYWaOjRooTxRqabquNb41MQIDAQABo4IB1TCCAdEwfgYDVR0jBHcwdYAUIOEEYoA6EFhC3FSBskx+jPX3qh+hWqRYMFYxCzAJBgNVBAYMAktSMRswGQYDVQQKDBJWaXZhIFJlcHVibGljYSBJbmMxEjAQBgNVBAsMCVRvc3MgQ2VydDEWMBQGA1UEAwwNVG9zcyBSb290IENBMYIBAjAdBgNVHQ4EFgQUzGBp9tdMgfWMqyYxYqNQ9CaPHkIwDgYDVR0PAQH/BAQDAgbAMIGLBgNVHSABAf8EgYAwfjB8BgsqgxqMmyIFAQEBAzBtMCsGCCsGAQUFBwIBFh9odHRwOi8vY2EuY2VydC50b3NzLmltL2Nwcy5odG1sMD4GCCsGAQUFBwICMDIeMABUAGgAaQBzACAAaQBzACAAVABvAHMAcwAgAGMAZQByAHQAaQBmAGkAYwBhAHQAZTBbBgNVHR8EVDBSMFCgTqBMhkpodHRwOi8vY2EuY2VydC50b3NzLmltL2NybC90b3NzX2NybF9kcDJwMjU4Ni5jcmw/Y2VydGlmaWNhdGVSZXZvY2F0aW9uTGlzdDA1BggrBgEFBQcBAQQpMCcwJQYIKwYBBQUHMAGGGWh0dHA6Ly9vY3NwLmNlcnQudG9zcy5pbS8wDQYJKoZIhvcNAQELBQADggIBABgt3/wzvsAMXX9JJK1JJbgXO5Ft5TdoJEdJXwdjIVrSDg62vreg9K3sR7pAz7Zw3/IUabWrChMnIfD8fmbVB1vB0vX+S9HcvIkNhhM5m3rQUnEMpsO+oK73IZ7E9IHKfYUy0QrrjVwqQakKI5Zc6YfLd9oCWSWh25oGwUgo524gkC86xYG2CLGpP4bDLEIZQe5+Dg+2v6KWuouDI/SnYkAXU+Qi0+YYGR3w3d2Qp5yqZ/D5hcR2aOEFDfl31NwVVeJ1lCHE+bhhqoxZzfUDl+2X1jHdIRyZ+kYARJg5VI+if9OhtT+pI1d55EGCkgi+xRlp03mCLHFr4a5KjZG4+5ds+73s2dUasAeiaZ6XmisfjtR1Gs5eV4wgtBJ12+faBxXIPhhDvZaO5Ag7ehMAyrn8VwgQAC5WMnsMqRx4t1AwInU9NgMRhKxjxrBxhWzjVBmBjeD891OHQO4pFF6QC5SzFj4ud/sX2XkB2iKj8aJUDeBN5H03FDmd0v6li3OZ2L2O5vcFVKK62EJazk7okXDTfiSf8lJa35lZPR170LqDSNOtp5u/HkdYPFZzEt0ROn5x3drEMSvrLtzCmEfgAj5NHKZfmj2VrXvRXALXXhENQLOqsWxbMrX19VyaXeUdz2+EHPwYybiRvqpqw5ZXx67HJtRRFIIBfSUjzGAnk8GIMYIB7jCCAeoCAQEwWDBRMQswCQYDVQQGDAJLUjEbMBkGA1UECgwSVml2YSBSZXB1YmxpY2EgSW5jMRIwEAYDVQQLDAlUb3NzIENlcnQxETAPBgNVBAMMCFRvc3MgQ0ExAgN2Xf8wDQYJYIZIAWUDBAIBBQCgaTAYBgkqhkiG9w0BCQMxCwYJKoZIhvcNAQcBMBwGCSqGSIb3DQEJBTEPFw0yMjA0MjExNjA1NTNaMC8GCSqGSIb3DQEJBDEiBCDFQjwDSF7RJrV5Cg3x6GlErYK7YwZV5b23yGTMuMKgXjANBgkqhkiG9w0BAQEFAASCAQBAcLs7q9Uy4Krsx8ynUgy5zyV1+QD4Er9uxpxfLuSXFw3kSbHdmQxekFN5G1aJSpQQtLHM0WhPpVZ/PnRxa2dBxt4gmIiAygjo9jsOsuU9xwbfxgIihD57Kf8H2zcPLUglDCoKP4k2c5o0GfzoOFvU31KPvWJDxPM/55TcmrJCwTWDEs76PviQcjq9IqYFxrm5jUhznCNnbew/xrGTvCNPQhge5/rapMh7UYPbsxXWaj29zC/jnDJXsiteFA6bbaFSrPJNMQHV+czza6jzS+XhaRPohmisszZ8YGbqPLvI0zmnMzIv947L3bknwPtgY5wEYg+cKPZ6SxJxpJW0DPs/",
    "randomValue": null,
    "completedDt": "2022-02-13T18:01:53+09:00",
    "requestedDt": "2022-02-13T18:00:26+09:00",
    "personalData": {
      "ci": "v1$b88f8717-8e76-4276-bed0-f769a8baf7be$X3g52aAyCBirz0UVp1oNRq0SfGtj66vGtUT3rp1aSdm1h//xmpm7vdf48fbGI2i7VTBj6TKG2rqanP6Yo9MiTQu63C8kLWayzWAMp+RLyXLovvnFb9SxxdblRtZbj5KRNlBWK9t2VXI=",
      "name": "v1$b88f8717-8e76-4276-bed0-f769a8baf7be$9oiJBRei1KI/SgXtXGmkfNHu+pdAUHXBxA==",
      "birthday": "v1$b88f8717-8e76-4276-bed0-f769a8baf7be$LQgw26ExChwWi8cQQz6GrdMAdMZGyaEI",
      "gender": "v1$b88f8717-8e76-4276-bed0-f769a8baf7be$WnREqd1HM/Ci7p+3KIqROusVkYeSAQ==",
      "nationality": "v1$b88f8717-8e76-4276-bed0-f769a8baf7be$UH5Kqd3dPV1daxw0i23eMWjeXcXC",
      "ci2": null,
      "di": "v1$2e161d9d-e620-443e-9a27-8db41cc96cf9$6GKr2zaUWWfI6rpJ6/AV9U4W0S4nhAMFIFLkt5CS6N8Gjb1Oc/dpitkMSSvLroDO5b6zdl9bufGSQ6SiVQdlYN2OWYFBr/Hb4e4AYwQpFxDbpi9ksYt52aFa3G2DwaNOQMUBkyQ1IWc=",
      "ciUpdate": null
    }
  }
}

```

**실패 응답**

| 이름 | 타입 | 설명 |
|---|---|---|
| resultType | string | 실패 시 `FAIL` |
| error.errorType | number | 에러 유형 |
| error.errorCode | string | 에러 코드(예: `CE3102`) |
| error.reason | string | 에러 메시지 |
| error.data | object | 부가 데이터(있을 경우) |
| error.title | string | null | 에러 제목(있을 경우) |

```json
{
  "resultType": "FAIL",
  "error": {
    "errorType": 0,
    "errorCode": "CE3102",
    "reason": "요청이 아직 완료되지 않았습니다.",
    "data": {},
    "title": null
  },
  "success": null
}

```

---

# 14. 토스 인증 테스트

> Source: https://developers-apps-in-toss.toss.im/tossauth/test.md

> Description: 토스인증 구현 시 테스트 방법에 대한 가이드입니다. 테스트 환경을 통해 어떻게 테스트하는지 구체적인 가이드가 담겨있습니다.

계약이 완료되지 않아도 **토스인증 테스트 환경**에서 인증 연동을 진행해 볼 수 있어요.\
먼저 연동을 진행한 뒤 테스트를 수행해 주세요.\
테스트 시에는 **앱 스토어에서 설치한 최신 버전의 토스앱**을 이용하세요.\
**본인확인**과 **원터치 인증** 방식 모두 테스트가 가능합니다.
::: tip 테스트 환경

* client\_id : `test_a8e23336d673ca70922b485fe806eb2d`
* client\_secret : `test_418087247d66da09fda1964dc4734e453c7cf66a7a9e3`
  :::

### 토스 앱 버전

* **토스앱 (본인확인)** : 5.233.0 이상
* **토스앱 (원터치 인증)** : 5.236.0 이상

[getTossAppVersion](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경%20확인/getTossAppVersion) 함수를 사용하여 토스앱 버전을 체크해보세요.

### 방화벽 설정

요청 서버의 **아웃바운드(Outbound)** 설정에 아래 토스인증 IP를 허용해주세요.\
모든 통신은 **443 포트(HTTPS)** 를 사용해요.

토스 인증 서버는 **인바운드(Inbound)** 가 제한 없이 오픈되어 있어, 별도 설정 없이 바로 통신 테스트를 진행할 수 있어요.

:::tip 본인확인 IP

* 117.52.3.222
* 117.52.3.235
* 211.115.96.222
* 211.115.96.235
  :::

### 라이브 환경과의 차이점

#### ✅ 인증 사용료 무료

테스트 환경에서는 인증을 성공적으로 완료하더라도 **과금되지 않아요.**

#### ✅ 테스트 환경 자격증명

테스트 환경의 **클라이언트 자격증명(client\_id, client\_secret)** 은 모두 `test_` 로 시작해요.\
이 접두어(prefix)를 통해 **운영 환경 정보와 쉽게 구분**할 수 있어요.

#### ✅ Access Token 유효기간

테스트 환경에서는 연동 편의를 위해 **1년(31536000초)** 유효기간이 적용된 Access Token을 제공해요.
운영 환경에서는 **사업자가 신청한 네트워크 방식**에 따라 유효기간이 달라질 수 있으니 참고해주세요.

#### ✅ 가상의 개인정보 제공

테스트 환경에서 인증이 완료되면,\
토스에 가입된 사용자의 암호화된 개인정보 대신 **토스가 생성한 가상 인물의 고정된 개인정보**가 전달돼요.

이는 실제 사용자 정보를 보호하기 위한 조치이며,\
정확한 사용자 정보가 필요하다면 **토스로부터 제공받은 이용기관 고유 키**를 사용해 운영 환경과 연동해야 해요.

:::info 테스트 환경에서 제공되는 가상 개인정보 예시

* CI : `CI0110000000001 ...  `
* DI : `DI0110000000001 ...  `
* 이름 : 김토스
* 생년월일 : 19930324
* 성별 : FEMALE
* 내외국인 : LOCAL
  :::

---

# 15. Firebase 연동

> Source: https://developers-apps-in-toss.toss.im/firebase/intro.md

앱인토스(미니앱) Webview 환경에서 Firebase를 연동하는 방법을 안내해요.\
이 문서는 **Vite(React + TypeScript)** 기반 프로젝트를 기준으로 작성되었어요.

***

### 개요

Firebase는 인증, 데이터베이스, 파일 저장 등 다양한 기능을 제공하는 서비스예요.\
앱인토스 WebView 환경에서도 동일하게 사용할 수 있지만, **보안 설정과 환경 변수 관리**가 중요해요.

***

### 1. 준비하기

* Firebase 콘솔 계정 ([console.firebase.google.com](https://console.firebase.google.com))
* Vite(React + TypeScript)로 만든 프로젝트
* Node.js, npm (또는 yarn, pnpm)

### 2. Firebase 프로젝트 만들기

1. Firebase 콘솔에서 **프로젝트 생성**을 눌러 새 프로젝트를 만들어요.
2. 프로젝트 설정 → **앱 추가** → **웹(\</>)** 을 선택해요.
3. 앱 닉네임을 입력하고 등록하면, 아래처럼 구성 정보(firebaseConfig)가 표시돼요.

```js
const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  databaseURL: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
  measurementId: '...'
}
```

### 3. 환경 변수 설정하기

Firebase 구성 정보는 보안을 위해 Vite 환경 변수로 관리하는 걸 권장해요.

프로젝트 루트에 `.env` 파일을 만들고 아래처럼 작성하세요.

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

코드에서는 `import.meta.env.VITE_FIREBASE_API_KEY`처럼 불러와요.

### 4. Firebase 설치 및 초기화

최신 Firebase 모듈식 SDK(v12+) 기준으로 작성했어요.

```bash
npm install firebase
## 또는
yarn add firebase
```

`src/firebase/init.ts`

```ts
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
```

> **참고:**
>
> * `databaseURL`은 **Realtime Database**를 사용할 때만 필요해요.
>   Firestore를 사용한다면 생략해도 괜찮아요.
> * `measurementId`는 **Firebase Analytics**(Google Analytics)를 쓸 때 필요해요.

### 5. Firestore 사용 예제

Firestore를 초기화했다면, React 컴포넌트 안에서 데이터를 읽거나 쓸 수 있어요.\
아래는 `App.tsx`에서 단일 문서를 읽고 저장하는 가장 간단한 예시예요.

```tsx
import { useState, useEffect } from 'react'
import { db } from './firebase/init'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function App() {
  const [name, setName] = useState('')
  const [savedName, setSavedName] = useState('')

  // Firestore에서 데이터 읽기
  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'users', 'exampleUser')
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setSavedName(snap.data().name)
      }
    }
    fetchData()
  }, [])

  // Firestore에 데이터 쓰기
  const handleSave = async () => {
    const ref = doc(db, 'users', 'exampleUser')
    await setDoc(ref, { name })
    setSavedName(name)
    setName('')
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Firestore 간단 예제</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 입력"
      />
      <button onClick={handleSave}>저장</button>
      <p>저장된 이름: {savedName || '(없음)'}</p>
    </div>
  )
}

export default App

```

#### 동작 방식

* 데이터 읽기 (`getDoc`)
  * Firestore의 users/exampleUser 문서를 한 번만 불러와요.
  * 문서가 존재하면 snap.data()의 값을 화면에 표시해요.

* 데이터 쓰기 (`setDoc`)
  * 입력한 이름을 Firestore에 덮어써 저장해요.
  * 문서가 없으면 자동으로 새로 생성돼요.

![firestore](https://developers-apps-in-toss.toss.im/assets/firestore-1.DBSmKjYU.png)

> Firestore는 단일 문서 외에도 여러 기능을 지원해요.
>
> * 실시간 구독 : `onSnapshot(doc(...))`을 사용하면 문서가 변경될 때마다 UI가 자동으로 갱신돼요.
> * 컬렉션 다루기 : `collection()`, `addDoc()`을 사용하면 여러 문서를 추가하고 불러올 수 있어요.
> * 파일 저장 : `getStorage()`로 `Storage`를 연결해 이미지나 파일을 업로드할 수 있어요.
> * 인증 연동 : `getAuth()`와 함께 사용하면 사용자별 데이터 저장이 가능해요.

### 6. 보안 체크리스트

* 민감한 정보 환경 변수로 관리하기
  * Firebase API Key, 서비스 계정 키 등은 코드에 직접 작성하지 않고 `.env`로 관리하세요.
* 환경 파일을 Git 등에 업로드하지 않기
  * `.env` 파일은 `.gitignore`에 반드시 추가하세요.
  * 키가 노출되면 Firebase 콘솔에서 즉시 재발급하고, 관련 프로젝트 권한을 점검하세요.
* Firebase 보안 규칙 설정하기
  * Firestore / Storage는 기본적으로 모든 사용자에게 공개되어 있어요.
  * 배포 전에 반드시 인증된 사용자만 접근하도록 규칙을 수정하세요.
* 출처(Origin) 제한 확인하기
  * Firebase 콘솔의 Authentication / Hosting / API Key 설정에서 허용 도메인을 제한해두세요.
  * 미니앱(WebView) 도메인만 허용하면 무단 접근을 예방할 수 있어요.

:::tip 허용 대상 도메인
https://.apps.tossmini.com : 실제 서비스 환경
https://.private-apps.tossmini.com : 콘솔 QR 테스트 환경
:::

---

# 16. Sentry 모니터링

> Source: https://developers-apps-in-toss.toss.im/learn-more/sentry-monitoring.md

> Description: Sentry를 이용한 앱인토스 미니앱 모니터링 가이드입니다. 에러 추적 및 성능 모니터링 방법을 확인하세요.

앱에 **Sentry**를 연동하면 JavaScript에서 발생한 오류를 자동으로 감지하고 모니터링할 수 있어요.\
이를 통해 앱의 안정성을 높이고, 사용자에게 더 나은 경험을 제공할 수 있어요.

:::tip WebView에서 Sentry 연동
[Sentry 공식 가이드](https://docs.sentry.io/platforms/javascript/)를 참고하여 연동해주세요.
:::

### 1. Sentry 초기 설정

[Sentry 공식 가이드](https://docs.sentry.io/platforms/react-native)를 참고하여 앱에서 Sentry를 초기화해주세요.

앱인토스 환경에서는 네이티브 오류 추적 기능을 사용할 수 없으므로 `enableNative` 옵션을 `false`로 설정해야 해요.

::: tip 네이티브 오류 추적은 지원되지 않아요
앱인토스 환경에서는 JavaScript 오류만 추적할 수 있어요.
:::

```ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  // ...
  enableNative: false,
});
```

### 2. Sentry 플러그인 설치

프로젝트 루트 디렉터리에서 사용 중인 패키지 관리자에 맞는 명령어를 실행해 Sentry 플러그인을 설치하세요.

::: code-group

```sh [npm]
npm install @granite-js/plugin-sentry
```

```sh [pnpm]
pnpm install @granite-js/plugin-sentry
```

```sh [yarn]
yarn add @granite-js/plugin-sentry
```

:::

### 3. 플러그인 구성

설치한 `@granite-js/plugin-sentry`를 `granite.config.ts` 파일의 `plugins` 항목에 추가하세요.
앱인토스 환경에서는 **`useClient` 옵션을 반드시 `false`로 설정**해야 해요.

::: tip 왜 `useClient` 옵션을 꺼야 하나요?

`useClient`를 `false`로 설정하면 앱 빌드 시 Sentry에 소스맵이 자동으로 업로드되지 않아요.
앱인토스 환경에서는 빌드 후 **수동으로 소스맵을 업로드**해야 하므로, 이 옵션을 꺼야 해요.

:::

```ts [granite.config.ts]
import { defineConfig } from '@granite-js/react-native/config';
import { sentry } from '@granite-js/plugin-sentry'; // [!code highlight]
import { appsInToss } from '@apps-in-toss/framework/plugins';

export default defineConfig({
  // ...,
  plugins: [
    sentry({ useClient: false }), // [!code highlight]
    appsInToss({
      // ...
    }),
  ],
});
```

### 4. 앱 출시하기

앱을 출시하는 방법은 [미니앱 출시](https://developers-apps-in-toss.toss.im/development/deploy.md) 문서를 참고하세요.

### 5. Sentry에 소스맵 업로드

출시된 미니앱의 오류를 정확히 추적하려면\
빌드 후 생성된 **소스맵을 Sentry에 업로드**해야 해요.

아래 명령어를 실행하면 소스맵이 업로드돼요.

::: tip 입력값 안내

* `<API_KEY>`: 앱인토스 콘솔에서 발급받은 API 키예요.
* `<APP_NAME>`: Sentry에 등록된 서비스 이름이에요.
* `<DEPLOYMENT_ID>`: 앱을 배포할 때 사용한 배포 ID예요.

:::

::: code-group

```sh [npm]
npx ait sentry upload-sourcemap \
  --api-key <API_KEY> \
  --app-name <APP_NAME> \
  --deployment-id <DEPLOYMENT_ID>
```

```sh [pnpm]
pnpm ait sentry upload-sourcemap \
  --api-key <API_KEY> \
  --app-name <APP_NAME> \
  --deployment-id <DEPLOYMENT_ID>
```

```sh [yarn]
yarn ait sentry upload-sourcemap \
  --api-key <API_KEY> \
  --app-name <APP_NAME> \
  --deployment-id <DEPLOYMENT_ID>
```

:::

명령어 실행 후 Sentry의 조직(Org), 프로젝트(Project), 인증 토큰 입력이 요청됩니다.\
모든 정보를 입력하면 해당 서비스의 소스맵이 Sentry에 업로드돼요.

---

# 17. AI 개발 가이드

> Source: https://developers-apps-in-toss.toss.im/development/llms.md

> Description: >-   IDE에서 AI가 더 정확한 코드를 생성할 수 있도록 컨텍스트 파일을 사용하는 방법을 안내합니다. llms.txt, 문서 URL, @docs   기능을 활용하여 프로젝트 정보를 AI에게 주입해 보세요.

AI가 프로젝트의 문맥을 이해하면 더 정확한 코드와 답변을 제공할 수 있어요.\
Cursor에서는 **문서(URL)** 또는 **llms.txt** 파일을 등록해 AI가 참고할 컨텍스트를 제공할 수 있으며,\
추가로 **MCP 서버를 사용하면** 훨씬 깊은 수준의 프로젝트 정보를 AI가 활용할 수 있어요.

::: tip 왜 컨텍스트가 필요한가요?
AI는 기본적으로 프로젝트의 도메인 지식을 알고 있지 않아요.\
SDK 사용법, API 구조, 에러 규칙 등 필요한 정보를 함께 제공하면 **정확도**와 **일관성**이 크게 향상돼요.
:::

### 1. MCP(Model Context Protocol) 서버 사용하기

Cursor는 **MCP(Model Context Protocol)** 를 지원해요.\
MCP는 IDE와 AI 모델 사이에서 프로젝트 정보를 더 구조적으로 전달하는 표준 프로토콜로,\
AI가 코드베이스의 맥락을 더 깊이 이해할 수 있도록 도와주는 역할을 해요.

앱인토스는 다양한 **SDK와 API(인앱 광고, 인앱 결제, 딥링크 등)** 를 제공하고 있는데,\
MCP를 함께 사용하면 다음과 같은 장점이 있어요:

* AI가 앱인토스 SDK 문서, API 스펙, 설정 파일을 자동으로 참조
* 인앱 광고, 인앱 결제 등 앱인토스의 기능을 더 짧은 코드로 빠르게 구현
* 잘못된 API 사용이나 누락된 파라미터 등을 AI가 조기에 감지
* 프로젝트 전체 구조(폴더, 설정, 자원 파일 등)를 기반으로 정확한 자동 생성 코드 구현

즉, MCP를 사용하면

> **앱인토스가 제공하는 기능을 훨씬 쉽게, 더 정확하게 구현할 수 있는 개발 환경을 만들 수 있어요.**\
> 기존 문서 기반 컨텍스트보다 더 깊은 통합을 제공한다는 점이 핵심입니다.

#### 설치하기

::: code-group

```[MacOS]
brew tap toss/tap && brew install ax
```

```[Windows]
scoop bucket add toss  https://github.com/toss/scoop-bucket.git
scoop install ax
```

:::

#### Cursor에 MCP 서버 연결하기

버튼이 작동하지 않을 경우, `.cursor/mcp.json` 파일을 생성하거나 수정해 아래 내용을 추가하세요.

```
{
 "mcpServers": {
   "apps-in-toss": {
     "command": "ax",
     "args": [
       "mcp", "start"
     ]
   }
 }
}
```

#### Claude Code에서 MCP 연결하기

```
claude mcp add --transport stdio apps-in-toss ax mcp start
```

***

### 2. IDE 외 LLM에서 앱인토스 문서 활용하기

Cursor 외에도 Claude, Codex 같은 LLM 환경에서 앱인토스 공식 문서를 기반으로 답변을 받고 싶다면\
**Apps In Toss Skills**를 사용할 수 있어요.

#### Apps In Toss Skills란?

Claude, Codex 등에서 사용 가능한 앱인토스 전용 에이전트 스킬 모음이에요.\
현재 제공되는 스킬은 다음과 같아요.

* `docs-search`
  * 앱인토스 `llms-full.txt` 문서를 다운로드·캐시하여 키워드 + 의미 유사도 기반으로 관련 스니펫을 검색해요.

#### Codex (skill-installer UI)

1. `$skill-installer`를 실행하세요.
2. 다음 프롬프트를 입력해 스킬을 설치하세요.

```bash
install GitHub repo toss/apps-in-toss-skills path apps-in-toss
```

#### Claude Code (plugin)

```bash
/plugin marketplace add toss/apps-in-toss-skills
/plugin install knowledge-skills@apps-in-toss-skills
```

#### 프롬프트 예시

> Search guide with docs-search "How to develop Apps In Toss Mini App"

***

### 3. 문서 URL 등록하기 (@docs)

앱인토스 문서를 AI에 연결하려면 Cursor의 **Docs 인덱싱** 기능을 사용하세요.\
아래 단계에 따라 필요한 문서를 빠르게 등록할 수 있어요.

1. Cursor 화면 우측 상단의 **톱니바퀴(⚙️)** 아이콘을 클릭하세요.
2. 왼쪽 메뉴에서 **Indexing & Docs**를 선택하세요.
3. 화면 하단의 **Docs** 섹션으로 이동하세요.
4. `+Add Doc` 버튼을 클릭해 문서를 추가하세요.

#### 추가할 수 있는 문서 URL

| 유형                           | 설명                                                                                             | URL                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| **기본 문서 (권장)**           | 앱인토스 기능을 사용하는 데 필요한 핵심 정보들이 포함돼 있어요.                                  | `https://developers-apps-in-toss.toss.im/llms.txt`              |
| **모든 기능 포함 문서 (Full)** | 전체 문서를 포함한 확장 버전이에요.컨텍스트는 풍부하지만 **토큰 소모량이 증가**할 수 있어요. | `https://developers-apps-in-toss.toss.im/llms-full.txt`         |
| **예제 전용 문서**             | 앱인토스 예제 코드만 빠르게 참고하고 싶을 때 사용해요.                                           | `https://developers-apps-in-toss.toss.im/tutorials/examples.html` |
| **TDS 문서 (WebView)**         | TDS WebView 관련 정보가 포함돼 있어요.                                                           | `https://tossmini-docs.toss.im/tds-mobile/llms-full.txt`        |
| **TDS 문서 (React Native)**    | TDS React Native 정보가 포함돼 있어요.                                                           | `https://tossmini-docs.toss.im/tds-react-native/llms-full.txt`  |

![llms-1](https://developers-apps-in-toss.toss.im/assets/llms-1.Ddl9380t.png)

### 4. 문서를 기반으로 AI 활용하기

문서를 등록하면 AI가 해당 문서를 기반으로 더 정확한 답변을 생성할 수 있어요.\
특히 Cursor에서는 `@docs` 명령을 사용하여 *지정된 문서를 우선적으로 참고*하도록 요청할 수 있어요.

```
@docs 앱인토스 인앱광고 샘플 코드 작성해줘
```

::: tip @docs는 언제 사용하나요?

* SDK처럼 **정확한 규칙 기반 코드**가 필요한 경우
* 문서 기반 의존도가 높은 기능을 사용할 때
* AI에게 “문서를 기반으로 답변해 달라”고 명확히 전달하고 싶을 때\
  `@docs`를 사용하면 AI는 문서를 우선적으로 참고해 더 안정적인 답변을 제공합니다.
  :::

AI는 `@docs` 없이도 문서를 자동으로 참고하지만,\
**정밀한 문맥 이해가 필요할 때는 `@docs`를 사용해 명시적으로 지시하는 것이 좋아요.**

---

