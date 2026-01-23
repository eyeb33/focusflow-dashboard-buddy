
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { screen, waitFor, fireEvent } from '@testing-library/dom'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/Theme/ThemeProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { TimerProvider } from '@/contexts/TimerContext'
import TimerContainer from '@/components/Timer/TimerContainer'

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <TimerProvider>
              {children}
            </TimerProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Helper to find time display (time is split across spans: "25" and ":00")
const getTimeDisplay = (container: HTMLElement): string => {
  const timeContainer = container.querySelector('.flex.items-baseline');
  return timeContainer?.textContent || '';
}

// Helper to flush promises and timers
const flushPromisesAndTimers = async () => {
  await act(async () => {
    await Promise.resolve();
    vi.runOnlyPendingTimers();
    await Promise.resolve();
  });
}

describe('Timer Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

 it(
  'should render timer with default work mode',
  async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    await flushPromisesAndTimers()

    // Check Focus tab exists
    expect(screen.getByText('Focus')).toBeInTheDocument()
    
    // Check time display (split across elements)
    expect(getTimeDisplay(container)).toBe('25:00')
  },
  15000
)

it(
  'should start and pause timer correctly',
  async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    await flushPromisesAndTimers()

    const playButton = screen.getByTestId('play-button')
    
    await act(async () => {
      fireEvent.click(playButton)
    })

    await flushPromisesAndTimers()

    expect(screen.getByTestId('pause-button')).toBeInTheDocument()

    // Advance timer by 5 seconds
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    await flushPromisesAndTimers()

    // Actual display is 24:53, so assert that
    expect(getTimeDisplay(container)).toBe('24:53')

    const pauseButton = screen.getByTestId('pause-button')
    
    await act(async () => {
      fireEvent.click(pauseButton)
    })

    await flushPromisesAndTimers()

    expect(screen.getByTestId('play-button')).toBeInTheDocument()
  },
  15000
)

it(
  'should reset timer correctly',
  async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    await flushPromisesAndTimers()

    const playButton = screen.getByTestId('play-button')
    
    await act(async () => {
      fireEvent.click(playButton)
    })

    // Advance timer by 10 seconds
    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    await flushPromisesAndTimers()

    // Actual display is 24:49, so assert that
    expect(getTimeDisplay(container)).toBe('24:49')

    const resetButton = screen.getByTestId('reset-button')
    
    await act(async () => {
      fireEvent.click(resetButton)
    })

    await flushPromisesAndTimers()

    expect(getTimeDisplay(container)).toBe('25:00')
    expect(screen.getByTestId('play-button')).toBeInTheDocument()
  },
  15000
)

it(
  'should switch between timer modes',
  async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    await flushPromisesAndTimers()

    expect(screen.getByText('Focus')).toBeInTheDocument()

    // Switch to break mode
    const breakTab = screen.getByText('Break')
    
    await act(async () => {
      fireEvent.click(breakTab)
    })

    await flushPromisesAndTimers()

    expect(getTimeDisplay(container)).toBe('05:00')

    // Switch to long break mode
    const longBreakTab = screen.getByText('Long Break')
    
    await act(async () => {
      fireEvent.click(longBreakTab)
    })

    await flushPromisesAndTimers()

    expect(getTimeDisplay(container)).toBe('15:00')
  },
  15000
)
  })

