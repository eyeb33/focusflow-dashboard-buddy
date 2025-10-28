import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Task } from '@/types/task';
import { Target, Plus } from 'lucide-react';

interface SessionStartModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (taskId: string | null, sessionGoal: string) => void;
  tasks: Task[];
  activeTask: Task | null;
  onQuickAddTask: (taskName: string) => Promise<string | null>;
}

export const SessionStartModal: React.FC<SessionStartModalProps> = ({
  open,
  onClose,
  onStart,
  tasks,
  activeTask,
  onQuickAddTask
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(activeTask?.id || null);
  const [sessionGoal, setSessionGoal] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleStart = () => {
    onStart(selectedTaskId, sessionGoal);
    setSessionGoal('');
    onClose();
  };

  const handleQuickAdd = async () => {
    if (!newTaskName.trim()) return;
    
    setIsAddingTask(true);
    const newTaskId = await onQuickAddTask(newTaskName);
    setIsAddingTask(false);
    
    if (newTaskId) {
      setSelectedTaskId(newTaskId);
      setNewTaskName('');
      setShowQuickAdd(false);
    }
  };

  const incompleteTasks = tasks.filter(t => !t.completed);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl shadow-soft-lg border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Target className="h-5 w-5 text-primary" />
            What will you focus on?
          </DialogTitle>
          <DialogDescription>
            Choose a task and set your intention for this session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Selection */}
          <div className="space-y-3">
            <Label>Select a task (optional)</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {incompleteTasks.length > 0 ? (
                incompleteTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`w-full p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedTaskId === task.id
                        ? 'border-primary bg-primary/5 shadow-soft'
                        : 'border-border hover:border-primary/30 hover:bg-accent/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{task.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {task.estimatedPomodoros} pomodoros · {task.timeSpent || 0} min tracked
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks available. Add one below!
                </p>
              )}
            </div>

            {/* Quick Add Task */}
            {!showQuickAdd ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickAdd(true)}
                className="w-full mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick add task
              </Button>
            ) : (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Task name..."
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  disabled={isAddingTask}
                />
                <Button 
                  onClick={handleQuickAdd} 
                  size="sm"
                  disabled={!newTaskName.trim() || isAddingTask}
                >
                  Add
                </Button>
              </div>
            )}

            {selectedTaskId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTaskId(null)}
                className="text-xs text-muted-foreground"
              >
                Clear selection
              </Button>
            )}
          </div>

          {/* Session Goal */}
          <div className="space-y-2">
            <Label htmlFor="session-goal">Session goal (optional)</Label>
            <Textarea
              id="session-goal"
              placeholder="What do you want to accomplish? (e.g., 'Write 500 words of introduction')"
              value={sessionGoal}
              onChange={(e) => setSessionGoal(e.target.value)}
              maxLength={150}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {sessionGoal.length}/150 characters
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStart} className="bg-primary">
            Start Focus Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};