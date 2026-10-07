import { ApiError } from '../services/api'

/** Converts any thrown value into a short, user-friendly message. Never shows stack traces. */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.kind) {
      case 'bad_request':
        return err.message || 'Some of the information provided is invalid.'
      case 'unauthorized':
        return 'Your session has expired. Please sign in again.'
      case 'forbidden':
        return "You don't have permission to do that."
      case 'not_found':
        return 'The requested item could not be found. It may have been deleted.'
      case 'conflict':
        return err.message || 'This action conflicts with the current state. Please refresh and try again.'
      case 'timeout':
        return 'The server took too long to respond. Please try again.'
      case 'rate_limited':
        return 'Too many requests. Please wait a moment and try again.'
      case 'unavailable':
        return 'The server is temporarily unavailable. Please try again shortly.'
      case 'server_error':
        return 'Something went wrong on the server. Please try again later.'
      case 'network':
        return 'Cannot reach the server. Check your internet connection or whether the backend is running.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }
  return 'Something went wrong. Please try again.'
}

export const isAbortError = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'
