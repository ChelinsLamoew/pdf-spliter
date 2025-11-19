export function downloadFile(data, fileName, mimeType = 'application/pdf') {
  try {
    // 确保data是正确的格式
    let blobData = data;
    
    // 如果data是Uint8Array，需要转换为ArrayBuffer
    if (data instanceof Uint8Array) {
      blobData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    
    // 验证数据不为空
    if (!blobData || (blobData.byteLength !== undefined && blobData.byteLength === 0)) {
      throw new Error('PDF数据为空');
    }
    
    // 创建Blob对象
    const blob = new Blob([blobData], { type: mimeType });
    
    // 验证Blob不为空
    if (blob.size === 0) {
      throw new Error('生成的文件为空');
    }
    
    console.log(`准备下载文件: ${fileName}, 大小: ${blob.size} bytes`);
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('下载失败:', error);
    console.error('数据类型:', typeof data);
    console.error('数据大小:', data?.length || data?.byteLength || 'unknown');
    return false;
  }
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateFileName(baseName, suffix = '') {
  const timestamp = new Date();
  const dateStr = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}${String(timestamp.getSeconds()).padStart(2, '0')}`;
  
  return `${baseName}${suffix}_${dateStr}_${timeStr}.pdf`;
}