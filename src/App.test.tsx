import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

const mockFlags = {
  flags: {
    dark_mode: {
      enabled: true,
      description: 'Enable dark mode theme',
      rollout_percentage: 100,
    },
    new_dashboard: {
      enabled: false,
      description: 'New dashboard UI',
      rollout_percentage: 25,
    },
  },
  version: '1.0.0',
  last_updated: '2024-01-15',
}

const mockCount = { count: 42 }

// Helper to create fetch mock that handles both flags and count endpoints
const createFetchMock = (options: {
  flagsResponse?: { ok: boolean; data?: typeof mockFlags; status?: number }
  countResponse?: { ok: boolean; data?: typeof mockCount; status?: number }
  countPostResponse?: { ok: boolean; data?: typeof mockCount; status?: number }
  neverResolve?: boolean
}) => {
  return vi.spyOn(global, 'fetch').mockImplementation((url, init) => {
    if (options.neverResolve) {
      return new Promise(() => {})
    }

    const urlStr = String(url)

    if (urlStr.includes('/flags')) {
      const resp = options.flagsResponse ?? { ok: true, data: mockFlags }
      if (!resp.ok) {
        return Promise.resolve({ ok: false, status: resp.status ?? 500 } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(resp.data),
      } as Response)
    }

    if (urlStr.includes('/api/count')) {
      const isPost = init?.method === 'POST'
      const resp = isPost
        ? (options.countPostResponse ?? options.countResponse ?? { ok: true, data: mockCount })
        : (options.countResponse ?? { ok: true, data: mockCount })

      if (!resp.ok) {
        return Promise.resolve({ ok: false, status: resp.status ?? 500 } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(resp.data),
      } as Response)
    }

    return Promise.reject(new Error(`Unknown URL: ${urlStr}`))
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    createFetchMock({ neverResolve: true })

    render(<App />)
    expect(screen.getByText('Loading flags...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument()
  })

  it('renders feature flags after successful fetch', async () => {
    createFetchMock({})

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('dark_mode')).toBeInTheDocument()
    })

    expect(screen.getByText('new_dashboard')).toBeInTheDocument()
    expect(screen.getByText('Enable dark mode theme')).toBeInTheDocument()
    expect(screen.getByText('Version: 1.0.0 | Updated: 2024-01-15')).toBeInTheDocument()
  })

  it('renders error state on fetch failure', async () => {
    createFetchMock({
      flagsResponse: { ok: false, status: 500 },
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Error: HTTP 500')).toBeInTheDocument()
    })
  })

  it('handles network errors for flags', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = String(url)
      if (urlStr.includes('/flags')) {
        return Promise.reject(new Error('Network error'))
      }
      if (urlStr.includes('/api/count')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCount),
        } as Response)
      }
      return Promise.reject(new Error(`Unknown URL: ${urlStr}`))
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })
  })

  it('loads initial count from API', async () => {
    createFetchMock({
      countResponse: { ok: true, data: { count: 42 } },
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /count is 42/i })).toBeInTheDocument()
    })
  })

  it('increments counter via API when button is clicked', async () => {
    let currentCount = 42
    vi.spyOn(global, 'fetch').mockImplementation((url, init) => {
      const urlStr = String(url)

      if (urlStr.includes('/flags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFlags),
        } as Response)
      }

      if (urlStr.includes('/api/count')) {
        if (init?.method === 'POST') {
          currentCount++
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ count: currentCount }),
        } as Response)
      }

      return Promise.reject(new Error(`Unknown URL: ${urlStr}`))
    })

    render(<App />)

    // Wait for initial count to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /count is 42/i })).toBeInTheDocument()
    })

    // Click the button
    const button = screen.getByRole('button', { name: /count is 42/i })
    fireEvent.click(button)

    // Wait for the count to increment
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /count is 43/i })).toBeInTheDocument()
    })

    // Click again
    fireEvent.click(screen.getByRole('button', { name: /count is 43/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /count is 44/i })).toBeInTheDocument()
    })
  })

  it('shows counter error on API failure', async () => {
    createFetchMock({
      countResponse: { ok: false, status: 500 },
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/counter error: http 500/i)).toBeInTheDocument()
    })
  })

  it('renders the app title and description', () => {
    createFetchMock({ neverResolve: true })

    render(<App />)
    expect(screen.getByText('Demo App')).toBeInTheDocument()
    expect(screen.getByText('A simple React + TypeScript + Vite demo.')).toBeInTheDocument()
  })

  it('displays ON/OFF badges correctly', async () => {
    createFetchMock({})

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('ON')).toBeInTheDocument()
      expect(screen.getByText('OFF')).toBeInTheDocument()
    })
  })

  it('displays rollout percentages', async () => {
    createFetchMock({})

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })

  it('disables button while loading count', () => {
    createFetchMock({ neverResolve: true })

    render(<App />)

    const button = screen.getByRole('button', { name: /loading/i })
    expect(button).toBeDisabled()
  })
})
