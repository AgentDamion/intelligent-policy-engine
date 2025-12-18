import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Plus,
  Send,
  Reply,
  Check,
  AlertTriangle,
  Lightbulb,
  X,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEnhancedCollaboration, DocumentAnnotation } from '@/hooks/useEnhancedCollaboration';
import { formatDistanceToNow } from 'date-fns';

interface AnnotationOverlayProps {
  documentId: string;
  documentType: string;
  children: React.ReactNode;
  className?: string;
}

interface AnnotationMarker {
  id: string;
  annotation: DocumentAnnotation;
  position: { x: number; y: number };
  isVisible: boolean;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  documentId,
  documentType,
  children,
  className = ''
}) => {
  const [annotationMarkers, setAnnotationMarkers] = useState<AnnotationMarker[]>([]);
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotationPosition, setNewAnnotationPosition] = useState<{ x: number; y: number } | null>(null);
  const [newAnnotationType, setNewAnnotationType] = useState<DocumentAnnotation['annotationType']>('comment');
  const [newAnnotationContent, setNewAnnotationContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const annotationRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const {
    annotations,
    addAnnotation
  } = useEnhancedCollaboration({
    documentId,
    documentType,
    onAnnotationAdded: (annotation) => {
      // Create annotation marker when new annotation is added
      const element = findElementForAnnotation(annotation);
      if (element) {
        const rect = element.getBoundingClientRect();
        const overlayRect = overlayRef.current?.getBoundingClientRect();
        
        if (overlayRect) {
          const marker: AnnotationMarker = {
            id: annotation.id,
            annotation,
            position: {
              x: rect.right - overlayRect.left + 10,
              y: rect.top - overlayRect.top
            },
            isVisible: true
          };
          
          setAnnotationMarkers(prev => [...prev, marker]);
        }
      }
    }
  });

  // Find DOM element for annotation based on position data
  const findElementForAnnotation = (annotation: DocumentAnnotation) => {
    if (annotation.positionData.elementId) {
      return document.getElementById(annotation.positionData.elementId);
    }
    if (annotation.positionData.xpath) {
      try {
        const result = document.evaluate(
          annotation.positionData.xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        return result.singleNodeValue as Element;
      } catch (error) {
        console.error('Invalid XPath:', annotation.positionData.xpath);
      }
    }
    return null;
  };

  // Handle click to add annotation
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const clickPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      setNewAnnotationPosition(clickPosition);
      setIsAddingAnnotation(true);
      setActiveAnnotation(null);
    }
  };

  // Create new annotation
  const handleCreateAnnotation = async () => {
    if (!newAnnotationContent.trim() || !newAnnotationPosition) return;

    const targetElement = document.elementFromPoint(
      newAnnotationPosition.x,
      newAnnotationPosition.y
    );

    const positionData = {
      elementId: targetElement?.id,
      xpath: getXPath(targetElement),
      offset: newAnnotationPosition.x
    };

    await addAnnotation(
      newAnnotationType,
      newAnnotationContent,
      positionData
    );

    setNewAnnotationContent('');
    setIsAddingAnnotation(false);
    setNewAnnotationPosition(null);
  };

  // Generate XPath for element
  const getXPath = (element: Element | null): string => {
    if (!element) return '';
    
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const parts: string[] = [];
    let current: Element | null = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += `[@class="${classes.join(' ')}"]`;
        }
      }
      
      parts.unshift(selector);
      current = current.parentElement;
      
      if (parts.length > 10) break; // Prevent overly long XPaths
    }
    
    return '//' + parts.join('/');
  };

  // Reply to annotation
  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    const parentAnnotation = annotations.find(a => a.id === parentId);
    if (!parentAnnotation) return;

    await addAnnotation(
      'comment',
      replyContent,
      parentAnnotation.positionData,
      parentId
    );

    setReplyContent('');
    setReplyingTo(null);
  };

  // Group annotations by thread
  const getAnnotationThread = (annotation: DocumentAnnotation): DocumentAnnotation[] => {
    const thread = [annotation];
    const replies = annotations.filter(a => a.parentId === annotation.id);
    thread.push(...replies);
    return thread;
  };

  // Update annotation markers when annotations change
  useEffect(() => {
    const markers: AnnotationMarker[] = [];
    
    annotations
      .filter(annotation => !annotation.parentId) // Only top-level annotations
      .forEach(annotation => {
        const element = findElementForAnnotation(annotation);
        if (element && overlayRef.current) {
          const rect = element.getBoundingClientRect();
          const overlayRect = overlayRef.current.getBoundingClientRect();
          
          const marker: AnnotationMarker = {
            id: annotation.id,
            annotation,
            position: {
              x: rect.right - overlayRect.left + 10,
              y: rect.top - overlayRect.top
            },
            isVisible: true
          };
          
          markers.push(marker);
        }
      });
    
    setAnnotationMarkers(markers);
  }, [annotations]);

  const getAnnotationIcon = (type: DocumentAnnotation['annotationType']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4" />;
      case 'approval':
        return <Check className="w-4 h-4" />;
      case 'concern':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getAnnotationColor = (type: DocumentAnnotation['annotationType']) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-500';
      case 'suggestion':
        return 'bg-yellow-500';
      case 'approval':
        return 'bg-green-500';
      case 'concern':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`relative ${className}`}
      onClick={handleOverlayClick}
    >
      {children}
      
      {/* Annotation markers */}
      {annotationMarkers.map((marker) => (
        <div
          key={marker.id}
          className="absolute z-10"
          style={{
            left: marker.position.x,
            top: marker.position.y,
            transform: 'translate(0, -50%)'
          }}
        >
          <Button
            variant="outline"
            size="sm"
            className={`w-8 h-8 p-0 rounded-full border-2 ${getAnnotationColor(marker.annotation.annotationType)} border-white shadow-lg hover:scale-110 transition-transform`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveAnnotation(
                activeAnnotation === marker.id ? null : marker.id
              );
            }}
          >
            {getAnnotationIcon(marker.annotation.annotationType)}
          </Button>
          
          {/* Annotation thread popup */}
          {activeAnnotation === marker.id && (
            <Card className="absolute left-8 top-0 w-80 max-h-96 shadow-xl border-2 animate-scale-in">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getAnnotationIcon(marker.annotation.annotationType)}
                    <span className="capitalize">
                      {marker.annotation.annotationType}
                    </span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => setActiveAnnotation(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ScrollArea className="max-h-60">
                  <div className="space-y-3">
                    {getAnnotationThread(marker.annotation).map((annotation) => (
                      <div
                        key={annotation.id}
                        className={`${annotation.parentId ? 'ml-4 pl-3 border-l-2 border-muted' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {annotation.userId.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground mb-1">
                              {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
                            </div>
                            <div className="text-sm">{annotation.content}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Reply input */}
                {replyingTo === marker.id ? (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="min-h-0 h-20 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReply(marker.id)}
                        disabled={!replyContent.trim()}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyingTo(marker.id)}
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Resolve</DropdownMenuItem>
                        <DropdownMenuItem>Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ))}
      
      {/* New annotation popup */}
      {isAddingAnnotation && newAnnotationPosition && (
        <Card
          className="absolute z-20 w-80 shadow-xl border-2 animate-scale-in"
          style={{
            left: newAnnotationPosition.x,
            top: newAnnotationPosition.y,
            transform: 'translate(0, -50%)'
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Add Annotation</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex gap-1">
                {(['comment', 'suggestion', 'approval', 'concern'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={newAnnotationType === type ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setNewAnnotationType(type)}
                  >
                    {getAnnotationIcon(type)}
                  </Button>
                ))}
              </div>
              
              <Textarea
                placeholder="Write your annotation..."
                value={newAnnotationContent}
                onChange={(e) => setNewAnnotationContent(e.target.value)}
                className="min-h-0 h-20 resize-none"
                autoFocus
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateAnnotation}
                  disabled={!newAnnotationContent.trim()}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingAnnotation(false);
                    setNewAnnotationPosition(null);
                    setNewAnnotationContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};