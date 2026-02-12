import { useState, KeyboardEvent } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SubTaskInputProps {
  onAddSubTask: (name: string) => Promise<string | null>;
}

export function SubTaskInput({ onAddSubTask }: SubTaskInputProps) {
  const [subTaskName, setSubTaskName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!subTaskName.trim()) return;

    setIsAdding(true);
    await onAddSubTask(subTaskName.trim());
    setSubTaskName('');
    setIsAdding(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <Input
        type="text"
        placeholder="Add a sub-task..."
        value={subTaskName}
        onChange={(e) => setSubTaskName(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isAdding}
        className="flex-1 text-sm bg-background/50"
      />
      <Button
        onClick={handleAdd}
        disabled={!subTaskName.trim() || isAdding}
        size="sm"
        variant="ghost"
        className="shrink-0"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
