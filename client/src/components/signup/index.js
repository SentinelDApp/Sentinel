// Signup Dashboard Components
export { default as SignupApp } from "./SignupApp";
export { SignupThemeProvider, useSignupTheme } from "./context/ThemeContext";

// Layout Components
export { default as Header, MobileLogo } from "./layout/Header";
export { default as Sidebar } from "./layout/Sidebar";
export { default as SignupLayout } from "./layout/SignupLayout";

// UI Components
export { default as WalletConnect } from "./components/WalletConnect";
export { default as RoleSelector } from "./components/RoleSelector";
export { default as DocumentUpload } from "./components/DocumentUpload";
export { default as FormInput } from "./components/FormInput";
export { default as SubmitButton } from "./components/SubmitButton";

// Pages
export { default as SignupPage } from "./pages/SignupPage";

// Constants
export * from "./constants";

// Icons
export * from "./icons/Icons";

// Legacy export for backward compatibility
export { default as Signup } from "./SignupApp";
