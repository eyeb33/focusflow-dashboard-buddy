import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimerLogic } from '@/hooks/useTimerLogic'
import { TimerSettings } from '@/hooks/useTimerSettings'

// Override mocks for this specific test file
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }) // No user to avoid database calls
}))

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

const createMockSettings = (overrides: Partial<TimerSettings> = {}): TimerSettings => ({
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  showNotifications: true,
  soundEnabled: true,
  soundVolume: 0.75,
  soundId: 'zen-bell',
  timerType: 'pomodoro',
  ...overrides
})

describe('useTimerLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('initializes with correct default values for pomodoro mode', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.timerMode).toBe('work')
      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeRemaining).toBe(1500) // 25 * 60
      expect(result.current.completedSessions).toBe(0)
      expect(result.current.currentSessionIndex).toBe(0)
    })

    it('initializes with zero time for free study mode', () => {
      const settings = createMockSettings({ timerType: 'freeStudy' })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.timeRemaining).toBe(0)
      expect(result.current.progress).toBe(0)
    })

    it('calculates correct total time for custom durations', () => {
      const settings = createMockSettings({
        workDuration: 30,
        breakDuration: 10,
        longBreakDuration: 20
      })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.timeRemaining).toBe(1800) // 30 * 60
    })
  })

  describe('Start/Pause Controls', () => {
    it('starts timer correctly', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })

      expect(result.current.isRunning).toBe(true)
    })

    it('pauses timer correctly', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })
      expect(result.current.isRunning).toBe(true)

      act(() => {
        result.current.handlePause()
      })
      expect(result.current.isRunning).toBe(false)
    })

    it('does not start if already running', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })
      const timeAfterFirstStart = result.current.timeRemaining

      act(() => {
        result.current.handleStart()
      })

      expect(result.current.isRunning).toBe(true)
      expect(result.current.timeRemaining).toBe(timeAfterFirstStart)
    })

    it('accepts session goal on start', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart('Complete task A')
      })

      expect(result.current.sessionGoal).toBe('Complete task A')
    })
  })

  describe('Reset', () => {
    it('resets timer to initial state', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      act(() => {
        result.current.handleReset()
      })

      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeRemaining).toBe(1500)
      expect(result.current.currentSessionIndex).toBe(0)
    })

    it('resets free study timer to zero', () => {
      const settings = createMockSettings({ timerType: 'freeStudy' })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      act(() => {
        result.current.handleReset()
      })

      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeRemaining).toBe(0)
    })
  })

  describe('Mode Switching', () => {
    it('switches from work to break mode', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleModeChange('break')
      })

      expect(result.current.timerMode).toBe('break')
      expect(result.current.timeRemaining).toBe(300) // 5 * 60
      expect(result.current.isRunning).toBe(false)
    })

    it('switches from work to long break mode', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleModeChange('longBreak')
      })

      expect(result.current.timerMode).toBe('longBreak')
      expect(result.current.timeRemaining).toBe(900) // 15 * 60
    })

    it('resets session index when switching to work mode', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleModeChange('break')
      })

      act(() => {
        result.current.handleModeChange('work')
      })

      expect(result.current.currentSessionIndex).toBe(0)
    })

    it('stops running timer when changing modes', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })
      expect(result.current.isRunning).toBe(true)

      act(() => {
        result.current.handleModeChange('break')
      })
      expect(result.current.isRunning).toBe(false)
    })
  })

  describe('Session Goal', () => {
    it('sets and updates session goal', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.setSessionGoal('Study chapter 5')
      })

      expect(result.current.sessionGoal).toBe('Study chapter 5')
    })
  })

  describe('Settings Changes', () => {
    it('updates time when settings change while stopped', () => {
      const { result, rerender } = renderHook(
        ({ settings }) => useTimerLogic({ settings, activeTaskId: null }),
        { initialProps: { settings: createMockSettings() } }
      )

      expect(result.current.timeRemaining).toBe(1500)

      rerender({ settings: createMockSettings({ workDuration: 30 }) })

      expect(result.current.timeRemaining).toBe(1800)
    })

    it('handles timer type switch from pomodoro to freeStudy', () => {
      const { result, rerender } = renderHook(
        ({ settings }) => useTimerLogic({ settings, activeTaskId: null }),
        { initialProps: { settings: createMockSettings() } }
      )

      expect(result.current.timeRemaining).toBe(1500)

      rerender({ settings: createMockSettings({ timerType: 'freeStudy' }) })

      expect(result.current.timeRemaining).toBe(0)
    })
  })
})
