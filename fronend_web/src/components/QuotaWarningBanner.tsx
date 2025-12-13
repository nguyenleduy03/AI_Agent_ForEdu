/**
 * Quota Warning Banner
 * Hiển thị thông báo khi API quota exceeded
 */
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ExternalLink } from 'lucide-react';

interface QuotaWarningBannerProps {
  onClose?: () => void;
}

const QuotaWarningBanner = ({ onClose }: QuotaWarningBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-md"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            ⚠️ API đã vượt quá giới hạn sử dụng
          </h3>
          
          <p className="text-sm text-yellow-800 mb-3">
            Gemini AI API miễn phí chỉ cho phép <strong>20 requests/ngày</strong>. 
            Hệ thống đã vượt quá giới hạn này.
          </p>
          
          <div className="space-y-2 mb-3">
            <div className="flex items-center space-x-2 text-sm text-yellow-700">
              <Clock className="w-4 h-4" />
              <span>Quota sẽ reset sau 24 giờ</span>
            </div>
          </div>
          
          <div className="bg-white/50 rounded-lg p-3 mb-3">
            <p className="text-sm font-medium text-yellow-900 mb-2">
              💡 Giải pháp:
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Thử lại sau 24 giờ (quota reset hàng ngày)</li>
              <li>Liên hệ admin để nâng cấp API key</li>
              <li>Hoặc sử dụng API key riêng của bạn</li>
            </ul>
          </div>
          
          <div className="flex items-center space-x-3">
            <a
              href="https://ai.google.dev/gemini-api/docs/rate-limits"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm text-yellow-700 hover:text-yellow-900 font-medium transition-colors"
            >
              <span>Tìm hiểu thêm về giới hạn API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            
            {onClose && (
              <button
                onClick={onClose}
                className="text-sm text-yellow-600 hover:text-yellow-800 font-medium transition-colors"
              >
                Đóng
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuotaWarningBanner;
