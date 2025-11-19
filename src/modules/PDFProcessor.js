export class PDFParser {
  constructor() {
    this.pdfjsLib = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // 动态加载PDF.js
      const pdfjs = await import('pdfjs-dist');
      this.pdfjsLib = pdfjs;
      
      // 设置worker路径
      this.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      this.initialized = true;
    } catch (error) {
      throw new Error(`PDF.js初始化失败: ${error.message}`);
    }
  }

  async parseFile(file) {
    await this.initialize();
    
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const pdf = await this.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          const info = {
            pageCount: pdf.numPages,
            title: await this.getMetadata(pdf, 'Title'),
            author: await this.getMetadata(pdf, 'Author'),
            creator: await this.getMetadata(pdf, 'Creator'),
            producer: await this.getMetadata(pdf, 'Producer'),
            creationDate: await this.getMetadata(pdf, 'CreationDate'),
            modificationDate: await this.getMetadata(pdf, 'ModDate')
          };
          
          resolve({ pdf, info });
        } catch (error) {
          reject(new Error(`PDF解析失败: ${error.message}`));
        }
      };
      
      fileReader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      fileReader.readAsArrayBuffer(file);
    });
  }

  async getMetadata(pdf, key) {
    try {
      const metadata = await pdf.getMetadata();
      return metadata.info[key] || null;
    } catch {
      return null;
    }
  }
}

export class PDFSplitter {
  constructor() {
    this.pdfLib = null;
  }

  async initialize() {
    if (!this.pdfLib) {
      try {
        this.pdfLib = await import('pdf-lib');
      } catch (error) {
        throw new Error(`PDF-lib初始化失败: ${error.message}`);
      }
    }
  }

  async split(file, startPage, endPage, onProgress) {
    await this.initialize();
    
    try {
      onProgress?.(10, '读取PDF文件...');
      
      // 读取源文件
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      const sourcePdf = await this.pdfLib.PDFDocument.load(arrayBuffer);
      
      onProgress?.(30, '创建新文档...');
      
      // 创建新文档
      const newPdf = await this.pdfLib.PDFDocument.create();
      
      // 验证页码范围
      const totalPages = sourcePdf.getPageCount();
      if (startPage < 1 || endPage > totalPages || startPage > endPage) {
        throw new Error(`无效的页码范围: ${startPage}-${endPage} (总页数: ${totalPages})`);
      }
      
      onProgress?.(50, '复制指定页面...');
      
      // 复制指定页面
      const pageIndices = [];
      for (let i = startPage - 1; i < endPage; i++) {
        pageIndices.push(i);
      }
      
      const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
      
      onProgress?.(80, '生成新文档...');
      
      // 添加页面到新文档
      copiedPages.forEach(page => {
        newPdf.addPage(page);
      });
      
      // 设置文档元数据
      newPdf.setTitle(`${file.name.replace('.pdf', '')}_第${startPage}-${endPage}页`);
      newPdf.setCreator('PDF工具箱');
      newPdf.setCreationDate(new Date());
      
      onProgress?.(95, '保存文档...');
      
      // 生成PDF字节数组
      const pdfBytes = await newPdf.save();
      
      onProgress?.(100, '完成!');
      
      // 确保返回正确的Uint8Array格式
      const resultData = new Uint8Array(pdfBytes);
      
      console.log(`PDF拆分完成: 文件大小 ${resultData.length} bytes`);
      
      return {
        fileName: `${file.name.replace('.pdf', '')}_第${startPage}-${endPage}页.pdf`,
        data: resultData,
        pageCount: endPage - startPage + 1,
        originalPages: `${startPage}-${endPage}`,
        size: resultData.length
      };
      
    } catch (error) {
      throw new Error(`PDF拆分失败: ${error.message}`);
    }
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }
}

export class PDFMerger {
  constructor() {
    this.pdfLib = null;
  }

  async initialize() {
    if (!this.pdfLib) {
      try {
        this.pdfLib = await import('pdf-lib');
      } catch (error) {
        throw new Error(`PDF-lib初始化失败: ${error.message}`);
      }
    }
  }

  async merge(files, onProgress) {
    await this.initialize();
    
    if (files.length < 2) {
      throw new Error('至少需要2个PDF文件才能合并');
    }
    
    try {
      onProgress?.(5, '初始化合并文档...');
      
      const mergedPdf = await this.pdfLib.PDFDocument.create();
      let totalPages = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = 10 + (i / files.length) * 80;
        
        onProgress?.(progress, `处理文件 ${i + 1}/${files.length}: ${file.name}`);
        
        // 读取PDF文件
        const arrayBuffer = await this.readFileAsArrayBuffer(file.file);
        const pdf = await this.pdfLib.PDFDocument.load(arrayBuffer);
        
        // 获取所有页面
        const pageCount = pdf.getPageCount();
        const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
        
        // 复制页面
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
        
        // 添加页面到合并文档
        copiedPages.forEach(page => {
          mergedPdf.addPage(page);
        });
        
        totalPages += pageCount;
      }
      
      onProgress?.(95, '保存合并文档...');
      
      // 设置文档元数据
      const timestamp = new Date();
      const fileName = `合并文档_${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}${String(timestamp.getSeconds()).padStart(2, '0')}.pdf`;
      
      mergedPdf.setTitle(fileName.replace('.pdf', ''));
      mergedPdf.setCreator('PDF工具箱');
      mergedPdf.setCreationDate(timestamp);
      
      // 生成PDF字节数组
      const pdfBytes = await mergedPdf.save();
      
      onProgress?.(100, '合并完成!');
      
      // 确保返回正确的Uint8Array格式
      const resultData = new Uint8Array(pdfBytes);
      
      console.log(`PDF合并完成: 文件大小 ${resultData.length} bytes`);
      
      return {
        fileName,
        data: resultData,
        pageCount: totalPages,
        fileCount: files.length,
        size: resultData.length,
        sourceFiles: files.map(f => f.name)
      };
      
    } catch (error) {
      throw new Error(`PDF合并失败: ${error.message}`);
    }
  }

  readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }
}