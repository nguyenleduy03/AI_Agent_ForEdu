import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BookOpen, Brain, MessageSquare, Trophy, Sparkles, GraduationCap, Star,
  Rocket, Users, ChevronDown, TrendingUp, Play, Calendar, Mail, Zap,
  CheckCircle, ArrowRight, Globe, Shield,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const LandingPage = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Trải nghiệm học tập cá nhân hóa với AI thông minh, tự động điều chỉnh theo phong cách học của bạn',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: MessageSquare,
      title: 'AI Chatbot 24/7',
      description: 'Trợ lý AI thông minh sẵn sàng giải đáp mọi thắc mắc, hỗ trợ học tập mọi lúc mọi nơi',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: Calendar,
      title: 'Quản lý Lịch học',
      description: 'Đồng bộ Google Calendar, xem thời khóa biểu và nhận nhắc nhở tự động',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: Trophy,
      title: 'Quiz & Flashcard',
      description: 'Hệ thống quiz thông minh và flashcard giúp ghi nhớ kiến thức hiệu quả',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      icon: Mail,
      title: 'Email Thông minh',
      description: 'AI tự động soạn email, gửi mail cho giảng viên chỉ với một câu lệnh',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      icon: BookOpen,
      title: 'RAG Knowledge Base',
      description: 'Hệ thống RAG với ChromaDB giúp AI trả lời chính xác dựa trên tài liệu của bạn',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Học viên', icon: Users },
    { number: '500+', label: 'Khóa học', icon: BookOpen },
    { number: '99%', label: 'Hài lòng', icon: TrendingUp },
    { number: '24/7', label: 'Hỗ trợ AI', icon: MessageSquare },
  ];

  const testimonials = [
    { name: 'Nguyễn Văn A', role: 'Sinh viên CNTT', text: 'EduAgent giúp tôi học hiệu quả hơn 3 lần. AI chatbot thực sự thông minh!' },
    { name: 'Trần Thị B', role: 'Giảng viên', text: 'Công cụ tuyệt vời để quản lý lớp học và tạo quiz tự động.' },
    { name: 'Lê Văn C', role: 'Sinh viên Kinh tế', text: 'Tính năng xem TKB và gửi email tự động rất tiện lợi.' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Video Background Hero */}
      <div className="relative min-h-screen">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isVideoLoaded ? 'opacity-40' : 'opacity-0'}`}
          >
            {/* Education/Study themed videos */}
            <source src="https://cdn.pixabay.com/video/2020/07/30/45913-446958795_large.mp4" type="video/mp4" />
          </video>
          {/* Light Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-blue-50/40 to-white"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/30 to-emerald-100/30"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Navigation */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  EduAgent
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <Link to="/login" className="px-6 py-2.5 text-gray-600 font-semibold hover:text-green-600 transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register" className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all hover:-translate-y-0.5">
                  Bắt đầu ngay
                </Link>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full mb-8 font-medium border border-green-200"
            >
              <Sparkles className="w-5 h-5" />
              Nền tảng học tập AI hàng đầu Việt Nam
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
            >
              <span className="text-gray-900">Học thông minh</span>
              <br />
              <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                với sức mạnh AI
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Trải nghiệm học tập cá nhân hóa với AI Chatbot, quản lý lịch học,
              quiz thông minh và nhiều tính năng đột phá khác
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/register"
                className="group px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-green-500/25 hover:shadow-2xl hover:shadow-green-500/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                Đăng ký miễn phí
              </Link>
              <Link
                to="/demo"
                className="px-10 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:border-green-500 hover:text-green-600 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <Play className="w-5 h-5" />
                Xem demo
              </Link>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex flex-col items-center gap-2 text-gray-500"
              >
                <span className="text-sm font-medium">Khám phá thêm</span>
                <ChevronDown className="w-6 h-6" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <stat.icon className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 bg-green-50/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-4 border border-green-200">
              <Zap className="w-4 h-4" /> Tính năng nổi bật
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              <span className="text-gray-900">Mọi thứ bạn cần</span>
              <br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">trong một nền tảng</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tích hợp đầy đủ công cụ học tập thông minh, từ AI chatbot đến quản lý lịch học
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all group shadow-lg"
              >
                <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">Bắt đầu chỉ với 3 bước</h2>
            <p className="text-xl text-gray-600">Đơn giản, nhanh chóng và hoàn toàn miễn phí</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản miễn phí chỉ trong 30 giây', icon: Users, color: 'blue' },
              { step: '02', title: 'Kết nối Google', desc: 'Đồng bộ Calendar và Gmail để trải nghiệm đầy đủ', icon: Globe, color: 'purple' },
              { step: '03', title: 'Bắt đầu học', desc: 'Chat với AI, xem TKB, làm quiz và nhiều hơn nữa', icon: Rocket, color: 'pink' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-100 h-full shadow-lg hover:shadow-xl transition-shadow">
                  <div className={`text-6xl font-black text-${item.color}-100 mb-4`}>{item.step}</div>
                  <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-blue-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-4 bg-gradient-to-b from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">Học viên nói gì?</h2>
          </motion.div>

          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 text-center shadow-xl"
          >
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 italic">"{testimonials[currentTestimonial].text}"</p>
            <div>
              <p className="font-bold text-gray-900 text-lg">{testimonials[currentTestimonial].name}</p>
              <p className="text-gray-500">{testimonials[currentTestimonial].role}</p>
            </div>
          </motion.div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentTestimonial ? 'bg-green-500 w-8' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/30">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">
            Sẵn sàng thay đổi cách học?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn học viên đang trải nghiệm tương lai của giáo dục
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-12 py-5 bg-white text-purple-600 rounded-xl font-bold text-xl shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all"
            >
              <CheckCircle className="w-6 h-6" />
              Đăng ký miễn phí ngay
            </Link>
          </div>
          <p className="mt-6 text-white/80 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Không cần thẻ tín dụng • Bắt đầu trong 30 giây
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold">EduAgent</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Nền tảng học tập AI hàng đầu Việt Nam. Học thông minh hơn với sức mạnh của trí tuệ nhân tạo.
              </p>
              <div className="flex gap-4">
                {['facebook', 'twitter', 'linkedin', 'youtube'].map((social) => (
                  <a key={social} href="#" className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">AI Chatbot</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Khóa học</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Quiz & Flashcard</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Lịch học</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Trung tâm trợ giúp</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Điều khoản</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-500">
            <p>© 2025 EduAgent. All rights reserved. Made with ❤️ in Vietnam</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
