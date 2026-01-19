import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Clock,
  Database
} from 'lucide-react';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { formatDistanceToNow } from 'date-fns';

const StatusBadge: React.FC<{ status: Document['status'] }> = ({ status }) => {
  switch (status) {
    case 'ready':
      return (
        <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return null;
  }
};

const DocumentRow: React.FC<{
  document: Document;
  onReprocess: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ document, onReprocess, onDelete }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="p-2 bg-primary/10 rounded-lg">
        <FileText className="h-6 w-6 text-primary" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">{document.title}</h4>
          <StatusBadge status={document.status} />
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{document.file_name}</span>
          <span>•</span>
          <span>{formatFileSize(document.file_size)}</span>
          {document.total_chunks > 0 && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {document.total_chunks} chunks
              </span>
            </>
          )}
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
          </span>
        </div>
        
        {document.error_message && (
          <p className="text-xs text-destructive mt-1">{document.error_message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {(document.status === 'error' || document.status === 'ready') && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onReprocess(document.id)}
            title="Reprocess document"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onDelete(document.id)}
          title="Delete document"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const DocumentList: React.FC = () => {
  const { documents, isLoading, reprocessDocument, deleteDocument } = useDocuments();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading documents...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Curriculum Documents
        </CardTitle>
        <CardDescription>
          {documents.length === 0 
            ? 'No documents uploaded yet. Upload curriculum PDFs to enhance AI tutor responses.'
            : `${documents.length} document${documents.length === 1 ? '' : 's'} • ${documents.filter(d => d.status === 'ready').reduce((acc, d) => acc + d.total_chunks, 0)} total chunks indexed`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No curriculum documents yet</p>
            <p className="text-sm">Upload the Edexcel specification to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onReprocess={reprocessDocument}
                onDelete={deleteDocument}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
