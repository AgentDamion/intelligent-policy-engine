import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title?: string;
}

const VideoModal = ({ 
  isOpen, 
  onClose, 
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder URL
  title = "Demo Video" 
}: VideoModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full">
          <iframe
            src={videoUrl}
            title={title}
            className="w-full h-full rounded-lg"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;