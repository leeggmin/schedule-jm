# 하루

Expo + React Native + TypeScript로 만든 로컬 일정 관리 앱입니다.

## 주요 기능

- 월간 달력 탐색과 날짜별 일정 표시
- 일정 등록, 수정, 삭제
- 시간이 있거나 없는 일정 등록, 메모와 색상 지정
- 정시 / 10분 전 / 30분 전 / 1시간 전 로컬 알림
- AsyncStorage 기반 기기 내 데이터 저장
- 로그인이나 서버 없이 단독 사용

## 실행

```bash
npm install
npm start
```

터미널에 표시된 QR 코드를 Expo Go로 스캔하거나 Android 에뮬레이터에서 `npm run android`를 실행합니다.

> 알림은 실제 Android/iOS 기기에서 확인하는 것이 가장 정확합니다. 첫 알림 일정 등록 시 운영체제의 알림 권한을 허용해 주세요.

## 검사

```bash
npm exec -- tsc --noEmit
npx expo export --platform android
```
