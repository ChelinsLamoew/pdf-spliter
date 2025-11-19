export class FileUploadComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      multiple: false,
      accept: '.pdf',
      maxSize: 50 * 1024 * 1024,
      onFileSelect: null,
      onError: null,
      ...options
    };
    
    this.dragCounter = 0;
    this.isDisabled = false;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    const disabledClass = this.isDisabled ? 'disabled' : '';
    const disabledText = this.isDisabled ? 
      '已有文件上传，请先移除文件后再重新上传' : 
      (this.options.multiple ? '点击选择或拖拽多个PDF文件到此处' : '点击选择或拖拽PDF文件到此处');
    
    this.container.innerHTML = `
      <div class="upload-area ${disabledClass}" id="upload-area">
        <div class="upload-icon">${this.isDisabled ? '🚫' : '📁'}</div>
        <div class="upload-text">
          ${disabledText}
        </div>
        <div class="upload-hint">
          ${this.isDisabled ? '请使用"移除文件"按钮清除当前文件' : 
            `支持PDF格式，${this.options.multiple ? '可选择多个文件，' : ''}最大${this.formatFileSize(this.options.maxSize)}`}
        </div>
        <input type="file" 
               id="file-input" 
               class="file-input" 
               accept="${this.options.accept}"
               ${this.options.multiple ? 'multiple' : ''}
               ${this.isDisabled ? 'disabled' : ''}>
      </div>
    `;
  }

  bindEvents() {
    const uploadArea = this.container.querySelector('#upload-area');
    const fileInput = this.container.querySelector('#file-input');

    // 点击上传
    uploadArea.addEventListener('click', () => {
      if (this.isDisabled) {
        this.showDisabledMessage();
        return;
      }
      fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
      if (this.isDisabled) {
        e.target.value = '';
        return;
      }
      this.handleFiles(Array.from(e.target.files));
    });

    // 拖拽事件
    uploadArea.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (this.isDisabled) {
        return;
      }
      this.dragCounter++;
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (this.isDisabled) {
        return;
      }
      this.dragCounter--;
      if (this.dragCounter === 0) {
        uploadArea.classList.remove('dragover');
      }
    });

    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dragCounter = 0;
      uploadArea.classList.remove('dragover');
      
      if (this.isDisabled) {
        this.showDisabledMessage();
        return;
      }
      
      const files = Array.from(e.dataTransfer.files);
      this.handleFiles(files);
    });
  }

  handleFiles(files) {
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
      }
    });

    if (validFiles.length > 0) {
      this.options.onFileSelect?.(this.options.multiple ? validFiles : validFiles[0]);
    }

    if (errors.length > 0) {
      this.options.onError?.(errors);
    }
  }

  validateFile(file) {
    const errors = [];
    
    if (file.type !== 'application/pdf') {
      errors.push('仅支持PDF格式');
    }
    
    if (file.size > this.options.maxSize) {
      errors.push(`文件大小超过${this.formatFileSize(this.options.maxSize)}`);
    }
    
    if (file.size === 0) {
      errors.push('文件为空');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  disable() {
    this.isDisabled = true;
    this.render();
    this.bindEvents();
  }

  enable() {
    this.isDisabled = false;
    this.render();
    this.bindEvents();
  }

  showDisabledMessage() {
    // 创建临时提示消息
    const message = document.createElement('div');
    message.className = 'upload-disabled-message';
    message.textContent = '请先移除当前文件后再上传新文件';
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ef4444;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;
      animation: fadeInOut 2s ease-in-out;
    `;

    // 添加CSS动画
    if (!document.querySelector('#upload-message-style')) {
      const style = document.createElement('style');
      style.id = 'upload-message-style';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }

    this.container.style.position = 'relative';
    this.container.appendChild(message);

    // 2秒后移除消息
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 2000);
  }

  reset() {
    const fileInput = this.container.querySelector('#file-input');
    if (fileInput) {
      fileInput.value = '';
    }
    this.dragCounter = 0;
    const uploadArea = this.container.querySelector('#upload-area');
    if (uploadArea) {
      uploadArea.classList.remove('dragover');
    }
    this.enable(); // 重置时启用上传功能
  }
}