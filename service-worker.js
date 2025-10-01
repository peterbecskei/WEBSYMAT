let tabID = null;
async function fetchPageContent(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    console.error('Invalid URL:', url);
    return { body: '', size: 0 };
  }
  try {
    const response = await fetch(url, { mode: 'cors' });
    const textfull = await response.text();

    // Extract string between 'window.icomEvents.listingsPageEvent(' and ');'
    let match = textfull.match(/window\.icomEvents\.listingsPageEvent\(([^)]*)\);/);
    let text = '';
    if (match && match[1]) {
      text = match[1].replace(/\s+/g, '');
    }
    // Split the text by comma and put into an array
    let textObject = [];
    if (text) {
      textObject = text.split(',');
    }
    // Optionally, log the array
    console.log(textObject);
    count = textObject[3] || 0;
    console.log('Count:', count);
    return {
      body: count ,
      size: textfull.length
    };
  } catch (error) {
    console.error('Fetch error:', error);
    return { body: '', size: 0 };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setAlarm') {
    chrome.alarms.clear('monitorAlarm');
    chrome.alarms.create('monitorAlarm', { periodInMinutes: message.period });
  } else if (message.action === 'clearAlarm') {
    chrome.alarms.clear('monitorAlarm');
  }
  sendResponse({});
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'monitorAlarm') {
    const { tabUrl, paused, previousSize = 0, notifications = [], unread = 0 } = 
      await chrome.storage.local.get(['tabUrl', 'paused', 'previousSize', 'notifications', 'unread']);
    if (paused || !tabUrl) return;
    // Fetch page content
    const { body, size } = await fetchPageContent(tabUrl);
    if (size && size !== previousSize) {
      const timestamp = new Date().toISOString();
      const notifText = `Az oldal tartalma megváltozott - ${timestamp}`;

      let queryOptions = { active: true, lastFocusedWindow: true };
      // `tab` will either be a `tabs.Tab` instance or `undefined`.
      let tabID = await chrome.tabs.query(queryOptions);

      chrome.notifications.create({
        title: 'Page Change',
        message: notifText,
        iconUrl: '/icons/icon48.png',
        type: 'basic'
      });
      const newNotifications = [...notifications, notifText];
      const newUnread = unread + 1;
      await chrome.storage.local.set({ 
        previousBody: body, 
        previousSize: size, 
        notifications: newNotifications, 
        unread: newUnread,
        lastCheck: timestamp
      });
      chrome.action.setBadgeText({ text: newUnread.toString() });
      chrome.action.setBadgeBackgroundColor(
          {color: 'green'},  // Also, also green
          () => { /* ... */ },
      );
    } else if (!previousSize) {
      await chrome.storage.local.set({ 
        previousBody: body, 
        previousSize: size, 
        lastCheck: new Date().toISOString()
      });
    }
  }
});

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function getCurrentTabid() {
  try {
    const window = await chrome.windows.getLastFocused();
    if (window && window.id) {
      await chrome.sidePanel.open({ windowId: window.id });
    } else {
      console.error('No valid window found, falling back to tab');
      chrome.tabs.create({ url: 'sidepanel.html' });
    }
  } catch (error) {
    console.error('Error opening side panel:', error);
    chrome.tabs.create({ url: 'sidepanel.html' });
  }
}

chrome.notifications.onClicked.addListener(() => {
  console.log('chrome.notifications.onClicked');
  chrome.tabs.create({ url: 'sidepanel.html' });
  //chrome.sidePanel.open({ windowId: tabID });
 // getCurrentTabid()
});