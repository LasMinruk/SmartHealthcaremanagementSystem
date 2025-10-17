import '@testing-library/jest-dom'

// Mock Vite's import.meta.env for Jest
globalThis.__TEST_ENV__ = {
  VITE_BACKEND_URL: 'http://localhost:4000'
}

