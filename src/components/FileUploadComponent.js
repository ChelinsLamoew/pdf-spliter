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
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="upload-area" id="upload-area">
        <div class="upload-icon">📁</div>
        <div class="upload-text">
          ${this.options.multiple ? '点击选择或拖拽多个PDF文件到此处' : '点击选择或拖拽PDF文件到此处'}
        </div>
        <div class="upload-hint">
          支持PDF格式，${this.options.multiple ? '可选择多个文件，' : ''}最大${this.formatFileSize(this.options.maxSize)}
        </div>
        <input type="file" 
               id="file-input" 
               class="file-input" 
               accept="${this.options.accept}"
               ${this.options.multiple ? 'multiple' : ''}>
      </div>
    `;
  }

  bindEvents() {
    const uploadArea = this.container.querySelector('#upload-area');
    const fileInput = this.container.querySelector('#file-input');

    // 点击上传
    uploadArea.addEventListener('click', () => {
      fileInput.click();
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(Array.from(e.target.files));
    });

    // 拖拽事件
    uploadArea.addEventListener('dragenter', (e) => {
      e.preventDefault();
      this.dragCounter++;
      uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
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

  reset() {
    this.container.querySelector('#file-input').value = '';
    this.dragCounter = 0;
    this.container.querySelector('#upload-area').classList.remove('dragover');
  }
}