import { useState, useEffect } from 'react';
import { 
  TRANSPORTER_AGENCIES, 
  PRODUCT_SUGGESTIONS,
  generateShipmentId, 
  suggestNextBatchId,
  isBatchIdDuplicate,
  DEMO_SUPPLIER_WALLET,
  SHIPMENT_STATUSES 
} from './supplier.constants';
import QRCodeDisplay from './QRCodeDisplay';


const CreateShipment = ({ onCreateShipment, isDarkMode = true }) => {
  const [formData, setFormData] = useState({
    productName: '',
    batchId: '',
    quantity: '',
    unit: 'units',
    transporterId: '',
  });
  const [suggestedBatchId, setSuggestedBatchId] = useState('');
  const [batchIdError, setBatchIdError] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdShipment, setCreatedShipment] = useState(null); // Holds shipment data after creation

  // Update batch ID suggestion when product changes
  useEffect(() => {
    if (formData.productName) {
      const suggestion = suggestNextBatchId(formData.productName);
      setSuggestedBatchId(suggestion);
    } else {
      setSuggestedBatchId('');
    }
  }, [formData.productName]);

  // Validate batch ID for duplicates
  useEffect(() => {
    if (formData.batchId && formData.productName) {
      if (isBatchIdDuplicate(formData.productName, formData.batchId)) {
        setBatchIdError('This Batch ID already exists for this product');
      } else {
        setBatchIdError('');
      }
    } else {
      setBatchIdError('');
    }
  }, [formData.batchId, formData.productName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'productName') {
      setShowProductSuggestions(true);
    }
  };

  const handleProductSelect = (productName) => {
    setFormData(prev => ({ ...prev, productName }));
    setShowProductSuggestions(false);
  };

  const useSuggestedBatchId = () => {
    setFormData(prev => ({ ...prev, batchId: suggestedBatchId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity || !formData.batchId) return;
    if (batchIdError) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate cryptographic shipment ID
    const shipmentId = generateShipmentId(
      formData.productName, 
      formData.batchId, 
      DEMO_SUPPLIER_WALLET.address
    );

    const newShipment = {
      id: shipmentId,
      batchId: formData.batchId,
      productName: formData.productName,
      quantity: parseInt(formData.quantity, 10),
      unit: formData.unit,
      transporterId: formData.transporterId || null,
      transporterName: formData.transporterId 
        ? TRANSPORTER_AGENCIES.find(t => t.id === formData.transporterId)?.name 
        : null,
      supplierWallet: DEMO_SUPPLIER_WALLET.address,
      status: SHIPMENT_STATUSES.CREATED,
      createdAt: Date.now(),
      metadata: null,
      concerns: [],
    };

    onCreateShipment(newShipment);
    setCreatedShipment(newShipment); // Show success state with QR code
    setIsSubmitting(false);
  };

  // Reset form to create another shipment
  const handleCreateAnother = () => {
    setCreatedShipment(null);
    setFormData({ productName: '', batchId: '', quantity: '', unit: 'units', transporterId: '' });
    setSuggestedBatchId('');
  };

  const filteredProducts = PRODUCT_SUGGESTIONS.filter(p => 
    p.toLowerCase().includes(formData.productName.toLowerCase())
  );

  const inputClass = `w-full border rounded-xl py-3 px-4 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
    isDarkMode 
      ? 'bg-slate-800/50 border-slate-700 text-slate-50 focus:border-blue-500 focus:ring-blue-500/20' 
      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20'
  }`;
  const inputErrorClass = `w-full border rounded-xl py-3 px-4 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
    isDarkMode 
      ? 'bg-slate-800/50 border-red-500 text-slate-50 focus:border-red-500 focus:ring-red-500/20' 
      : 'bg-white border-red-500 text-slate-900 focus:border-red-500 focus:ring-red-500/20'
  }`;

  // Success State: Show QR Code after shipment creation
  if (createdShipment) {
    return (
      <div className={`
        border rounded-2xl p-6 transition-colors duration-200
        ${isDarkMode 
          ? 'bg-slate-900/50 border-slate-800' 
          : 'bg-white border-slate-200 shadow-sm'
        }
      `}>
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
            Shipment Created Successfully
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Your shipment has been registered on the blockchain
          </p>
        </div>

        {/* Shipment Details */}
        <div className={`
          border rounded-xl p-4 mb-6
          ${isDarkMode 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-slate-50 border-slate-200'
          }
        `}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Product</span>
              <p className={`font-medium ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                {createdShipment.productName}
              </p>
            </div>
            <div>
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Batch ID</span>
              <p className={`font-medium ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                {createdShipment.batchId}
              </p>
            </div>
            <div>
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Quantity</span>
              <p className={`font-medium ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
                {createdShipment.quantity} {createdShipment.unit}
              </p>
            </div>
            <div>
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Created
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className={`
          border rounded-xl p-6 mb-6
          ${isDarkMode 
            ? 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700' 
            : 'bg-gradient-to-br from-slate-50 to-white border-slate-200'
          }
        `}>
          <div className="text-center mb-4">
            <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
              Shipment QR Code
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              This QR code is permanently linked to this shipment
            </p>
          </div>

          <QRCodeDisplay shipmentId={createdShipment.id} size={180} showActions={true} isDarkMode={isDarkMode} />

          {/* Instructions */}
          <div className={`
            mt-6 p-4 rounded-xl border
            ${isDarkMode 
              ? 'bg-amber-500/10 border-amber-500/30' 
              : 'bg-amber-50 border-amber-200'
            }
          `}>
            <div className="flex items-start gap-3">
              <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                  Attach to Physical Shipment
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-amber-200/70' : 'text-amber-600'}`}>
                  Print or download this QR code and attach it to the physical shipment package. 
                  This allows anyone to scan and verify the shipment's authenticity and track its journey.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCreateAnother}
            className={`
              flex-1 py-3 px-4 font-medium rounded-xl transition-colors
              ${isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }
            `}
          >
            Create Another Shipment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      border rounded-2xl p-6 transition-all duration-200
      ${isDarkMode 
        ? 'bg-slate-900/50 border-slate-800 hover:border-slate-700' 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
      }
    `}>
      <h2 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-slate-50' : 'text-slate-900'}`}>
        Create New Shipment
      </h2>
      <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Enter batch ID or use the suggested one based on product history
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name with Suggestions */}
        <div className="relative">
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            onFocus={() => setShowProductSuggestions(true)}
            onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
            required
            placeholder="e.g., Organic Olive Oil"
            autoComplete="off"
            className={inputClass}
          />
          
          {/* Product Suggestions Dropdown */}
          {showProductSuggestions && formData.productName && filteredProducts.length > 0 && (
            <div className={`
              absolute z-10 w-full mt-1 border rounded-xl shadow-lg max-h-48 overflow-y-auto
              ${isDarkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
              }
            `}>
              {filteredProducts.map(product => (
                <button
                  key={product}
                  type="button"
                  onClick={() => handleProductSelect(product)}
                  className={`
                    w-full px-4 py-2 text-left first:rounded-t-xl last:rounded-b-xl transition-colors
                    ${isDarkMode 
                      ? 'text-slate-200 hover:bg-slate-700' 
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                >
                  {product}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Batch ID with Suggestion */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Batch ID <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="batchId"
              value={formData.batchId}
              onChange={handleChange}
              required
              placeholder="e.g., OOO-2024-004"
              className={batchIdError ? inputErrorClass : inputClass}
            />
          </div>
          
          {/* Batch ID Suggestion */}
          {suggestedBatchId && !formData.batchId && (
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Suggested:</span>
              <button
                type="button"
                onClick={useSuggestedBatchId}
                className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                {suggestedBatchId}
              </button>
            </div>
          )}
          
          {/* Error Message */}
          {batchIdError && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {batchIdError}
            </p>
          )}
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Quantity <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              placeholder="e.g., 500"
              className={inputClass}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Unit
            </label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., kg, bottles"
              className={inputClass}
            />
          </div>
        </div>

        {/* Transporter Selection */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Assign Transporter <span className={isDarkMode ? 'text-slate-500' : 'text-slate-400'}>(optional)</span>
          </label>
          <select
            name="transporterId"
            value={formData.transporterId}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="" className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>-- Select Later --</option>
            {TRANSPORTER_AGENCIES.map(agency => (
              <option key={agency.id} value={agency.id} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>
                {agency.name} • {agency.specialization}
              </option>
            ))}
          </select>
          <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Can be assigned later before marking ready for dispatch
          </p>
        </div>

        {/* Preview Info */}
        {formData.productName && formData.batchId && !batchIdError && (
          <div className={`
            border rounded-xl p-4
            ${isDarkMode 
              ? 'bg-slate-800/30 border-slate-700/50' 
              : 'bg-slate-50 border-slate-200'
            }
          `}>
            <p className={`text-xs mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Shipment ID will be generated on creation:
            </p>
            <code className="text-xs text-emerald-400 font-mono">
              SHP-[HASH]-[TIMESTAMP]
            </code>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !formData.productName || !formData.quantity || !formData.batchId || batchIdError}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating Shipment...
            </span>
          ) : 'Create Shipment'}
        </button>
      </form>
    </div>
  );
};

export default CreateShipment;
