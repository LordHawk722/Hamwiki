import { createContext } from 'react'

export const PageIdContext = createContext(["wiki", (pageId) => (pageId)])
