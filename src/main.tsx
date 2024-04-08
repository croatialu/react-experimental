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
import { WebRTCExample } from './pages/webrtc/index.tsx'
import { MiniWebRTCExample } from './pages/mini-webrtc/index.tsx'
import RXDBExample2 from './pages/rxdb-example/index.tsx'

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
    path: '/rxdb2',
    element: <RXDBExample2 />,
  },
  {
    path: '/sqljs',
    element: <SqlJSExample />,
  },
  {
    path: '/webrtc',
    element: <WebRTCExample />,
  },
  {
    path: '/mini-webrtc',
    element: <MiniWebRTCExample />,
  },
])
const queryClient = new QueryClient()
ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
)
