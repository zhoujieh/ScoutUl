// 后台脚本，负责插件的生命周期管理

// 监听来自content script的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'save-state') {
    // 保存状态到本地存储
    chrome.storage.local.set({ scoutUIActive: message.active });
  }
});

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    // 页面加载完成后，恢复之前的状态
    chrome.storage.local.get('scoutUIActive', function(data) {
      if (data.scoutUIActive) {
        chrome.tabs.sendMessage(tabId, { action: 'toggle-scan', active: true });
      }
    });
  }
});