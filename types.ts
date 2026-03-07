export interface Badge {
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface Account {
  'Tên tài khoản': string;
  Email: string;
  'Mật khẩu': string;
  'Voucher'?: string;
  'Danh hiệu'?: string;
  'Đã xác minh'?: string;
  'Vai trò'?: string;
  'Tuổi'?: number;
  'Tổng số câu hỏi đã làm'?: number;
  'Tổng số câu hỏi đã làm đúng'?: number;
  'Tổng số câu hỏi đã làm trong tuần'?: number;
  'Tổng số câu hỏi đã làm đúng trong tuần'?: number;
  Tokens?: number;
  'Tổng thời gian học'?: number;
  'Thời gian học hôm nay'?: number;
  'Ngày cập nhật học'?: string;
  Money?: number;
  AvatarURL?: string;
  'Thông tin mô tả'?: string;
  'Môn học'?: string;
  Goal?: string;
  'Tiêu chí 1'?: string | null;
  'Tiêu chí 2'?: string | null;
  'Tiêu chí 3'?: string | null;
  'Tiêu chí 4'?: string | null;
  'Tiêu chí 5'?: string | null;
  'Tiêu chí 6'?: string | null;
}

export interface AnatomyQuestion {
  ID: string;
  Question_Text: string;
  Image_URL: string;
  Correct_Coordinates: string;
  type?: string;
}

export interface MedicalQuestion {
  ID: string;
  Question_Text: string;
  Option_A: string;
  Option_B: string;
  Option_C: string;
  Option_D: string;
  Correct_Answer: 'A' | 'B' | 'C' | 'D';
  Explanation: string;
  Specialty?: string;
  Paragraph?: string;
  GroupID?: string;
  Image_URL?: string;
  type?: string;
}

export type AnyQuestion = AnatomyQuestion | MedicalQuestion;

export interface DocumentData {
  title: string;
  author: string;
  category: string;
  pages: number;
  imageUrl: string;
  documentUrl: string;
  uploader: string;
  uploadDate: string;
}

export interface ScientificArticle {
  ID: string;
  SM_DOI: string;
  Title: string;
  Authors: string;
  Abstract: string;
  Keywords: string;
  Category: string;
  DocumentURL: string;
  SubmitterEmail: string;
  SubmissionDate: string;
  Status: 'Pending' | 'Approved' | 'Rejected' | string;
  Feedback: string;
  Price?: string;
  Part?: string;
}

export interface ForumPost {
  ID: string;
  Title: string;
  Content: string;
  AuthorEmail: string;
  AuthorName: string;
  Channel: string;
  Timestamp: string;
  Upvotes: string;
  UpvotedBy: string;
  ImageURLs?: string; 
}

export interface ForumComment {
  ID: string;
  PostID: string;
  ParentID: string;
  Content: string;
  AuthorEmail: string;
  AuthorName: string;
  Timestamp: string;
  ImageURLs?: string;
}

export interface CustomQuizQuestion {
  id: string;
  questionText: string;
  imageUrl?: string;
  options: { text: string }[];
  correctAnswerIndex: number;
}

export interface QuizResult {
  participantName: string;
  score: number;
  totalQuestions: number;
  participantEmail: string;
  answers: { [key: number]: number };
  timestamp?: string;
}

export interface UserQuiz {
  quizId: string;
  title: string;
  description: string;
  authorEmail: string;
  questions: CustomQuizQuestion[];
  results: QuizResult[];
  isFree: boolean;
  oneAttemptOnly: boolean;
  createdAt?: string;
  price?: number;
  category?: string;
  difficulty?: 'Dễ' | 'Trung bình' | 'Khó' | string;
  timeLimit?: number;
  attemptsCount?: number;
}

export interface Classroom {
  ClassID: string;
  ClassName: string;
  Subject: string;
  Description: string;
  CreatorEmail: string;
  JoinCode: string;
  memberCount?: number;
  quizCount?: number;
}

export interface ClassMember {
  email: string;
  name: string;
}

export interface AssignedQuiz {
  quizId: string;
  title: string;
  questionCount: number;
  results: QuizResult[];
  dueDate: string;
  dateAssigned: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
}

export interface Course {
  ID: string;
  Title: string;
  Authors: string;
  Abstract: string;
  Keywords: string;
  Category: string;
  SubmissionDate: string;
  Price: number;
  ImageURL: string;
  For?: string;
  Update?: string;
  Expiry?: string;
  Sales?: string;
  Goal?: string;
  MainTeacher?: string;
}

export interface Book {
  ID: string;
  Title: string;
  Authors: string;
  Abstract: string;
  Category: string;
  SubmissionDate: string;
  Price: number;
  ImageURL: string;
  DemoFileURL: string;
  Saled: number;
  Pages: number;
  MoreImageURLs: string[];
  Coupon: string;
}

export interface NewStudentCredential {
  name: string;
  email: string;
  password?: string;
}
