import './styles/main.css';
import { FileManager } from './modules/FileManager.js';
import { PDFParser, PDFSplitter, PDFMerger } from './modules/PDFProcessor.js';
import { ErrorHandler } from './modules/ErrorHandler.js';
import { FileUploadComponent } from './components/FileUploadComponent.js';
import { PageRangeSelector } from './components/PageRangeSelector.js';
import { FileListComponent } from './components/FileListComponent.js';
import { PDFPreviewComponent } from './components/PDFPreviewComponent.js';
import { downloadFile } from './utils/downloadUtils.js';

class PDFToolbox {
  constructor() {
    this.fileManager = new FileManager();
    this.pdfParser = new PDFParser();
    this.pdfSplitter = new PDFSplitter();
    this.pdfMerger = new PDFMerger();
    this.errorHandler = new ErrorHandler();
    
    this.splitUploadComponent = null;
    this.mergeUploadComponent = null;
    this.pageRangeSelector = null;
    this.mergeFileList = null;
    this.splitPreviewComponent = null;
    this.mergePreviewComponent = null;
    
    this.splitResult = null;
    this.mergeResult = null;
    
    this.init();
  }

  init() {
    this.initializeComponents();
    this.bindEvents();
    
    // 设置移动端检测
    this.setupResponsiveDesign();
  }

  initializeComponents() {
    // 初始化拆分上传组件
    const splitUploadContainer = document.getElementById('split-upload-container');
    this.splitUploadComponent = new FileUploadComponent(splitUploadContainer, {
      multiple: false,
      onFileSelect: (file) => this.handleSplitFileSelect(file),
      onError: (errors) => this.showErrors(errors)
    });

    // 初始化合并上传组件
    const mergeUploadContainer = document.getElementById('merge-upload-container');
    this.mergeUploadComponent = new FileUploadComponent(mergeUploadContainer, {
      multiple: true,
      onFileSelect: (files) => this.handleMergeFileSelect(files),
      onError: (errors) => this.showErrors(errors)
    });

    // 初始化页码选择器
    const pageRangeContainer = document.getElementById('page-range-container');
    this.pageRangeSelector = new PageRangeSelector(pageRangeContainer, {
      onChange: (range) => this.onPageRangeChange(range)
    });

    // 初始化合并文件列表
    const mergeFilesContainer = document.getElementById('merge-files-container');
    this.mergeFileList = new FileListComponent(mergeFilesContainer, {
      sortable: true,
      onRemove: (fileId) => this.handleMergeFileRemove(fileId),
      onReorder: (fromIndex, toIndex) => this.handleMergeFileReorder(fromIndex, toIndex)
    });

    // 初始化PDF预览组件
    const splitPreviewContainer = document.getElementById('split-pdf-preview-container');
    this.splitPreviewComponent = new PDFPreviewComponent(splitPreviewContainer, {
      showThumbnails: true,
      maxPreviewPages: 5
    });

    const mergePreviewContainer = document.getElementById('merge-pdf-preview-container');
    this.mergePreviewComponent = new PDFPreviewComponent(mergePreviewContainer, {
      showThumbnails: true,
      maxPreviewPages: 8
    });
  }

  bindEvents() {
    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // 拆分相关事件
    document.getElementById('clear-split-file').addEventListener('click', () => {
      this.clearSplitFile();
    });

    document.getElementById('split-btn').addEventListener('click', () => {
      this.splitPdf();
    });

    document.getElementById('reset-split').addEventListener('click', () => {
      this.resetSplit();
    });

    document.getElementById('download-split-result').addEventListener('click', () => {
      this.downloadSplitResult();
    });

    // 合并相关事件
    document.getElementById('clear-merge-files').addEventListener('click', () => {
      this.clearMergeFiles();
    });

    document.getElementById('merge-btn').addEventListener('click', () => {
      this.mergePdf();
    });

    document.getElementById('reset-merge').addEventListener('click', () => {
      this.resetMerge();
    });

    document.getElementById('download-merge-result').addEventListener('click', () => {
      this.downloadMergeResult();
    });
  }

  setupResponsiveDesign() {
    const checkMobile = () => {
      const tabNav = document.querySelector('.tab-nav');
      if (window.innerWidth <= 768) {
        tabNav.classList.add('mobile');
      } else {
        tabNav.classList.remove('mobile');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
  }

  switchTab(tabName) {
    // 更新标签按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 更新标签内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  async handleSplitFileSelect(file) {
    try {
      // 设置文件到文件管理器
      const fileInfo = this.fileManager.setSplitFile(file);
      
      // 禁用上传组件
      this.splitUploadComponent.disable();
      
      // 显示文件信息
      this.showSplitFileInfo(fileInfo);
      
      // 解析PDF获取页数
      const parseResult = await this.pdfParser.parseFile(file);
      fileInfo.pageCount = parseResult.info.pageCount;
      
      // 更新页数显示
      document.getElementById('total-pages').textContent = parseResult.info.pageCount;
      document.getElementById('split-filesize').innerHTML = 
        `${this.fileManager.formatFileSize(file.size)} • 共 <span id="total-pages">${parseResult.info.pageCount}</span> 页`;
      
      // 更新页码选择器
      this.pageRangeSelector.updateTotalPages(parseResult.info.pageCount);
      
    } catch (error) {
      this.errorHandler.handleFileValidationError(error, file.name);
      // 如果文件处理失败，重新启用上传组件
      this.splitUploadComponent.enable();
    }
  }

  showSplitFileInfo(fileInfo) {
    document.getElementById('split-filename').textContent = fileInfo.name;
    document.getElementById('split-filesize').innerHTML = 
      `${this.fileManager.formatFileSize(fileInfo.size)} • 共 <span id="total-pages">解析中...</span> 页`;
    document.getElementById('split-file-info').classList.remove('hidden');
  }

  clearSplitFile() {
    this.fileManager.clearSplitFile();
    document.getElementById('split-file-info').classList.add('hidden');
    document.getElementById('split-preview').classList.add('hidden');
    this.splitUploadComponent.reset(); // reset()方法内部会调用enable()
    this.splitPreviewComponent.clear();
    this.splitResult = null;
  }

  async splitPdf() {
    if (!this.fileManager.splitFile) return;
    
    const range = this.pageRangeSelector.getRange();
    const btn = document.getElementById('split-btn');
    const originalText = btn.innerHTML;
    
    try {
      // 显示加载状态
      btn.innerHTML = '<span class="loading"></span> 正在拆分...';
      btn.disabled = true;
      
      // 执行拆分
      const result = await this.pdfSplitter.split(
        this.fileManager.splitFile.file,
        range.startPage,
        range.endPage,
        (progress, message) => {
          console.log(`拆分进度: ${progress}% - ${message}`);
        }
      );
      
      this.splitResult = result;
      
      // 显示结果
      document.getElementById('split-result-info').textContent = 
        `已成功提取第${range.startPage}-${range.endPage}页，共${range.pageCount}页内容`;
      document.getElementById('split-preview').classList.remove('hidden');
      
      // 加载PDF预览
      try {
        await this.splitPreviewComponent.loadPDF(result.data);
        this.showMessage('PDF拆分成功！预览已生成', 'success');
      } catch (previewError) {
        console.warn('预览生成失败:', previewError);
        this.showMessage('PDF拆分成功！（预览生成失败，但不影响下载）', 'success');
      }
      
    } catch (error) {
      this.errorHandler.handlePDFProcessingError(error, 'split', range);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  downloadSplitResult() {
    if (!this.splitResult) return;
    
    const success = downloadFile(this.splitResult.data, this.splitResult.fileName);
    if (success) {
      this.showMessage('文件下载成功！', 'success');
    } else {
      this.showMessage('文件下载失败，请重试', 'error');
    }
  }

  resetSplit() {
    document.getElementById('split-preview').classList.add('hidden');
    this.splitPreviewComponent.clear();
    this.splitResult = null;
  }

  async handleMergeFileSelect(files) {
    try {
      for (const file of files) {
        const fileInfo = this.fileManager.addMergeFile(file);
        
        // 解析PDF获取页数
        try {
          const parseResult = await this.pdfParser.parseFile(file);
          fileInfo.pageCount = parseResult.info.pageCount;
        } catch (error) {
          console.warn(`解析文件 ${file.name} 失败:`, error);
          fileInfo.pageCount = 0;
        }
        
        // 添加到文件列表显示
        this.mergeFileList.addFile(fileInfo);
      }
      
      // 显示文件列表
      document.getElementById('merge-file-list').classList.remove('hidden');
      
    } catch (error) {
      this.errorHandler.handleFileValidationError(error, 'multiple files');
    }
  }

  handleMergeFileRemove(fileId) {
    this.fileManager.removeMergeFile(fileId);
    
    if (this.fileManager.mergeFiles.length === 0) {
      document.getElementById('merge-file-list').classList.add('hidden');
    }
  }

  handleMergeFileReorder(fromIndex, toIndex) {
    this.fileManager.reorderMergeFiles(fromIndex, toIndex);
  }

  clearMergeFiles() {
    this.fileManager.clearMergeFiles();
    this.mergeFileList.clear();
    document.getElementById('merge-file-list').classList.add('hidden');
    document.getElementById('merge-preview').classList.add('hidden');
    this.mergeUploadComponent.reset();
    this.mergePreviewComponent.clear();
    this.mergeResult = null;
  }

  async mergePdf() {
    if (this.fileManager.mergeFiles.length < 2) {
      this.showMessage('至少需要2个PDF文件才能合并', 'error');
      return;
    }
    
    const btn = document.getElementById('merge-btn');
    const originalText = btn.innerHTML;
    
    try {
      // 显示加载状态
      btn.innerHTML = '<span class="loading"></span> 正在合并...';
      btn.disabled = true;
      
      // 执行合并
      const result = await this.pdfMerger.merge(
        this.fileManager.mergeFiles,
        (progress, message) => {
          console.log(`合并进度: ${progress}% - ${message}`);
        }
      );
      
      this.mergeResult = result;
      
      // 显示结果
      document.getElementById('merge-result-info').textContent = 
        `已成功合并${result.fileCount}个文件，共${result.pageCount}页内容`;
      document.getElementById('merge-preview').classList.remove('hidden');
      
      // 加载PDF预览
      try {
        await this.mergePreviewComponent.loadPDF(result.data);
        this.showMessage('PDF合并成功！预览已生成', 'success');
      } catch (previewError) {
        console.warn('预览生成失败:', previewError);
        this.showMessage('PDF合并成功！（预览生成失败，但不影响下载）', 'success');
      }
      
    } catch (error) {
      this.errorHandler.handlePDFProcessingError(error, 'merge', {
        fileCount: this.fileManager.mergeFiles.length
      });
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  downloadMergeResult() {
    if (!this.mergeResult) return;
    
    const success = downloadFile(this.mergeResult.data, this.mergeResult.fileName);
    if (success) {
      this.showMessage('文件下载成功！', 'success');
    } else {
      this.showMessage('文件下载失败，请重试', 'error');
    }
  }

  resetMerge() {
    document.getElementById('merge-preview').classList.add('hidden');
    this.mergePreviewComponent.clear();
    this.mergeResult = null;
  }

  onPageRangeChange(range) {
    // 页码范围变化时的处理，可以在这里添加预览等功能
    console.log('页码范围变化:', range);
  }

  showMessage(message, type) {
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `status-message status-${type}`;
    messageEl.textContent = message;
    
    // 插入到主内容顶部
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageEl, mainContent.firstChild);
    
    // 自动移除
    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  showErrors(errors) {
    errors.forEach(error => {
      this.showMessage(error, 'error');
    });
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.pdfToolbox = new PDFToolbox();
});