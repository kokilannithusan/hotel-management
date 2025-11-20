import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { validateEmail, validateRequired } from "../../utils/validators";
import { Hotel, Mail, ArrowRight, ArrowLeft, Lock, Shield } from "lucide-react";

type Step = "email" | "otp" | "password";

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string } = {};

    if (!validateRequired(email)) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Mock OTP generation (6-digit code)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(mockOtp);
      console.log("Generated OTP:", mockOtp); // For testing purposes
      alert(`OTP sent to ${email}! (Mock OTP: ${mockOtp})`); // Mock notification
      setCurrentStep("otp");
      setErrors({});
    } catch (error) {
      setErrors({ email: "Failed to send OTP. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { otp?: string } = {};

    if (!validateRequired(otp)) {
      newErrors.otp = "OTP is required";
    } else if (otp.length !== 6) {
      newErrors.otp = "OTP must be 6 digits";
    } else if (otp !== generatedOtp) {
      newErrors.otp = "Invalid OTP. Please try again.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCurrentStep("password");
      setErrors({});
    } catch (error) {
      setErrors({ otp: "Verification failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!validateRequired(newPassword)) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!validateRequired(confirmPassword)) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Password reset successful! Redirecting to login...");
      navigate("/login");
    } catch (error) {
      setErrors({ newPassword: "Failed to reset password. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Image/Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), 
                               radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`,
            }}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-start w-full px-16 text-white">
          {/* Logo */}
          <div className="mb-12 flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
              <Hotel className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Hotel Management</h1>
              <p className="text-blue-200 text-sm">Professional Edition</p>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Password Recovery
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-lg leading-relaxed">
            {currentStep === "email" &&
              "Enter your email to receive a verification code"}
            {currentStep === "otp" && "Verify your identity with the OTP"}
            {currentStep === "password" && "Create a new secure password"}
          </p>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === "email"
                  ? "bg-white text-blue-600"
                  : "bg-white/30 text-white"
              }`}
            >
              1
            </div>
            <div className="w-12 h-1 bg-white/30"></div>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === "otp"
                  ? "bg-white text-blue-600"
                  : "bg-white/30 text-white"
              }`}
            >
              2
            </div>
            <div className="w-12 h-1 bg-white/30"></div>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep === "password"
                  ? "bg-white text-blue-600"
                  : "bg-white/30 text-white"
              }`}
            >
              3
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl items-center justify-center shadow-lg mb-3">
              <Hotel className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Hotel Management
            </h2>
          </div>

          {/* Back to Login Link */}
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </Link>

          {/* Step 1: Email */}
          {currentStep === "email" && (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Forgot Password?
                </h2>
                <p className="text-base text-gray-600">
                  Enter your email address and we'll send you an OTP to reset
                  your password.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({ ...errors, email: undefined });
                      }}
                      className={`appearance-none block w-full pl-12 pr-4 py-3.5 border ${
                        errors.email
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-base`}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span>Sending OTP...</span>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === "otp" && (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Verify OTP
                </h2>
                <p className="text-base text-gray-600">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-semibold text-gray-900">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    OTP Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="otp"
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setOtp(value);
                        setErrors({ ...errors, otp: undefined });
                      }}
                      className={`appearance-none block w-full pl-12 pr-4 py-3.5 border ${
                        errors.otp
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-base tracking-widest text-center font-semibold text-2xl`}
                      placeholder="000000"
                    />
                  </div>
                  {errors.otp && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.otp}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendOtp({
                      preventDefault: () => {},
                    } as React.FormEvent)
                  }
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Resend OTP
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {currentStep === "password" && (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  Reset Password
                </h2>
                <p className="text-base text-gray-600">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrors({ ...errors, newPassword: undefined });
                      }}
                      className={`appearance-none block w-full pl-12 pr-4 py-3.5 border ${
                        errors.newPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-base`}
                      placeholder="Enter new password"
                    />
                  </div>
                  {errors.newPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.newPassword}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({ ...errors, confirmPassword: undefined });
                      }}
                      className={`appearance-none block w-full pl-12 pr-4 py-3.5 border ${
                        errors.confirmPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-base`}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                      <span>⚠️</span>
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <span>Resetting Password...</span>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
