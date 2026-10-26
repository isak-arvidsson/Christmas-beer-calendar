export type TesterId = 'isak' | 'ingrid' | 'gustav' | 'louise';

export interface Tester {
  id: TesterId;
  name: string;
  avatarColor: string;
  shortName: string;
  accentBg: string;
  favoriteStyle?: string;
}

export interface BeerDay {
  day: number; // 1 - 24
  brewery: string;
  name: string;
  style: string;
  abv: number;
  imageUrl?: string;
  systembolagetUrl: string;
  description: string;
  origin?: string;
  servingTemp?: string;
}

export interface UserRating {
  score: number; // 0.0 to 10.0 with 0.1 granularity
  notes?: string;
  flavorTags?: string[];
  ratedAt: string;
}

export type DayRatings = Partial<Record<TesterId, UserRating>>;

export type CalendarRatings = Record<number, DayRatings>;

export interface GoogleSheetConfig {
  sheetUrl: string;
  autoSync: boolean;
  lastSyncTime?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}
