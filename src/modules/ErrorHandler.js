export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logLevel: 'error', // 'debug', 'info', 'warn', 'error'
      enableConsoleLog: true,
      enableUserNotification: true,
      maxLogEntries: 100,
      ...options
    };
    
    this.logs = [];
    this.errorTypes = {
      FILE_VALIDATION: 'file_validation',
      PDF_PARSING: 'pdf_parsing',
      PDF_PROCESSING: 'pdf_processing',
      MEMORY_ERROR: 'memory_error',
      NETWORK_ERROR: 'network_error',
      USER_INPUT: 'user_input',
      SYSTEM_ERROR: 'system_error'
    };
    
    this.init();
  }

  init() {
    // 全局错误捕获
    window.addEventListener('error', (event) => {
      this.handleError(event.error, this.errorTypes.SYSTEM_ERROR, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, this.errorTypes.SYSTEM_ERROR, {
        type: 'unhandled_promise_rejection'
      });
    });
  }

  handleError(error, type = this.errorTypes.SYSTEM_ERROR, context = {}) {
    const errorInfo = {
      id: this.generateId(),
      timestamp: new Date(),
      type,
      message: error.message || String(error),
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // 记录日志
    this.log('error', errorInfo);

    // 用户通知
    if (this.options.enableUserNotification) {
      this.showUserNotification(errorInfo);
    }

    // 返回错误信息供调用者使用
    return errorInfo;
  }

  log(level, data) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      data
    };

    // 添加到日志数组
    this.logs.push(logEntry);

    // 限制日志数量
    if (this.logs.length > this.options.maxLogEntries) {
      this.logs.shift();
    }

    // 控制台输出
    if (this.options.enableConsoleLog && this.shouldLog(level)) {
      const method = console[level] || console.log;
      method(`[${level.toUpperCase()}]`, data);
    }
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.options.logLevel);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= currentLevelIndex;
  }

  showUserNotification(errorInfo) {
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-icon">⚠️</div>
        <div class="error-message">
          <div class="error-title">操作失败</div>
          <div class="error-description">${userMessage}</div>
        </div>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // 添加到页面
    const container = document.getElementById('error-notifications') || document.body;
    container.appendChild(notification);

    // 自动移除
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  getUserFriendlyMessage(errorInfo) {
    const messageMap = {
      [this.errorTypes.FILE_VALIDATION]: '文件格式或大小不符合要求',
      [this.errorTypes.PDF_PARSING]: 'PDF文件解析失败，请检查文件是否损坏',
      [this.errorTypes.PDF_PROCESSING]: 'PDF处理过程中出现错误',
      [this.errorTypes.MEMORY_ERROR]: '内存不足，请尝试处理较小的文件',
      [this.errorTypes.NETWORK_ERROR]: '网络连接异常',
      [this.errorTypes.USER_INPUT]: '输入参数有误',
      [this.errorTypes.SYSTEM_ERROR]: '系统异常，请刷新页面重试'
    };

    return messageMap[errorInfo.type] || errorInfo.message;
  }

  // 特定错误处理方法
  handleFileValidationError(error, fileName) {
    return this.handleError(error, this.errorTypes.FILE_VALIDATION, {
      fileName,
      action: 'file_upload'
    });
  }

  handlePDFParsingError(error, fileName) {
    return this.handleError(error, this.errorTypes.PDF_PARSING, {
      fileName,
      action: 'pdf_parsing'
    });
  }

  handlePDFProcessingError(error, operation, params) {
    return this.handleError(error, this.errorTypes.PDF_PROCESSING, {
      operation,
      params,
      action: 'pdf_processing'
    });
  }

  handleMemoryError(error, operation) {
    return this.handleError(error, this.errorTypes.MEMORY_ERROR, {
      operation,
      memoryUsage: this.getMemoryUsage()
    });
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // 工具方法
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}