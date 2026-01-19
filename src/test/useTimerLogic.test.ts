
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimerLogic } from '@/hooks/useTimerLogic'
import { TimerSettings } from '@/hooks/useTimerSettings'

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null })
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

const mockSettings: TimerSettings = {
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
  timerType: 'pomodoro'
}

describe('useTimerLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useTimerLogic({ settings: mockSettings, activeTaskId: null }))

    expect(result.current.timerMode).toBe('work')
    expect(result.current.isRunning).toBe(false)
    expect(result.current.timeRemaining).toBe(1500) // 25 minutes
    expect(result.current.completedSessions).toBe(0)
    expect(result.current.currentSessionIndex).toBe(0)
  })

  it('should handle start and pause correctly', () => {
    const { result } = renderHook(() => useTimerLogic({ settings: mockSettings, activeTaskId: null }))

    // Start timer
    act(() => {
      result.current.handleStart()
    })

    expect(result.current.isRunning).toBe(true)

    // Pause timer
    act(() => {
      result.current.handlePause()
    })

    expect(result.current.isRunning).toBe(false)
  })

  it('should reset timer correctly', () => {
    const { result } = renderHook(() => useTimerLogic({ settings: mockSettings, activeTaskId: null }))

    // Start and run timer for a bit
    act(() => {
      result.current.handleStart()
    })

    act(() => {
      vi.advanceTimersByTime(10000) // 10 seconds
    })

    // Reset timer
    act(() => {
      result.current.handleReset()
    })

    expect(result.current.isRunning).toBe(false)
    expect(result.current.timeRemaining).toBe(1500) // Back to 25 minutes
    expect(result.current.currentSessionIndex).toBe(0)
  })

  it('should switch modes correctly', () => {
    const { result } = renderHook(() => useTimerLogic({ settings: mockSettings, activeTaskId: null }))

    // Switch to break mode
    act(() => {
      result.current.handleModeChange('break')
    })

    expect(result.current.timerMode).toBe('break')
    expect(result.current.timeRemaining).toBe(300) // 5 minutes
    expect(result.current.isRunning).toBe(false)

    // Switch to long break mode
    act(() => {
      result.current.handleModeChange('longBreak')
    })

    expect(result.current.timerMode).toBe('longBreak')
    expect(result.current.timeRemaining).toBe(900) // 15 minutes
  })
})
