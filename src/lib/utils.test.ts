import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatTime, generateTimeSlots } from './utils'

describe('cn (classNames utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included')
  })

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('should handle objects with boolean values', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })
})

describe('formatDate', () => {
  it('should format Date object correctly', () => {
    const date = new Date('2026-02-08')
    const formatted = formatDate(date)
    expect(formatted).toContain('2026')
    expect(formatted).toContain('February')
  })

  it('should format date string correctly', () => {
    const formatted = formatDate('2026-02-08')
    expect(formatted).toContain('2026')
    expect(formatted).toContain('February')
  })

  it('should include weekday in output', () => {
    const formatted = formatDate('2026-02-08') // This is a Sunday
    expect(formatted).toMatch(/Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday/)
  })
})

describe('formatTime', () => {
  it('should format morning time correctly', () => {
    expect(formatTime('09:00')).toBe('9:00 AM')
    expect(formatTime('08:30')).toBe('8:30 AM')
  })

  it('should format afternoon time correctly', () => {
    expect(formatTime('14:00')).toBe('2:00 PM')
    expect(formatTime('15:30')).toBe('3:30 PM')
  })

  it('should handle noon correctly', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('should handle midnight correctly', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })

  it('should handle edge cases', () => {
    expect(formatTime('11:59')).toBe('11:59 AM')
    expect(formatTime('12:01')).toBe('12:01 PM')
    expect(formatTime('23:59')).toBe('11:59 PM')
  })
})

describe('generateTimeSlots', () => {
  it('should generate default time slots (8am-5pm, 30min intervals)', () => {
    const slots = generateTimeSlots()
    expect(slots).toContain('08:00')
    expect(slots).toContain('08:30')
    expect(slots).toContain('16:30')
    expect(slots).not.toContain('17:00') // End hour is exclusive
    expect(slots.length).toBe(18) // 9 hours * 2 slots per hour
  })

  it('should generate slots with custom start and end hours', () => {
    const slots = generateTimeSlots(9, 12)
    expect(slots[0]).toBe('09:00')
    expect(slots[slots.length - 1]).toBe('11:30')
    expect(slots.length).toBe(6) // 3 hours * 2 slots
  })

  it('should generate slots with custom interval', () => {
    const slots = generateTimeSlots(8, 9, 15)
    expect(slots).toEqual(['08:00', '08:15', '08:30', '08:45'])
  })

  it('should handle 60-minute intervals', () => {
    const slots = generateTimeSlots(8, 12, 60)
    expect(slots).toEqual(['08:00', '09:00', '10:00', '11:00'])
  })

  it('should return empty array when start equals end', () => {
    const slots = generateTimeSlots(8, 8)
    expect(slots).toEqual([])
  })

  it('should pad hours and minutes with zeros', () => {
    const slots = generateTimeSlots(8, 10, 30)
    expect(slots[0]).toBe('08:00')
    expect(slots[1]).toBe('08:30')
    expect(slots[2]).toBe('09:00')
  })
})
