# PortBand — Electron App 개발 명세서 & AI 프롬프트

> **Version**: 1.0  
> **Date**: 2025-02-21  
> **Status**: Ready for Development  
> **License**: MIT (Portsly fork)  
> **Price**: $1.99 (LemonSqueezy 직접 판매)

---

## 1. 제품 한 줄 요약

macOS 메뉴바에 상주하며, 현재 리스닝 중인 TCP 포트를 모니터링하고, 포트 수에 따라 졸라맨(stickman) 캐릭터가 헤드뱅잉하는 개발자 유틸리티.

---

## 2. 아키텍처

```
┌────────────────────────────────┐
│  Electron Main Process         │
│  ┌──────────────────────────┐  │
│  │  Tray (메뉴바 아이콘)      │  │  ← Canvas로 머리+머리카락 렌더링
│  │  - 24x24 nativeImage      │  │
│  │  - 포트 카운트 표시         │  │
│  └──────────┬───────────────┘  │
│             │ click             │
│  ┌──────────▼───────────────┐  │
│  │  BrowserWindow (Popover)  │  │  ← 340x520, frameless, 투명
│  │  - React + shadcn/ui      │  │
│  │  - Vite 번들링             │  │
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │  PortScanner Service      │  │  ← 2초 간격 lsof 실행
│  │  - child_process.exec     │  │
│  │  - IPC → renderer         │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### 핵심 기술 스택

| 레이어 | 기술 | 이유 |
|--------|------|------|
| Runtime | Electron 28+ | Tray + BrowserWindow, macOS 네이티브 통합 |
| Frontend | React 18 + Vite | 빠른 HMR, 작은 번들 |
| UI | shadcn/ui + Tailwind | 다크모드 기본, 일관된 디자인 시스템 |
| Icons | Simple Icons (CC0) | SVG path, 상업 사용 자유 |
| Animation | Canvas 2D API | 졸라맨 + 메뉴바 머리 렌더링 |
| Port Scan | `lsof -iTCP -sTCP:LISTEN -nP` | macOS 기본 내장, 권한 불필요 |
| Process Kill | `process.kill(pid, 'SIGTERM')` | 우아한 종료, 실패 시 SIGKILL fallback |
| Build | electron-builder | DMG/ZIP 배포, 코드 서명, Notarization |
| Payment | LemonSqueezy | MoR, 5%+$0.50 수수료 |

---

## 3. 기능 명세

### 3.1 메뉴바 (Tray)

**아이콘: 머리만 보이는 캐릭터 (24x24)**

- 동그란 머리 (빨강 `#FF6B6B`) + 흰 눈 2개
- 머리카락 7가닥 (빨강 `#E8485C`), `quadraticCurveTo`로 곡선
- 포트 수에 따라 머리카락이 좌↔우로 흔들림 (flip 방향 교대)
- 머리 전체가 위↔아래로 bounce (2px)
- 숫자 옆에 포트 카운트 표시

**애니메이션 속도 (BPM):**

| 포트 수 | 속도 | BPM | 묘사 |
|---------|------|-----|------|
| 0 | 2000ms | 💤 Zzz | 잠 (흔들림 없음, "z" 표시) |
| 1–2 | 900ms | ~60 | 발라드 끄덕 |
| 3–4 | 450ms | ~120 | 팝록 리듬 |
| 5–7 | 220ms | ~180 | 하드록 뱅잉 |
| 8+ | 110ms | ~240 | 데스메탈 풀파워 |

**Canvas 렌더링 코드 (main process):**

```javascript
// Tray 아이콘 업데이트 루프
function renderTrayIcon(count, frame) {
  const canvas = createCanvas(24, 24); // node-canvas 또는 OffscreenCanvas
  const ctx = canvas.getContext('2d');
  const cx = 12, cy = 15;
  const flip = count === 0 ? 0 : (frame % 2 === 0 ? -1 : 1);
  const bounce = count === 0 ? 0 : (frame % 2 === 0 ? 0 : 2);

  // 머리카락 7가닥
  ctx.strokeStyle = '#E8485C';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 2, cy - 5 + bounce);
    ctx.quadraticCurveTo(
      cx + i * 2 + flip * 4,
      cy - 12 + Math.abs(i) + bounce,
      cx + i * 2 + flip * 7,
      cy - 16 + Math.abs(i) * 2 + bounce
    );
    ctx.stroke();
  }

  // 머리
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(cx, cy + bounce, 6, 0, Math.PI * 2);
  ctx.fill();

  // 눈
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 2.5, cy - 1 + bounce, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 2.5, cy - 1 + bounce, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Zzz (idle)
  if (count === 0) {
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('z', 18, 8);
    ctx.font = 'bold 5px sans-serif';
    ctx.fillText('z', 20, 5);
  }

  return nativeImage.createFromBuffer(canvas.toBuffer());
}
```

**Tray 타이틀:**

```javascript
tray.setTitle(` ${count}`); // macOS는 tray title을 아이콘 옆에 표시
```

### 3.2 팝오버 (BrowserWindow)

**윈도우 설정:**

```javascript
const popover = new BrowserWindow({
  width: 340,
  height: 520,
  frame: false,
  transparent: true,
  resizable: false,
  show: false,
  skipTaskbar: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  }
});

// Tray 클릭 시 토글
tray.on('click', (event, bounds) => {
  const { x, y } = bounds;
  popover.setPosition(
    Math.round(x - popover.getSize()[0] / 2),
    y
  );
  popover.isVisible() ? popover.hide() : popover.show();
});

// 포커스 잃으면 닫기
popover.on('blur', () => popover.hide());
```

**UI 구조 (위→아래):**

```
┌─────────────────────────────────┐
│ PortBand    [3 active]      ⚙  │  ← 헤더: 타이틀 + Badge + Settings(SVG)
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │   🕺🕺🕺  (~120 BPM)       │ │  ← 무대: 졸라맨들 (드래그 가능)
│ │   border만 있는 투명 영역    │ │     border: 1px solid #27272a
│ │                             │ │     높이: 144px
│ └─────────────────────────────┘ │
├─────────────────────────────────┤  ← 1px 구분선 (#27272a)
│ ⬡ :3000  next-app    🔗 📋 ✕  │  ← 포트 리스트
│ ◆ :6379  redis-server 🔗 📋 ✕  │     아이콘(컬러) + 포트 + 이름 + 액션 3개
│ 🐘 :5432  postgres    🔗 📋 ✕  │     액션: 항상 보임 (호버 인터랙션 없음)
├─────────────────────────────────┤
│ ● Watching ports     [Kill All] │  ← 푸터: 라이브펄스 + Kill All (확인 다이얼로그)
└─────────────────────────────────┘
```

**빈 상태 (포트 0개):**

```
┌─────────────────────────────────┐
│ PortBand    [0 active]      ⚙  │
├─────────────────────────────────┤
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐ │
│                                 │  ← dashed border, 높이 144px
│      No active ports            │     텍스트 한 줄만. 심플하게.
│                                 │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘ │
├─────────────────────────────────┤
│   Idle                          │  ← 펄스 없음
└─────────────────────────────────┘
```

### 3.3 포트 리스트 행 (PortRow)

**각 행에 항상 표시되는 요소:**

| 위치 | 요소 | 상세 |
|------|------|------|
| 좌 | 서비스 아이콘 | Simple Icons SVG, 15x15, 브랜드 컬러 |
| 중앙 상단 | `:포트번호` + 프로세스명 | 포트: 13px bold #e4e4e7, 이름: 12px #71717a |
| 중앙 하단 | PID | 10px monospace #52525b |
| 우 | 액션 버튼 3개 | 항상 보임, 26x26px, 간격 2px |

**액션 버튼 (항상 보임, 호버 인터랙션 없음):**

| 버튼 | 아이콘 | 색상 | 동작 |
|------|--------|------|------|
| Open | ExternalLink | `#52525b` | `shell.openExternal('http://localhost:${port}')` |
| Copy | Copy → Check | `#52525b` → `#34d399` (1.5초) | 클립보드에 URL 복사 |
| Kill | X | `#ef4444` | SIGTERM → 0.4초 슬라이드 아웃 → 목록에서 제거 |

**Kill All:**
- AlertDialog로 확인 필수
- "Kill all N processes?" + "This will send SIGTERM to all listening processes."
- Cancel / Kill All (빨강 버튼)

### 3.4 무대 (Band Stage)

- 크기: 부모 width × 144px
- 배경: 투명 (border: `1px solid #27272a`만)
- 졸라맨 크기: 40×60px (6개 이상이면 0.8x 스케일)
- 위치: 시드 기반 랜덤 배치 (안정적, 리렌더 시 점프 안 함)
- 드래그: 마우스/터치로 자유 이동, z-index는 y좌표 기준
- BPM 표시: 우상단, 10px monospace, `#52525b`

**졸라맨 스펙:**

```
크기: 40x60px (size=1 기준)
색상: 8가지 순환
  body: ["#FF6B6B","#4ECDC4","#9B59B6","#F1C40F","#3498DB","#E67E22","#1ABC9C","#EC407A"]
  hair: ["#E8485C","#5BC0EB","#9B5DE5","#F15BB5","#FEE440","#00BBF9","#00F5D4","#FF6F61"]

구조:
  - 머리카락: 5가닥, quadraticCurveTo, 좌우 flip
  - 머리: 원형 (r=7*size), body 색상
  - 눈: 흰색 원 2개 (r=1.5*size)
  - 몸통: 직선 (head+7 → head+28)
  - 팔: 2개, armSwing으로 위아래 교대
  - 다리: 2개, armSwing과 연동

애니메이션: 2프레임
  frame 0: bounce=0, arm=+1, flip=-1
  frame 1: bounce=-2, arm=-1, flip=+1
```

### 3.5 설정 (Preferences)

- 설정 아이콘: Lucide Settings SVG (톱니바퀴), `#71717a`
- **절대 이모지 사용 금지** — 모든 UI 아이콘은 SVG

설정 항목 (v1 최소):
- Open at Login (체크박스)
- Scan interval: 1s / 2s / 5s
- About PortBand (MIT 라이선스 고지)

---

## 4. 포트 스캐닝

### 4.1 명령어

```bash
lsof -iTCP -sTCP:LISTEN -nP
```

### 4.2 파싱

```javascript
// main/port-scanner.js
const { exec } = require('child_process');

function scanPorts() {
  return new Promise((resolve, reject) => {
    exec('lsof -iTCP -sTCP:LISTEN -nP', (err, stdout) => {
      if (err && err.code !== 1) return reject(err);
      const lines = (stdout || '').trim().split('\n').slice(1); // 헤더 제거
      const ports = [];
      const seen = new Set();

      for (const line of lines) {
        const parts = line.split(/\s+/);
        const command = parts[0];
        const pid = parseInt(parts[1]);
        const nameField = parts[8] || '';
        const portMatch = nameField.match(/:(\d+)$/);
        if (!portMatch) continue;

        const port = parseInt(portMatch[1]);
        const key = `${pid}:${port}`;
        if (seen.has(key)) continue;
        seen.add(key);

        ports.push({
          id: key,
          name: command,
          port,
          pid,
          iconKey: detectService(command, port),
        });
      }

      resolve(ports.sort((a, b) => a.port - b.port));
    });
  });
}
```

### 4.3 서비스 감지

```javascript
function detectService(command, port) {
  const cmd = command.toLowerCase();
  const map = {
    node: 'nodedotjs',
    redis: 'redis',
    postgres: 'postgresql',
    mysql: 'mysql',
    nginx: 'nginx',
    docker: 'docker',
    python: 'python',
    uvicorn: 'python',
    gunicorn: 'python',
    java: 'openjdk',
    httpd: 'apache',
    mongod: 'mongodb',
    code: 'visualstudiocode',
  };

  for (const [key, icon] of Object.entries(map)) {
    if (cmd.includes(key)) return icon;
  }

  // 포트 기반 fallback
  const portMap = { 3000:'nodedotjs', 5173:'vite', 8080:'nginx', 5432:'postgresql', 6379:'redis', 3306:'mysql', 27017:'mongodb' };
  return portMap[port] || 'terminal';
}
```

### 4.4 프로세스 종료

```javascript
function killProcess(pid) {
  return new Promise((resolve) => {
    try {
      process.kill(pid, 'SIGTERM');
      // 2초 후 여전히 살아있으면 SIGKILL
      setTimeout(() => {
        try {
          process.kill(pid, 0); // 존재 확인
          process.kill(pid, 'SIGKILL');
        } catch (e) {
          // 이미 죽음
        }
        resolve();
      }, 2000);
    } catch (e) {
      resolve(); // 이미 죽었거나 권한 없음
    }
  });
}
```

---

## 5. IPC 통신

### preload.js

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('portband', {
  onPortsUpdate: (callback) => ipcRenderer.on('ports-update', (_, data) => callback(data)),
  killProcess: (pid) => ipcRenderer.invoke('kill-process', pid),
  killAll: (pids) => ipcRenderer.invoke('kill-all', pids),
  openInBrowser: (port) => ipcRenderer.invoke('open-browser', port),
  copyUrl: (port) => ipcRenderer.invoke('copy-url', port),
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),
});
```

### main.js IPC 핸들러

```javascript
ipcMain.handle('kill-process', async (_, pid) => {
  await killProcess(pid);
});

ipcMain.handle('kill-all', async (_, pids) => {
  await Promise.all(pids.map(killProcess));
});

ipcMain.handle('open-browser', (_, port) => {
  shell.openExternal(`http://localhost:${port}`);
});

ipcMain.handle('copy-url', (_, port) => {
  clipboard.writeText(`http://localhost:${port}`);
});
```

---

## 6. 프로젝트 구조

```
portband/
├── package.json
├── electron-builder.yml
├── src/
│   ├── main/
│   │   ├── main.js              # Electron 메인 프로세스
│   │   ├── tray.js              # Tray 아이콘 + 애니메이션
│   │   ├── port-scanner.js      # lsof 실행 + 파싱
│   │   ├── preferences.js       # electron-store 설정
│   │   └── preload.js           # contextBridge
│   └── renderer/
│       ├── index.html
│       ├── main.jsx             # React 엔트리
│       ├── App.jsx              # 메인 컴포넌트
│       ├── components/
│       │   ├── BandStage.jsx    # 무대 + 드래그 가능한 졸라맨
│       │   ├── Stickman.jsx     # Canvas 졸라맨 렌더링
│       │   ├── PortRow.jsx      # 포트 리스트 행
│       │   ├── LivePulse.jsx    # 초록 펄스 인디케이터
│       │   └── Settings.jsx     # 설정 화면
│       ├── lib/
│       │   ├── icons.js         # Simple Icons SVG paths + colors
│       │   └── constants.js     # 색상, BPM 테이블
│       └── styles/
│           └── globals.css      # Tailwind + shadcn
├── resources/
│   ├── icon.icns               # macOS 앱 아이콘
│   └── tray-template.png       # (사용 안 함 — 동적 Canvas)
└── scripts/
    └── notarize.js             # electron-notarize 스크립트
```

---

## 7. 디자인 토큰

### 색상 (Dark Only)

```javascript
const colors = {
  bg:           '#09090b',  // zinc-950 (앱 배경)
  card:         '#18181b',  // zinc-900 (카드 배경)
  border:       '#27272a',  // zinc-800
  borderSubtle: '#1f1f23',  // 약한 보더
  separator:    '#27272a',

  text: {
    primary:    '#fafafa',  // zinc-50
    secondary:  '#e4e4e7',  // zinc-200
    tertiary:   '#71717a',  // zinc-500
    muted:      '#52525b',  // zinc-600
    ghost:      '#3f3f46',  // zinc-700
  },

  accent: {
    green:      '#34d399',  // emerald-400 (active badge)
    greenBg:    'rgba(52,211,153,0.1)',
    red:        '#ef4444',  // red-500 (kill)
    redHover:   '#dc2626',  // red-600
  },

  stickman: {
    body: ['#FF6B6B','#4ECDC4','#9B59B6','#F1C40F','#3498DB','#E67E22','#1ABC9C','#EC407A'],
    hair: ['#E8485C','#5BC0EB','#9B5DE5','#F15BB5','#FEE440','#00BBF9','#00F5D4','#FF6F61'],
  },
};
```

### 타이포그래피

```css
font-family: -apple-system, "SF Pro Display", "Segoe UI", sans-serif;
```

| 용도 | 크기 | 굵기 | 색상 |
|------|------|------|------|
| 카드 타이틀 | 14px | 600 | #fafafa |
| 포트 번호 | 13px | 600 | #e4e4e7 |
| 프로세스 이름 | 12px | 400 | #71717a |
| PID | 10px mono | 400 | #52525b |
| BPM | 10px mono | 500 | #52525b |
| Badge | 10px | 500 | #34d399 |
| Footer | 10px | 400 | #52525b |

---

## 8. 빌드 & 배포

### electron-builder.yml

```yaml
appId: com.portband.app
productName: PortBand
mac:
  category: public.app-category.developer-tools
  icon: resources/icon.icns
  target:
    - dmg
    - zip
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
dmg:
  title: PortBand
  iconSize: 80
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
afterSign: scripts/notarize.js
```

### entitlements.mac.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
</dict>
</plist>
```

### Notarization

```javascript
// scripts/notarize.js
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  if (process.platform !== 'darwin') return;
  await notarize({
    appBundleId: 'com.portband.app',
    appPath: `${context.appOutDir}/${context.packager.appInfo.productFilename}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

---

## 9. 개발 단계

### Phase 1: 기본 골격 (1–2일)

- [ ] `npm create electron-vite@latest portband`
- [ ] Tray + BrowserWindow 팝오버 셋업
- [ ] `lsof` 파싱 → IPC → 렌더러
- [ ] 포트 리스트 표시 (React)

### Phase 2: UI 구현 (2–3일)

- [ ] shadcn/ui 설치 + 다크모드 강제
- [ ] PortRow 컴포넌트 (아이콘 + 포트 + 액션 버튼)
- [ ] Kill / Open / Copy 기능 연결
- [ ] Kill All + AlertDialog
- [ ] 빈 상태 UI

### Phase 3: 애니메이션 (1–2일)

- [ ] Stickman Canvas 컴포넌트
- [ ] BandStage + 드래그 구현
- [ ] 메뉴바 머리 Canvas + setInterval 애니메이션
- [ ] BPM 단계별 속도 적용

### Phase 4: 마무리 (1–2일)

- [ ] Settings 화면 (Open at Login, Scan interval)
- [ ] electron-store로 설정 영속화
- [ ] 앱 아이콘 제작
- [ ] electron-builder DMG 빌드
- [ ] Apple Developer ID 서명 + Notarize

---

## 10. AI 개발 프롬프트

아래 프롬프트를 Claude Code 또는 Cursor에 붙여넣어 바로 개발을 시작할 수 있습니다.

---

### 프롬프트 시작

```
당신은 macOS Electron 앱 "PortBand"를 개발합니다.

## 앱 개요
macOS 메뉴바에 상주하며 TCP 리스닝 포트를 모니터링하는 개발자 도구입니다.
포트 수에 따라 졸라맨(stickman) 캐릭터가 헤드뱅잉 애니메이션을 합니다.

## 기술 스택
- Electron 28+ (electron-vite로 프로젝트 생성)
- React 18 + Vite (renderer)
- shadcn/ui + Tailwind CSS (dark mode only)
- Canvas 2D API (졸라맨 + 메뉴바 아이콘 렌더링)

## 핵심 구조

### Main Process
1. **Tray**: 24x24 Canvas로 머리+머리카락 렌더링. 포트 수에 따라 BPM 변경:
   - 0개: 2000ms (Zzz), 1-2개: 900ms, 3-4개: 450ms, 5-7개: 220ms, 8+: 110ms
   - 머리카락 7가닥이 좌우로 흔들리고 머리가 위아래로 bounce
   - tray.setTitle로 포트 카운트 숫자 표시

2. **BrowserWindow (Popover)**: 340x520, frameless, transparent
   - Tray 클릭으로 토글, blur 시 닫힘
   - tray bounds 기준 중앙 정렬

3. **Port Scanner**: 2초 간격 `lsof -iTCP -sTCP:LISTEN -nP` 실행
   - 결과를 파싱해서 {id, name, port, pid, iconKey} 배열로 변환
   - command 이름과 포트 번호로 서비스 종류 감지 (node→nodedotjs, redis→redis 등)
   - IPC로 renderer에 전달

4. **IPC 핸들러**:
   - kill-process: SIGTERM → 2초 후 SIGKILL fallback
   - kill-all: 복수 PID 동시 종료
   - open-browser: shell.openExternal
   - copy-url: clipboard.writeText

### Renderer (Popover UI)

다크모드 전용. 배경 #18181b, 보더 #27272a.

**레이아웃 (위→아래):**

1. **헤더**: "PortBand" 타이틀(14px bold) + Badge("N active", 에메랄드) + Settings 아이콘(Lucide SVG 톱니바퀴, #71717a)

2. **무대 영역 (144px)**: border: 1px solid #27272a만 (배경색 없음)
   - 포트 수만큼 졸라맨 표시
   - 각 졸라맨은 40x60px Canvas, 8가지 색상 순환
   - 드래그로 자유 이동 가능 (마우스/터치)
   - 시드 기반 초기 위치 (리렌더 시 안정적)
   - 우상단에 BPM 표시

3. **포트 리스트**: 스크롤 가능 (max-height 256px)
   각 행: [서비스아이콘 15px] [포트번호 bold + 프로세스명] [PID mono] [Open][Copy][Kill]
   - 액션 버튼 3개는 항상 보임 (호버 인터랙션 없음)
   - Open/Copy: #52525b, Kill: #ef4444
   - Copy 누르면 아이콘이 체크마크로 1.5초간 변경 (#34d399)
   - Kill 누르면 행이 오른쪽으로 슬라이드하며 사라짐 (0.4초)

4. **푸터**: 라이브 펄스(초록 동그라미 ping 애니메이션) + "Watching ports" + Kill All 버튼
   - Kill All은 AlertDialog로 확인 ("Kill all N processes?")

5. **빈 상태**: 무대 영역에 dashed border + "No active ports" 한 줄. 포트 리스트 영역 없음.

**졸라맨 Canvas 렌더링:**
- 머리카락 5가닥 (quadraticCurveTo, 프레임마다 flip 방향 교대)
- 원형 머리 + 흰 눈 2개
- 직선 몸통 + 팔 2개 (armSwing) + 다리 2개
- 2프레임 애니메이션 (bounce + arm/leg swing)

**서비스 아이콘:**
Simple Icons의 SVG path를 인라인으로 사용 (CC0 라이선스).
지원 서비스: Node.js(#5FA04E), Redis(#FF4438), PostgreSQL(#4169E1), Vite(#646CFF), Nginx(#009639), Docker(#2496ED), MySQL(#4479A1), Python(#3776AB)

## 중요 규칙
- 이모지를 UI 아이콘으로 절대 사용하지 마세요. 모든 아이콘은 SVG입니다.
- shadcn 컴포넌트가 라이트모드로 렌더될 수 있으므로 Card, AlertDialog 등에 inline style로 background와 color를 강제하세요.
- 호버 시 나타나는 버튼 같은 복잡한 인터랙션은 없습니다. 액션 버튼은 항상 보입니다.
- Tailwind 색상 클래스 대신 inline style을 사용해서 다크모드를 확실히 보장하세요.

## 참고할 목업
첨부된 portband-mockup.jsx 파일은 디자인 확정본입니다.
이 파일의 컴포넌트 구조, 색상, 레이아웃을 정확히 따르되
데모용 useState 로직을 실제 Electron IPC 통신으로 교체하세요.
```

### 프롬프트 끝

---

## 11. 참고 자료

| 항목 | 링크/파일 |
|------|-----------|
| UI 목업 (확정) | `portband-mockup.jsx` (첨부) |
| 사업 분석 | `port-monitor-app-사업분석.md` |
| Portsly 원본 | github.com/nicoverbruggen/portsly (MIT) |
| Simple Icons | simpleicons.org (CC0) |
| electron-vite | github.com/alex8088/electron-vite |
| shadcn/ui | ui.shadcn.com |
| LemonSqueezy | lemonsqueezy.com |

---

## 12. 라이선스 고지 (필수 포함)

앱 내 About 화면에 반드시 포함:

```
PortBand is inspired by Portsly by Nico Verbruggen.
Licensed under the MIT License.

Copyright (c) Nico Verbruggen
Permission is hereby granted, free of charge, to any person obtaining a copy...
(전문 포함)
```
