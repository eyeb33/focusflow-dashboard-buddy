
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface TaskInputProps {
  onAddTask: (taskName: string, estimatedPomodoros: number) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim()) {
      onAddTask(taskName, estimatedPomodoros);
      setTaskName('');
      setEstimatedPomodoros(1);
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
          className="w-full"
        />
      </div>
      <div className="w-24">
        <Input
          type="number"
          min="1"
          max="10"
          value={estimatedPomodoros}
          onChange={(e) => setEstimatedPomodoros(parseInt(e.target.value) || 1)}
          className="w-full"
          aria-label="Estimated pomodoros"
        />
      </div>
      <Button type="submit" size="icon" disabled={!taskName.trim()}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default TaskInput;
