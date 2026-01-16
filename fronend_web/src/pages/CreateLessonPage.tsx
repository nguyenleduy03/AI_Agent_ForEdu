import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft, Save, Loader, BookOpen, Upload, File, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { driveService, formatFileSize, isSupportedFileType, getMaterialTypeFromMime } from '../services/driveService';
import { courseService, type MaterialUploadData } from '../services/courseService';
import { useAuthStore } from '../store/authStore';
import type { Course } from '../types';

// Pending upload - file đã upload lên Drive nhưng chưa save vào DB (vì chưa có lessonId)
interface PendingUpload {
  id: string; // unique id for UI
  file: File;
  driveResponse: {
    file_id: string;
    file_name: string;
    mime_type: string;
    view_link: string;
    embed_link: string;
    download_link?: string;
    size?: number;
  } | null;
  status: 'uploading' | 'uploaded' | 'saving' | 'saved' | 'error';
  progress: number;
  error?: string;
}

const CreateLessonPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    orderIndex: 1,
  });

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const [courseData, lessonsData] = await Promise.all([
        courseService.getCourseById(Number(courseId)),
        courseService.getLessonsByCourse(Number(courseId))
      ]);
      
      setCourse(courseData);
      
      // Set order index to next available
      if (lessonsData && lessonsData.length > 0) {
        const maxOrder = Math.max(...lessonsData.map((l) => l.orderIndex || 0));
        setFormData(prev => ({ ...prev, orderIndex: maxOrder + 1 }));
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Không thể tải thông tin khóa học!');
      navigate('/courses');
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Upload file lên Drive (chưa save vào DB)
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!user || !course) return;

    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Validate file
      if (!isSupportedFileType(file)) {
        toast.error(`File "${file.name}" không được hỗ trợ!`);
        continue;
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error(`File "${file.name}" quá lớn (max 100MB)!`);
        continue;
      }

      // Create pending upload entry
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newUpload: PendingUpload = {
        id: uploadId,
        file,
        driveResponse: null,
        status: 'uploading',
        progress: 0,
      };

      setPendingUploads(prev => [...prev, newUpload]);

      try {
        // Upload to Drive
        const driveResponse = await driveService.uploadFile(
          file,
          user.id,
          Number(courseId),
          course.title
          // Không truyền lessonId vì chưa có
        );

        // Update status to uploaded
        setPendingUploads(prev => prev.map(u => 
          u.id === uploadId 
            ? { ...u, driveResponse, status: 'uploaded', progress: 100 }
            : u
        ));

        toast.success(`Đã upload "${file.name}" lên Drive!`);
      } catch (error: any) {
        console.error('Upload error:', error);
        setPendingUploads(prev => prev.map(u => 
          u.id === uploadId 
            ? { ...u, status: 'error', error: error.message || 'Upload failed' }
            : u
        ));
        toast.error(`Lỗi upload "${file.name}": ${error.message}`);
      }
    }
  };

  // Remove pending upload
  const removePendingUpload = (uploadId: string) => {
    setPendingUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tên bài học!');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung bài học!');
      return;
    }

    // Check if any uploads are still in progress
    const uploadingFiles = pendingUploads.filter(u => u.status === 'uploading');
    if (uploadingFiles.length > 0) {
      toast.error('Vui lòng đợi upload hoàn tất!');
      return;
    }

    setLoading(true);

    try {
      // 1. Create lesson first
      const newLesson = await courseService.createLesson(Number(courseId), formData);
      const lessonId = newLesson.id;

      // 2. Save pending uploads to DB with new lessonId
      const uploadedFiles = pendingUploads.filter(u => u.status === 'uploaded' && u.driveResponse);
      
      if (uploadedFiles.length > 0) {
        for (const upload of uploadedFiles) {
          if (!upload.driveResponse) continue;

          // Update status to saving
          setPendingUploads(prev => prev.map(u => 
            u.id === upload.id ? { ...u, status: 'saving' } : u
          ));

          try {
            const materialData: MaterialUploadData = {
              courseId: Number(courseId),
              lessonId: lessonId,
              title: upload.file.name,
              fileUrl: upload.driveResponse.view_link,
              type: getMaterialTypeFromMime(upload.driveResponse.mime_type, upload.file.name),
              driveFileId: upload.driveResponse.file_id,
              driveEmbedLink: upload.driveResponse.embed_link,
              driveDownloadLink: upload.driveResponse.download_link,
              fileSize: upload.driveResponse.size || upload.file.size,
              originalFilename: upload.file.name,
            };

            console.log('Saving material to DB:', materialData);
            const savedMaterial = await courseService.uploadMaterialWithDrive(materialData);
            console.log('Material saved:', savedMaterial);

            // Update status to saved
            setPendingUploads(prev => prev.map(u => 
              u.id === upload.id ? { ...u, status: 'saved' } : u
            ));
          } catch (error: any) {
            console.error('Error saving material:', error);
            setPendingUploads(prev => prev.map(u => 
              u.id === upload.id ? { ...u, status: 'error', error: 'Lỗi lưu vào DB' } : u
            ));
          }
        }
      }

      toast.success('Tạo bài học thành công!');
      navigate(`/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo bài học!');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Không tìm thấy khóa học</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Quay lại khóa học</span>
          </button>

          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tạo Bài Học Mới</h1>
              <p className="text-gray-600">Thêm bài học vào khóa học</p>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <div>
              <p className="text-sm text-gray-600">Khóa học:</p>
              <p className="font-semibold text-gray-900">{course.title}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Tên Bài Học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ví dụ: Chapter 1: Introduction to Python"
                className="input-field"
                disabled={loading}
                required
              />
            </div>

            {/* Order Index */}
            <div>
              <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 mb-2">
                Thứ Tự Bài Học
              </label>
              <input
                type="number"
                id="orderIndex"
                name="orderIndex"
                value={formData.orderIndex}
                onChange={handleChange}
                min="1"
                className="input-field"
                disabled={loading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Số thứ tự của bài học trong khóa học (1, 2, 3...)
              </p>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Nội Dung Bài Học <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Nhập nội dung bài học... Hỗ trợ Markdown:

# Heading 1
## Heading 2

**Bold text**
*Italic text*

```python
# Code block
print('Hello World')
```

- List item 1
- List item 2"
                rows={20}
                className="input-field resize-none font-mono text-sm"
                disabled={loading}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Hỗ trợ Markdown để format nội dung
              </p>
            </div>

            {/* Upload Materials Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-primary-600" />
                    <span>Tài Liệu & Video</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload file PDF, DOC, PPT hoặc video MP4 cho bài học
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploader(!showUploader)}
                  className="px-4 py-2 text-sm bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{showUploader ? 'Ẩn' : 'Thêm tài liệu'}</span>
                </button>
              </div>

              {/* File Uploader - Inline */}
              {showUploader && user && (
                <div className="mb-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragging 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-300 hover:border-primary-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 mb-2">
                      Kéo thả file vào đây hoặc{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        chọn file
                      </button>
                    </p>
                    <p className="text-xs text-gray-400">
                      PDF, DOC, DOCX, PPT, PPTX, TXT, MP4, AVI, MOV, JPG, PNG (max 100MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp4,.avi,.mov,.jpg,.jpeg,.png,.gif"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {/* Pending Uploads List */}
              {pendingUploads.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                    <File className="w-4 h-4" />
                    <span>Files đã upload ({pendingUploads.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {pendingUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {upload.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(upload.file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          {upload.status === 'uploading' && (
                            <Loader className="w-4 h-4 animate-spin text-primary-600" />
                          )}
                          {upload.status === 'uploaded' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {upload.status === 'saving' && (
                            <Loader className="w-4 h-4 animate-spin text-green-600" />
                          )}
                          {upload.status === 'saved' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {upload.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          {(upload.status === 'uploaded' || upload.status === 'error') && (
                            <button
                              type="button"
                              onClick={() => removePendingUpload(upload.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    * Files sẽ được liên kết với bài học sau khi tạo
                  </p>
                </div>
              )}

              {pendingUploads.length === 0 && !showUploader && (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <File className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Chưa có tài liệu nào</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Thêm tài liệu" để upload</p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">💡 Markdown Tips:</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p><code className="bg-green-100 px-1 rounded"># Heading</code> - Tiêu đề</p>
                <p><code className="bg-green-100 px-1 rounded">**bold**</code> - Chữ đậm</p>
                <p><code className="bg-green-100 px-1 rounded">*italic*</code> - Chữ nghiêng</p>
                <p><code className="bg-green-100 px-1 rounded">```code```</code> - Code block</p>
                <p><code className="bg-green-100 px-1 rounded">- item</code> - List</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate(`/courses/${courseId}`)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || pendingUploads.some(u => u.status === 'uploading')}
                className="btn-primary flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Tạo Bài Học</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3">📝 Tips để tạo bài học tốt:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-1">✅ Cấu trúc:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Bắt đầu với giới thiệu</li>
                <li>Chia nhỏ thành sections</li>
                <li>Kết thúc với tóm tắt</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">✅ Nội dung:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Giải thích rõ ràng</li>
                <li>Có ví dụ minh họa</li>
                <li>Thêm bài tập thực hành</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default CreateLessonPage;
