export class PageRangeSelector {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      totalPages: 1,
      defaultStart: 1,
      defaultEnd: 1,
      onChange: null,
      ...options
    };
    
    this.currentStart = this.options.defaultStart;
    this.currentEnd = this.options.defaultEnd;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="page-range">
        <label class="page-range-label">选择页码范围：</label>
        <div class="page-range-inputs">
          <span>从第</span>
          <input type="number" 
                 id="start-page" 
                 class="page-input" 
                 min="1" 
                 max="${this.options.totalPages}"
                 value="${this.currentStart}"
                 data-testid="start-page">
          <span>页到第</span>
          <input type="number" 
                 id="end-page" 
                 class="page-input" 
                 min="1" 
                 max="${this.options.totalPages}"
                 value="${this.currentEnd}"
                 data-testid="end-page">
          <span>页</span>
        </div>
        <div class="page-range-info">
          将提取 <span id="page-count" data-testid="page-count">${this.currentEnd - this.currentStart + 1}</span> 页内容
        </div>
      </div>
    `;
  }

  bindEvents() {
    const startInput = this.container.querySelector('#start-page');
    const endInput = this.container.querySelector('#end-page');

    startInput.addEventListener('input', () => {
      this.validateAndUpdate();
    });

    endInput.addEventListener('input', () => {
      this.validateAndUpdate();
    });

    startInput.addEventListener('blur', () => {
      this.validateAndUpdate();
    });

    endInput.addEventListener('blur', () => {
      this.validateAndUpdate();
    });
  }

  validateAndUpdate() {
    const startInput = this.container.querySelector('#start-page');
    const endInput = this.container.querySelector('#end-page');
    const pageCountSpan = this.container.querySelector('#page-count');

    let startPage = parseInt(startInput.value) || 1;
    let endPage = parseInt(endInput.value) || 1;

    // 验证和修正范围
    startPage = Math.max(1, Math.min(startPage, this.options.totalPages));
    endPage = Math.max(startPage, Math.min(endPage, this.options.totalPages));

    // 更新输入框
    startInput.value = startPage;
    endInput.value = endPage;

    // 更新页数显示
    const pageCount = endPage - startPage + 1;
    pageCountSpan.textContent = pageCount;

    // 更新内部状态
    this.currentStart = startPage;
    this.currentEnd = endPage;

    // 触发回调
    this.options.onChange?.({
      startPage,
      endPage,
      pageCount
    });
  }

  updateTotalPages(totalPages) {
    this.options.totalPages = totalPages;
    
    const startInput = this.container.querySelector('#start-page');
    const endInput = this.container.querySelector('#end-page');
    
    startInput.max = totalPages;
    endInput.max = totalPages;
    endInput.value = totalPages;
    
    this.validateAndUpdate();
  }

  getRange() {
    return {
      startPage: this.currentStart,
      endPage: this.currentEnd,
      pageCount: this.currentEnd - this.currentStart + 1
    };
  }

  reset() {
    this.currentStart = this.options.defaultStart;
    this.currentEnd = this.options.defaultEnd;
    this.render();
    this.bindEvents();
  }
}