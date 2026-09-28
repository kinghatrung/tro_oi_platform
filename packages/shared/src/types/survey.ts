/** Kiểu câu hỏi khảo sát. */
export enum SurveyQuestionType {
  SINGLE_CHOICE = 'single-choice',
  MULTIPLE_CHOICE = 'multiple-choice',
  TEXT = 'text',
  RATING = 'rating'
}

/** Một lựa chọn của câu hỏi dạng chọn đáp án. */
export interface SurveyOption {
  id: string;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  title: string;
  type: SurveyQuestionType;
  /** Bắt buộc với câu hỏi dạng chọn đáp án. */
  options?: SurveyOption[];
  isRequired?: boolean;
}

/** Bài khảo sát (vd: khảo sát nhu cầu thuê trọ của sinh viên). */
export interface Survey {
  id: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  isActive: boolean;
  /** ISO 8601. */
  startsAt?: string;
  /** ISO 8601. */
  endsAt?: string;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** Câu trả lời cho một câu hỏi trong khảo sát. */
export interface SurveyAnswer {
  questionId: string;
  optionIds?: string[];
  text?: string;
  rating?: number;
}

export interface SubmitSurveyRequest {
  surveyId: string;
  answers: SurveyAnswer[];
}
