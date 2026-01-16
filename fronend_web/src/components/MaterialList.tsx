import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Video,
  Image,
  File,
  Download,
  ExternalLink,
  Trash2,
  Play,
  Eye,
  MoreVertical,
  X,
} from 'lucide-react';
import type { Material } from '../types';
import { courseService } from '../services/courseService';
import toast from 'react-hot-toast';

interface MaterialListProps {
  materials: Material[];
  onDelete?: (id: number) => void;
  canDelete?: boolean;
  showLesson?: boolean;
}

const MaterialList = ({ materials, onDelete, canDelete = false, showLesson = false }: MaterialListProps) => {
  const [selectedVideo, setSelectedVideo] = useState<Material | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    const iconMap: Record<string, JSX.Element> = {
      PDF: <FileText className="w-5 h-5 text-red-500" />,
      DOC: <FileText className="w-5 h-5 text-green-500" />,
      DOCX: <FileText className="w-5 h-5 text-green-500" />,
      PPT: <FileText className="w-5 h-5 text-orange-500" />,
      PPTX: <FileText className="w-5 h-5 text-orange-500" />,
      TXT: <FileText className="w-5 h-5 text-gray-500" />,
      HTML: <FileText className="w-5 h-5 text-purple-500" />,
      VIDEO: <Video className="w-5 h-5 text-purple-500" />,
      MP4: <Video className="w-5 h-5 text-purple-500" />,
      AVI: <Video className="w-5 h-5 text-purple-500" />,
      MOV: <Video className="w-5 h-5 text-purple-500" />,
      IMAGE: <Image className="w-5 h-5 text-green-500" />,
    };
    return iconMap[type] || <File className="w-5 h-5 text-gray-500" />;
  };

  // Check if material is video
  const isVideo = (type: string) => ['VIDEO', 'MP4', 'AVI', 'MOV'].includes(type);

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tài liệu này?')) return;

    setDeletingId(id);
    try {
      await courseService.deleteMaterial(id);
      toast.success('Xóa tài liệu thành công');
      onDelete?.(id);
    } catch (error: any) {
      toast.error(error.message || 'Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Chưa có tài liệu nào</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {materials.map((material) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {getFileIcon(material.type)}

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{material.title}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{material.type}</span>
                  {material.fileSizeFormatted && (
                    <>
                      <span>•</span>
                      <span>{material.fileSizeFormatted}</span>
                    </>
                  )}
                  {showLesson && material.lessonTitle && (
                    <>
                      <span>•</span>
                      <span className="text-primary-600">{material.lessonTitle}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {/* View/Play button */}
              {isVideo(material.type) ? (
                <button
                  onClick={() => setSelectedVideo(material)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Xem video"
                >
                  <Play className="w-4 h-4" />
                </button>
              ) : (
                <a
                  href={material.driveEmbedLink || material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Xem"
                >
                  <Eye className="w-4 h-4" />
                </a>
              )}

              {/* Download button */}
              {material.driveDownloadLink && (
                <a
                  href={material.driveDownloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Tải xuống"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              {/* Open in new tab */}
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mở trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Delete button */}
              {canDelete && (
                <button
                  onClick={() => handleDelete(material.id)}
                  disabled={deletingId === material.id}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Xóa"
                >
                  {deletingId === material.id ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Video title */}
              <div className="p-4 border-b border-gray-700">
                <p className="text-white font-medium">{selectedVideo.title}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedVideo.fileSizeFormatted && `${selectedVideo.fileSizeFormatted} • `}
                  {selectedVideo.type}
                </p>
              </div>

              {/* Video player - Use Google Drive preview URL */}
              <div className="aspect-video bg-black">
                {selectedVideo.driveFileId ? (
                  <iframe
                    src={`https://drive.google.com/file/d/${selectedVideo.driveFileId}/preview`}
                    className="w-full h-full"
                    allow="autoplay"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <Video className="w-16 h-16 mb-4 text-gray-500" />
                    <p className="text-gray-400 mb-4">Không thể phát video trực tiếp</p>
                    <a
                      href={selectedVideo.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="w-5 h-5" />
                      Mở trong Google Drive
                    </a>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-gray-700 flex justify-center gap-4">
                <a
                  href={selectedVideo.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Mở trong Drive
                </a>
                {selectedVideo.driveDownloadLink && (
                  <a
                    href={selectedVideo.driveDownloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Tải xuống
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MaterialList;
