import { describe, expect, it } from 'vitest'
import { passwordStrength, validateConfirmPassword, validateEmail, validateNewPassword, validateUsername } from './authValidation'

describe('validateEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(validateEmail('  jane@example.com ')).toBeNull()
  })

  it('rejects empty and malformed addresses', () => {
    expect(validateEmail('')).toBe('Email is required.')
    expect(validateEmail('jane@example')).toBe('Enter a valid email address.')
    expect(validateEmail('jane example.com')).toBe('Enter a valid email address.')
  })
})

describe('validateUsername', () => {
  it('accepts letters, numbers and . _ -', () => {
    expect(validateUsername('jane.doe_01')).toBeNull()
  })

  it('enforces length and allowed characters', () => {
    expect(validateUsername('')).toBe('Username is required.')
    expect(validateUsername('ab')).toMatch(/3–30/)
    expect(validateUsername('jane doe')).toMatch(/only letters/)
  })
})

describe('validateNewPassword', () => {
  it('requires 8+ characters with a letter and a number', () => {
    expect(validateNewPassword('short1')).toMatch(/at least 8/)
    expect(validateNewPassword('abcdefgh')).toMatch(/letter and one number/)
    expect(validateNewPassword('abcdefg1')).toBeNull()
  })
})

describe('validateConfirmPassword', () => {
  it('requires a matching value', () => {
    expect(validateConfirmPassword('abcdefg1', '')).toBe('Please confirm your password.')
    expect(validateConfirmPassword('abcdefg1', 'abcdefg2')).toBe('Passwords do not match.')
    expect(validateConfirmPassword('abcdefg1', 'abcdefg1')).toBeNull()
  })
})

describe('passwordStrength', () => {
  it('scores from 0 (empty) to 4 (long and varied)', () => {
    expect(passwordStrength('')).toBe(0)
    expect(passwordStrength('abc')).toBe(1)
    expect(passwordStrength('Abcdefg1!xyz')).toBe(4)
  })
})
