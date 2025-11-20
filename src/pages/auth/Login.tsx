import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail, validateRequired } from "../../utils/validators";
import {
  Hotel,
  Lock,
  Mail,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!validateRequired(email)) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!validateRequired(password)) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(email, password, rememberMe);
      if (success) {
        navigate("/dashboard");
      } else {
        setErrors({ password: "Invalid credentials" });
      }
    } catch (error) {
      setErrors({ password: "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail("demo@hotel.com");
    setPassword("demo123");
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
            Manage Smarter,
            <br />
            <span className="text-blue-200">Grow Faster</span>
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-lg leading-relaxed">
            All-in-one platform for modern hotel operations
          </p>

          {/* Features List */}
          <div className="space-y-4 mb-12">
            {[
              "Real-time booking & pricing",
              "Automated management",
              "Smart analytics",
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg text-blue-50">{feature}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex space-x-8">
            <div>
              <div className="text-3xl font-bold">5K+</div>
              <div className="text-blue-200 text-sm">Hotels</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-blue-200 text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h2>
            <p className="text-base text-gray-600">Sign in to continue</p>
          </div>

          {/* Demo Quick Login Badge */}
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Try Demo
                </p>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 underline"
                >
                  Auto-fill credentials →
                </button>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email
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

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: undefined });
                  }}
                  className={`appearance-none block w-full pl-12 pr-12 py-3.5 border ${
                    errors.password
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  } rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-base`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a
                href="#"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
