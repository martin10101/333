# FamilyHub MVP Roadmap

This document tracks the major objectives, responsibilities, and the 50 key questions we identified so the project stays aligned.

## Current Status
- ✅ Expo TypeScript scaffold with navigation shell (Join → Video Call)
- ✅ Join Room UI with gradient background, AsyncStorage, and validation
- ⏳ Awaiting Agora integration and Firebase-backed game state

## Phase Overview
1. **Foundation** – Project scaffold, navigation, folder structure *(completed)*
2. **Join Flow & Auth Lite** – Join room UX, AsyncStorage, room creation logic *(in progress)*
3. **Agora Video Core** – Permissions, 2x2 layout, mute/video/leave controls
4. **Firebase Game Service** – Room schema, start/answer/score functions, listeners
5. **Quiz Overlay** – UI overlay, answer timing, score badges, question counter
6. **Real-Time Sync & Edge Cases** – Host handoff, disconnects, optimistic updates
7. **Polish & Audio** – Animations, sound cues, loading states, accessibility
8. **Testing & Release Prep** – Multi-device tests, error handling, analytics, builds

## Immediate Next Steps
- [x] Implement JoinRoom → VideoCall navigation with mock data
- [ ] Add Agora engine bootstrap (needs App ID)
- [ ] Scaffold Firebase service wrapper (needs config files)
- [ ] Prepare static quiz bank and service stub

## Dependencies You Provide
- Agora App ID (test) and notes for production token strategy
- Firebase config (Realtime Database URL, API key) and security preferences
- Design assets (logo variations, sound effects) when available
- Feedback from real device testing once builds are generated

## Responsibilities Snapshot
- **Your role**: Accounts/secrets, branding, running device tests, feature prioritisation
- **My role**: Implement React Native screens, services, state management, polish
- **Shared**: QA sessions, backlog grooming, iterating on UX

---

## Appendix: 50 Key Questions & Answers

1. **Q:** How will the project stay maintainable as features grow? **A:** Use modular folders (`/screens`, `/components`, `/services`, `/stores`) with shared TypeScript types and consistent naming.
2. **Q:** What UI framework ensures native + web support? **A:** Expo with React Native and React Navigation.
3. **Q:** How do we manage environment variables securely? **A:** Store secrets in `.env` or Expo `app.config.js` and keep them out of git.
4. **Q:** How do we plan for offline or poor connectivity? **A:** Cache local state, queue Firebase writes, and let Agora downgrade quality dynamically.
5. **Q:** How do we minimise bundle size? **A:** Lazy load heavy modules, prefer tree-shakeable imports, and keep dependencies lean.
6. **Q:** How will we manage app state across screens? **A:** Use React Context or Zustand for global state, React Query for server caching.
7. **Q:** What ensures smooth animations? **A:** Use React Native Reanimated/Animated, memoise components, avoid unnecessary re-renders.
8. **Q:** How do we validate room codes? **A:** Enforce six-digit numeric codes with regex and server checks.
9. **Q:** How do we secure Firebase later on? **A:** Add auth-based rules, membership tokens, and Cloud Functions for sensitive logic.
10. **Q:** How do we prevent duplicate answers/cheating? **A:** Lock first answer per player server-side and timestamp submissions.
11. **Q:** What UI keeps the quiz clear? **A:** Question banner, tile overlays, scoreboard badges, waiting indicators.
12. **Q:** How is quiz data structured? **A:** Local array of 50 questions with `{question, answers, correctIndex, category}` and a service to fetch random sets.
13. **Q:** How do we show who is talking? **A:** Enable Agora audio volume indication, map user IDs to tiles, throttle updates.
14. **Q:** What if Agora fails? **A:** Show connection error UI, allow retry, consider voice-only fallback, log errors.
15. **Q:** How do we persist user identity? **A:** Store username in AsyncStorage and optionally link to Firebase Auth later.
16. **Q:** How do we handle camera/mic permissions? **A:** Use `expo-permissions` / `react-native-permissions`, show guidance if denied.
17. **Q:** How do we keep UIs in sync across devices? **A:** Firebase `onValue` listeners with optimistic updates and server timestamps.
18. **Q:** What happens if someone joins mid-game? **A:** Snap them to current question, mark earlier ones as missed, show info banner.
19. **Q:** How do we maintain the scoreboard? **A:** Store `scores` in Firebase and update via transactions to prevent conflicts.
20. **Q:** How will the question pipeline scale? **A:** Abstract quiz fetching behind a service so we can swap in OpenTDB later.
21. **Q:** How do we avoid layout jank on different screens? **A:** Use responsive Flexbox, lock portrait orientation, test tablets and phones.
22. **Q:** How will question transitions feel smooth? **A:** Animate fade/slide transitions between questions with Reanimated.
23. **Q:** How do we secure Agora channels? **A:** Use unique channel names now and token-based authentication later.
24. **Q:** How do we ensure stable builds? **A:** Lock dependency versions, run lint/tests, use Husky hooks.
25. **Q:** What’s our debugging strategy? **A:** Add verbose logs around Firebase/Agora events and use Reactotron/Flipper.
26. **Q:** How do we manage theming? **A:** Centralise colours/spacing/fonts in a `theme.ts` file.
27. **Q:** How do we add audio cues? **A:** Use `expo-av` to preload sounds and respect device silent mode.
28. **Q:** How do we handle orientation? **A:** Lock to portrait with `expo-screen-orientation` for predictable layout.
29. **Q:** Who is the host? **A:** First entrant becomes host, store `hostId`, allow handoff if they leave.
30. **Q:** How do we know everyone answered? **A:** Compare `playerAnswers` count to active players, trigger results when matched.
31. **Q:** How do we clean up stale rooms? **A:** Schedule cleanup (Cloud Function/crons) to remove inactive rooms.
32. **Q:** Who generates room codes? **A:** A helper that ensures uniqueness via Firebase transaction.
33. **Q:** How do we keep Expo/EAS credentials safe? **A:** You manage them, store in Expo secrets, never commit to git.
34. **Q:** How do we monitor performance? **A:** Integrate Sentry or Crashlytics, monitor Agora stats.
35. **Q:** How do we control Firebase costs? **A:** Batch writes, prune old data, only listen to necessary paths.
36. **Q:** What’s the fallback if video is weak? **A:** Show avatars, keep audio + quiz running, allow re-enable when bandwidth improves.
37. **Q:** How do we handle duplicate usernames? **A:** Append random suffix or display warnings; use separate internal IDs.
38. **Q:** How do we test multi-device scenarios? **A:** Use Expo Dev Client builds, run on real devices, script test scenarios.
39. **Q:** How do we ensure accessibility? **A:** Provide high-contrast colours, accessibility labels, avoid audio-only cues.
40. **Q:** How do we prepare for localisation? **A:** Wrap strings with an i18n solution and design for varying text lengths.
41. **Q:** How do we instrument analytics? **A:** Add Firebase Analytics or Amplitude to track key events.
42. **Q:** How do we handle Agora SDK updates? **A:** Pin versions, review release notes, test upgrades in staging first.
43. **Q:** How do we onboard new developers? **A:** Maintain setup docs, scripts, and environment templates.
44. **Q:** How do we enforce code style? **A:** Use ESLint + Prettier + strict TypeScript.
45. **Q:** How do we blend quiz UI with video tiles? **A:** Use consistent card styling, semi-transparent overlays, aligned edges.
46. **Q:** How do we handle timeouts? **A:** Add countdown timers; mark unanswered as incorrect after expiry.
47. **Q:** Can we support spectators later? **A:** Yes—track `role` and render read-only views (future enhancement).
48. **Q:** How do we keep MVP scope manageable? **A:** Limit to 2–4 players, static question bank, basic UI initially.
49. **Q:** How will we plan releases? **A:** Follow staged milestones: prototype → beta → release with feedback loops.
50. **Q:** How do we stay coordinated? **A:** Maintain this roadmap, update statuses, communicate progress each step.

## Web Simulation Mode
- Toggle ENABLE_WEB_MOCKS in src/screens/VideoCallScreen.web.tsx to enable/disable the three simulated participants.
- Mock profiles join sequentially, answer with human-like timing, award +10 to the fastest correct response, and reset each round.
- When testing with real remote users, set the flag to alse to rely solely on Agora clients.
