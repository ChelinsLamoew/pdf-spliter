export class PDFPreviewComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      showThumbnails: true,
      maxPreviewPages: 5,
      thumbnailSize: { width: 150, height: 200 },
      ...options
    };
    
    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.scale = 1.2;
    this.canvases = [];
    this.currentRenderTask = null;
    this.renderDebounceTimer = null;
    
    // 检查容器是否存在
    if (!this.container) {
      console.error('PDFPreviewComponent: 容器元素不存在');
      return;
    }
    
    this.init();
  }

  init() {
    this.createPreviewStructure();
    this.bindEvents();
  }

  createPreviewStructure() {
    this.container.innerHTML = `
      <div class="pdf-preview-container">
        <!-- 预览头部 -->
        <div class="preview-header">
          <div class="preview-info">
            <span class="page-info">第 <span class="current-page">1</span> 页，共 <span class="total-pages">0</span> 页</span>
          </div>
          <div class="preview-controls">
            <button class="btn btn-small" id="prev-page" disabled>
              ← 上一页
            </button>
            <button class="btn btn-small" id="next-page" disabled>
              下一页 →
            </button>
            <button class="btn btn-small" id="zoom-out">
              🔍-
            </button>
            <button class="btn btn-small" id="zoom-in">
              🔍+
            </button>
          </div>
        </div>

        <!-- 主预览区域 -->
        <div class="main-preview">
          <div class="pdf-viewer">
            <canvas id="pdf-canvas" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></canvas>
          </div>
        </div>

        <!-- 缩略图区域 -->
        <div class="thumbnails-container" style="display: ${this.options.showThumbnails ? 'block' : 'none'};">
          <div class="thumbnails-header">
            <h4>页面缩略图</h4>
          </div>
          <div class="thumbnails-grid" id="thumbnails-grid">
            <!-- 缩略图将动态生成 -->
          </div>
        </div>

        <!-- 加载状态 -->
        <div class="loading-overlay" id="preview-loading">
          <div class="loading-spinner"></div>
          <div class="loading-text">正在生成预览...</div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 页面导航
    this.container.querySelector('#prev-page').addEventListener('click', () => {
      this.previousPage();
    });

    this.container.querySelector('#next-page').addEventListener('click', () => {
      this.nextPage();
    });

    // 缩放控制
    this.container.querySelector('#zoom-in').addEventListener('click', () => {
      this.zoomIn();
    });

    this.container.querySelector('#zoom-out').addEventListener('click', () => {
      this.zoomOut();
    });

    // 缩略图点击事件将后续绑定
  }

  async loadPDF(pdfData) {
    // 检查容器是否存在
    if (!this.container) {
      console.error('容器不存在，无法加载PDF预览');
      return;
    }
    
    // 检查DOM结构是否存在，如果不存在则重新创建
    if (!this.container.querySelector('.pdf-preview-container')) {
      console.log('DOM结构不存在，重新创建预览结构');
      this.createPreviewStructure();
      this.bindEvents();
    }
    
    this.showLoading();
    
    try {
      // 动态加载PDF.js
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      // 确保pdfData是正确的格式
      let data = pdfData;
      if (pdfData instanceof Uint8Array) {
        data = pdfData.buffer.slice(pdfData.byteOffset, pdfData.byteOffset + pdfData.byteLength);
      }
      
      console.log(`加载PDF预览: 数据大小 ${data.byteLength || data.length} bytes`);

      // 加载PDF文档
      this.pdfDoc = await pdfjs.getDocument({ data: data }).promise;
      this.totalPages = this.pdfDoc.numPages;
      
      // 更新UI
      this.updatePageInfo();
      this.updateNavigationButtons();
      
      // 渲染第一页
      await this.renderPage(1);
      
      // 等待主页面渲染完成后再生成缩略图
      if (this.options.showThumbnails) {
        // 添加小延迟确保主页面渲染完成
        setTimeout(async () => {
          await this.generateThumbnails();
        }, 200);
      }
      
    } catch (error) {
      console.error('PDF预览加载失败:', error);
      this.showError('PDF预览加载失败: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }

  async renderPage(pageNum) {
    if (!this.pdfDoc || pageNum < 1 || pageNum > this.totalPages) return;
    
    try {
      // 取消之前的渲染任务
      if (this.currentRenderTask) {
        this.currentRenderTask.cancel();
        this.currentRenderTask = null;
      }
      
      const page = await this.pdfDoc.getPage(pageNum);
      const canvas = this.container.querySelector('#pdf-canvas');
      
      if (!canvas) {
        console.error('Canvas元素未找到');
        return;
      }
      
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('无法获取Canvas上下文');
        return;
      }
      
      // 计算视口
      const viewport = page.getViewport({ scale: this.scale });
      
      // 设置画布尺寸
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // 渲染页面
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      // 开始新的渲染任务
      this.currentRenderTask = page.render(renderContext);
      await this.currentRenderTask.promise;
      
      this.currentPage = pageNum;
      this.updatePageInfo();
      this.updateNavigationButtons();
      this.currentRenderTask = null;
      
    } catch (error) {
      if (error.name === 'RenderingCancelledException') {
        console.log('页面渲染被取消');
        return;
      }
      console.error('页面渲染失败:', error);
      this.showError('页面渲染失败');
    }
  }

  async generateThumbnails() {
    if (!this.pdfDoc) return;
    
    const thumbnailsGrid = this.container.querySelector('#thumbnails-grid');
    if (!thumbnailsGrid) {
      console.warn('缩略图容器未找到，跳过缩略图生成');
      return;
    }
    
    thumbnailsGrid.innerHTML = '';
    
    // 限制缩略图数量以提升性能
    const maxThumbnails = Math.min(this.totalPages, this.options.maxPreviewPages);
    
    // 使用队列方式逐个生成缩略图，避免并发渲染
    for (let i = 1; i <= maxThumbnails; i++) {
      try {
        await this.generateSingleThumbnail(i, thumbnailsGrid);
      } catch (error) {
        console.error(`缩略图 ${i} 生成失败:`, error);
      }
    }
    
    // 如果页数超过预览限制，显示提示
    if (this.totalPages > maxThumbnails) {
      const moreInfo = document.createElement('div');
      moreInfo.className = 'thumbnail-more-info';
      moreInfo.innerHTML = `<div class="more-pages">还有 ${this.totalPages - maxThumbnails} 页...</div>`;
      thumbnailsGrid.appendChild(moreInfo);
    }
  }

  async generateSingleThumbnail(pageNum, container) {
    const page = await this.pdfDoc.getPage(pageNum);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // 计算缩略图尺寸
    const viewport = page.getViewport({ scale: 0.3 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // 渲染缩略图 - 使用独立的canvas，不会与主预览冲突
    const renderTask = page.render({
      canvasContext: context,
      viewport: viewport
    });
    
    await renderTask.promise;
    
    // 创建缩略图容器
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = `thumbnail-item ${pageNum === this.currentPage ? 'active' : ''}`;
    thumbnailItem.innerHTML = `
      <div class="thumbnail-canvas-container">
        ${canvas.outerHTML}
      </div>
      <div class="thumbnail-label">第 ${pageNum} 页</div>
    `;
    
    // 绑定点击事件
    thumbnailItem.addEventListener('click', () => {
      this.debouncedRenderPage(pageNum);
    });
    
    container.appendChild(thumbnailItem);
  }

  updateThumbnailSelection(pageNum) {
    this.container.querySelectorAll('.thumbnail-item').forEach((item, index) => {
      if (index + 1 === pageNum) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.debouncedRenderPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.debouncedRenderPage(this.currentPage + 1);
    }
  }

  zoomIn() {
    this.scale = Math.min(this.scale * 1.2, 3.0);
    this.debouncedRenderPage(this.currentPage);
  }

  zoomOut() {
    this.scale = Math.max(this.scale / 1.2, 0.5);
    this.debouncedRenderPage(this.currentPage);
  }

  debouncedRenderPage(pageNum) {
    // 清除之前的防抖定时器
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
    }
    
    // 设置新的防抖定时器
    this.renderDebounceTimer = setTimeout(() => {
      this.renderPage(pageNum);
      this.updateThumbnailSelection(pageNum);
    }, 100); // 100ms防抖
  }

  updatePageInfo() {
    const currentPageEl = this.container.querySelector('.current-page');
    const totalPagesEl = this.container.querySelector('.total-pages');
    
    if (currentPageEl) currentPageEl.textContent = this.currentPage;
    if (totalPagesEl) totalPagesEl.textContent = this.totalPages;
  }

  updateNavigationButtons() {
    const prevBtn = this.container.querySelector('#prev-page');
    const nextBtn = this.container.querySelector('#next-page');
    
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= this.totalPages;
    }
  }

  showLoading() {
    const loading = this.container.querySelector('#preview-loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  hideLoading() {
    const loading = this.container.querySelector('#preview-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  showError(message) {
    const errorHtml = `
      <div class="preview-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
        <button class="btn btn-secondary" onclick="this.parentElement.remove()">关闭</button>
      </div>
    `;
    
    const previewContainer = this.container.querySelector('.pdf-preview-container');
    if (previewContainer) {
      previewContainer.innerHTML = errorHtml;
    } else {
      // 如果预览容器不存在，直接替换整个容器内容
      this.container.innerHTML = errorHtml;
    }
  }

  clear() {
    // 取消当前的渲染任务
    if (this.currentRenderTask) {
      this.currentRenderTask.cancel();
      this.currentRenderTask = null;
    }
    
    // 清除防抖定时器
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
      this.renderDebounceTimer = null;
    }
    
    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.canvases = [];
    
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  clearPDFData() {
    // 取消当前的渲染任务
    if (this.currentRenderTask) {
      this.currentRenderTask.cancel();
      this.currentRenderTask = null;
    }
    
    // 清除防抖定时器
    if (this.renderDebounceTimer) {
      clearTimeout(this.renderDebounceTimer);
      this.renderDebounceTimer = null;
    }
    
    // 清除PDF数据但保留DOM结构
    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this.canvases = [];
    
    // 清除canvas内容
    const canvas = this.container.querySelector('#pdf-canvas');
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    // 清除缩略图内容
    const thumbnailsGrid = this.container.querySelector('#thumbnails-grid');
    if (thumbnailsGrid) {
      thumbnailsGrid.innerHTML = '';
    }
    
    // 重置页面信息显示
    this.updatePageInfo();
    this.updateNavigationButtons();
  }

  // 获取当前预览的PDF数据（用于调试）
  getCurrentPDFInfo() {
    return {
      totalPages: this.totalPages,
      currentPage: this.currentPage,
      scale: this.scale,
      hasDocument: !!this.pdfDoc
    };
  }
}