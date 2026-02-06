import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => cleanup())

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn()
  })
})

const originalQuerySelector = Element.prototype.querySelector
const originalQuerySelectorAll = Element.prototype.querySelectorAll
Element.prototype.querySelector = function querySelectorWithFallback(selector: string) {
  try {
    return originalQuerySelector.call(this, selector)
  } catch (error: any) {
    if (error?.name === 'SyntaxError' && /unknown pseudo-class selector/.test(error?.message || '')) {
      return null
    }
    throw error
  }
}

Element.prototype.querySelectorAll = function querySelectorAllWithFallback(selector: string) {
  try {
    return originalQuerySelectorAll.call(this, selector)
  } catch (error: any) {
    if (error?.name === 'SyntaxError' && /unknown pseudo-class selector/.test(error?.message || '')) {
      return document.createDocumentFragment().querySelectorAll('*')
    }
    throw error
  }
}
