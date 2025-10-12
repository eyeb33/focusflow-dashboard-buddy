export interface Task {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedPomodoros?: number;
  isActive?: boolean;
  timeSpent?: number; // Total minutes spent on this task
  timeSpentSeconds?: number; // Total seconds spent on this task
}
