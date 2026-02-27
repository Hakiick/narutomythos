export type Locale = 'en' | 'fr';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
