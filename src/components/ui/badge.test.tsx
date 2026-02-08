import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Badge } from './badge'

describe('Badge Component', () => {
  it('should render with children', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('should apply default variant styles', () => {
    render(<Badge data-testid="badge">Default</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-primary-100')
    expect(badge).toHaveClass('text-primary-700')
  })

  it('should apply secondary variant styles', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-secondary-100')
    expect(badge).toHaveClass('text-secondary-700')
  })

  it('should apply success variant styles', () => {
    render(<Badge variant="success" data-testid="badge">Success</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-green-100')
    expect(badge).toHaveClass('text-green-700')
  })

  it('should apply warning variant styles', () => {
    render(<Badge variant="warning" data-testid="badge">Warning</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-yellow-100')
    expect(badge).toHaveClass('text-yellow-700')
  })

  it('should apply error variant styles', () => {
    render(<Badge variant="error" data-testid="badge">Error</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-700')
  })

  it('should apply info variant styles', () => {
    render(<Badge variant="info" data-testid="badge">Info</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('bg-blue-100')
    expect(badge).toHaveClass('text-blue-700')
  })

  it('should apply outline variant styles', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('border')
    expect(badge).toHaveClass('text-gray-700')
  })

  it('should support custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>)
    expect(screen.getByText('Custom')).toHaveClass('custom-badge')
  })

  it('should have inline-flex display', () => {
    render(<Badge data-testid="badge">Inline</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('inline-flex')
  })

  it('should have rounded styling', () => {
    render(<Badge data-testid="badge">Rounded</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('rounded-full')
  })
})
