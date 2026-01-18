/**
 * QRCodesView Component
 *
 * Standalone component to display QR codes for all containers in a shipment.
 * Shows two sections: Product QR (batch-level) and Container QRs (individual).
 */

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ContainerQRGrid from "./ContainerQRGrid";

const QRCodesView = ({ shipment, onClose, isDarkMode = true }) => {
  if (!shipment) return null;

  const containers = shipment.containers || [];
  // Generate tracking URL for QR code - points to public shipment history page
  const baseUrl = window.location.origin;
  const trackingUrl = `${baseUrl}/${encodeURIComponent(shipment.batchId)}/shipment-history`;
  const productQrData = trackingUrl;
  const [activeTab, setActiveTab] = useState("product"); // 'product' or 'containers'

  // Print product QR code
  const handlePrintProductQR = () => {
    const svg = document.querySelector("[data-product-qr]");
    if (!svg) {
      alert("Product QR code not found");
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const dataUrl =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));

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
          <title>Product QR Code - ${shipment.batchId}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 40px;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .qr-card {
              text-align: center;
              padding: 30px;
              border: 3px solid #10b981;
              border-radius: 15px;
              background: #f0fdf4;
            }
            .qr-wrapper {
              background: white;
              padding: 20px;
              border-radius: 10px;
              display: inline-block;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .qr-image {
              width: 250px;
              height: 250px;
              display: block;
            }
            .title {
              margin-top: 20px;
              font-size: 14px;
              color: #059669;
              font-weight: bold;
              text-transform: uppercase;
            }
            .batch-id {
              margin-top: 10px;
              font-family: 'Courier New', monospace;
              font-size: 16px;
              color: #333;
              font-weight: bold;
            }
            .tracking-info {
              margin-top: 8px;
              font-size: 11px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="qr-wrapper">
              <img src="${dataUrl}" class="qr-image" alt="Product QR Code" />
            </div>
            <div class="title">Scan to Track Product</div>
            <div class="batch-id">${shipment.batchId}</div>
            <div class="tracking-info">Scan QR to view shipment history</div>
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
      className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${
        isDarkMode
          ? "bg-slate-900/50 border-slate-800"
          : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          isDarkMode
            ? "border-slate-800 bg-slate-800/50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDarkMode ? "bg-emerald-500/20" : "bg-emerald-100"
              }`}
            >
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  isDarkMode ? "text-slate-100" : "text-slate-800"
                }`}
              >
                QR Codes
              </h3>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Batch {shipment.batchId} • {containers.length} containers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-slate-700 text-slate-400"
                : "hover:bg-slate-200 text-slate-500"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab("product")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === "product"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                : isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Product QR
          </button>
          <button
            onClick={() => setActiveTab("containers")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
              activeTab === "containers"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                : isDarkMode
                  ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Containers ({containers.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Product QR Tab */}
        {activeTab === "product" && (
          <div className="space-y-4">
            {productQrData ? (
              <div
                className={`border rounded-xl p-6 ${
                  isDarkMode
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-emerald-50 border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4
                        className={`font-semibold text-sm ${
                          isDarkMode ? "text-emerald-400" : "text-emerald-700"
                        }`}
                      >
                        Product Tracking QR Code
                      </h4>
                      <p
                        className={`text-xs ${
                          isDarkMode
                            ? "text-emerald-300/70"
                            : "text-emerald-600"
                        }`}
                      >
                        Links to: Shipment History Page
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handlePrintProductQR}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isDarkMode
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                        : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                    }`}
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
                    Print
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className={`p-5 rounded-xl ${
                      isDarkMode ? "bg-white" : "bg-white shadow-sm"
                    }`}
                  >
                    <QRCodeSVG
                      value={productQrData}
                      size={200}
                      level="M"
                      includeMargin={false}
                      data-product-qr="true"
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <p
                      className={`font-mono text-sm font-bold ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      {shipment.batchId}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      Scan to view shipment history
                    </p>
                    <p
                      className={`text-[10px] mt-2 font-mono truncate max-w-[200px] ${
                        isDarkMode ? "text-slate-500" : "text-slate-400"
                      }`}
                      title={productQrData}
                    >
                      {productQrData}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  No product QR code available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Containers QR Tab */}
        {activeTab === "containers" && (
          <>
            {containers.length === 0 ? (
              <div className="text-center py-12">
                <div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isDarkMode ? "bg-slate-700" : "bg-slate-200"
                  }`}
                >
                  <svg
                    className={`w-10 h-10 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h4
                  className={`font-medium mb-2 ${
                    isDarkMode ? "text-slate-200" : "text-slate-700"
                  }`}
                >
                  No Containers
                </h4>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  This shipment has no containers yet
                </p>
              </div>
            ) : (
              <ContainerQRGrid
                containers={containers}
                isDarkMode={isDarkMode}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QRCodesView;
