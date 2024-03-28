import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'

import '@unocss/reset/normalize.css'

import 'virtual:uno.css'

import './index.css'
import RXDBExample from './pages/rxdb/index.tsx'
import SqlJSExample from './pages/sqljs/index.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/rxdb',
    element: <RXDBExample />,
  },
  {
    path: '/sqljs',
    element: <SqlJSExample />,
  },
])
const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
)
