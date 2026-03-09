// 内容脚本，注入到页面中实现核心功能

let isActive = false;
let currentElement = null;
let overlay = null;
let infoPanel = null;

// 初始化
function init() {
  try {
    // 创建覆盖层
    createOverlay();
    // 创建信息面板
    createInfoPanel();
    // 监听鼠标移动事件
    document.addEventListener('mousemove', throttle(handleMouseMove, 100));
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener(handleMessage);
    // 监听键盘事件，添加快捷键支持
    document.addEventListener('keydown', handleKeyDown);
    // 检查初始状态
    chrome.storage.local.get('scoutUIActive', function(data) {
      try {
        isActive = data.scoutUIActive || false;
        updateOverlayVisibility();
      } catch (error) {
        console.error('ScoutUI: 初始化状态失败:', error);
      }
    });
  } catch (error) {
    console.error('ScoutUI: 初始化失败:', error);
  }
}

// 创建覆盖层
function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'scoutui-overlay';
  document.body.appendChild(overlay);
}

// 创建信息面板
function createInfoPanel() {
  infoPanel = document.createElement('div');
  infoPanel.id = 'scoutui-info-panel';
  document.body.appendChild(infoPanel);
}

// 元素信息缓存
const elementCache = new Map();

// 处理鼠标移动事件
function handleMouseMove(e) {
  if (!isActive) return;
  
  try {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element === currentElement || element === overlay || element === infoPanel) return;
    
    currentElement = element;
    updateOverlay(element);
    updateInfoPanel(element, e.clientX, e.clientY);
  } catch (error) {
    console.error('ScoutUI: 处理鼠标移动事件失败:', error);
  }
}

// 更新覆盖层
function updateOverlay(element) {
  try {
    const rect = element.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';
  } catch (error) {
    console.error('ScoutUI: 更新覆盖层失败:', error);
  }
}

// 更新信息面板
function updateInfoPanel(element, x, y) {
  try {
    const rect = element.getBoundingClientRect();
    
    // 生成元素唯一标识
    const elementId = generateElementId(element, rect);
    
    // 检查缓存
    let elementInfo = elementCache.get(elementId);
    
    if (!elementInfo) {
      // 解析元素样式
      const style = getComputedStyle(element);
      elementInfo = {
        name: getElementName(element),
        size: `${Math.round(rect.width)}px × ${Math.round(rect.height)}px`,
        layout: getLayoutType(style),
        position: style.position,
        margin: style.margin,
        padding: style.padding,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
        backgroundColor: style.backgroundColor
      };
      
      // 缓存元素信息（限制缓存大小）
      if (elementCache.size > 100) {
        const firstKey = elementCache.keys().next().value;
        elementCache.delete(firstKey);
      }
      elementCache.set(elementId, elementInfo);
    }
    
    const info = `
      <h3>${elementInfo.name}</h3>
      <div>
        <strong>尺寸:</strong> <span class="scoutui-copyable">${elementInfo.size}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.size}">复制</button>
      </div>
      <div>
        <strong>布局:</strong> <span class="scoutui-copyable">${elementInfo.layout}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.layout}">复制</button>
      </div>
      <div>
        <strong>定位:</strong> <span class="scoutui-copyable">${elementInfo.position}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.position}">复制</button>
      </div>
      <div>
        <strong>外边距:</strong> <span class="scoutui-copyable">${elementInfo.margin}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.margin}">复制</button>
      </div>
      <div>
        <strong>内边距:</strong> <span class="scoutui-copyable">${elementInfo.padding}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.padding}">复制</button>
      </div>
      <div>
        <strong>字体:</strong> <span class="scoutui-copyable">${elementInfo.fontFamily}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.fontFamily}">复制</button>
      </div>
      <div>
        <strong>字号:</strong> <span class="scoutui-copyable">${elementInfo.fontSize}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.fontSize}">复制</button>
      </div>
      <div>
        <strong>字重:</strong> <span class="scoutui-copyable">${elementInfo.fontWeight}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.fontWeight}">复制</button>
      </div>
      <div>
        <strong>颜色:</strong> <span class="scoutui-copyable">${elementInfo.color}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.color}">复制</button>
      </div>
      <div>
        <strong>背景:</strong> <span class="scoutui-copyable">${elementInfo.backgroundColor}</span>
        <button class="scoutui-copy-btn" data-text="${elementInfo.backgroundColor}">复制</button>
      </div>
    `;
    
    infoPanel.innerHTML = info;
    
    // 计算信息面板的位置，确保它不会超出视口范围
    let left = x + 10;
    let top = y + 10;
    
    // 检查是否超出右侧视口
    if (left + infoPanel.offsetWidth > window.innerWidth) {
      left = x - infoPanel.offsetWidth - 10;
    }
    
    // 检查是否超出底部视口
    if (top + infoPanel.offsetHeight > window.innerHeight) {
      top = y - infoPanel.offsetHeight - 10;
    }
    
    // 确保面板不会超出左侧和顶部视口
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    infoPanel.style.left = left + 'px';
    infoPanel.style.top = top + 'px';
    infoPanel.style.display = 'block';
    
    // 添加复制按钮事件监听
    const copyButtons = infoPanel.querySelectorAll('.scoutui-copy-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', function() {
        try {
          const text = this.getAttribute('data-text');
          copyToClipboard(text);
          this.textContent = '已复制!';
          setTimeout(() => {
            this.textContent = '复制';
          }, 1000);
        } catch (error) {
          console.error('ScoutUI: 复制操作失败:', error);
        }
      });
    });
  } catch (error) {
    console.error('ScoutUI: 更新信息面板失败:', error);
  }
}

// 生成元素唯一标识
function generateElementId(element, rect) {
  let id = element.tagName.toLowerCase();
  if (element.id) {
    id += `#${element.id}`;
  }
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c).join('.');
    if (classes) {
      id += `.${classes}`;
    }
  }
  // 添加位置和尺寸信息，确保同一元素在不同状态下的唯一性
  id += `_${Math.round(rect.left)}_${Math.round(rect.top)}_${Math.round(rect.width)}_${Math.round(rect.height)}`;
  return id;
}

// 复制到剪贴板
function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('ScoutUI: 复制失败:', err);
    });
  } catch (error) {
    console.error('ScoutUI: 复制操作失败:', error);
  }
}

// 获取元素名称
function getElementName(element) {
  try {
    let name = element.tagName.toLowerCase();
    if (element.id) {
      name += `#${element.id}`;
    }
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c).join('.');
      if (classes) {
        name += `.${classes}`;
      }
    }
    return name;
  } catch (error) {
    console.error('ScoutUI: 获取元素名称失败:', error);
    return 'unknown';
  }
}

// 获取布局类型
function getLayoutType(style) {
  try {
    const display = style.display;
    if (display === 'flex') return 'Flex';
    if (display === 'grid') return 'Grid';
    if (display === 'inline') return 'Inline';
    if (display === 'inline-block') return 'Inline-Block';
    if (display === 'table') return 'Table';
    if (display === 'inline-flex') return 'Inline-Flex';
    if (display === 'inline-grid') return 'Inline-Grid';
    return 'Block';
  } catch (error) {
    console.error('ScoutUI: 获取布局类型失败:', error);
    return 'Unknown';
  }
}

// 处理来自popup的消息
function handleMessage(message) {
  try {
    if (message.action === 'toggle-scan') {
      isActive = message.active;
      updateOverlayVisibility();
    }
  } catch (error) {
    console.error('ScoutUI: 处理消息失败:', error);
  }
}

// 处理键盘事件
function handleKeyDown(e) {
  try {
    // Alt+Shift+S 快捷键切换走查模式
    if (e.altKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      isActive = !isActive;
      updateOverlayVisibility();
      // 保存状态到本地存储
      chrome.storage.local.set({ scoutUIActive: isActive });
    }
  } catch (error) {
    console.error('ScoutUI: 处理键盘事件失败:', error);
  }
}

// 更新覆盖层可见性
function updateOverlayVisibility() {
  try {
    if (isActive) {
      overlay.style.display = 'block';
      infoPanel.style.display = 'block';
    } else {
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
      currentElement = null;
    }
  } catch (error) {
    console.error('ScoutUI: 更新覆盖层可见性失败:', error);
  }
}

// 节流函数
function throttle(func, delay) {
  try {
    let lastCall = 0;
    return function(...args) {
      try {
        const now = new Date().getTime();
        if (now - lastCall < delay) return;
        lastCall = now;
        return func(...args);
      } catch (error) {
        console.error('ScoutUI: 节流函数执行失败:', error);
      }
    };
  } catch (error) {
    console.error('ScoutUI: 创建节流函数失败:', error);
    return function(...args) {
      return func(...args);
    };
  }
}

// 初始化插件
init();