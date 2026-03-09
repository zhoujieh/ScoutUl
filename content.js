// 内容脚本，注入到页面中实现核心功能

let isActive = false;
let currentElement = null;
let overlay = null;
let infoPanel = null;
let marginOverlay = null;
let paddingOverlay = null;
let dimensionLabels = [];
let marginLabels = [];
let paddingLabels = [];
let dimensionLines = [];

function init() {
  console.log('ScoutUI: 开始初始化...');
  try {
    createOverlay();
    console.log('ScoutUI: 覆盖层创建成功');
    createLayoutOverlays();
    console.log('ScoutUI: 布局覆盖层创建成功');
    createInfoPanel();
    console.log('ScoutUI: 信息面板创建成功');
    document.addEventListener('mousemove', throttle(handleMouseMove, 100));
    console.log('ScoutUI: 鼠标移动事件监听器已添加');
    chrome.runtime.onMessage.addListener(handleMessage);
    console.log('ScoutUI: 消息监听器已添加');
    document.addEventListener('keydown', handleKeyDown);
    console.log('ScoutUI: 键盘事件监听器已添加');
    chrome.storage.local.get('scoutUIActive', function(data) {
      try {
        isActive = data.scoutUIActive || false;
        console.log('ScoutUI: 初始状态:', isActive);
        updateOverlayVisibility();
        console.log('ScoutUI: 初始化完成');
      } catch (error) {
        console.error('ScoutUI: 初始化状态失败:', error);
      }
    });
  } catch (error) {
    console.error('ScoutUI: 初始化失败:', error);
  }
}

function createOverlay() {
  overlay = document.createElement('div');
  overlay.id = 'scoutui-overlay';
  document.body.appendChild(overlay);
}

function createLayoutOverlays() {
  marginOverlay = document.createElement('div');
  marginOverlay.className = 'scoutui-margin-overlay';
  document.body.appendChild(marginOverlay);
  
  paddingOverlay = document.createElement('div');
  paddingOverlay.className = 'scoutui-padding-overlay';
  document.body.appendChild(paddingOverlay);
  
  for (let i = 0; i < 2; i++) {
    const label = document.createElement('div');
    label.className = 'scoutui-dimension-label';
    document.body.appendChild(label);
    dimensionLabels.push(label);
  }
  
  for (let i = 0; i < 4; i++) {
    const label = document.createElement('div');
    label.className = 'scoutui-margin-label';
    document.body.appendChild(label);
    marginLabels.push(label);
  }
  
  for (let i = 0; i < 4; i++) {
    const label = document.createElement('div');
    label.className = 'scoutui-padding-label';
    document.body.appendChild(label);
    paddingLabels.push(label);
  }
  
  for (let i = 0; i < 8; i++) {
    const line = document.createElement('div');
    line.className = 'scoutui-dimension-line';
    document.body.appendChild(line);
    dimensionLines.push(line);
  }
}

function createInfoPanel() {
  infoPanel = document.createElement('div');
  infoPanel.id = 'scoutui-info-panel';
  document.body.appendChild(infoPanel);
}

const elementCache = new Map();

function handleMouseMove(e) {
  if (!isActive) return;
  
  try {
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element === currentElement || element === overlay || element === infoPanel || 
        element === marginOverlay || element === paddingOverlay) return;
    
    currentElement = element;
    updateOverlay(element);
    updateLayoutOverlays(element);
    updateInfoPanel(element, e.clientX, e.clientY);
  } catch (error) {
    console.error('ScoutUI: 处理鼠标移动事件失败:', error);
  }
}

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

function parseBoxValue(value) {
  const parts = value.split(' ').map(v => parseFloat(v) || 0);
  if (parts.length === 1) {
    return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  } else if (parts.length === 2) {
    return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  } else if (parts.length === 3) {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  } else {
    return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
  }
}

function updateLayoutOverlays(element) {
  try {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    const margin = parseBoxValue(style.margin);
    const padding = parseBoxValue(style.padding);
    
    const hasVisibleMargin = margin.top > 0 || margin.right > 0 || margin.bottom > 0 || margin.left > 0;
    const hasVisiblePadding = padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0;
    
    if (hasVisibleMargin) {
      marginOverlay.style.left = (rect.left - margin.left) + 'px';
      marginOverlay.style.top = (rect.top - margin.top) + 'px';
      marginOverlay.style.width = (rect.width + margin.left + margin.right) + 'px';
      marginOverlay.style.height = (rect.height + margin.top + margin.bottom) + 'px';
      marginOverlay.style.display = 'block';
    } else {
      marginOverlay.style.display = 'none';
    }
    
    if (hasVisiblePadding) {
      paddingOverlay.style.left = rect.left + 'px';
      paddingOverlay.style.top = rect.top + 'px';
      paddingOverlay.style.width = rect.width + 'px';
      paddingOverlay.style.height = rect.height + 'px';
      paddingOverlay.style.display = 'block';
    } else {
      paddingOverlay.style.display = 'none';
    }
    
    updateDimensionLabels(rect, dimensionLabels);
    updateMarginLabels(rect, margin, marginLabels, hasVisibleMargin);
    updatePaddingLabels(rect, padding, paddingLabels, hasVisiblePadding);
    
  } catch (error) {
    console.error('ScoutUI: 更新布局覆盖层失败:', error);
  }
}

function updateDimensionLabels(rect, labels) {
  const widthLabel = labels[0];
  const heightLabel = labels[1];
  
  widthLabel.textContent = `${Math.round(rect.width)}px`;
  widthLabel.style.left = (rect.left + rect.width / 2 - widthLabel.offsetWidth / 2) + 'px';
  widthLabel.style.top = (rect.top - 24) + 'px';
  widthLabel.style.display = rect.width > 20 ? 'block' : 'none';
  
  heightLabel.textContent = `${Math.round(rect.height)}px`;
  heightLabel.style.left = (rect.right + 8) + 'px';
  heightLabel.style.top = (rect.top + rect.height / 2 - 8) + 'px';
  heightLabel.style.display = rect.height > 20 ? 'block' : 'none';
}

function updateMarginLabels(rect, margin, labels, hasVisibleMargin) {
  const positions = [
    { value: margin.top, left: rect.left + rect.width / 2, top: rect.top - margin.top / 2, show: margin.top > 0 },
    { value: margin.right, left: rect.right + margin.right / 2, top: rect.top + rect.height / 2, show: margin.right > 0 },
    { value: margin.bottom, left: rect.left + rect.width / 2, top: rect.bottom + margin.bottom / 2, show: margin.bottom > 0 },
    { value: margin.left, left: rect.left - margin.left / 2, top: rect.top + rect.height / 2, show: margin.left > 0 }
  ];
  
  positions.forEach((pos, index) => {
    const label = labels[index];
    if (pos.show && hasVisibleMargin) {
      label.textContent = `${Math.round(pos.value)}px`;
      label.style.left = (pos.left - label.offsetWidth / 2) + 'px';
      label.style.top = (pos.top - 8) + 'px';
      label.style.display = 'block';
    } else {
      label.style.display = 'none';
    }
  });
}

function updatePaddingLabels(rect, padding, labels, hasVisiblePadding) {
  const positions = [
    { value: padding.top, left: rect.left + rect.width / 2, top: rect.top + padding.top / 2, show: padding.top > 0 },
    { value: padding.right, left: rect.right - padding.right / 2, top: rect.top + rect.height / 2, show: padding.right > 0 },
    { value: padding.bottom, left: rect.left + rect.width / 2, top: rect.bottom - padding.bottom / 2, show: padding.bottom > 0 },
    { value: padding.left, left: rect.left + padding.left / 2, top: rect.top + rect.height / 2, show: padding.left > 0 }
  ];
  
  positions.forEach((pos, index) => {
    const label = labels[index];
    if (pos.show && hasVisiblePadding) {
      label.textContent = `${Math.round(pos.value)}px`;
      label.style.left = (pos.left - label.offsetWidth / 2) + 'px';
      label.style.top = (pos.top - 8) + 'px';
      label.style.display = 'block';
    } else {
      label.style.display = 'none';
    }
  });
}

function updateInfoPanel(element, x, y) {
  try {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    
    const elementId = generateElementId(element, rect);
    
    let elementInfo = elementCache.get(elementId);
    
    if (!elementInfo) {
      const margin = parseBoxValue(style.margin);
      const padding = parseBoxValue(style.padding);
      
      elementInfo = {
        name: getElementName(element),
        size: { width: Math.round(rect.width), height: Math.round(rect.height) },
        layout: getLayoutType(style),
        position: style.position,
        margin: margin,
        padding: padding,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        color: style.color,
        backgroundColor: style.backgroundColor,
        border: style.border,
        borderRadius: style.borderRadius
      };
      
      if (elementCache.size > 100) {
        const firstKey = elementCache.keys().next().value;
        elementCache.delete(firstKey);
      }
      elementCache.set(elementId, elementInfo);
    }
    
    const info = generateInfoPanelHTML(elementInfo);
    
    infoPanel.innerHTML = info;
    
    let left = x + 10;
    let top = y + 10;
    
    if (left + infoPanel.offsetWidth > window.innerWidth) {
      left = x - infoPanel.offsetWidth - 10;
    }
    
    if (top + infoPanel.offsetHeight > window.innerHeight) {
      top = y - infoPanel.offsetHeight - 10;
    }
    
    left = Math.max(10, left);
    top = Math.max(10, top);
    
    infoPanel.style.left = left + 'px';
    infoPanel.style.top = top + 'px';
    infoPanel.style.display = 'block';
    
    addCopyButtonListeners();
  } catch (error) {
    console.error('ScoutUI: 更新信息面板失败:', error);
  }
}

function generateInfoPanelHTML(info) {
  const marginStr = `${info.margin.top}px ${info.margin.right}px ${info.margin.bottom}px ${info.margin.left}px`;
  const paddingStr = `${info.padding.top}px ${info.padding.right}px ${info.padding.bottom}px ${info.padding.left}px`;
  
  return `
    <div class="scoutui-panel-header">
      <h3>${info.name}</h3>
    </div>
    
    <div class="scoutui-section">
      <div class="scoutui-section-title">尺寸</div>
      <div class="scoutui-size-display">
        <div class="scoutui-size-item">
          <span class="scoutui-size-value">${info.size.width}</span>
          <span class="scoutui-size-unit">px</span>
        </div>
        <span class="scoutui-size-separator">×</span>
        <div class="scoutui-size-item">
          <span class="scoutui-size-value">${info.size.height}</span>
          <span class="scoutui-size-unit">px</span>
        </div>
      </div>
    </div>
    
    <div class="scoutui-section">
      <div class="scoutui-section-title">布局</div>
      <div class="scoutui-layout-info">
        <div class="scoutui-info-row">
          <span class="scoutui-info-label">Display</span>
          <span class="scoutui-info-value scoutui-copyable">${info.layout}</span>
          <button class="scoutui-copy-btn" data-text="${info.layout}">复制</button>
        </div>
        <div class="scoutui-info-row">
          <span class="scoutui-info-label">Position</span>
          <span class="scoutui-info-value scoutui-copyable">${info.position}</span>
          <button class="scoutui-copy-btn" data-text="${info.position}">复制</button>
        </div>
      </div>
    </div>
    
    <div class="scoutui-section">
      <div class="scoutui-section-title">
        <span class="scoutui-color-indicator" style="background: rgba(255, 158, 54, 0.3);"></span>
        Margin
      </div>
      <div class="scoutui-box-model">
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">上</span>
          <span class="scoutui-box-value">${info.margin.top}px</span>
        </div>
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">右</span>
          <span class="scoutui-box-value">${info.margin.right}px</span>
        </div>
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">下</span>
          <span class="scoutui-box-value">${info.margin.bottom}px</span>
        </div>
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">左</span>
          <span class="scoutui-box-value">${info.margin.left}px</span>
        </div>
      </div>
      <button class="scoutui-copy-btn scoutui-copy-all" data-text="${marginStr}">复制全部</button>
    </div>
    
    <div class="scoutui-section">
      <div class="scoutui-section-title">
        <span class="scoutui-color-indicator" style="background: rgba(76, 175, 80, 0.3);"></span>
        Padding
      </div>
      <div class="scoutui-box-model">
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">上</span>
          <span class="scoutui-box-value">${info.padding.top}px</span>
        </div>
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">右</span>
          <span class="scoutui-box-value">${info.padding.right}px</span>
        </div>
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">下</span>
          <span class="scoutui-box-value">${info.padding.bottom}px</span>
        </div>
        <div class="scoutui-box-row">
          <span class="scoutui-box-label">左</span>
          <span class="scoutui-box-value">${info.padding.left}px</span>
        </div>
      </div>
      <button class="scoutui-copy-btn scoutui-copy-all" data-text="${paddingStr}">复制全部</button>
    </div>
    
    <div class="scoutui-section">
      <div class="scoutui-section-title">字体</div>
      <div class="scoutui-info-row">
        <span class="scoutui-info-label">字体</span>
        <span class="scoutui-info-value scoutui-copyable scoutui-font-preview" style="font-family: ${info.fontFamily}">${info.fontFamily.split(',')[0]}</span>
        <button class="scoutui-copy-btn" data-text="${info.fontFamily}">复制</button>
      </div>
      <div class="scoutui-info-row">
        <span class="scoutui-info-label">字号</span>
        <span class="scoutui-info-value scoutui-copyable">${info.fontSize}</span>
        <button class="scoutui-copy-btn" data-text="${info.fontSize}">复制</button>
      </div>
      <div class="scoutui-info-row">
        <span class="scoutui-info-label">字重</span>
        <span class="scoutui-info-value scoutui-copyable">${info.fontWeight}</span>
        <button class="scoutui-copy-btn" data-text="${info.fontWeight}">复制</button>
      </div>
    </div>
    
    <div class="scoutui-section">
      <div class="scoutui-section-title">颜色</div>
      <div class="scoutui-info-row">
        <span class="scoutui-info-label">文字</span>
        <span class="scoutui-color-preview" style="background: ${info.color};"></span>
        <span class="scoutui-info-value scoutui-copyable">${info.color}</span>
        <button class="scoutui-copy-btn" data-text="${info.color}">复制</button>
      </div>
      <div class="scoutui-info-row">
        <span class="scoutui-info-label">背景</span>
        <span class="scoutui-color-preview" style="background: ${info.backgroundColor};"></span>
        <span class="scoutui-info-value scoutui-copyable">${info.backgroundColor}</span>
        <button class="scoutui-copy-btn" data-text="${info.backgroundColor}">复制</button>
      </div>
    </div>
  `;
}

function addCopyButtonListeners() {
  const copyButtons = infoPanel.querySelectorAll('.scoutui-copy-btn');
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      try {
        const text = this.getAttribute('data-text');
        copyToClipboard(text);
        const originalText = this.textContent;
        this.textContent = '已复制!';
        this.classList.add('scoutui-copied');
        setTimeout(() => {
          this.textContent = originalText;
          this.classList.remove('scoutui-copied');
        }, 1000);
      } catch (error) {
        console.error('ScoutUI: 复制操作失败:', error);
      }
    });
  });
}

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
  id += `_${Math.round(rect.left)}_${Math.round(rect.top)}_${Math.round(rect.width)}_${Math.round(rect.height)}`;
  return id;
}

function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text).catch(err => {
      console.error('ScoutUI: 复制失败:', err);
    });
  } catch (error) {
    console.error('ScoutUI: 复制操作失败:', error);
  }
}

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

function handleMessage(message) {
  try {
    if (message.action === 'toggle-scan') {
      isActive = message.active;
      updateOverlayVisibility();
      chrome.storage.local.set({ scoutUIActive: isActive });
      console.log('ScoutUI: 状态切换为', isActive);
    }
  } catch (error) {
    console.error('ScoutUI: 处理消息失败:', error);
  }
  return true;
}

function handleKeyDown(e) {
  try {
    if (e.altKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      isActive = !isActive;
      updateOverlayVisibility();
      chrome.storage.local.set({ scoutUIActive: isActive });
    }
  } catch (error) {
    console.error('ScoutUI: 处理键盘事件失败:', error);
  }
}

function updateOverlayVisibility() {
  try {
    if (isActive) {
      overlay.style.display = 'block';
      infoPanel.style.display = 'block';
    } else {
      overlay.style.display = 'none';
      infoPanel.style.display = 'none';
      marginOverlay.style.display = 'none';
      paddingOverlay.style.display = 'none';
      dimensionLabels.forEach(label => label.style.display = 'none');
      marginLabels.forEach(label => label.style.display = 'none');
      paddingLabels.forEach(label => label.style.display = 'none');
      dimensionLines.forEach(line => line.style.display = 'none');
      currentElement = null;
    }
  } catch (error) {
    console.error('ScoutUI: 更新覆盖层可见性失败:', error);
  }
}

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

init();
