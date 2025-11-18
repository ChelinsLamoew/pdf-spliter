export class FileManager {
  constructor() {
    this.splitFile = null;
    this.mergeFiles = [];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.allowedTypes = ['application/pdf'];
  }

  // 文件验证
  validateFile(file) {
    const errors = [];
    
    if (!this.allowedTypes.includes(file.type)) {
      errors.push('仅支持PDF格式文件');
    }
    
    if (file.size > this.maxFileSize) {
      errors.push(`文件大小不能超过${this.formatFileSize(this.maxFileSize)}`);
    }
    
    if (file.size === 0) {
      errors.push('文件不能为空');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // 添加拆分文件
  setSplitFile(file) {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    this.splitFile = {
      id: this.generateId(),
      file: file,
      name: file.name,
      size: file.size,
      uploadTime: new Date(),
      pageCount: null // 将通过PDF解析获取
    };
    
    return this.splitFile;
  }

  // 添加合并文件
  addMergeFile(file) {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    const fileInfo = {
      id: this.generateId(),
      file: file,
      name: file.name,
      size: file.size,
      uploadTime: new Date(),
      pageCount: null,
      order: this.mergeFiles.length
    };
    
    this.mergeFiles.push(fileInfo);
    return fileInfo;
  }

  // 移除合并文件
  removeMergeFile(fileId) {
    const index = this.mergeFiles.findIndex(f => f.id === fileId);
    if (index !== -1) {
      this.mergeFiles.splice(index, 1);
      this.updateMergeOrder();
    }
  }

  // 更新合并文件顺序
  reorderMergeFiles(fromIndex, toIndex) {
    const [movedFile] = this.mergeFiles.splice(fromIndex, 1);
    this.mergeFiles.splice(toIndex, 0, movedFile);
    this.updateMergeOrder();
  }

  // 清空拆分文件
  clearSplitFile() {
    this.splitFile = null;
  }

  // 清空合并文件
  clearMergeFiles() {
    this.mergeFiles = [];
  }

  // 工具方法
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

  updateMergeOrder() {
    this.mergeFiles.forEach((file, index) => {
      file.order = index;
    });
  }
}