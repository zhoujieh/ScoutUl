document.addEventListener('DOMContentLoaded', function() {
  const toggleScan = document.getElementById('toggle-scan');

  // 初始化开关状态
  chrome.storage.local.get('scoutUIActive', function(data) {
    toggleScan.checked = data.scoutUIActive || false;
  });

  // 监听开关变化
  toggleScan.addEventListener('change', function() {
    const isActive = toggleScan.checked;
    
    // 保存状态到本地存储
    chrome.storage.local.set({ scoutUIActive: isActive });
    
    // 向当前活动标签页发送消息
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-scan', active: isActive });
      }
    });
  });
});