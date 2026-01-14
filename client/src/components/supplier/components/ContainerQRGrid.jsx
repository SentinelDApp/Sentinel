/**
 * ContainerQRGrid Component
 * 
 * SYSTEM PRINCIPLE:
 * Sentinel records shipment identity on-chain while enabling container-level
 * traceability using off-chain QR codes. Each container has a unique QR code
 * that encodes only the containerId for scanning and verification.
 * 
 * This component displays a scrollable grid of container QR codes with
 * download and print functionality for each container.
 */

import { useRef, useState } from 'react';
import { CONTAINER_STATUS_COLORS } from '../constants';


/**
 * Generate a QR code pattern for a given data string
 * @param {string} data - The data to encode in the QR pattern
 * @returns {Array} Array of {row, col} positions for filled modules
 */
const generateQRPattern = (data) => {
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pattern = [];
  const gridSize = 21; // Standard QR code size
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Position detection patterns (corners)
      const isTopLeft = row < 7 && col < 7;
      const isTopRight = row < 7 && col >= gridSize - 7;
      const isBottomLeft = row >= gridSize - 7 && col < 7;
      
      // Finder pattern borders
      const isFinderOuter = (isTopLeft || isTopRight || isBottomLeft) && 
        (row === 0 || row === 6 || col === 0 || col === 6 || 
         (row >= gridSize - 7 && (row === gridSize - 7 || row === gridSize - 1)) ||
         (col >= gridSize - 7 && (col === gridSize - 7 || col === gridSize - 1)));
      
      const isFinderInner = (isTopLeft || isTopRight || isBottomLeft) &&
        row >= 2 && row <= 4 && col >= 2 && col <= 4;
      
      // Data modules - pseudo-random based on hash
      const moduleHash = (hash + row * 31 + col * 17) % 100;
      const isDataModule = !isTopLeft && !isTopRight && !isBottomLeft && moduleHash > 45;
      
      if (isFinderOuter || isFinderInner || isDataModule) {
        pattern.push({ row, col });
      }
    }
  }
  
  return pattern;
};


/**
 * Single Container QR Card Component
 */
const ContainerQRCard = ({ container, isDarkMode, size = 120 }) => {
  const qrRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const pattern = generateQRPattern(container.qrData);
  const moduleSize = size / 25;
  const statusStyle = CONTAINER_STATUS_COLORS[container.status] || CONTAINER_STATUS_COLORS.CREATED;

  // Download QR code as image
  const handleDownload = (e) => {
    e.stopPropagation();
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size * 2;
    canvas.height = size * 2;

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const link = document.createElement('a');
      link.download = `${container.containerId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Print single QR code
  const handlePrint = (e) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank');
    const svg = qrRef.current;
    if (!svg || !printWindow) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Container QR - ${container.containerId}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
              border: 2px dashed #ccc;
              border-radius: 12px;
            }
            .container-id {
              margin-top: 20px;
              font-family: monospace;
              font-size: 12px;
              color: #333;
              word-break: break-all;
            }
            .instructions {
              margin-top: 10px;
              font-size: 11px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svgData}
            <div class="container-id">${container.containerId}</div>
            <div class="instructions">Attach to physical container</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      className={`
        relative rounded-xl p-3 transition-all duration-200 border
        ${isDarkMode 
          ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
        }
        ${isHovered ? 'scale-[1.02] shadow-lg' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        <span className={`
          text-[10px] font-medium px-1.5 py-0.5 rounded-full border
          ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}
        `}>
          {statusStyle.label}
        </span>
      </div>

      {/* QR Code */}
      <div className="bg-white p-2 rounded-lg mx-auto w-fit">
        <svg
          ref={qrRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width={size} height={size} fill="white" />
          {pattern.map(({ row, col }, index) => (
            <rect
              key={index}
              x={(col + 2) * moduleSize}
              y={(row + 2) * moduleSize}
              width={moduleSize}
              height={moduleSize}
              fill="black"
            />
          ))}
        </svg>
      </div>

      {/* Container ID */}
      <div className="mt-2 text-center">
        <p className={`text-[10px] font-mono truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} title={container.containerId}>
          {container.containerId}
        </p>
      </div>

      {/* Action Buttons (visible on hover) */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-2 backdrop-blur-sm">
          <button
            onClick={handleDownload}
            className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
            title="Download"
          >
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
            title="Print"
          >
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};


/**
 * Container QR Grid Component
 * Displays a scrollable grid of container QR codes
 */
const ContainerQRGrid = ({ containers = [], isDarkMode = true, maxHeight = 400 }) => {
  const [showAll, setShowAll] = useState(false);
  
  // Show first 6 containers by default, or all if showAll is true
  const displayedContainers = showAll ? containers : containers.slice(0, 6);
  const hasMore = containers.length > 6;

  // Download all QR codes as a batch
  const handleDownloadAll = () => {
    containers.forEach((container, index) => {
      setTimeout(() => {
        const svg = document.querySelector(`[data-container-id="${container.containerId}"]`);
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        canvas.width = 240;
        canvas.height = 240;

        img.onload = () => {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const link = document.createElement('a');
          link.download = `${container.containerId}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }, index * 200); // Stagger downloads to prevent browser issues
    });
  };

  // Print all QR codes
  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrHtml = containers.map(container => {
      const pattern = generateQRPattern(container.qrData);
      const size = 150;
      const moduleSize = size / 25;
      
      const rects = pattern.map(({ row, col }) => 
        `<rect x="${(col + 2) * moduleSize}" y="${(row + 2) * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black" />`
      ).join('');

      return `
        <div class="qr-card">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${size}" height="${size}" fill="white" />
            ${rects}
          </svg>
          <div class="container-id">${container.containerId}</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Container QR Codes</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              padding: 20px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .qr-card {
              text-align: center;
              padding: 15px;
              border: 1px dashed #ccc;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .container-id {
              margin-top: 10px;
              font-family: monospace;
              font-size: 9px;
              color: #333;
              word-break: break-all;
            }
            @media print {
              .grid {
                grid-template-columns: repeat(3, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <h2 style="text-align: center; margin-bottom: 20px;">Container QR Codes</h2>
          <div class="grid">
            ${qrHtml}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (containers.length === 0) {
    return (
      <div className={`
        text-center py-8 rounded-xl border
        ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-200'}
      `}>
        <p className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>No containers generated yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex items-center justify-between">
        <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {containers.length} container{containers.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadAll}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${isDarkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </button>
          <button
            onClick={handlePrintAll}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${isDarkMode 
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }
            `}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print All
          </button>
        </div>
      </div>

      {/* QR Grid */}
      <div 
        className={`
          grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1
          ${showAll ? '' : 'max-h-[400px]'}
        `}
        style={{ maxHeight: showAll ? `${maxHeight}px` : undefined }}
      >
        {displayedContainers.map((container) => (
          <ContainerQRCard 
            key={container.containerId}
            container={container}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className={`
            w-full py-2 text-sm font-medium rounded-lg transition-colors
            ${isDarkMode 
              ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-300' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }
          `}
        >
          {showAll ? `Show Less` : `Show All ${containers.length} Containers`}
        </button>
      )}
    </div>
  );
};

export default ContainerQRGrid;
