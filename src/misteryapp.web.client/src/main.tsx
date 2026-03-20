import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { ServicesProvider } from './core/providers'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicesProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ServicesProvider>
  </StrictMode>,
)
