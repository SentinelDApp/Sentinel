import { FactoryIcon, TruckIcon, WarehouseIcon, UserIcon } from '../icons/Icons';

// Stakeholder roles configuration
export const ROLES = [
  {
    id: "SUPPLIER",
    title: "Supplier",
    description: "Create shipments, manage products, and track deliveries",
    icon: FactoryIcon,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "TRANSPORTER",
    title: "Transporter",
    description: "Update shipment status and scan boxes during transit",
    icon: TruckIcon,
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: "WAREHOUSE",
    title: "Warehouse",
    description: "Receive shipments, manage inventory, and verify products",
    icon: WarehouseIcon,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "RETAILER",
    title: "Retailer",
    description: "Receive shipments, verify products, and manage inventory",
    icon: UserIcon,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
];

// Document types for verification
export const DOCUMENT_TYPES = [
  { id: "org_certificate", label: "Organization Registration Certificate" },
  { id: "aadhaar", label: "Aadhaar Card" },
  { id: "pan", label: "PAN Card" },
  { id: "passport", label: "Passport" },
  { id: "voter_id", label: "Voter ID Card" },
];

// Features displayed on the signup page
export const FEATURES = [
  {
    title: "End-to-end shipment tracking",
    iconKey: "location",
    color: "text-blue-400",
    bgColorDark: "bg-blue-500/10",
    bgColorLight: "bg-white/20",
  },
  {
    title: "Instant product verification",
    iconKey: "checkCircle",
    color: "text-green-400",
    bgColorDark: "bg-green-500/10",
    bgColorLight: "bg-white/20",
  },
  {
    title: "Real-time status updates",
    iconKey: "chart",
    color: "text-purple-400",
    bgColorDark: "bg-purple-500/10",
    bgColorLight: "bg-white/20",
  },
  {
    title: "Immutable audit trail",
    iconKey: "clock",
    color: "text-amber-400",
    bgColorDark: "bg-amber-500/10",
    bgColorLight: "bg-white/20",
  },
];

// API endpoints
export const API_ENDPOINTS = {
  ONBOARDING_REQUEST: "http://localhost:5000/api/onboarding/request",
};
