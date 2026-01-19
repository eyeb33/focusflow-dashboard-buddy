
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface TaskInputProps {
  onAddTask: (taskName: string, estimatedPomodoros: number) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim()) {
      onAddTask(taskName, 1); // Default to 1 pomodoro
      setTaskName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="w-full h-12 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <Button 
        type="submit" 
        size="icon" 
        disabled={!taskName.trim()}
        className="h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-primary/50"
      >
        <Plus className="w-5 h-5" />
      </Button>
    </form>
  );
};

export default TaskInput;
