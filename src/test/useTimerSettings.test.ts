import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimerSettings, TimerSettings, TimerType } from '@/hooks/useTimerSettings'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get store() {
      return store
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('useTimerSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('Initialization', () => {
    it('should initialize with default settings when localStorage is empty', () => {
      const { result } = renderHook(() => useTimerSettings())

      expect(result.current.settings).toEqual({
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
      })
    })

    it('should load settings from localStorage', () => {
      const customSettings: TimerSettings = {
        workDuration: 30,
        breakDuration: 10,
        longBreakDuration: 20,
        sessionsUntilLongBreak: 3,
        autoStartBreaks: false,
        autoStartFocus: true,
        showNotifications: false,
        soundEnabled: false,
        soundVolume: 0.5,
        soundId: 'custom-sound',
        timerType: 'freeStudy'
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(customSettings))

      const { result } = renderHook(() => useTimerSettings())

      expect(result.current.settings.workDuration).toBe(30)
      expect(result.current.settings.breakDuration).toBe(10)
      expect(result.current.settings.timerType).toBe('freeStudy')
    })

    it('should use defaults when localStorage has invalid data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')

      const { result } = renderHook(() => useTimerSettings())

      expect(result.current.settings.workDuration).toBe(25)
    })

    it('should use defaults when localStorage has incomplete data', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        workDuration: 'not a number'
      }))

      const { result } = renderHook(() => useTimerSettings())

      expect(result.current.settings.workDuration).toBe(25)
    })
  })

  describe('updateSetting', () => {
    it('should update a single setting', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSetting('workDuration', 45)
      })

      expect(result.current.settings.workDuration).toBe(45)
    })

    it('should preserve other settings when updating one', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSetting('workDuration', 45)
      })

      expect(result.current.settings.breakDuration).toBe(5)
      expect(result.current.settings.longBreakDuration).toBe(15)
    })

    it('should save to localStorage after update', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSetting('workDuration', 45)
      })

      const savedSettings = JSON.parse(localStorageMock.store['timerSettings'])
      expect(savedSettings.workDuration).toBe(45)
    })
  })

  describe('updateSettings', () => {
    it('should update multiple settings at once', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSettings({
          workDuration: 50,
          breakDuration: 15,
          timerType: 'freeStudy'
        })
      })

      expect(result.current.settings.workDuration).toBe(50)
      expect(result.current.settings.breakDuration).toBe(15)
      expect(result.current.settings.timerType).toBe('freeStudy')
    })

    it('should preserve unspecified settings', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSettings({
          workDuration: 50
        })
      })

      expect(result.current.settings.longBreakDuration).toBe(15)
      expect(result.current.settings.soundEnabled).toBe(true)
    })

    it('should update sound settings correctly', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSettings({
          soundEnabled: false,
          soundVolume: 0.25,
          soundId: 'gong'
        })
      })

      expect(result.current.settings.soundEnabled).toBe(false)
      expect(result.current.settings.soundVolume).toBe(0.25)
      expect(result.current.settings.soundId).toBe('gong')
    })

    it('should update timer type correctly', () => {
      const { result } = renderHook(() => useTimerSettings())

      expect(result.current.settings.timerType).toBe('pomodoro')

      act(() => {
        result.current.updateSettings({ timerType: 'freeStudy' })
      })

      expect(result.current.settings.timerType).toBe('freeStudy')

      act(() => {
        result.current.updateSettings({ timerType: 'pomodoro' })
      })

      expect(result.current.settings.timerType).toBe('pomodoro')
    })
  })

  describe('Persistence', () => {
    it('should persist settings across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSettings({ workDuration: 35 })
      })

      rerender()

      expect(result.current.settings.workDuration).toBe(35)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSetting('soundVolume', 0)
      })

      expect(result.current.settings.soundVolume).toBe(0)
    })

    it('should handle maximum values', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSettings({
          workDuration: 120,
          breakDuration: 60,
          longBreakDuration: 60
        })
      })

      expect(result.current.settings.workDuration).toBe(120)
      expect(result.current.settings.breakDuration).toBe(60)
      expect(result.current.settings.longBreakDuration).toBe(60)
    })

    it('should handle sessionsUntilLongBreak changes', () => {
      const { result } = renderHook(() => useTimerSettings())

      act(() => {
        result.current.updateSetting('sessionsUntilLongBreak', 6)
      })

      expect(result.current.settings.sessionsUntilLongBreak).toBe(6)
    })
  })
})

describe('TimerType', () => {
  it('should support pomodoro type', () => {
    const type: TimerType = 'pomodoro'
    expect(type).toBe('pomodoro')
  })

  it('should support freeStudy type', () => {
    const type: TimerType = 'freeStudy'
    expect(type).toBe('freeStudy')
  })
})
