import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { get, post, put, del } from '../api'

// Mock fetch globally
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment
    import.meta.env.VITE_API_URL = 'https://api.example.com'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('get', () => {
    it('should make a GET request and return JSON data', async () => {
      const mockData = { id: 1, name: 'Test' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        {
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
        }
      )
      expect(result).toEqual(mockData)
    })

    it('should handle errors correctly', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      })

      await expect(get('/test')).rejects.toThrow('HTTP 404: Not Found')
    })

    it('should work without API_BASE', async () => {
      import.meta.env.VITE_API_URL = ''
      const mockData = { id: 1 }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      await get('/test')
      expect(global.fetch).toHaveBeenCalledWith('/test', expect.any(Object))
    })
  })

  describe('post', () => {
    it('should make a POST request with JSON body', async () => {
      const mockData = { id: 1, created: true }
      const requestBody = { name: 'Test' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await post('/test', requestBody)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        }
      )
      expect(result).toEqual(mockData)
    })

    it('should handle POST errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      })

      await expect(post('/test', {})).rejects.toThrow('HTTP 400: Bad Request')
    })
  })

  describe('put', () => {
    it('should make a PUT request with JSON body', async () => {
      const mockData = { id: 1, updated: true }
      const requestBody = { name: 'Updated' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await put('/test/1', requestBody)

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test/1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        }
      )
      expect(result).toEqual(mockData)
    })
  })

  describe('del', () => {
    it('should make a DELETE request', async () => {
      const mockData = { deleted: true }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const result = await del('/test/1')

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test/1',
        {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
        }
      )
      expect(result).toEqual(mockData)
    })
  })
})

