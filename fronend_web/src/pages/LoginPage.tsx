import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, GraduationCap, Mail, Lock, UserPlus, User, Eye, EyeOff, Sparkles, ArrowRight, BookOpen, Trophy, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(!searchParams.get('tab') || searchParams.get('tab') !== 'register');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'STUDENT',
  });

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (!isLogin) {
      newSearchParams.set('tab', 'register');
    } else {
      newSearchParams.delete('tab');
    }
    const newSearch = newSearchParams.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [isLogin, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = isLogin
        ? await authService.login({ username: formData.username, password: formData.password })
        : await authService.register(formData);
      setAuth(response.user, response.token);
      toast.success(`${isLogin ? 'Login' : 'Registration'} successful!`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BookOpen, title: 'Smart Learning', desc: 'AI-powered personalized learning paths' },
    { icon: Trophy, title: 'Achievements', desc: 'Track your progress and earn rewards' },
    { icon: Target, title: 'Goal Setting', desc: 'Set and achieve your learning goals' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-indigo-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
        >
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Left side - Branding & Info */}
            <motion.div
              animate={{
                background: isLogin
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              }}
              transition={{ duration: 0.6 }}
              className="lg:w-1/2 p-12 flex flex-col justify-between text-white relative overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute bottom-20 right-10 w-24 h-24 border-4 border-white rounded-lg rotate-45 animate-pulse" />
                <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full animate-bounce" style={{ animationDuration: '4s' }} />
              </div>

              <div className="relative z-10">
                {/* Logo */}
                <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                  >
                    <GraduationCap className="w-7 h-7" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl font-bold">EduAgent</h1>
                    <p className="text-sm text-white/80">Your AI Learning Companion</p>
                  </div>
                </Link>

                {/* Welcome message */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-4xl font-bold mb-4">
                      {isLogin ? 'Welcome Back!' : 'Join Us Today!'}
                    </h2>
                    <p className="text-lg text-white/90 mb-8">
                      {isLogin
                        ? 'Continue your learning journey with AI-powered education.'
                        : 'Start your journey to smarter, personalized learning.'}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Features */}
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-white/80">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom decoration */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Sparkles className="w-4 h-4" />
                  <span>Trusted by 10,000+ students worldwide</span>
                </div>
              </div>
            </motion.div>

            {/* Right side - Form */}
            <div className="lg:w-1/2 p-12 flex flex-col justify-center">
              {/* Tab switcher */}
              <div className="flex gap-2 mb-8 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    isLogin
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                    !isLogin
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login-title' : 'register-title'}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isLogin ? 'Sign in to your account' : 'Create your account'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {isLogin
                      ? 'Enter your credentials to access your account'
                      : 'Fill in your information to get started'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={isLogin ? 'login-form' : 'register-form'}
                  initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          required
                          autoComplete="name"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                        placeholder={isLogin ? 'Enter your username' : 'Choose a username'}
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          required
                          autoComplete="email"
                          className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        minLength={!isLogin ? 6 : undefined}
                        className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-gray-900 placeholder-gray-400"
                        placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        I am a...
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'STUDENT' })}
                          className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                            formData.role === 'STUDENT'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, role: 'TEACHER' })}
                          className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                            formData.role === 'TEACHER'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          Teacher
                        </button>
                      </div>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                        {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      </>
                    )}
                  </motion.button>
                </motion.form>
              </AnimatePresence>

              {/* Footer text */}
              <p className="text-center text-sm text-gray-600 mt-6">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-semibold text-green-600 hover:text-green-700 transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Back to home link */}
        <Link
          to="/"
          className="absolute -top-16 left-0 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
