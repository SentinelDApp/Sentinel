import { useRef } from 'react';


const QRCodeDisplay = ({ shipmentId, size = 200, showActions = true }) => {
  const qrRef = useRef(null);

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

  const pattern = generateQRPattern(shipmentId);
  const moduleSize = size / 25; // 21 modules + 2 quiet zone on each side

  // Download QR code as image
  const handleDownload = () => {
    const svg = qrRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `QR-${shipmentId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Print QR code
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const svg = qrRef.current;
    if (!svg || !printWindow) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${shipmentId}</title>
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
            }
            .shipment-id {
              margin-top: 20px;
              font-family: monospace;
              font-size: 14px;
              color: #333;
            }
            .instructions {
              margin-top: 10px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svgData}
            <div class="shipment-id">${shipmentId}</div>
            <div class="instructions">Attach this QR to the physical shipment</div>
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
    <div className="flex flex-col items-center">
      {/* QR Code SVG */}
      <div className="bg-white p-4 rounded-xl">
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

      {/* Shipment ID Display */}
      <div className="mt-4 text-center">
        <p className="text-xs text-slate-400 mb-1">Shipment Hash</p>
        <code className="text-sm font-mono text-slate-200 bg-slate-700/50 px-3 py-1.5 rounded-lg">
          {shipmentId}
        </code>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
