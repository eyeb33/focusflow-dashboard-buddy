import React, { useState, useRef, useCallback } from 'react';
import { ImagePlus, X, HelpCircle, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type ImageIntent = 'help' | 'check';

interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (imageBase64: string, intent: ImageIntent) => void;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [intent, setIntent] = useState<ImageIntent>('help');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setIntent('help');
    setError(null);
    setDragActive(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      resetState();
      onOpenChange(false);
    }
  }, [isLoading, resetState, onOpenChange]);

  const processFile = useCallback((file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64);
    };
    reader.onerror = () => {
      setError('Failed to read the image. Please try again.');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleSubmit = () => {
    if (imageBase64) {
      onSubmit(imageBase64, intent);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImagePlus className="w-5 h-5" />
            Upload Question Image
          </DialogTitle>
          <DialogDescription>
            Upload a photo of a maths question from a paper or textbook.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image Upload Area */}
          {!imagePreview ? (
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_TYPES.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drop your image here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, WebP or GIF (max 10MB)
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Uploaded question preview"
                className="w-full rounded-lg border border-border max-h-64 object-contain bg-muted/30"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleRemoveImage}
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Intent Selection */}
          {imagePreview && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">What would you like me to do?</Label>
              <RadioGroup
                value={intent}
                onValueChange={(v) => setIntent(v as ImageIntent)}
                className="grid grid-cols-1 gap-3"
                disabled={isLoading}
              >
                <label
                  htmlFor="intent-help"
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    intent === 'help'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="help" id="intent-help" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">Help me with this question</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      I'll guide you through solving it step-by-step without giving the answer directly.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="intent-check"
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    intent === 'check'
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value="check" id="intent-check" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm">Check my answer</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      I'll review your working and identify any errors or areas for improvement.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!imageBase64 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4 mr-2" />
                Send to Tutor
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadModal;
