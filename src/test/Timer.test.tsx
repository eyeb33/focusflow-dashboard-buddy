
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
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

describe('Timer Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render timer with default work mode', async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Focus')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Check time display (split across elements)
    expect(getTimeDisplay(container)).toBe('25:00')
  })

  it('should start and pause timer correctly', async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    // Wait for render
    await waitFor(() => {
      expect(screen.getByTestId('play-button')).toBeInTheDocument()
    }, { timeout: 1000 })

    const playButton = screen.getByTestId('play-button')
    fireEvent.click(playButton)

    await waitFor(() => {
      expect(screen.getByTestId('pause-button')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Advance timer by 5 seconds
    vi.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(getTimeDisplay(container)).toBe('24:55')
    }, { timeout: 1000 })

    const pauseButton = screen.getByTestId('pause-button')
    fireEvent.click(pauseButton)

    await waitFor(() => {
      expect(screen.getByTestId('play-button')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should reset timer correctly', async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    // Wait for render
    await waitFor(() => {
      expect(screen.getByTestId('play-button')).toBeInTheDocument()
    }, { timeout: 1000 })

    const playButton = screen.getByTestId('play-button')
    fireEvent.click(playButton)

    // Advance timer by 10 seconds
    vi.advanceTimersByTime(10000)

    await waitFor(() => {
      expect(getTimeDisplay(container)).toBe('24:50')
    }, { timeout: 1000 })

    const resetButton = screen.getByTestId('reset-button')
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(getTimeDisplay(container)).toBe('25:00')
      expect(screen.getByTestId('play-button')).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should switch between timer modes', async () => {
    const { container } = render(
      <TestWrapper>
        <TimerContainer activeTask={null} />
      </TestWrapper>
    )

    // Wait for render
    await waitFor(() => {
      expect(screen.getByText('Focus')).toBeInTheDocument()
    }, { timeout: 1000 })

    // Switch to break mode
    const breakTab = screen.getByText('Break')
    fireEvent.click(breakTab)

    await waitFor(() => {
      expect(getTimeDisplay(container)).toBe('05:00')
    }, { timeout: 1000 })

    // Switch to long break mode
    const longBreakTab = screen.getByText('Long Break')
    fireEvent.click(longBreakTab)

    await waitFor(() => {
      expect(getTimeDisplay(container)).toBe('15:00')
    }, { timeout: 1000 })
  })
})
