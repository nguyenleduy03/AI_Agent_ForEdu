import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  FileText,
  Video,
  Image,
  File,
  Loader,
  CheckCircle,
  AlertCircle,
  HardDrive,
} from 'lucide-react';
import { driveService, formatFileSize, isSupportedFileType, getMaterialTypeFromMime } from '../services/driveService';
import { courseService, type MaterialUploadData } from '../services/courseService';
import toast from 'react-hot-toast';

interface FileUploaderProps {
  userId: number;
  courseId: number;
  courseName?: string;
  lessonId?: number;
  onUploadComplete?: (material: any) => void;
  maxSize?: number; // in bytes, default 100MB
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  driveResponse?: any;
}

const FileUploader = ({
  userId,
  courseId,
  courseName,
  lessonId,
  onUploadComplete,
  maxSize = 100 * 1024 * 1024, // 100MB
}: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [quota, setQuota] = useState<{ used_gb: number; total_gb: number; usage_percent: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load quota on mount
  const loadQuota = useCallback(async () => {
    try {
      const q = await driveService.getQuota(userId);
      setQuota(q);
    } catch (error) {
      console.error('Failed to load quota:', error);
    }
  }, [userId]);

  // Load quota when component mounts
  useEffect(() => {
    loadQuota();
  }, [loadQuota]);

  // Get file icon based on type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5 text-green-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document'))
      return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
      return <FileText className="w-5 h-5 text-orange-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  // Handle file upload
  const handleUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      // Validate file type
      if (!isSupportedFileType(file)) {
        toast.error(`File "${file.name}" không được hỗ trợ`);
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" quá lớn (max ${formatFileSize(maxSize)})`);
        continue;
      }

      // Add to uploading list
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        status: 'uploading',
      };
      setUploadingFiles((prev) => [...prev, uploadingFile]);

      try {
        // 1. Upload to Google Drive
        const driveResponse = await driveService.uploadFile(file, userId, courseId, courseName, lessonId);

        // Update progress
        setUploadingFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, progress: 50, driveResponse } : f))
        );

        // 2. Save to database
        const materialData: MaterialUploadData = {
          courseId,
          lessonId,
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          description: `Uploaded: ${file.name}`,
          fileUrl: driveResponse.view_link,
          type: getMaterialTypeFromMime(file.type, file.name),
          driveFileId: driveResponse.file_id,
          driveEmbedLink: driveResponse.embed_link,
          driveDownloadLink: driveResponse.download_link,
          fileSize: file.size,
          originalFilename: file.name,
        };

        const material = await courseService.uploadMaterialWithDrive(materialData);

        // Update status to success
        setUploadingFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, progress: 100, status: 'success' } : f))
        );

        toast.success(`Upload "${file.name}" thành công!`);
        onUploadComplete?.(material);

        // Refresh quota
        loadQuota();
      } catch (error: any) {
        console.error('Upload error:', error);
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, status: 'error', error: error.message || 'Upload failed' } : f
          )
        );
        toast.error(`Upload "${file.name}" thất bại: ${error.message}`);
      }
    }
  }, [userId, courseId, courseName, lessonId, maxSize, onUploadComplete, loadQuota]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload]
  );

  // Remove file from list
  const removeFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  };

  return (
    <div className="space-y-4">
      {/* Quota Info */}
      {quota && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4" />
            <span>Google Drive</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  quota.usage_percent > 90 ? 'bg-red-500' : quota.usage_percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${quota.usage_percent}%` }}
              />
            </div>
            <span>
              {quota.used_gb.toFixed(1)} / {quota.total_gb.toFixed(0)} GB
            </span>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.html,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className="hidden"
        />

        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />

        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragging ? 'Thả file vào đây' : 'Kéo thả file hoặc click để chọn'}
        </p>

        <p className="text-sm text-gray-500">
          Hỗ trợ: PDF, DOC, DOCX, PPT, PPTX, TXT, MP4, AVI, MOV, JPG, PNG
        </p>
        <p className="text-sm text-gray-400 mt-1">Tối đa {formatFileSize(maxSize)} / file</p>
      </div>

      {/* Uploading Files List */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {uploadingFiles.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-3 bg-white border rounded-lg p-3"
              >
                {getFileIcon(item.file.type)}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(item.file.size)}</p>

                  {item.status === 'uploading' && (
                    <div className="mt-1 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {item.status === 'error' && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
                </div>

                <div className="flex-shrink-0">
                  {item.status === 'uploading' && <Loader className="w-5 h-5 text-primary-500 animate-spin" />}
                  {item.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>

                {item.status !== 'uploading' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(item.file);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploader;
