export type PackAccent = "plum" | "cobalt" | "coral" | "forest" | "sand";

export type Submission = {
  id: string;
  packId: string;
  name: string;
  question: string;
  receiptCode: string;
  isQueued: boolean;
  position: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Pack = {
  id: string;
  name: string;
  slug: string;
  description: string;
  accent: PackAccent;
  isPublished: boolean;
  queue: Submission[];
  submissionCount: number;
  updatedAt: string;
  createdAt: string;
};
