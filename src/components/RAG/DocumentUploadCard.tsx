import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Folder, Loader2 } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { toast } from 'sonner';

interface PendingFile {
  file: File;
  title: string;
}

export const DocumentUploadCard: React.FC = () => {
  const { uploadDocument, isUploading } = useDocuments();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const generateTitle = (fileName: string) => {
    return fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      toast.error('No PDF files found');
      return;
    }

    const newPendingFiles: PendingFile[] = pdfFiles.map(file => ({
      file,
      title: generateTitle(file.name),
    }));

    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    
    // Reset input
    if (e.target === fileInputRef.current) {
      fileInputRef.current.value = '';
    } else if (e.target === folderInputRef.current) {
      folderInputRef.current.value = '';
    }

    toast.success(`Added ${pdfFiles.length} PDF file${pdfFiles.length > 1 ? 's' : ''}`);
  };

  const handleTitleChange = (index: number, newTitle: string) => {
    setPendingFiles(prev => 
      prev.map((pf, i) => i === index ? { ...pf, title: newTitle } : pf)
    );
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setPendingFiles([]);
  };

  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;

    const validFiles = pendingFiles.filter(pf => pf.title.trim());
    if (validFiles.length === 0) {
      toast.error('All files need titles');
      return;
    }

    setUploadProgress(0);
    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const { file, title } = validFiles[i];
      const result = await uploadDocument(file, title.trim());
      if (result) {
        successCount++;
      }
      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} of ${validFiles.length} files`);
      setPendingFiles([]);
    }
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalSize = pendingFiles.reduce((acc, pf) => acc + pf.file.size, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Curriculum Documents
        </CardTitle>
        <CardDescription>
          Upload PDF documents like the Edexcel A-Level Maths specification, past papers, or mark schemes.
          You can select multiple files or an entire folder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload buttons */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            accept=".pdf,application/pdf"
            // @ts-ignore - webkitdirectory is a valid attribute but not in types
            webkitdirectory=""
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
            disabled={isUploading}
          >
            <FileText className="h-4 w-4 mr-2" />
            Select Files
          </Button>
          <Button
            variant="outline"
            onClick={() => folderInputRef.current?.click()}
            className="flex-1"
            disabled={isUploading}
          >
            <Folder className="h-4 w-4 mr-2" />
            Select Folder
          </Button>
        </div>

        {/* Pending files list */}
        {pendingFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">
                {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} selected ({formatFileSize(totalSize)})
              </Label>
              <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={isUploading}>
                Clear all
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {pendingFiles.map((pf, index) => (
                <div key={`${pf.file.name}-${index}`} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <Input
                      value={pf.title}
                      onChange={(e) => handleTitleChange(index, e.target.value)}
                      className="h-7 text-sm"
                      placeholder="Document title"
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground truncate">
                      {pf.file.name} • {formatFileSize(pf.file.size)}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && uploadProgress > 0 && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload button */}
        <Button 
          onClick={handleUploadAll} 
          disabled={pendingFiles.length === 0 || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {pendingFiles.length > 0 ? `${pendingFiles.length} File${pendingFiles.length > 1 ? 's' : ''}` : '& Process'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
