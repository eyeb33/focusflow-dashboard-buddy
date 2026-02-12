# 🚀 Quick Start: Mascot System

## Required First Steps (5 minutes)

### Step 1: Apply Database Migration

**Option A: Supabase Dashboard** (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project (mphdigvrxgnckplongdu)
3. Navigate to **SQL Editor**
4. Click "New query"
5. Copy ALL contents from: `supabase/migrations/20260212_create_mascot_system.sql`
6. Paste into the editor
7. Click **Run** button
8. ✅ You should see: "Success. No rows returned"

**Option B: Supabase CLI**
```bash
npx supabase db push
```

### Step 2: Regenerate Types
```bash
npx supabase gen types typescript --project-id mphdigvrxgnckplongdu > src/types/database.ts
```

### Step 3: Restart Dev Server
The dev server should auto-reload. If not:
```bash
# The terminal with the dev server - press Ctrl+C then restart
npm run dev
```

---

## ✅ Verify It's Working

1. **Check for TypeScript errors**: Should be 0 after type generation
2. **Open the app** in browser (localhost:8080)
3. **Go to Tutor** → Switch to **Practice mode**
4. **Look for mascot** in top-right corner (should be in idle state)
5. **Ask for a problem**: "Give me a quadratic equation to solve"
6. **After AI responds**: Feedback buttons should appear
7. **Click "Got it!"**: Mascot should celebrate! 🎉
8. **Click "Got it!" 2 more times**: After 3 correct → Achievement unlocked!

---

## 🎮 Testing Checklist

- [ ] Mascot appears in Practice mode (top-right)
- [ ] Mascot shows in idle state (blue robot with antenna)
- [ ] Feedback buttons appear after AI responses
- [ ] Clicking "Got it!" shows celebrating mascot
- [ ] Speech bubble appears with encouraging message
- [ ] After 3 correct: Achievement toast pops up (top-right)
- [ ] Mascot disappears in Explain/Upload modes (only shows in Practice)

---

## Common Issues

**"Property 'mascot_streaks' does not exist"**
→ You forgot Step 1 (database migration) or Step 2 (type generation)

**Mascot not visible**
→ Make sure you're in Practice mode (not Explain mode)

**No feedback buttons**
→ Wait for AI to finish responding, buttons appear after assistant messages

**Achievement didn't unlock**
→ Database migration might not have run completely - check Supabase dashboard

---

## What to Test

### Basic Flow:
1. Ask: "Give me a differentiation problem"
2. Wait for AI response
3. Click "Got it!" → Mascot celebrates
4. Ask for another problem
5. Click "Got it!" → Mascot gets more excited
6. Repeat once more → Achievement unlocks!

### Streak System:
- **Correct answers** build your streak
- **Using hints** maintains your streak but mascot encourages
- **Struggling** resets streak but mascot stays supportive

### Different Reactions:
- Try clicking "Struggling" → Mascot should be encouraging, not judging
- Try "Needed hint" → Mascot reinforces that hints are good!
- Get 5 in a row correct → Different mascot message

---

## Next: View Achievements

The achievements panel component is ready but not yet added to navigation. To see it:

**Manual testing** (add this temporarily to a page):
```tsx
import { AchievementsPanel } from '@/components/Tutor/AchievementDisplay';

// Inside your component
<AchievementsPanel />
```

**Or wait for**: Navigation update to add "Achievements" page

---

## 🎨 Customization Ideas

Want to personalize the mascot? Edit these files:

**Colors**: `src/components/Tutor/MascotCharacter.tsx` → `getMascotColor()`
**Messages**: `src/types/mascotSystem.ts` → `MASCOT_REACTIONS`
**Achievements**: `src/types/achievement.ts` → `ACHIEVEMENTS` array

---

**Ready to inspire your students with a robot buddy!** 🤖✨
