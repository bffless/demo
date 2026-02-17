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

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    // Mock fetch to never resolve during this test
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(() => {})
    )

    render(<App />)
    expect(screen.getByText('Loading flags...')).toBeInTheDocument()
  })

  it('renders feature flags after successful fetch', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFlags),
    } as Response)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('dark_mode')).toBeInTheDocument()
    })

    expect(screen.getByText('new_dashboard')).toBeInTheDocument()
    expect(screen.getByText('Enable dark mode theme')).toBeInTheDocument()
    expect(screen.getByText('Version: 1.0.0 | Updated: 2024-01-15')).toBeInTheDocument()
  })

  it('renders error state on fetch failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Error: HTTP 500')).toBeInTheDocument()
    })
  })

  it('handles network errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })
  })

  it('increments counter when button is clicked', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFlags),
    } as Response)

    render(<App />)

    const button = screen.getByRole('button', { name: /count is 0/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /count is 2/i })).toBeInTheDocument()
  })

  it('renders the app title and description', () => {
    vi.spyOn(global, 'fetch').mockImplementation(
      () => new Promise(() => {})
    )

    render(<App />)
    expect(screen.getByText('Demo App')).toBeInTheDocument()
    expect(screen.getByText('A simple React + TypeScript + Vite demo.')).toBeInTheDocument()
  })

  it('displays ON/OFF badges correctly', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFlags),
    } as Response)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('ON')).toBeInTheDocument()
      expect(screen.getByText('OFF')).toBeInTheDocument()
    })
  })

  it('displays rollout percentages', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFlags),
    } as Response)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })
})
