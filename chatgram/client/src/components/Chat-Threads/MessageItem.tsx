import React from 'react';
import { DownloadIcon, EyeIcon } from '@/utils/icons';

interface MessageItemProps {
  user: boolean | undefined;
  message: string | undefined;
  type?: string;
}

function MessageItem({ user, message, type = "text" }: MessageItemProps) {
  const isFile = type === "file";
  const fileName = message ? message.split('/').pop()?.replace(/^\d+?-/, '') || 'file' : 'file';

  const handleFileAction = async (url: string) => {
    if (!url) return;

    if (url.match(/\.(pdf)$/i)) {
      // Open PDF in a new tab for viewing
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (url.match(/\.(jpeg|jpg|png|gif)$/i)) {
      // Open image in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Download other file types
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download file.');
      }
    }
  };

  return (
    <div className={`chat ${user ? 'chat-end' : 'chat-start'} mb-4`}>
      <div
        className={`chat-bubble ${user ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} p-3 rounded-lg shadow-md max-w-[70%]`}
      >
        {isFile && message ? (
          message.match(/\.(jpeg|jpg|png|gif)$/i) ? (
            <button
              onClick={() => handleFileAction(message)}
              className="w-full"
            >
              <img
                src={message}
                alt={fileName}
                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
            </button>
          ) : (
            <button
              onClick={() => handleFileAction(message)}
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              {message.match(/\.(pdf)$/i) ? <EyeIcon /> : <DownloadIcon />}
              <span>{fileName}</span>
            </button>
          )
        ) : (
          <span className="break-words">{message}</span>
        )}
      </div>
    </div>
  );
}

export default MessageItem;