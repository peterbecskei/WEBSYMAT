document.addEventListener('DOMContentLoaded', () => {
  const tabUrlInput = document.getElementById('tabUrl');
  const getBtn = document.getElementById('getTabUrl');
  const set1 = document.getElementById('setAlert1');
  const set10 = document.getElementById('setAlert10');
  const setX = document.getElementById('setAlertX');
  const openSidepanelBtn = document.getElementById('Opensidepanel');


  chrome.storage.local.get(['tabUrl'], (data) => {
    if (data.tabUrl) tabUrlInput.value = data.tabUrl;
  });

  async function openSidePanelForActiveTab() {
    try {
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (tabs.length > 0) {
        await chrome.sidePanel.open({tabId: tabs[0].id});
      }
    } catch (err) {
      console.warn('Side panel open failed:', err);
    }
  }

  openSidepanelBtn.addEventListener('click', () => {
      openSidePanelForActiveTab()
    })

  getBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url && /^https?:\/\//i.test(tab.url)) {
      tabUrlInput.value = tab.url;
      chrome.storage.local.set({ tabUrl: tab.url });
    } else {
      alert('Érvénytelen URL, csak http(s) támogatott.');
    }
  });

  const setAlarm = (period) => {
    chrome.storage.local.set({ period, paused: false });
    chrome.runtime.sendMessage({ action: 'setAlarm', period });
  };

  set1.addEventListener('click', () => setAlarm(1));
  set10.addEventListener('click', () => setAlarm(10));
  setX.addEventListener('click', () => {
    const period = prompt('SET Alert frequency in minute:');
    const numPeriod = parseFloat(period);
    if (numPeriod > 0) setAlarm(numPeriod);
    else alert('Érvénytelen időtartam, pozitív szám szükséges.');
  });
});