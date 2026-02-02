# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShareGym is an Expo-based React Native fitness tracking application with social features. Built with TypeScript, it supports iOS, Android, and web platforms through Expo Router file-based navigation.

## Essential Commands

### Development
```bash
npm start           # Start Expo dev server (press i for iOS, a for Android, w for web)
npm run ios         # Start iOS simulator directly
npm run android     # Start Android emulator directly
npm run web         # Start web version directly
npm run lint        # Run ESLint checks
```

### Project Management
```bash
npm run reset-project  # Interactive CLI to reset app to starter template (archives current code to app-example/)
```

## Architecture & Key Patterns

### Navigation Structure (Expo Router)
The app uses file-based routing where file paths directly map to routes:
- `app/_layout.tsx` - Root Stack navigator with theme provider
- `app/(tabs)/_layout.tsx` - Bottom tab navigator with 5 tabs
- `app/(auth)/` - Authentication screens (login, signup)
- `app/workout/` - Workout flow screens (active-session, exercise-select, session-complete)
- `app/routine/` - Routine management screens
- Modal presentations configured for auth and workout screens

### State Management (Zustand)
Six domain-specific stores with AsyncStorage persistence:

#### Core Stores
- **authStore**: User authentication, profiles, follow system (currently mock implementation)
- **workoutStore**: Active workout session, exercise/set management, rest timer, history
- **routineStore**: Saved workout templates with favorite/duplicate functionality
- **liveWorkoutStore**: Real-time workout broadcasting with cheer system
- **feedStore**: Social feed with likes, comments, pagination
- **groupStore**: Fitness group management

#### State Pattern
```typescript
// All stores follow this pattern
const useStore = create(
  persist(
    (set, get) => ({
      // State
      data: [],
      loading: false,

      // Actions
      asyncAction: async () => {
        set({ loading: true });
        // ... async operation
        set({ data: newData, loading: false });
      }
    }),
    {
      name: 'store-key',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ /* selective persistence */ })
    }
  )
);
```

### Component Architecture
- **Themed Components**: `ThemedText` and `ThemedView` automatically handle dark/light mode
- **Platform-specific files**: Use `.ios.tsx`, `.android.tsx`, `.web.tsx` extensions
- **Import alias**: Use `@/` prefix for root-relative imports

### Data Flow
1. **Offline-first**: AsyncStorage for local persistence
2. **Firebase-ready**: Configuration and integration points prepared but not active
3. **Mock data**: Authentication uses test users (`test@test.com`, `test2@test.com`)

## Key Implementation Details

### Exercise Database (`data/exercises.ts`)
- 70+ exercises with Korean translations
- Categories: chest, back, shoulders, legs, arms, abs, cardio, bodyweight
- Each exercise includes: id, name, nameKo, category, muscleGroups, equipment, icon, unit
- Unit types for exercises:
  - `kg`: Weight training exercises (default)
  - `km`: Distance-based cardio (running, cycling)
  - `level`: Machine difficulty level (elliptical, stairmaster)
  - `reps`: Count-based exercises (burpees, jumping jacks)

### Workout Flow
1. **Start**: Quick start, copy last workout, or start from routine
2. **Track**: Add exercises, track sets (weight/reps), auto rest timer
3. **Complete**: Summary with stats, create shareable card, post to feed

### Workout Cards Feature
- 4 Instagram-optimized styles (minimal, gradient, dark, colorful)
- Auto-generated statistics and exercise list
- Direct save to gallery or social sharing
- 9:16 aspect ratio for stories

### Social Features
- Feed with workout posts, likes, comments
- Follow/following system
- Real-time workout broadcasting with cheers
- User search and profiles

### Type System
Complete TypeScript interfaces in `types/index.ts`:
- User, WorkoutSession, Exercise, Set
- ExerciseType with Korean translations
- FeedItem, Comment, Badge
- Routine, Group, Achievement

## Current Implementation Status

### ✅ Completed Features
- **Phase 1**: Core workout recording with sets, rest timer, history
- **Phase 2**: Routines, statistics dashboard, workout analysis
- **Phase 3**: Instagram-ready workout cards with 4 styles
- **Phase 4**: Social feed, authentication, follow system
- **Phase 5**: Cardio exercise unit system (km, level, reps)
  - Exercise types now support different units (kg, km, level, reps)
  - UI components adapted for cardio-specific inputs
  - Workout card template UI improvements (fixed text overlap)

### 🚧 Planned Features (Phase 6)
- Badge & achievement system
- Leaderboards & rankings
- AI workout recommendations
- Gym location features
- Personal trainer matching

### 🔧 Recent Updates (2026-01-30)
- **Cardio Exercise Support**: Added unit system for cardio exercises
  - Distance-based (km): Treadmill, Cycling, Rowing Machine
  - Level-based: Elliptical, Stairmaster, Stair Climber
  - Reps-based: Burpees, Jumping Jacks, Mountain Climbers
- **UI Improvements**: Fixed text overlap in workout card templates
- **Common Styles System**: Created `styles/common.ts` for reusable styles

## Technical Stack

### Core
- React Native 0.81.5 + React 19.1.0
- Expo SDK ~54.0.32 with Expo Router ~6.0.22
- TypeScript ~5.9.2 (strict mode)
- New React Native Architecture enabled

### State & Data
- Zustand for state management
- AsyncStorage for persistence
- Firebase configured (not active)

### UI & Animations
- React Native Reanimated ~4.1.1
- Victory Native for charts
- React Native Bottom Sheet
- Expo Linear Gradient

## Development Notes

### Korean Localization
- UI text in Korean (홈, 운동, 통계, 그룹, 프로필)
- Exercise names translated (벤치프레스, 스쿼트, etc.)
- Time formatting with 오전/오후
- Muscle groups in Korean

### Performance Considerations
- Haptic feedback on iOS via HapticTab
- Large touch targets (44px minimum)
- Auto-save on every action
- Cursor-based pagination for feeds
- Component memoization where needed

### Code Quality
- ESLint with auto-fix on save (VSCode)
- Strict TypeScript configuration
- Component-based architecture
- Clear separation of concerns

### Platform Support
All platforms supported with platform-specific handling:
- iOS: Haptic feedback, specific styling
- Android: Material design adaptations
- Web: Responsive layout support

## Important Configuration

### app.json
- Portrait orientation only
- Deep linking: `sharegym://`
- EAS project ID: `3384839e-fe99-46de-994d-7a0117b484b7`
- Typed routes enabled
- React Compiler experimental feature enabled

### Firebase Setup
- Configuration in `config/firebase.ts` (placeholder values)
- Integration points ready in stores
- Replace with actual Firebase project credentials when ready

## Development Workflow

### Adding New Features
1. Define types in `types/index.ts`
2. Create/update Zustand store in `stores/`
3. Add navigation screen in `app/`
4. Build UI components in `components/`
5. Test on all platforms

### Common Tasks
- **Add exercise**: Update `data/exercises.ts`
- **New screen**: Create file in `app/` directory
- **State logic**: Add to appropriate store
- **UI component**: Create in `components/` with theme support

기존 파일을 분석해 중복되는 코드를 없이 작성하세요
코드를 작성할땐 항상 주석을 적어주세요.