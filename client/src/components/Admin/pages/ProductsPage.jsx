import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  BoxIcon,
  SearchIcon,
  RefreshIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ChevronRightIcon,
} from "../icons/Icons";
import { fetchShipments } from "../../../services/shipmentApi";

const ProductsPage = () => {
  const { isDarkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Load products from shipments
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchShipments(null, { limit: 100 });
      const shipmentsData = result.shipments || [];
      
      // Transform shipments to products
      const productsData = shipmentsData.map(s => ({
        id: s.shipmentHash,
        batchId: s.batchId,
        name: `Batch ${s.batchId}`,
        quantity: s.totalQuantity || 0,
        containers: s.numberOfContainers || 0,
        status: s.status,
        createdAt: s.createdAt,
        supplier: s.supplierWallet,
        warehouse: s.warehouseName || 'Not assigned',
      }));
      
      setProducts(productsData);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts();
    setIsRefreshing(false);
  };

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.batchId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'in_transit' || p.status === 'created' || p.status === 'ready_for_dispatch').length,
    delivered: products.filter(p => p.status === 'delivered').length,
    totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
  };

  const getStatusConfig = (status) => {
    const configs = {
      created: { label: "Created", color: "slate", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
      ready_for_dispatch: { label: "Ready", color: "blue", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
      in_transit: { label: "In Transit", color: "amber", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
      at_warehouse: { label: "Warehouse", color: "purple", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
      delivered: { label: "Delivered", color: "green", bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
    };
    return configs[status] || configs.created;
  };

  const cardClass = isDarkMode
    ? "bg-slate-900/50 border border-slate-800/50"
    : "bg-white border border-slate-200/50 shadow-sm";

  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${textPrimary}`}>
            Products Inventory
          </h1>
          <p className={`mt-1 ${textSecondary}`}>
            Manage and track all products across shipments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className={`flex rounded-xl p-1 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-blue-500 text-white"
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-blue-500 text-white"
                  : isDarkMode ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDarkMode
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
            }`}
          >
            <RefreshIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: stats.total, icon: BoxIcon, color: "blue" },
          { label: "Active Shipments", value: stats.active, icon: TruckIcon, color: "amber" },
          { label: "Delivered", value: stats.delivered, icon: CheckCircleIcon, color: "green" },
          { label: "Total Quantity", value: stats.totalQuantity.toLocaleString(), icon: ClockIcon, color: "purple" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: isDarkMode ? "from-blue-500/20 to-cyan-500/20 text-blue-400" : "from-blue-50 to-cyan-50 text-blue-600",
            amber: isDarkMode ? "from-amber-500/20 to-orange-500/20 text-amber-400" : "from-amber-50 to-orange-50 text-amber-600",
            green: isDarkMode ? "from-green-500/20 to-emerald-500/20 text-green-400" : "from-green-50 to-emerald-50 text-green-600",
            purple: isDarkMode ? "from-purple-500/20 to-pink-500/20 text-purple-400" : "from-purple-50 to-pink-50 text-purple-600",
          };
          return (
            <div key={index} className={`rounded-2xl p-5 ${cardClass}`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[stat.color]} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</p>
              <p className={`text-sm mt-1 ${textSecondary}`}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className={`rounded-2xl p-4 ${cardClass}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl ${
            isDarkMode ? "bg-slate-800/80 border border-slate-700" : "bg-slate-50 border border-slate-200"
          }`}>
            <SearchIcon className={`w-5 h-5 ${textSecondary}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by batch ID or name..."
              className={`bg-transparent outline-none w-full ${isDarkMode ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}`}
            />
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {loading ? (
        <div className={`rounded-2xl p-12 text-center ${cardClass}`}>
          <div className="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className={`mt-4 ${textSecondary}`}>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={`rounded-2xl p-12 text-center ${cardClass}`}>
          <BoxIcon className={`w-16 h-16 mx-auto ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
          <p className={`mt-4 text-lg font-medium ${textPrimary}`}>No products found</p>
          <p className={`mt-2 ${textSecondary}`}>Products will appear here once shipments are created</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const status = getStatusConfig(product.status);
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
                className={`rounded-2xl p-5 cursor-pointer transition-all hover:scale-[1.02] ${cardClass} ${
                  selectedProduct?.id === product.id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center`}>
                    <BoxIcon className={`w-6 h-6 ${status.text}`} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
                    {status.label}
                  </span>
                </div>
                
                <h3 className={`font-semibold ${textPrimary}`}>{product.name}</h3>
                <p className={`text-sm mt-1 ${textSecondary}`}>
                  ID: {product.id?.slice(0, 8)}...{product.id?.slice(-6)}
                </p>
                
                <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={textSecondary}>Quantity</span>
                    <span className={`font-medium ${textPrimary}`}>{product.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className={textSecondary}>Containers</span>
                    <span className={`font-medium ${textPrimary}`}>{product.containers}</span>
                  </div>
                </div>

                {selectedProduct?.id === product.id && (
                  <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className={textSecondary}>Warehouse</span>
                        <span className={textPrimary}>{product.warehouse}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={textSecondary}>Created</span>
                        <span className={textPrimary}>{new Date(product.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-2xl overflow-hidden ${cardClass}`}>
          <table className="w-full">
            <thead>
              <tr className={`text-left text-xs font-medium uppercase tracking-wider ${
                isDarkMode ? "text-slate-400 bg-slate-800/50" : "text-slate-500 bg-slate-50"
              }`}>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Batch ID</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Containers</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Warehouse</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-800" : "divide-slate-100"}`}>
              {filteredProducts.map((product) => {
                const status = getStatusConfig(product.status);
                return (
                  <tr key={product.id} className={`transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center`}>
                          <BoxIcon className={`w-5 h-5 ${status.text}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${textPrimary}`}>{product.name}</p>
                          <p className={`text-xs ${textSecondary}`}>{product.id?.slice(0, 12)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-mono text-sm ${textPrimary}`}>{product.batchId}</td>
                    <td className={`px-6 py-4 ${textPrimary}`}>{product.quantity.toLocaleString()}</td>
                    <td className={`px-6 py-4 ${textPrimary}`}>{product.containers}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${textSecondary}`}>{product.warehouse}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
