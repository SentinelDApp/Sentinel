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
 *
 * QR CODE FORMAT:
 * Uses qrcode.react library to generate REAL scannable QR codes that work
 * with any mobile device camera or QR scanner app.
 */

import { useRef, useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { CONTAINER_STATUS_COLORS } from "../constants";

/**
 * Helper function to convert QR SVG to data URL
 */
const svgToDataURL = (svgElement) => {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  return (
    "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  );
};

/**
 * Single Container QR Card Component
 */
const ContainerQRCard = ({ container, isDarkMode, size = 120 }) => {
  const qrRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const statusStyle =
    CONTAINER_STATUS_COLORS[container.status] ||
    CONTAINER_STATUS_COLORS.CREATED;

  // Download QR code as image
  const handleDownload = (e) => {
    e.stopPropagation();
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = size * 2;
    canvas.height = size * 2;

    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const link = document.createElement("a");
      link.download = `${container.containerId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  // Print single QR code - uses the existing rendered SVG
  const handlePrint = (e) => {
    e.stopPropagation();

    // Get the SVG from the rendered QR code
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) {
      alert("QR code not found");
      return;
    }

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImageUrl =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));

    const containerId = container.containerId;
    const batchId = container.batchId;
    const statusLabel = statusStyle.label;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print QR codes");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Container QR - ${containerId}</title>
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
            .qr-image {
              width: 200px;
              height: 200px;
            }
            .container-id {
              margin-top: 20px;
              font-family: monospace;
              font-size: 14px;
              color: #333;
              word-break: break-all;
              font-weight: bold;
            }
            .batch-info {
              margin-top: 8px;
              font-size: 12px;
              color: #666;
              font-weight: 500;
            }
            .instructions {
              margin-top: 10px;
              font-size: 11px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              margin-top: 8px;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
              background: #e0f2fe;
              color: #0369a1;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrImageUrl}" class="qr-image" alt="QR Code" />
            <div class="container-id">${containerId}</div>
            ${
              batchId
                ? `<div class="batch-info">📦 Batch: ${batchId}</div>`
                : ""
            }
            <div class="status-badge">${statusLabel}</div>
            <div class="instructions">Attach to physical container</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div
      className={`
        relative rounded-xl p-3 transition-all duration-200 border
        ${
          isDarkMode
            ? "bg-slate-800/50 border-slate-700 hover:border-slate-600"
            : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
        }
        ${isHovered ? "scale-[1.02] shadow-lg" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        <span
          className={`
          text-[10px] font-medium px-1.5 py-0.5 rounded-full border
          ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}
        `}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* QR Code */}
      <div className="bg-white p-2 rounded-lg mx-auto w-fit" ref={qrRef}>
        <QRCodeSVG
          value={container.qrData}
          size={size}
          level="H"
          includeMargin={false}
          data-container-id={container.containerId}
        />
      </div>

      {/* Container ID */}
      <div className="mt-2 text-center">
        <p
          className={`text-[10px] font-mono truncate ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
          title={container.containerId}
        >
          {container.containerId}
        </p>
        {/* Batch ID */}
        {container.batchId && (
          <p
            className={`text-[9px] font-medium mt-0.5 ${
              isDarkMode ? "text-slate-500" : "text-slate-400"
            }`}
            title={`Batch: ${container.batchId}`}
          >
            📦 {container.batchId}
          </p>
        )}
        {/* Scanned By Info */}
        {container.scannedBy && (
          <p
            className={`text-[9px] font-medium mt-0.5 flex items-center justify-center gap-1 ${
              isDarkMode ? "text-emerald-400" : "text-emerald-600"
            }`}
          >
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {container.scannedBy}
          </p>
        )}
      </div>

      {/* Action Buttons (visible on hover) */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-2 backdrop-blur-sm">
          <button
            onClick={handleDownload}
            className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
            title="Download"
          >
            <svg
              className="w-4 h-4 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
            title="Print"
          >
            <svg
              className="w-4 h-4 text-slate-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
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
const ContainerQRGrid = ({
  containers = [],
  isDarkMode = true,
  maxHeight = 400,
}) => {
  const [showAll, setShowAll] = useState(false);

  // Show first 6 containers by default, or all if showAll is true
  const displayedContainers = showAll ? containers : containers.slice(0, 6);
  const hasMore = containers.length > 6;

  // Print all QR codes - collects SVGs already rendered on page
  const handlePrintAll = () => {
    // Collect all QR code SVGs from the rendered cards
    const qrImages = [];
    containers.forEach((container) => {
      const svg = document.querySelector(
        `[data-container-id="${container.containerId}"]`
      );
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const dataUrl =
          "data:image/svg+xml;base64," +
          btoa(unescape(encodeURIComponent(svgData)));
        qrImages.push({
          dataUrl,
          containerId: container.containerId,
          batchId: container.batchId,
        });
      }
    });

    if (qrImages.length === 0) {
      alert("No QR codes found to print");
      return;
    }

    // Generate the print HTML with pre-generated QR images
    const qrCardsHtml = qrImages
      .map(
        (item) => `
      <div class="qr-card">
        <div class="qr-wrapper">
          <img src="${item.dataUrl}" class="qr-image" alt="QR Code" />
        </div>
        <div class="container-id">${item.containerId}</div>
        ${
          item.batchId ? `<div class="batch-info">📦 ${item.batchId}</div>` : ""
        }
      </div>
    `
      )
      .join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print QR codes");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Container QR Codes - ${containers.length} Containers</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
              background: #fff;
            }
            h2 {
              text-align: center;
              margin-bottom: 25px;
              color: #333;
              font-size: 18px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .qr-card {
              text-align: center;
              padding: 15px;
              border: 2px dashed #ccc;
              border-radius: 10px;
              page-break-inside: avoid;
              background: #fafafa;
            }
            .qr-wrapper {
              background: white;
              padding: 10px;
              border-radius: 8px;
              display: inline-block;
            }
            .qr-image {
              width: 140px;
              height: 140px;
              display: block;
            }
            .container-id {
              margin-top: 10px;
              font-family: 'Courier New', monospace;
              font-size: 9px;
              color: #333;
              word-break: break-all;
              font-weight: bold;
            }
            .batch-info {
              margin-top: 5px;
              font-size: 8px;
              color: #666;
            }
            @media print {
              body { padding: 10px; }
              .grid { gap: 15px; }
            }
          </style>
        </head>
        <body>
          <h2>Container QR Codes - ${containers.length} Total</h2>
          <div class="grid">
            ${qrCardsHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); }, 300);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (containers.length === 0) {
    return (
      <div
        className={`
        text-center py-8 rounded-xl border
        ${
          isDarkMode
            ? "bg-slate-800/30 border-slate-700"
            : "bg-slate-50 border-slate-200"
        }
      `}
      >
        <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
          No containers generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${
            isDarkMode ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {containers.length} container{containers.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={handlePrintAll}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
            ${
              isDarkMode
                ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }
          `}
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print All
        </button>
      </div>

      {/* QR Grid */}
      <div
        className={`
          grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1
          ${showAll ? "" : "max-h-[400px]"}
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
            ${
              isDarkMode
                ? "bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-300"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
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
