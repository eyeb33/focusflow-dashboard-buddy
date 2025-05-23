
export interface Task {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completed: boolean;
  createdAt: string;
  completedPomodoros?: number;
  isActive?: boolean;
}
