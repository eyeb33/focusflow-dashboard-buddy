
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
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Add a new task..."
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          className="w-full focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <Button 
        type="submit" 
        size="icon" 
        disabled={!taskName.trim()}
        className="bg-red-500 hover:bg-red-600 text-white disabled:bg-red-500/50"
      >
        <Plus className="h-5 w-5" strokeWidth={3} />
      </Button>
    </form>
  );
};

export default TaskInput;
