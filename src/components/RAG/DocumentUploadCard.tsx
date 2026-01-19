import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';

export const DocumentUploadCard: React.FC = () => {
  const { uploadDocument, isUploading } = useDocuments();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-generate title from filename if not set
      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    const result = await uploadDocument(selectedFile, title.trim());
    if (result) {
      setSelectedFile(null);
      setTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setTitle('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Curriculum Document
        </CardTitle>
        <CardDescription>
          Upload PDF documents like the Edexcel A-Level Maths specification, past papers, or mark schemes.
          These will be processed and used to ground AI tutor responses in the official curriculum.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file">PDF Document</Label>
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="flex-1"
            />
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            placeholder="e.g., Edexcel A-Level Mathematics Specification 2024"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || !title.trim() || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
