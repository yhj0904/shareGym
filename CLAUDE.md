# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ShareGym is an Expo-based React Native mobile application supporting iOS, Android, and web platforms. The project uses Expo Router for file-based navigation and TypeScript for type safety.

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

### Navigation Structure
The app uses Expo Router (file-based routing similar to Next.js):
- `app/_layout.tsx` - Root navigation layout
- `app/(tabs)/_layout.tsx` - Tab group layout (if using tabs)
- `app/index.tsx` - Entry screen
- Screens are auto-registered based on file structure

### Theming System
Dark/light mode support is built-in:
- `hooks/use-color-scheme.ts` - Detects system theme preference
- `hooks/use-theme-color.ts` - Returns appropriate colors for current theme
- `components/themed-text.tsx` & `themed-view.tsx` - Theme-aware components
- Theme colors defined in `constants/theme.ts`

### Component Patterns
- **Themed Components**: Use `ThemedText` and `ThemedView` for automatic dark/light mode support
- **Platform-specific code**: Use `.ios.tsx`, `.android.tsx`, `.web.tsx` file suffixes
- **Animations**: Use React Native Reanimated v4 with `useAnimatedStyle`, `useSharedValue`
- **Haptics**: Wrap with platform check: `if (process.env.EXPO_OS === 'ios')`

### Import Alias
Use `@/` prefix for cleaner imports (configured in tsconfig.json):
```typescript
import { ThemedText } from '@/components/themed-text';
```

## Project Structure

```
app/
├── _layout.tsx              # Root navigation with modal screens
├── (tabs)/                  # Main tab navigation
│   ├── _layout.tsx          # Tab bar configuration
│   ├── index.tsx            # Home/Feed screen with social features
│   ├── workout.tsx          # Workout start screen
│   ├── stats.tsx            # Statistics dashboard with charts
│   ├── groups.tsx           # Group management
│   └── profile.tsx          # User profile
├── (auth)/                  # Authentication screens
│   ├── login.tsx            # Login screen
│   └── signup.tsx           # Sign up screen
├── workout/
│   ├── active-session.tsx   # Active workout tracking
│   ├── exercise-select.tsx  # Exercise selection modal
│   └── session-complete.tsx # Workout summary
├── routine/
│   ├── list.tsx             # Routine list
│   ├── create.tsx           # Create new routine
│   └── exercise-select.tsx  # Exercise selection for routines
└── card/
    └── create.tsx           # Workout card generator

components/
├── workout/
│   ├── ExerciseCard.tsx    # Exercise display with sets
│   ├── SetRow.tsx          # Individual set row
│   └── RestTimer.tsx       # Rest timer overlay
├── card/
│   └── WorkoutCardTemplate.tsx # Instagram card templates
├── feed/
│   └── FeedCard.tsx        # Social feed card component
└── stats/
    └── WeeklyChart.tsx     # Victory chart component

stores/
├── workoutStore.ts         # Zustand store for workouts
├── routineStore.ts         # Zustand store for routines
├── authStore.ts           # Zustand store for authentication
└── feedStore.ts           # Zustand store for social feed

config/
└── firebase.ts            # Firebase configuration

data/
└── exercises.ts            # Exercise database (70+ exercises)

types/
└── index.ts               # TypeScript type definitions

utils/
└── time.ts                # Time formatting utilities
```

## Key Technologies

### Core Framework
- **React Native 0.81.5** + **React 19.1.0**
- **Expo SDK ~54.0.32** with Expo Router ~6.0.22
- **TypeScript ~5.9.2** with strict mode
- **React Native Reanimated ~4.1.1** for animations
- **React Navigation** for navigation infrastructure
- New React Native Architecture enabled (`newArchEnabled: true`)
- React Compiler experimental feature enabled

### State Management & Data
- **Zustand** - Global state management (workout sessions, routines, auth, feed)
- **AsyncStorage** - Local data persistence
- **React Native UUID** - Unique ID generation
- **Firebase** - Backend services (Authentication, Firestore, Storage)

### UI & Visualization
- **Victory Native** - Charts and data visualization
- **React Native Bottom Sheet** - Bottom sheet components
- **React Native View Shot** - Screenshot capture for workout cards
- **Expo Linear Gradient** - Gradient effects
- **Expo Media Library** - Gallery save functionality
- **Expo Sharing** - Share functionality

## Development Notes

### Current Implementation Status

#### ✅ Phase 1: Core Workout Recording (Completed)
- **Workout Session Management** - Start, track, and complete workouts
- **Exercise Database** - 70+ exercises with Korean/English names
- **Set Tracking** - Weight, reps, completion status
- **Rest Timer** - Auto-start timer with visual/haptic feedback
- **Quick Actions** - Copy last set, copy last workout
- **Session Summary** - Post-workout statistics and sharing

#### ✅ Phase 2: Routines & Statistics (Completed)
- **Routine Management** - Create, edit, duplicate, favorite routines
- **Routine-based Workouts** - Start workouts from saved routines
- **Statistics Dashboard** - Weekly/monthly workout analysis
- **Data Visualization** - Charts using Victory Native
- **Workout History** - Complete workout log with filtering

#### ✅ Phase 3: Workout Cards (Completed)
- **Instagram-ready Cards** - 4 styles (minimal, gradient, dark, colorful)
- **Auto-generated Summary** - Exercise list, volume, duration
- **Gallery Save** - Direct save to device gallery
- **Share Integration** - Direct sharing to social media

#### ✅ Phase 4: Social Features (Completed)
- **User Authentication** - Email/password login with Firebase Auth
- **User Profiles** - Profile management, follow/following system
- **Social Feed** - Share workouts, view friends' activities
- **Interactions** - Like, comment, share functionality
- **Feed Types** - All/Following feed filtering
- **Real-time Updates** - Firestore integration for live data

#### 🚧 Phase 5: Advanced Features (Planned)
- Badge & achievement system
- Leaderboards & rankings
- AI workout recommendations
- Gym location-based features
- Personal trainer matching
- Workout challenges & events

### Key Features & Usage

#### Workout Recording Flow
1. **Start Workout**: Workout tab → Quick start / Copy last / From routine
2. **Add Exercises**: Search from 70+ exercise database with Korean names
3. **Track Sets**: Tap to edit weight/reps, check to complete
4. **Rest Timer**: Auto-starts on set completion, visual countdown
5. **Complete**: Summary screen → Create card → Share to feed

#### Routine Management
- Create custom workout templates
- Set default weights, reps, rest times
- Quick start from saved routines
- Favorite and duplicate routines

#### Workout Cards (Instagram Sharing)
- 4 pre-designed styles (minimal, gradient, dark, colorful)
- Auto-generated statistics
- Instagram story optimized (9:16 ratio)
- Direct save to gallery or share to social media

#### Social Features
- **Authentication**: Email/password login with Firebase
- **Feed System**: Share workouts, view friends' activities
- **Interactions**: Like, comment on posts
- **Follow System**: Follow users to see their workouts
- **Privacy**: Public/private workout sharing options

#### Data Persistence
- Hybrid storage: AsyncStorage for offline + Firebase for sync
- Workout history preserved locally and in cloud
- Offline-first architecture with sync when online
- Firebase backend for social features

### Expo Configuration (app.json)
- Portrait orientation only
- Deep linking scheme: `sharegym`
- Typed routes enabled
- Static web output
- Adaptive Android icons configured
- Splash screen with dark mode support

### Code Quality
- ESLint with Expo configuration
- VSCode settings configured for auto-fix on save
- Strict TypeScript enabled
- Zustand for state management
- Component-based architecture

### Platform Support
All three platforms (iOS, Android, Web) are supported. Use platform-specific file extensions when needed:
- `.ios.tsx` - iOS-specific implementation
- `.android.tsx` - Android-specific implementation
- `.web.tsx` - Web-specific implementation
- Default `.tsx` - Shared implementation

### Important Implementation Details

#### State Management Pattern
```typescript
// Zustand stores handle all app state
useWorkoutStore() // Current session, history, timers
useRoutineStore() // Saved routines, favorites
useAuthStore()    // User authentication, profile
useFeedStore()    // Social feed, likes, comments
```

#### Exercise Database
- Located in `data/exercises.ts`
- 70+ exercises with Korean translations
- Categories: chest, back, shoulders, legs, arms, abs, cardio, bodyweight
- Each exercise includes muscle groups and equipment

#### Navigation Flow
- Tab-based main navigation
- Modal presentations for workout screens
- Stack navigation for nested screens
- Expo Router handles all routing

#### UX Optimizations
- Large touch targets (44px minimum)
- Haptic feedback on iOS
- Auto-save on every action
- Copy/paste functionality for quick input
- Rest timer with visual and haptic alerts