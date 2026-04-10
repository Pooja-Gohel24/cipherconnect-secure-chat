import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

interface MediaItem {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  message_id: string;
}

interface MediaSectionProps {
  conversationId: string;
  onClose: () => void;
}

export default function MediaSection({ conversationId, onClose }: MediaSectionProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'files' | 'links'>('media');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    loadMediaItems();
  }, [conversationId]);

  const loadMediaItems = async () => {
    try {
      const res = await chatService.listMessages(conversationId);
      const messages = res.data;
      
      // Extract all attachments from messages
      const allMedia: MediaItem[] = [];
      messages.forEach((msg: any) => {
        if (msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach((att: any) => {
            allMedia.push({
              ...att,
              created_at: msg.created_at,
              message_id: msg.id
            });
          });
        }
      });
      
      setMediaItems(allMedia);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load media:', err);
      setLoading(false);
    }
  };

  const getMediaItems = () => {
    return mediaItems.filter(item => 
      item.file_type.startsWith('image/') || item.file_type.startsWith('video/')
    );
  };

  const getFileItems = () => {
    return mediaItems.filter(item => 
      !item.file_type.startsWith('image/') && 
      !item.file_type.startsWith('video/') && 
      !item.file_type.startsWith('audio/')
    );
  };

  const getAudioItems = () => {
    return mediaItems.filter(item => item.file_type.startsWith('audio/'));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading media...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Media & Files</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('media')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'media'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Media ({getMediaItems().length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'files'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Files ({getFileItems().length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'media' && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {getMediaItems().map(item => (
                <div
                  key={item.id}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80"
                  onClick={() => setSelectedMedia(item)}
                >
                  {item.file_type.startsWith('image/') ? (
                    <img
                      src={`http://127.0.0.1:8000${item.file_url}`}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              {getFileItems().map(item => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.file_name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(item.file_size)} • {formatDate(item.created_at)}</p>
                  </div>
                  <a
                    href={`http://127.0.0.1:8000${item.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {selectedMedia.file_type.startsWith('image/') ? (
              <img
                src={`http://127.0.0.1:8000${selectedMedia.file_url}`}
                alt={selectedMedia.file_name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <video
                src={`http://127.0.0.1:8000${selectedMedia.file_url}`}
                controls
                className="max-w-full max-h-full"
              />
            )}
            
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm font-medium">{selectedMedia.file_name}</p>
              <p className="text-xs text-gray-300">{formatDate(selectedMedia.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}