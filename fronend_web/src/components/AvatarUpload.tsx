import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadService } from '../services/uploadService';
import { useAuthStore } from '../store/authStore';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange?: (newUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
  fallbackInitial?: string;
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

const initialSizeMap = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
};

const AvatarUpload = ({
  currentAvatarUrl,
  onAvatarChange,
  size = 'md',
  fallbackInitial,
}: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, setUser } = useAuthStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // 1. Upload to Google Drive
      console.log('Starting upload for user:', user.id);
      const uploadResult = await uploadService.uploadUserAvatar(file, user.id);
      console.log('Upload result (full):', JSON.stringify(uploadResult, null, 2));
      console.log('avatar_url:', uploadResult?.avatar_url);
      console.log('success:', uploadResult?.success);

      if (!uploadResult || !uploadResult.avatar_url) {
        console.error('Missing avatar_url in response:', uploadResult);
        throw new Error('Upload response missing avatar_url');
      }

      // 2. Try to update in database (optional - may fail if not connected)
      try {
        await uploadService.updateUserAvatar(
          uploadResult.avatar_url,
          uploadResult.file_id
        );
        console.log('Database updated successfully');
      } catch (dbError) {
        console.warn('Could not save to database, but image uploaded:', dbError);
      }

      // 3. Update local state
      const newAvatarUrl = uploadResult.avatar_url;
      console.log('Setting new avatar URL:', newAvatarUrl);
      setUser({ ...user, avatarUrl: newAvatarUrl });
      onAvatarChange?.(newAvatarUrl);

      toast.success('Cập nhật avatar thành công!');
      setShowModal(false);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      const message =
        error.response?.data?.detail || 
        error.message || 
        'Không thể upload avatar. Vui lòng thử lại.';
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl || user?.avatarUrl;

  return (
    <>
      {/* Avatar Display */}
      <div className="relative group">
        <div
          className={`${sizeMap[size]} rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg`}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
              {fallbackInitial || user?.fullName?.charAt(0).toUpperCase() ? (
                <span className={`font-bold ${initialSizeMap[size]}`}>
                  {fallbackInitial || user?.fullName?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-1/2 h-1/2" />
              )}
            </div>
          )}
        </div>

        {/* Upload Button Overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          <Camera className="w-6 h-6 text-white" />
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => !isUploading && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Xác nhận avatar mới
                </h3>
                <button
                  onClick={() => !isUploading && setShowModal(false)}
                  disabled={isUploading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPreviewUrl(null);
                  }}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Lưu
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Ảnh sẽ được lưu trên Google Drive của bạn
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AvatarUpload;
