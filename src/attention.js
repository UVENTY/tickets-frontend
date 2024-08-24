import { createContext, useCallback, useContext, useState } from 'react'

const AttentionContext = createContext({
  queue: [],
  setQueue,
})

export function AttentionProvider({ children }) {
  const [ queue, setQueue ] = useState([])

  const message = useCallback((options) => {
    const { position = 'rightBottom', duration, ...rest } = options
    const newQueue = [...queue]
  }, queue)

  const value = { queue, setQueue }
  return (
    <AttentionContext.Provider value={value}>{children}</AttentionContext.Provider>
  )
}

export function useAttention() {
  const context = useContext(AttentionContext)
  if (!context) {
    throw new Error('useAttention must be used within AttentionProvider')
  }
  return {
    queue: context.attention,
    setAttention: context.setAttention || (() => { })
  }
}