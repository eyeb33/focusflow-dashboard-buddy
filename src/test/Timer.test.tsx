
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

describe('Timer Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render timer with default work mode', () => {
    render(
      <TestWrapper>
      <TimerContainer
        activeTask={null}
        tasks={[]}
        onRemoveActiveTask={() => {}}
        onCompleteActiveTask={() => {}}
        onDrop={() => {}}
        onDragOver={() => {}}
        onQuickAddTask={async () => null}
        onSetActiveTask={async () => {}}
      />
      </TestWrapper>
    )

    expect(screen.getByText('Focus')).toBeInTheDocument()
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('should start and pause timer correctly', async () => {
    render(
      <TestWrapper>
        <TimerContainer 
          activeTask={null}
          tasks={[]}
          onRemoveActiveTask={() => {}}
          onCompleteActiveTask={() => {}}
          onDrop={() => {}}
          onDragOver={() => {}}
          onQuickAddTask={async () => null}
          onSetActiveTask={async () => {}}
        />
      </TestWrapper>
    )

    const playButton = screen.getByTestId('play-button')
    fireEvent.click(playButton)

    await waitFor(() => {
      expect(screen.getByTestId('pause-button')).toBeInTheDocument()
    })

    // Advance timer by 5 seconds
    vi.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(screen.getByText('24:55')).toBeInTheDocument()
    })

    const pauseButton = screen.getByTestId('pause-button')
    fireEvent.click(pauseButton)

    await waitFor(() => {
      expect(screen.getByTestId('play-button')).toBeInTheDocument()
    })
  })

  it('should reset timer correctly', async () => {
    render(
      <TestWrapper>
        <TimerContainer 
          activeTask={null}
          tasks={[]}
          onRemoveActiveTask={() => {}}
          onCompleteActiveTask={() => {}}
          onDrop={() => {}}
          onDragOver={() => {}}
          onQuickAddTask={async () => null}
          onSetActiveTask={async () => {}}
        />
      </TestWrapper>
    )

    const playButton = screen.getByTestId('play-button')
    fireEvent.click(playButton)

    // Advance timer by 10 seconds
    vi.advanceTimersByTime(10000)

    await waitFor(() => {
      expect(screen.getByText('24:50')).toBeInTheDocument()
    })

    const resetButton = screen.getByTestId('reset-button')
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(screen.getByText('25:00')).toBeInTheDocument()
      expect(screen.getByTestId('play-button')).toBeInTheDocument()
    })
  })

  it('should switch between timer modes', async () => {
    render(
      <TestWrapper>
        <TimerContainer 
          activeTask={null}
          tasks={[]}
          onRemoveActiveTask={() => {}}
          onCompleteActiveTask={() => {}}
          onDrop={() => {}}
          onDragOver={() => {}}
          onQuickAddTask={async () => null}
          onSetActiveTask={async () => {}}
        />
      </TestWrapper>
    )

    // Switch to break mode
    const breakTab = screen.getByText('Break')
    fireEvent.click(breakTab)

    await waitFor(() => {
      expect(screen.getByText('05:00')).toBeInTheDocument()
    })

    // Switch to long break mode
    const longBreakTab = screen.getByText('Long Break')
    fireEvent.click(longBreakTab)

    await waitFor(() => {
      expect(screen.getByText('15:00')).toBeInTheDocument()
    })
  })
})
