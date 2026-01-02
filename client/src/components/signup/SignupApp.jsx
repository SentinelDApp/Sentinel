import { SignupThemeProvider } from './context/ThemeContext';
import SignupLayout from './layout/SignupLayout';
import SignupPage from './pages/SignupPage';

const SignupApp = () => {
  return (
    <SignupThemeProvider>
      <SignupLayout>
        <SignupPage />
      </SignupLayout>
    </SignupThemeProvider>
  );
};

export default SignupApp;
