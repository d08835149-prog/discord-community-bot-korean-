# 🤖 Dot

> 한국어 Discord 커뮤니티 봇  
> 게임 · 커뮤니티 · EP 경제 시스템

**Made by Ditto**

---

## ✨ 소개

**Dot**은 `Node.js`와 `discord.js`로 제작한 한국어 Discord 커뮤니티 봇입니다.

서버 멤버들이 함께 즐길 수 있는 커뮤니티 기능, 미니게임, EP 경제 시스템, 랭킹, 업적, 칭호 상점 등 다양한 기능을 제공합니다.

---

## 🚀 주요 기능

### 💬 커뮤니티

- `/오늘의질문` — 오늘의 랜덤 질문
- `/오늘의tmi` — 오늘의 TMI 질문
- `/오늘의운세` — 나의 오늘의 운세
- `/서버운세` — 서버의 오늘 운세
- `/오늘의멤버` — 오늘의 랜덤 멤버 선정
- `/궁합` — 다른 유저와의 궁합 확인
- `/고백확률` — 고백 성공 확률 확인
- `/친밀도` — 다른 유저와의 친밀도 확인

### 🎲 랜덤

- `/동전던지기` — 앞면/뒷면 동전 던지기
- `/랜덤선택` — 여러 선택지 중 하나를 랜덤 선택
- `/룰렛` — 입력한 선택지로 룰렛 돌리기
- `/밸런스게임` — 서버 멤버들과 밸런스 게임
- `/이상형월드컵` — 토너먼트 방식 월드컵

### 🎮 미니게임

- `/가위바위보` — EP를 걸고 가위바위보
- `/숫자맞추기` — 1~100 숫자 맞추기
- `/초성퀴즈` — 초성을 보고 정답 맞추기
- `/퀴즈` — 객관식 일반 상식 퀴즈
- `/끝말잇기` — Dot과 끝말잇기

### 💰 EP 경제 시스템

- `/출석체크` — 매일 출석하고 EP 획득
- `/프로필` — EP와 게임 기록 확인
- `/랭킹` — 서버 EP 랭킹 확인
- `/송금` — 다른 유저에게 EP 송금
- `/더블업` — EP를 걸고 2배에 도전
- `/잭팟` — 서버 공동 잭팟에 도전
- `/상점` — EP로 칭호 구매 및 장착
- `/업적` — 달성한 업적 확인

### ⚙️ 시스템

- `/핑` — 봇 및 Discord API 응답 속도 확인
- `/도움말` — Dot 명령어 확인
- `/제작자` — 제작자 및 프로젝트 정보

---

## 💰 EP 시스템

Dot에는 서버에서 사용할 수 있는 가상 포인트인 **EP**가 있습니다.

출석체크와 게임 등을 통해 EP를 획득할 수 있으며, 다른 유저에게 송금하거나 게임에 사용하고 칭호를 구매할 수도 있습니다.

> EP는 Dot 내부에서만 사용하는 가상 포인트이며 실제 화폐가 아닙니다.

---

## 🏆 업적

활동 기록에 따라 다양한 업적을 달성할 수 있습니다.

예시:

- 첫 출석
- 출석 3일 연속
- 누적 출석 30회
- 10,000 EP 달성
- 50,000 EP 달성
- 가위바위보 승리
- 가위바위보 10승
- 퀴즈 정답 10회
- 초성퀴즈 정답 10회
- 숫자맞추기 승리
- 누적 송금
- 칭호 수집

---

## 🛒 칭호 상점

EP를 사용해 칭호를 구매하고 프로필에 장착할 수 있습니다.

| 칭호 | 가격 |
|---|---:|
| 🌱 새싹 | 1,000 EP |
| 🍀 행운아 | 2,500 EP |
| 🧠 퀴즈왕 | 5,000 EP |
| 🎲 승부사 | 7,500 EP |
| 👑 전설 | 15,000 EP |

---

## 🛠 기술 스택

- **Node.js**
- **discord.js**
- **PostgreSQL**
- **Neon**
- **Lunafy**

---

## 📁 프로젝트 구조

```text
src/
├── commands/
│   ├── community/
│   ├── economy/
│   ├── games/
│   ├── random/
│   └── system/
├── data/
├── database/
├── utils/
├── deploy-commands.js
└── index.js
```

---

## ⚙️ 환경 변수

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_discord_server_id
DATABASE_URL=your_postgresql_connection_string
```

> ⚠️ `.env` 파일과 Discord Bot Token은 절대로 GitHub에 업로드하지 마세요.

---

## 📦 설치 방법

저장소를 Clone합니다.

```bash
git clone https://github.com/d08835149-prog/discord-community-bot-korean-.git
cd discord-community-bot-korean-
```

패키지를 설치합니다.

```bash
npm install
```

Discord Slash Commands를 등록합니다.

```bash
npm run deploy
```

Dot을 실행합니다.

```bash
npm start
```

---

## 💾 데이터베이스

Dot은 **PostgreSQL**을 사용하여 데이터를 저장합니다.

저장되는 데이터에는 다음과 같은 정보가 포함됩니다.

- EP
- 출석 기록
- 연속 출석
- 게임 기록
- 퀴즈 기록
- 송금 기록
- 칭호
- 랭킹 데이터

필요한 데이터베이스 테이블은 Dot 실행 시 자동으로 생성됩니다.

---

## 📊 Dot v1.0.0

현재 버전:

**v1.0.0**

- 29개의 Slash Command
- PostgreSQL 데이터 저장
- EP 경제 시스템
- 미니게임
- 커뮤니티 기능
- 서버 랭킹
- 업적 시스템
- 칭호 상점

---

## 👨‍💻 제작자

**Ditto**

Dot은 Discord 커뮤니티에서 가볍게 즐길 수 있는 다양한 기능을 하나의 봇에 담기 위해 제작되었습니다.

---

<p align="center">
  <b>🤖 Dot</b><br>
  Games · Community · EP Economy<br><br>
  Made with ❤️ by Ditto
</p>