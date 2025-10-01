document.addEventListener('DOMContentLoaded', () => {
  const notifsDiv = document.getElementById('notifications');
  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const deleteBtn = document.getElementById('delete');
  const moreBtn = document.getElementById('more');

  function loadNotifications() {
    chrome.storage.local.get(['notifications'], (data) => {
      notifsDiv.innerHTML = '';
      (data.notifications || []).forEach((notif) => {
        const p = document.createElement('p');
        p.textContent = notif;
        notifsDiv.appendChild(p);
      });
      chrome.action.setBadgeText({ text: '0' });
      chrome.storage.local.set({ unread: 0 });
    });
  }

  loadNotifications(); // Opening sidepanel marks notifications as read

  startBtn.addEventListener('click', () => {
    chrome.storage.local.get(['period'], (data) => {
      if (data.period) {
        chrome.storage.local.set({ paused: false });
        chrome.runtime.sendMessage({ action: 'setAlarm', period: data.period });
      }
    });
  });

  pauseBtn.addEventListener('click', () => {
    chrome.storage.local.set({ paused: true });
    chrome.runtime.sendMessage({ action: 'clearAlarm' });
  });

  deleteBtn.addEventListener('click', () => {
    chrome.storage.local.set({
      tabUrl: '',
      period: null,
      previousBody: '',
      previousSize: 0,
      notifications: [],
      unread: 0,
      paused: true
    });
    chrome.action.setBadgeText({ text: '' });
    chrome.runtime.sendMessage({ action: 'clearAlarm' });
    notifsDiv.innerHTML = '';
  });

  moreBtn.addEventListener('click', () => {
    const confirmed = confirm('Contact us: https://www.44dev.com...');
    if (confirmed) {
      chrome.tabs.create({ url: 'https://www.44dev.com' });
    }
  });
});