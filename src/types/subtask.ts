export interface SubTask {
  id: string;
  parent_task_id: string;
  user_id: string;
  name: string;
  completed: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}
