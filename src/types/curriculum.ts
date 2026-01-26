export interface CurriculumTopic {
  id: string;
  topicId: string;
  category: string;
  name: string;
  subtopics: string[];
  sortOrder: number;
}

export interface TopicSession {
  id: string;
  userId: string;
  topicId: string;
  topicName: string;
  totalTimeSeconds: number;
  lastAccessed: string | null;
  completedSubtopics: string[];
  isActive: boolean;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  activeSubtopic: string | null; // Currently selected subtopic for study
}

export interface CurriculumCategory {
  name: string;
  topics: CurriculumTopic[];
  isExpanded: boolean;
}

export interface TopicWithSession {
  topic: CurriculumTopic;
  session: TopicSession | null;
  progressPercent: number;
  isActive: boolean;
}
