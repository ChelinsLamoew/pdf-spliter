export class FileListComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      sortable: false,
      showThumbnails: false,
      onRemove: null,
      onReorder: null,
      onPreview: null,
      ...options
    };
    
    this.files = [];
    this.draggedIndex = null;
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    if (this.files.length === 0) {
      this.container.innerHTML = '<div class="file-list-empty">暂无文件</div>';
      return;
    }

    const sortableClass = this.options.sortable ? 'sortable' : '';
    const listHTML = `
      <div class="file-list ${sortableClass}">
        ${this.options.sortable ? '<h3 class="file-list-title">📑 文件列表 <span class="file-list-hint">(拖拽调整顺序)</span></h3>' : ''}
        <div class="file-list-container">
          ${this.files.map((file, index) => this.renderFileItem(file, index)).join('')}
        </div>
      </div>
    `;
    
    this.container.innerHTML = listHTML;
    this.bindEvents();
  }

  renderFileItem(file, index) {
    const dragHandle = this.options.sortable ? '<div class="drag-handle">⋮⋮</div>' : '';
    const thumbnail = this.options.showThumbnails && file.thumbnail ? 
      `<img src="${file.thumbnail}" class="file-thumbnail" alt="缩略图">` : '';
    
    return `
      <div class="file-item ${this.options.sortable ? 'draggable' : ''}" 
           data-index="${index}" 
           data-testid="file-item"
           ${this.options.sortable ? 'draggable="true"' : ''}>
        ${dragHandle}
        <div class="file-icon">
          ${thumbnail || 'PDF'}
        </div>
        <div class="file-info">
          <div class="file-name" title="${file.name}">${file.name}</div>
          <div class="file-details">
            ${this.formatFileSize(file.size)}
            ${file.pageCount ? ` • ${file.pageCount} 页` : ''}
            ${file.uploadTime ? ` • ${this.formatTime(file.uploadTime)}` : ''}
          </div>
          ${file.processingStatus ? `<div class="file-status ${file.processingStatus.type}">${file.processingStatus.message}</div>` : ''}
        </div>
        <div class="file-actions">
          ${this.options.onPreview ? `<button class="btn btn-secondary btn-sm" data-file-id="${file.id}" data-action="preview">预览</button>` : ''}
          <button class="btn btn-danger btn-sm" data-file-id="${file.id}" data-action="remove">移除</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 绑定文件操作事件
    this.container.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-action]');
      if (button) {
        const action = button.dataset.action;
        const fileId = button.dataset.fileId;
        
        if (action === 'remove') {
          this.handleRemove(fileId);
        } else if (action === 'preview') {
          this.handlePreview(fileId);
        }
      }
    });

    if (!this.options.sortable) return;

    const fileItems = this.container.querySelectorAll('.file-item.draggable');
    
    fileItems.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.draggedIndex = parseInt(e.target.dataset.index);
        e.target.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
        this.draggedIndex = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      item.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.target.classList.add('drag-over');
      });

      item.addEventListener('dragleave', (e) => {
        e.target.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        
        const dropIndex = parseInt(e.target.closest('.file-item').dataset.index);
        
        if (this.draggedIndex !== null && this.draggedIndex !== dropIndex) {
          this.reorderFiles(this.draggedIndex, dropIndex);
        }
      });
    });
  }

  addFile(file) {
    this.files.push({
      id: file.id || this.generateId(),
      name: file.name,
      size: file.size,
      pageCount: file.pageCount,
      uploadTime: file.uploadTime || new Date(),
      thumbnail: file.thumbnail,
      processingStatus: null,
      file: file.file || file
    });
    
    this.render();
  }

  addFiles(files) {
    files.forEach(file => this.addFile(file));
  }

  removeFile(fileId) {
    const index = this.files.findIndex(f => f.id === fileId);
    if (index !== -1) {
      this.files.splice(index, 1);
      this.render();
      this.options.onRemove?.(fileId);
    }
  }

  reorderFiles(fromIndex, toIndex) {
    const [movedFile] = this.files.splice(fromIndex, 1);
    this.files.splice(toIndex, 0, movedFile);
    this.render();
    this.options.onReorder?.(fromIndex, toIndex);
  }

  updateFileStatus(fileId, status) {
    const file = this.files.find(f => f.id === fileId);
    if (file) {
      file.processingStatus = status;
      this.render();
    }
  }

  handleRemove(fileId) {
    this.removeFile(fileId);
  }

  handlePreview(fileId) {
    const file = this.files.find(f => f.id === fileId);
    if (file) {
      this.options.onPreview?.(file);
    }
  }

  clear() {
    this.files = [];
    this.render();
  }

  getFiles() {
    return [...this.files];
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}