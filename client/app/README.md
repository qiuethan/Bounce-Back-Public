# App Directory Structure

This directory contains the main application code organized in a clean, scalable structure.

## Directory Structure

```
app/
├── (tabs)/              # Expo Router tab screens (main app screens)
├── auth.jsx             # Authentication screen
├── _layout.jsx          # Root layout component
├── onboarding/          # Onboarding flow components and screens
├── components/          # Reusable components organized by feature
│   ├── home/           # Home screen components
│   ├── chat/           # Chat functionality components
│   ├── workout/        # Workout-related components
│   ├── mood-tracker/   # Mood tracking components
│   ├── journal/        # Journal functionality components
│   ├── chores/         # Chore management components
│   ├── contacts/       # Contact management components
│   ├── outdoor/        # Outdoor activities components
│   ├── settings/       # Settings screen components
│   ├── avoidance-zones/ # Avoidance zones components
│   └── ui/             # Generic/reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── constants/          # App constants and styles
└── utils/              # Utility functions
```

## Import Guidelines

### Components
Use the organized import structure:

```javascript
// Good - import from organized structure
import { DistressModal, Greeting, XPBar } from '../components/home';
import { TypingBubble, MessageBubble } from '../components/chat';

// Even better - import from main components index
import { DistressModal, TypingBubble } from '../components';
```

### Constants
```javascript
import colors from '../constants/colors';
import onboardingStyles from '../constants/onboardingStyles';
```

### Contexts
```javascript
import { AuthProvider } from '../contexts/auth_provider';
import { ProfileProvider } from '../contexts/profile_provider';
```

## Benefits of This Structure

1. **Feature-based organization**: Components are grouped by the feature they belong to
2. **Clear separation of concerns**: Screens, components, utilities, and contexts are separated
3. **Easier navigation**: No more hunting through dozens of mixed directories
4. **Scalable**: Easy to add new features without cluttering the structure
5. **Consistent naming**: Removed inconsistent "Components" suffixes
6. **Better imports**: Index files make importing multiple components easier

## Migration Notes

- All `*Components` directories have been reorganized into `components/*`
- Onboarding styles moved to `constants/` for better organization
- Nested component directories (like ChallengesComponents) have been flattened
- Index files added for easier importing 