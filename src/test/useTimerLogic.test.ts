import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTimerLogic } from '@/hooks/useTimerLogic'
import { TimerSettings } from '@/hooks/useTimerSettings'

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } })
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'session-123' }, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
  }
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

vi.mock('@/utils/productivityStats', () => ({
  updateDailyStats: vi.fn(() => Promise.resolve())
}))

vi.mock('@/services/taskService', () => ({
  updateTaskTimeSpent: vi.fn(() => Promise.resolve())
}))

vi.mock('@/lib/utils', () => ({
  retryWithBackoff: vi.fn((fn) => fn()),
  cn: vi.fn((...args) => args.filter(Boolean).join(' '))
}))

vi.mock('@/utils/timerContextUtils', () => ({
  TimerMode: {},
  getTotalTime: vi.fn((mode: string, settings: { workDuration: number; breakDuration: number; longBreakDuration: number }) => {
    switch (mode) {
      case 'work': return settings.workDuration * 60
      case 'break': return settings.breakDuration * 60
      case 'longBreak': return settings.longBreakDuration * 60
      default: return settings.workDuration * 60
    }
  }),
  savePartialSession: vi.fn(() => Promise.resolve())
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

// Short durations for faster tests
const createQuickSettings = (overrides: Partial<TimerSettings> = {}): TimerSettings => ({
  ...createMockSettings(),
  workDuration: 0.05, // 3 seconds
  breakDuration: 0.033, // 2 seconds
  longBreakDuration: 0.083, // 5 seconds
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
    it('should initialize with correct default values for pomodoro mode', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.timerMode).toBe('work')
      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeRemaining).toBe(1500) // 25 * 60
      expect(result.current.completedSessions).toBe(0)
      expect(result.current.currentSessionIndex).toBe(0)
      expect(result.current.totalTimeToday).toBe(0)
      expect(result.current.progress).toBe(0)
    })

    it('should initialize with zero time for free study mode', () => {
      const settings = createMockSettings({ timerType: 'freeStudy' })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.timeRemaining).toBe(0)
      expect(result.current.progress).toBe(0)
    })

    it('should calculate correct total time for different modes', () => {
      const settings = createMockSettings({
        workDuration: 30,
        breakDuration: 10,
        longBreakDuration: 20
      })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      // Work mode
      expect(result.current.timeRemaining).toBe(1800) // 30 * 60

      // Switch to break
      act(() => {
        result.current.handleModeChange('break')
      })
      expect(result.current.timeRemaining).toBe(600) // 10 * 60

      // Switch to long break
      act(() => {
        result.current.handleModeChange('longBreak')
      })
      expect(result.current.timeRemaining).toBe(1200) // 20 * 60
    })
  })

  describe('Start/Pause/Resume', () => {
    it('should start timer correctly', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })

      expect(result.current.isRunning).toBe(true)
    })

    it('should pause timer correctly', () => {
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

    it('should preserve time when pausing and resuming', async () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      const initialTime = result.current.timeRemaining

      // Start timer
      act(() => {
        result.current.handleStart()
      })

      // Advance 5 seconds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })

      // Pause
      act(() => {
        result.current.handlePause()
      })

      const pausedTime = result.current.timeRemaining
      expect(pausedTime).toBeLessThan(initialTime)
      expect(pausedTime).toBeGreaterThanOrEqual(initialTime - 6) // Allow 1 second tolerance

      // Resume
      act(() => {
        result.current.handleStart()
      })

      // Time should continue from paused value
      expect(result.current.timeRemaining).toBeLessThanOrEqual(pausedTime)
    })

    it('should not start if already running', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })
      expect(result.current.isRunning).toBe(true)

      // Try to start again
      act(() => {
        result.current.handleStart()
      })
      expect(result.current.isRunning).toBe(true)
    })

    it('should accept session goal on start', () => {
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
    it('should reset timer to initial state', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      // Start and advance
      act(() => {
        result.current.handleStart()
      })

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Reset
      act(() => {
        result.current.handleReset()
      })

      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeRemaining).toBe(1500) // Back to 25 minutes
      expect(result.current.currentSessionIndex).toBe(0)
    })

    it('should reset free study timer to zero', () => {
      const settings = createMockSettings({ timerType: 'freeStudy' })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      // Start and advance
      act(() => {
        result.current.handleStart()
      })

      act(() => {
        vi.advanceTimersByTime(60000) // 1 minute
      })

      // Reset
      act(() => {
        result.current.handleReset()
      })

      expect(result.current.isRunning).toBe(false)
      expect(result.current.timeRemaining).toBe(0)
    })
  })

  describe('Mode Switching', () => {
    it('should switch from work to break mode', () => {
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

    it('should switch from work to long break mode', () => {
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

    it('should reset session index when switching to work mode', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      // Go to break first
      act(() => {
        result.current.handleModeChange('break')
      })

      // Then back to work
      act(() => {
        result.current.handleModeChange('work')
      })

      expect(result.current.currentSessionIndex).toBe(0)
    })

    it('should stop running timer when changing modes', () => {
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

  describe('Progress Calculation', () => {
    it('should calculate progress correctly during countdown', async () => {
      const settings = createMockSettings({ workDuration: 1 }) // 60 seconds
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.progress).toBe(0)

      act(() => {
        result.current.handleStart()
      })

      // Advance 30 seconds (50%)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000)
      })

      // Progress should be around 50%
      expect(result.current.progress).toBeGreaterThan(45)
      expect(result.current.progress).toBeLessThan(55)
    })

    it('should always return 0 progress for free study mode', () => {
      const settings = createMockSettings({ timerType: 'freeStudy' })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      act(() => {
        result.current.handleStart()
      })

      act(() => {
        vi.advanceTimersByTime(60000)
      })

      expect(result.current.progress).toBe(0)
    })
  })

  describe('Free Study Mode', () => {
    it('should count up from zero', async () => {
      const settings = createMockSettings({ timerType: 'freeStudy' })
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.timeRemaining).toBe(0)

      act(() => {
        result.current.handleStart()
      })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })

      // Time should have increased
      expect(result.current.timeRemaining).toBeGreaterThan(0)
    })
  })

  describe('Session Goal', () => {
    it('should set and update session goal', () => {
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

  describe('Active Task Tracking', () => {
    it('should accept activeTaskId prop', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: 'task-123' })
      )

      // Timer should work normally with active task
      expect(result.current.timerMode).toBe('work')
      expect(result.current.isRunning).toBe(false)
    })

    it('should handle null activeTaskId', () => {
      const settings = createMockSettings()
      const { result } = renderHook(() => 
        useTimerLogic({ settings, activeTaskId: null })
      )

      expect(result.current.timerMode).toBe('work')
    })
  })

  describe('Session Completion Callback', () => {
    it('should call onSessionComplete when session ends', async () => {
      const onSessionComplete = vi.fn()
      const settings = createQuickSettings()
      
      const { result } = renderHook(() => 
        useTimerLogic({ 
          settings, 
          activeTaskId: 'task-123',
          onSessionComplete 
        })
      )

      act(() => {
        result.current.handleStart()
      })

      // Wait for timer to complete (3 seconds + buffer)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000)
      })

      // Check if callback was called
      await waitFor(() => {
        expect(onSessionComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: 'work',
            taskId: 'task-123'
          })
        )
      }, { timeout: 1000 })
    })
  })

  describe('Settings Changes', () => {
    it('should update time when settings change while stopped', () => {
      const { result, rerender } = renderHook(
        ({ settings }) => useTimerLogic({ settings, activeTaskId: null }),
        { initialProps: { settings: createMockSettings() } }
      )

      expect(result.current.timeRemaining).toBe(1500) // 25 min

      // Update settings
      rerender({ settings: createMockSettings({ workDuration: 30 }) })

      expect(result.current.timeRemaining).toBe(1800) // 30 min
    })

    it('should handle timer type switch from pomodoro to freeStudy', () => {
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

describe('Timer Calculations', () => {
  it('formatTime should format seconds correctly', async () => {
    const { formatTime } = await import('@/hooks/useTimerCalculations')
    
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(59)).toBe('00:59')
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(3600)).toBe('60:00')
    expect(formatTime(3661)).toBe('61:01')
  })

  it('formatTime should handle edge cases', async () => {
    const { formatTime } = await import('@/hooks/useTimerCalculations')
    
    expect(formatTime(-1)).toBe('00:00') // Negative
    expect(formatTime(NaN)).toBe('00:00') // NaN handled by Math.floor
  })

  it('getModeLabel should return correct labels', async () => {
    const { getModeLabel } = await import('@/hooks/useTimerCalculations')
    
    expect(getModeLabel('work')).toBe('Focus')
    expect(getModeLabel('break')).toBe('Short Break')
    expect(getModeLabel('longBreak')).toBe('Long Break')
  })

  it('getTotalSecondsForMode should calculate correctly', async () => {
    const { getTotalSecondsForMode } = await import('@/hooks/useTimerCalculations')
    
    const settings = {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15
    }

    expect(getTotalSecondsForMode('work', settings)).toBe(1500)
    expect(getTotalSecondsForMode('break', settings)).toBe(300)
    expect(getTotalSecondsForMode('longBreak', settings)).toBe(900)
  })

  it('toDisplayMode should convert work to focus', async () => {
    const { toDisplayMode } = await import('@/hooks/useTimerCalculations')
    
    expect(toDisplayMode('work')).toBe('focus')
    expect(toDisplayMode('break')).toBe('break')
    expect(toDisplayMode('longBreak')).toBe('longBreak')
  })

  it('getModeColors should return correct color objects', async () => {
    const { getModeColors } = await import('@/hooks/useTimerCalculations')
    
    const workColors = getModeColors('work')
    expect(workColors).toHaveProperty('solid')
    expect(workColors).toHaveProperty('glow')
    expect(workColors).toHaveProperty('fill')
    expect(workColors).toHaveProperty('stroke')
    expect(workColors).toHaveProperty('hex')

    const focusColors = getModeColors('focus')
    expect(focusColors).toEqual(workColors) // focus maps to work
  })
})

describe('timerContextUtils', () => {
  it('getTotalTime should return correct seconds for each mode', async () => {
    const { getTotalTime } = await import('@/utils/timerContextUtils')
    
    const settings = {
      workDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4
    }

    expect(getTotalTime('work', settings)).toBe(1500)
    expect(getTotalTime('break', settings)).toBe(300)
    expect(getTotalTime('longBreak', settings)).toBe(900)
  })
})
