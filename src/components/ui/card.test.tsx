import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render children', () => {
      render(<Card>Card content</Card>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>)
      expect(screen.getByTestId('card')).toHaveClass('custom-class')
    })

    it('should have default styling', () => {
      render(<Card data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('bg-white')
    })
  })

  describe('CardHeader', () => {
    it('should render children', () => {
      render(<CardHeader>Header content</CardHeader>)
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('should apply padding', () => {
      render(<CardHeader data-testid="header">Content</CardHeader>)
      expect(screen.getByTestId('header')).toHaveClass('p-6')
    })
  })

  describe('CardTitle', () => {
    it('should render as heading', () => {
      render(<CardTitle>My Title</CardTitle>)
      expect(screen.getByText('My Title')).toBeInTheDocument()
    })

    it('should have appropriate styling', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)
      expect(screen.getByTestId('title')).toHaveClass('font-semibold')
    })
  })

  describe('CardDescription', () => {
    it('should render description text', () => {
      render(<CardDescription>This is a description</CardDescription>)
      expect(screen.getByText('This is a description')).toBeInTheDocument()
    })

    it('should have muted styling', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>)
      // The actual class is text-gray-500, not text-muted-foreground
      expect(screen.getByTestId('desc')).toHaveClass('text-gray-500')
    })
  })

  describe('CardContent', () => {
    it('should render children', () => {
      render(<CardContent>Main content here</CardContent>)
      expect(screen.getByText('Main content here')).toBeInTheDocument()
    })

    it('should apply padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      expect(screen.getByTestId('content')).toHaveClass('p-6')
    })
  })

  describe('CardFooter', () => {
    it('should render children', () => {
      render(<CardFooter>Footer content</CardFooter>)
      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should have flex layout', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      expect(screen.getByTestId('footer')).toHaveClass('flex')
    })
  })

  describe('Full Card composition', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>A test description</CardDescription>
          </CardHeader>
          <CardContent>Main content goes here</CardContent>
          <CardFooter>Footer actions</CardFooter>
        </Card>
      )

      expect(screen.getByText('Test Card')).toBeInTheDocument()
      expect(screen.getByText('A test description')).toBeInTheDocument()
      expect(screen.getByText('Main content goes here')).toBeInTheDocument()
      expect(screen.getByText('Footer actions')).toBeInTheDocument()
    })
  })
})
