import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register service worker for sleep reminder notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // If notification reminder was previously enabled, reschedule on each load
      if (localStorage.getItem('sleep-notif') === 'on') {
        reg.active?.postMessage({ type: 'SCHEDULE_SLEEP_REMINDER' })
        // Active may be null briefly on first load — wait for it
        reg.addEventListener('updatefound', () => {
          reg.installing?.addEventListener('statechange', function () {
            if (this.state === 'activated') {
              this.postMessage({ type: 'SCHEDULE_SLEEP_REMINDER' })
            }
          })
        })
        navigator.serviceWorker.ready.then(r => {
          r.active?.postMessage({ type: 'SCHEDULE_SLEEP_REMINDER' })
        })
      }
    })
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
