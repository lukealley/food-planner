// Sleep reminder service worker
// Schedules an 8am notification to prompt the user to log last night's sleep.

let reminderTimeout = null

function scheduleReminder() {
  if (reminderTimeout) clearTimeout(reminderTimeout)

  const now    = new Date()
  const target = new Date()
  target.setHours(8, 0, 0, 0)

  // If 8am already passed today, aim for tomorrow
  if (now >= target) target.setDate(target.getDate() + 1)

  const delay = target.getTime() - now.getTime()

  reminderTimeout = setTimeout(async () => {
    await self.registration.showNotification('Log your sleep', {
      body: "How did you sleep last night? Tap to log your hours.",
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sleep-reminder',         // replaces any existing sleep notification
      renotify: true,
      requireInteraction: false,
    })
    // Schedule the next day's reminder
    scheduleReminder()
  }, delay)
}

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

self.addEventListener('message', event => {
  if (event.data?.type === 'SCHEDULE_SLEEP_REMINDER') {
    scheduleReminder()
  }
  if (event.data?.type === 'CANCEL_SLEEP_REMINDER') {
    if (reminderTimeout) {
      clearTimeout(reminderTimeout)
      reminderTimeout = null
    }
  }
})

// When the notification is tapped, open/focus the app
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/')
    })
  )
})
