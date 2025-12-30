import { useTheme } from "../context/ThemeContext";
import { BoxIcon, SearchIcon } from "../icons/Icons";

const InventoryPage = () => {
  const { isDarkMode } = useTheme();

  const inventoryItems = [
    { id: "INV-001", name: "Electronic Components Batch A", quantity: 450, location: "Zone A-1", status: "In Stock" },
    { id: "INV-002", name: "Pharmaceutical Supplies", quantity: 200, location: "Zone B-2", status: "In Stock" },
    { id: "INV-003", name: "Industrial Parts Kit", quantity: 75, location: "Zone A-3", status: "Low Stock" },
    { id: "INV-004", name: "Consumer Electronics", quantity: 320, location: "Zone C-1", status: "In Stock" },
    { id: "INV-005", name: "Medical Equipment", quantity: 15, location: "Zone D-1", status: "Low Stock" },
    { id: "INV-006", name: "Automotive Parts", quantity: 580, location: "Zone B-1", status: "In Stock" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return isDarkMode
          ? "bg-green-500/10 text-green-400 border-green-500/30"
          : "bg-green-50 text-green-600 border-green-200";
      case "Low Stock":
        return isDarkMode
          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
          : "bg-amber-50 text-amber-600 border-amber-200";
      case "Out of Stock":
        return isDarkMode
          ? "bg-red-500/10 text-red-400 border-red-500/30"
          : "bg-red-50 text-red-600 border-red-200";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-cyan-500/10" : "bg-cyan-50"}`}>
              <BoxIcon className={`w-6 h-6 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`} />
            </div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Inventory
            </h1>
          </div>
          <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Manage warehouse inventory and stock levels
          </p>
        </div>

        {/* Search */}
        <div
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl w-full sm:w-72
            ${isDarkMode ? "bg-slate-800/50 border border-slate-700/50" : "bg-white border border-slate-200"}
          `}
        >
          <SearchIcon className={`w-5 h-5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search inventory..."
            className={`
              bg-transparent outline-none w-full text-sm
              ${isDarkMode ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"}
            `}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div
        className={`
          rounded-2xl overflow-hidden
          ${isDarkMode
            ? "bg-slate-900/50 border border-slate-800/50"
            : "bg-white border border-slate-200/50 shadow-sm"
          }
        `}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDarkMode ? "bg-slate-800/50" : "bg-slate-50"}>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Item ID
                </th>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Quantity
                </th>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Location
                </th>
                <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? "divide-slate-800" : "divide-slate-100"}`}>
              {inventoryItems.map((item) => (
                <tr
                  key={item.id}
                  className={`transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
                >
                  <td className="px-6 py-4">
                    <span className={`font-mono font-medium ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {item.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={isDarkMode ? "text-slate-300" : "text-slate-700"}>
                      {item.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
                      {item.location}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
