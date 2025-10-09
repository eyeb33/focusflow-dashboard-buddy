
export interface Task {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedPomodoros?: number;
  isActive?: boolean;
  timeSpent?: number; // Total minutes spent on this task
}
