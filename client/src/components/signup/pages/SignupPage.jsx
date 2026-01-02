import { useState } from "react";
import { Link } from "react-router-dom";
import { useSignupTheme } from '../context/ThemeContext';
import { MobileLogo } from '../layout/Header';
import WalletConnect from '../components/WalletConnect';
import RoleSelector from '../components/RoleSelector';
import DocumentUpload from '../components/DocumentUpload';
import FormInput from '../components/FormInput';
import SubmitButton from '../components/SubmitButton';
import { API_ENDPOINTS } from '../constants';

const SignupPage = () => {
  const { isDarkMode } = useSignupTheme();
  const [wallet, setWallet] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [document, setDocument] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(accounts[0]);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!wallet) {
      alert("Connect wallet first");
      return;
    }

    if (!email) {
      alert("Email is required for notifications");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("walletAddress", wallet);
    formData.append("fullName", name);
    formData.append("email", email);
    formData.append("organizationName", organizationName);
    formData.append("address", address);
    formData.append("requestedRole", role);
    formData.append("documentType", documentType);
    formData.append("verificationDocument", document);

    try {
      const response = await fetch(API_ENDPOINTS.ONBOARDING_REQUEST, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Submitted! You will receive an email when your request is processed.");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = wallet && role && documentType;

  return (
    <>
      {/* Mobile Logo */}
      <MobileLogo />

      <div className="mb-8">
        <h2
          className={`text-2xl lg:text-3xl font-bold ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}
        >
          Stakeholder Signup
        </h2>
        <p
          className={`mt-2 ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Register as Supplier, Transporter, Warehouse, or Retailer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet Connection */}
        <WalletConnect 
          wallet={wallet} 
          isConnecting={isConnecting} 
          onConnect={connectWallet} 
        />

        {/* Name Input */}
        <FormInput
          label="Full Name"
          value={name}
          onChange={setName}
          placeholder="Enter your full name"
          required
        />

        {/* Email Input */}
        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="Enter your email address"
          required
          helperText="You'll receive approval/rejection updates on this email"
        />

        {/* Organization Name Input */}
        <FormInput
          label="Organization Name"
          value={organizationName}
          onChange={setOrganizationName}
          placeholder="Enter your organization/company name"
        />

        {/* Address Input */}
        <FormInput
          label="Address"
          value={address}
          onChange={setAddress}
          placeholder="Enter your complete address"
          isTextarea
          rows={3}
        />

        {/* Role Selection */}
        <RoleSelector 
          selectedRole={role} 
          onRoleSelect={setRole} 
        />

        {/* File Upload */}
        <DocumentUpload
          document={document}
          documentType={documentType}
          onDocumentChange={setDocument}
          onDocumentTypeChange={setDocumentType}
        />

        {/* Submit Button */}
        <SubmitButton 
          isValid={isFormValid} 
          isSubmitting={isSubmitting} 
        />

        {/* Approval Notice */}
        <div
          className={`
            flex items-center justify-center gap-2 p-3 rounded-xl
            ${isDarkMode ? "bg-amber-500/10" : "bg-amber-50"}
          `}
        >
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span
            className={`text-sm ${
              isDarkMode ? "text-amber-400" : "text-amber-600"
            }`}
          >
            Approval required before accessing the dashboard
          </span>
        </div>

        {/* Sign In Link */}
        <p
          className={`text-center text-sm ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          Already registered?{" "}
          <Link
            to="/login"
            className={`font-medium ${
              isDarkMode
                ? "text-blue-400 hover:text-blue-300"
                : "text-blue-600 hover:text-blue-500"
            }`}
          >
            Sign in
          </Link>
        </p>
      </form>
    </>
  );
};

export default SignupPage;
