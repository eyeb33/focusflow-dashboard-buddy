import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  formatTime,
  getModeLabel,
  toDisplayMode,
  getModeColors,
  getTotalSecondsForMode,
  useTimerCalculations,
  useSessionCalculations,
  type TimerMode
} from '@/hooks/useTimerCalculations'

describe('formatTime', () => {
  it('formats zero seconds correctly', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats seconds under a minute correctly', () => {
    expect(formatTime(1)).toBe('00:01')
    expect(formatTime(9)).toBe('00:09')
    expect(formatTime(30)).toBe('00:30')
    expect(formatTime(59)).toBe('00:59')
  })

  it('formats exact minutes correctly', () => {
    expect(formatTime(60)).toBe('01:00')
    expect(formatTime(120)).toBe('02:00')
    expect(formatTime(600)).toBe('10:00')
    expect(formatTime(1500)).toBe('25:00')
  })

  it('formats minutes and seconds correctly', () => {
    expect(formatTime(61)).toBe('01:01')
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(125)).toBe('02:05')
    expect(formatTime(1499)).toBe('24:59')
  })

  it('formats hours correctly', () => {
    expect(formatTime(3600)).toBe('60:00')
    expect(formatTime(3661)).toBe('61:01')
    expect(formatTime(7200)).toBe('120:00')
  })

  it('handles negative values by treating as zero', () => {
    expect(formatTime(-1)).toBe('00:00')
    expect(formatTime(-60)).toBe('00:00')
  })

  it('handles decimal values by flooring', () => {
    expect(formatTime(59.9)).toBe('00:59')
    expect(formatTime(60.5)).toBe('01:00')
  })
})

describe('getModeLabel', () => {
  it('returns "Focus" for work mode', () => {
    expect(getModeLabel('work')).toBe('Focus')
  })

  it('returns "Short Break" for break mode', () => {
    expect(getModeLabel('break')).toBe('Short Break')
  })

  it('returns "Long Break" for longBreak mode', () => {
    expect(getModeLabel('longBreak')).toBe('Long Break')
  })
})

describe('toDisplayMode', () => {
  it('converts work to focus', () => {
    expect(toDisplayMode('work')).toBe('focus')
  })

  it('preserves break mode', () => {
    expect(toDisplayMode('break')).toBe('break')
  })

  it('preserves longBreak mode', () => {
    expect(toDisplayMode('longBreak')).toBe('longBreak')
  })
})

describe('getModeColors', () => {
  it('returns color object with all required properties', () => {
    const colors = getModeColors('work')
    
    expect(colors).toHaveProperty('solid')
    expect(colors).toHaveProperty('glow')
    expect(colors).toHaveProperty('fill')
    expect(colors).toHaveProperty('stroke')
    expect(colors).toHaveProperty('hex')
  })

  it('returns work colors for work mode', () => {
    const colors = getModeColors('work')
    expect(colors.hex).toBe('#ef4343')
  })

  it('returns break colors for break mode', () => {
    const colors = getModeColors('break')
    expect(colors.hex).toBe('#2fc55e')
  })

  it('returns longBreak colors for longBreak mode', () => {
    const colors = getModeColors('longBreak')
    expect(colors.hex).toBe('#3b81f6')
  })

  it('maps focus display mode to work colors', () => {
    const focusColors = getModeColors('focus')
    const workColors = getModeColors('work')
    expect(focusColors).toEqual(workColors)
  })
})

describe('getTotalSecondsForMode', () => {
  const settings = {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15
  }

  it('returns correct seconds for work mode', () => {
    expect(getTotalSecondsForMode('work', settings)).toBe(1500) // 25 * 60
  })

  it('returns correct seconds for break mode', () => {
    expect(getTotalSecondsForMode('break', settings)).toBe(300) // 5 * 60
  })

  it('returns correct seconds for longBreak mode', () => {
    expect(getTotalSecondsForMode('longBreak', settings)).toBe(900) // 15 * 60
  })

  it('handles custom durations', () => {
    const customSettings = {
      workDuration: 50,
      breakDuration: 10,
      longBreakDuration: 30
    }
    expect(getTotalSecondsForMode('work', customSettings)).toBe(3000)
    expect(getTotalSecondsForMode('break', customSettings)).toBe(600)
    expect(getTotalSecondsForMode('longBreak', customSettings)).toBe(1800)
  })
})

describe('useTimerCalculations', () => {
  const defaultInput = {
    timeRemaining: 750, // 12:30
    totalSeconds: 1500, // 25 minutes
    mode: 'work' as TimerMode
  }

  it('returns sanitized time values', () => {
    const { result } = renderHook(() => useTimerCalculations(defaultInput))
    
    expect(result.current.safeTimeRemaining).toBe(750)
    expect(result.current.safeTotalSeconds).toBe(1500)
  })

  it('calculates minutes and seconds correctly', () => {
    const { result } = renderHook(() => useTimerCalculations(defaultInput))
    
    expect(result.current.minutes).toBe(12)
    expect(result.current.seconds).toBe(30)
    expect(result.current.formattedTime).toBe('12:30')
  })

  it('calculates progress correctly (50% through)', () => {
    const { result } = renderHook(() => useTimerCalculations(defaultInput))
    
    expect(result.current.progress).toBe(50)
  })

  it('calculates progress at start (0%)', () => {
    const { result } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 1500
    }))
    
    expect(result.current.progress).toBe(0)
  })

  it('calculates progress at end (100%)', () => {
    const { result } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 0
    }))
    
    expect(result.current.progress).toBe(100)
  })

  it('returns 0 progress for free study mode', () => {
    const { result } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      isFreeStudy: true
    }))
    
    expect(result.current.progress).toBe(0)
  })

  it('calculates SVG circumference correctly', () => {
    const { result } = renderHook(() => useTimerCalculations(defaultInput))
    
    // size=220, strokeWidth=15, radius=102.5
    const expectedCircumference = 2 * Math.PI * 102.5
    expect(result.current.circumference).toBeCloseTo(expectedCircumference, 2)
  })

  it('returns correct mode colors and labels', () => {
    const { result } = renderHook(() => useTimerCalculations(defaultInput))
    
    expect(result.current.displayMode).toBe('focus')
    expect(result.current.modeLabel).toBe('Focus')
    expect(result.current.colors.hex).toBe('#ef4343')
  })

  it('detects last 10 seconds correctly', () => {
    const { result: notLast10 } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 15
    }))
    expect(notLast10.current.isLastTenSeconds).toBe(false)

    const { result: inLast10 } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 10
    }))
    expect(inLast10.current.isLastTenSeconds).toBe(true)

    const { result: at5 } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 5
    }))
    expect(at5.current.isLastTenSeconds).toBe(true)

    const { result: atZero } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 0
    }))
    expect(atZero.current.isLastTenSeconds).toBe(false)
  })

  it('detects hasStarted correctly', () => {
    const { result: notStarted } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 1500
    }))
    expect(notStarted.current.hasStarted).toBe(false)

    const { result: started } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 1499
    }))
    expect(started.current.hasStarted).toBe(true)
  })

  it('detects isComplete correctly', () => {
    const { result: notComplete } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 1
    }))
    expect(notComplete.current.isComplete).toBe(false)

    const { result: complete } = renderHook(() => useTimerCalculations({
      ...defaultInput,
      timeRemaining: 0
    }))
    expect(complete.current.isComplete).toBe(true)
  })

  it('handles NaN inputs gracefully', () => {
    const { result } = renderHook(() => useTimerCalculations({
      timeRemaining: NaN,
      totalSeconds: NaN,
      mode: 'work'
    }))
    
    expect(result.current.safeTimeRemaining).toBe(0)
    expect(result.current.safeTotalSeconds).toBe(1)
    expect(result.current.formattedTime).toBe('00:00')
  })

  it('clamps timeRemaining to totalSeconds in pomodoro mode', () => {
    const { result } = renderHook(() => useTimerCalculations({
      timeRemaining: 2000, // More than total
      totalSeconds: 1500,
      mode: 'work'
    }))
    
    expect(result.current.safeTimeRemaining).toBe(1500)
  })
})

describe('useSessionCalculations', () => {
  const defaultInput = {
    completedSessions: 2,
    totalSessions: 4,
    currentSessionIndex: 2,
    mode: 'work' as TimerMode
  }

  it('generates correct number of session dots', () => {
    const { result } = renderHook(() => useSessionCalculations(defaultInput))
    
    expect(result.current.sessionDots).toHaveLength(4)
  })

  it('marks completed sessions correctly', () => {
    const { result } = renderHook(() => useSessionCalculations(defaultInput))
    
    expect(result.current.sessionDots[0].isCompleted).toBe(true)
    expect(result.current.sessionDots[1].isCompleted).toBe(true)
    expect(result.current.sessionDots[2].isCompleted).toBe(false)
    expect(result.current.sessionDots[3].isCompleted).toBe(false)
  })

  it('marks current session correctly', () => {
    const { result } = renderHook(() => useSessionCalculations(defaultInput))
    
    expect(result.current.sessionDots[0].isCurrent).toBe(false)
    expect(result.current.sessionDots[1].isCurrent).toBe(false)
    expect(result.current.sessionDots[2].isCurrent).toBe(true)
    expect(result.current.sessionDots[3].isCurrent).toBe(false)
  })

  it('sets correct sizes for dots', () => {
    const { result } = renderHook(() => useSessionCalculations(defaultInput))
    
    expect(result.current.sessionDots[0].size).toBe(12) // Not current
    expect(result.current.sessionDots[2].size).toBe(16) // Current
  })

  it('detects work mode correctly', () => {
    const { result } = renderHook(() => useSessionCalculations({
      ...defaultInput,
      mode: 'work'
    }))
    
    expect(result.current.isWorkMode).toBe(true)
    expect(result.current.isBreakMode).toBe(false)
    expect(result.current.isLongBreakMode).toBe(false)
  })

  it('detects break mode correctly', () => {
    const { result } = renderHook(() => useSessionCalculations({
      ...defaultInput,
      mode: 'break'
    }))
    
    expect(result.current.isWorkMode).toBe(false)
    expect(result.current.isBreakMode).toBe(true)
    expect(result.current.isLongBreakMode).toBe(false)
  })

  it('detects long break mode correctly', () => {
    const { result } = renderHook(() => useSessionCalculations({
      ...defaultInput,
      mode: 'longBreak'
    }))
    
    expect(result.current.isWorkMode).toBe(false)
    expect(result.current.isBreakMode).toBe(false)
    expect(result.current.isLongBreakMode).toBe(true)
  })

  it('returns correct colors for mode', () => {
    const { result } = renderHook(() => useSessionCalculations({
      ...defaultInput,
      mode: 'break'
    }))
    
    expect(result.current.colors.hex).toBe('#2fc55e')
  })

  it('handles zero completed sessions', () => {
    const { result } = renderHook(() => useSessionCalculations({
      ...defaultInput,
      completedSessions: 0,
      currentSessionIndex: 0
    }))
    
    expect(result.current.sessionDots.every(dot => !dot.isCompleted)).toBe(true)
    expect(result.current.sessionDots[0].isCurrent).toBe(true)
  })

  it('handles all sessions completed', () => {
    const { result } = renderHook(() => useSessionCalculations({
      completedSessions: 4,
      totalSessions: 4,
      currentSessionIndex: 0, // Reset after cycle
      mode: 'longBreak'
    }))
    
    expect(result.current.sessionDots.every(dot => dot.isCompleted)).toBe(true)
  })
})
