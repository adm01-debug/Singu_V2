// Push Notification Service Worker - Enhanced
// Version: 2.0

const CACHE_NAME = 'relateiq-push-v2';

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received');
  
  let data = {
    title: 'RelateIQ',
    body: 'Você tem uma nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {}
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }
  
  // Customize options based on notification type
  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: getVibrationPattern(data.type),
    data: data.data || {},
    actions: getActions(data.type),
    tag: data.tag || data.type || 'default',
    renotify: true,
    requireInteraction: data.requireInteraction || isHighPriority(data.type),
    silent: data.silent || false,
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Get vibration pattern based on notification type
function getVibrationPattern(type) {
  switch (type) {
    case 'health_alert':
    case 'churn_risk':
      return [200, 100, 200, 100, 200]; // Urgent pattern
    case 'followup':
    case 'meeting':
      return [100, 50, 100]; // Standard pattern
    case 'birthday':
    case 'celebration':
      return [100, 50, 100, 50, 100, 50, 100]; // Celebratory pattern
    default:
      return [100, 50, 100];
  }
}

// Check if notification type is high priority
function isHighPriority(type) {
  const highPriorityTypes = ['health_alert', 'churn_risk', 'meeting_reminder', 'urgent'];
  return highPriorityTypes.includes(type);
}

// Get action buttons based on notification type
function getActions(type) {
  switch (type) {
    case 'followup':
      return [
        { action: 'view', title: '👁️ Ver Detalhes', icon: '/pwa-192x192.png' },
        { action: 'snooze', title: '⏰ Adiar 1h', icon: '/pwa-192x192.png' }
      ];
    case 'health_alert':
      return [
        { action: 'view', title: '🔍 Analisar', icon: '/pwa-192x192.png' },
        { action: 'dismiss', title: '✓ Entendido', icon: '/pwa-192x192.png' }
      ];
    case 'birthday':
      return [
        { action: 'view', title: '🎂 Ver Contato', icon: '/pwa-192x192.png' },
        { action: 'message', title: '💬 Enviar Mensagem', icon: '/pwa-192x192.png' }
      ];
    case 'meeting':
    case 'meeting_reminder':
      return [
        { action: 'view', title: '📅 Ver Reunião', icon: '/pwa-192x192.png' },
        { action: 'join', title: '🎥 Entrar', icon: '/pwa-192x192.png' }
      ];
    case 'insight':
      return [
        { action: 'view', title: '💡 Ver Insight', icon: '/pwa-192x192.png' }
      ];
    default:
      return [
        { action: 'view', title: 'Ver', icon: '/pwa-192x192.png' }
      ];
  }
}

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked', event.action);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetUrl = '/';
  
  // Handle specific actions
  if (event.action === 'snooze') {
    // Could trigger a snooze API call
    console.log('[Service Worker] Snooze requested for', data);
    return;
  }
  
  if (event.action === 'dismiss') {
    console.log('[Service Worker] Dismissed', data);
    return;
  }
  
  if (event.action === 'message' && data.contactId) {
    // Open WhatsApp or messaging
    if (data.whatsapp) {
      targetUrl = `https://wa.me/${data.whatsapp}`;
    } else {
      targetUrl = `/contatos/${data.contactId}`;
    }
  }
  
  // Route based on notification type
  if (data.url) {
    targetUrl = data.url;
  } else if (data.contactId) {
    targetUrl = `/contatos/${data.contactId}`;
  } else if (data.companyId) {
    targetUrl = `/empresas/${data.companyId}`;
  } else if (data.type === 'health_alert') {
    targetUrl = '/';
  } else if (data.type === 'insight') {
    targetUrl = '/insights';
  } else if (data.type === 'meeting') {
    targetUrl = '/calendario';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ('focus' in client) {
            client.focus();
            if (targetUrl.startsWith('http')) {
              return clients.openWindow(targetUrl);
            }
            client.navigate(targetUrl);
            return;
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed', event.notification.tag);
  
  // Track notification dismissal
  const data = event.notification.data || {};
  if (data.trackClose) {
    // Could send analytics event
  }
});

// Handle subscription change
self.addEventListener('pushsubscriptionchange', function(event) {
  console.log('[Service Worker] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.vapidPublicKey
    }).then(function(subscription) {
      // Re-register the subscription
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });
    })
  );
});

// Periodic sync for background updates (if supported)
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNotifications());
  }
});

async function checkForNotifications() {
  // This would check for pending notifications
  console.log('[Service Worker] Periodic sync - checking notifications');
}

// Message handler for communication with main app
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});
