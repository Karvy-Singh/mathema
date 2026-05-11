# Country Expansion Roadmap

matheo의 다국가 출시 전략. **인도(IN) 1차 출시 → 단계적 확장**.

> 기본 원칙: 핵심 코드는 country-agnostic. 차이는 `backend/src/common/enums/country.enum.ts`의 `COUNTRY_CONFIG` 매핑 한 곳에 집중. 새 나라 추가 = 매핑 + 콘텐츠 시드만으로 끝낼 수 있게 유지.

---

## 출시 단계

| Phase | 기간 | 국가 | 상태 |
|---|---|---|---|
| **1** | 2026 H2 | India (NCERT) | **🟢 LIVE (PoC)** |
| 2 | 2027 H1 | India (Hindi 추가) + JEE/NEET prep mode | 🟡 Planned |
| 3 | 2027 H2 | Korea (수능 — 기존 K-PoC 재가동) | 🟡 Planned |
| 4 | 2028 H1 | US (Common Core / SAT) | ⚪ Concept |
| 5 | 2028 H2+ | UK (GCSE) · Australia · Singapore | ⚪ Concept |

---

## Country별 차이가 모이는 곳

| 차이점 | 어디서 관리 | 새 나라 추가 시 작업 |
|---|---|---|
| 커리큘럼 단원 | `unit.enum.ts` `GRADE_TO_UNITS` | 학년별 단원 배열 1개 추가 |
| UI 단원명 (NCERT 등) | `content-en.ts` `UNIT_NAME_EN` | 영문 챕터명 매핑 (또는 새 사전 `_hi.ts`) |
| 학년 라벨 prefix | `country.enum.ts` `gradeLabel` | 'Class' / 'Grade' / 'Year' 중 선택 |
| 통화 / 날짜 / 숫자 | `country.enum.ts` `COUNTRY_CONFIG` | 1줄 추가 |
| 시험 명칭 | `country.enum.ts` `examNames` | 4개 라벨 |
| 결제 (Play Billing) | 별도 인프라 | Play Console 에 product 등록 |
| 법적 문서 | `legal/` (TBD) | 개인정보처리방침·ToS 번역본 |

---

## Phase 1 — India launch checklist

### ✅ Done
- [x] CountryCode enum + User.country 필드 (default IN)
- [x] NCERT 챕터명 매핑 (Class 7~12)
- [x] 학년 정합 (Coordinate Plane → Class 9, Quadratic Eq → Class 10 등)
- [x] EN UI 디폴트 (Korean은 명시적 brower 언어일 때만)
- [x] 데모 페르소나 → Arjun Sharma, Class 7, country=IN
- [x] 색채 심리학 팔레트 (학습 친화)
- [x] 27 문제 KO/EN 콘텐츠 + 3단계 distractor

### 🚧 Next (출시 전 필수)
- [ ] **Mobile**: TWA (Trusted Web Activity) 또는 Capacitor 래핑 → APK/AAB 빌드
- [ ] **Google Sign-In** (Indian users 핵심): Passport-Google strategy + Google Identity Services
- [ ] **Google Play Billing**: 구독 체계 (free / ₹199 monthly / ₹1,599 annual 가안)
- [ ] **콘텐츠 확대**: Class 7~10 NCERT 각 200문제 (현재 20)
- [ ] **OCR**: Vision API 연결 — 인도 학생들이 교과서 사진 찍어서 등록하는 동선
- [ ] **법적 문서**: 인도 DPDP Act 2023 준수 개인정보처리방침 · ToS · 미성년자 동의 (보호자)
- [ ] **Sentry / Crashlytics**: 모바일 에러 추적
- [ ] **Push notifications (FCM)**: 학습 streak / SM-2 복습 알림
- [ ] **CDN + S3**: 정적 자산 / 추후 동영상 강의

### 🔵 Phase 2 (PMF 검증 후)
- [ ] Hindi UI 번역 (제 2 도시 / tier-2 시장)
- [ ] JEE Mains / NEET 모드 (Class 11~12 별도 트랙)
- [ ] 부모 대시보드 (자녀 진도 / 결제 관리)
- [ ] 오프라인 모드 (지방 인터넷 약한 지역)
- [ ] Family subscription (Play 정책 활용)

---

## Phase 2 detail — India 시장 deepening

| 영역 | 작업 | 비고 |
|---|---|---|
| **JEE Mains** | Class 11~12 콘텐츠 + JEE 출제 패턴 mock + 문제 유형 분류기 | EdTech 시장의 70% — 핵심 진입 |
| **NEET** | Biology + Chem + Physics + Maths 통합 → 별도 트랙 | 의대 준비 — 두 번째 큰 시장 |
| **Hindi** | UI + 핵심 문제 본문 번역 (Crowdin 워크플로) | tier-2 시장 진입 — 비핵심 |
| **Olympiad** | RMO/INMO/IMO 기출 — 상위권 학생 대상 | 작지만 lock-in 효과 큼 |

---

## Phase 3+ 국가별 진입 가이드

각 국가 추가 시 체크리스트:

1. `country.enum.ts`에 `COUNTRY_CONFIG[XX]` 추가
2. 커리큘럼 — `unit.enum.ts`에 학년별 단원 추가 OR 별도 `unit-{cc}.enum.ts`
3. 콘텐츠 — 학년당 최소 200문제 시드
4. 언어 — `content-{lang}.ts` 사전 + `translations.ts` UI 번역
5. 결제 — Play Console 국가별 product 등록
6. 법무 — 해당 국가 개인정보 처리 방침
7. 마케팅 — App Store / Play 등록 자료 (스크린샷·설명·키워드)
8. 결제 / 마케팅 단가는 PPP-aware (Purchasing Power Parity) 로 가격 조정

---

## 비-기능 요구사항 (모든 국가 공통)

- WCAG AA 접근성 (학교 도입 차단 방지)
- 모바일 first (mobile-only 디자인 우선, 데스크톱은 secondary)
- 오프라인 모드
- LaTeX/MathJax 수식 렌더링
- 손글씨 입력 (수학 풀이 사진/필기 → OCR)
- 부모 dashboard
- 다중 자녀 계정 (가족 단위)
- Play Integrity API (보안 / cheat 방지)
- COPPA / 13세 미만 동의 (US/EU 진입 시)

---

마지막 갱신: 2026-05-11 (Phase 1 India 출시 PoC 완료 시점)
