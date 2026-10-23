import { createContext, useContext } from 'react'

export const DialogContext = createContext(null)

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog compound components must be rendered within a Dialog root.')
  }
  return context
}
