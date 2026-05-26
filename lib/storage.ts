"use client";

export interface Progress {
  known: string[];
  learning: string[];
  quizResults: { wordId: string; correct: boolean; date: string }[];
  streak: number;
  lastStudied: string | null;
}

const STORAGE_KEY = "vocabflow_progress";

const defaultProgress: Progress = {
  known: [],
  learning: [],
  quizResults: [],
  streak: 0,
  lastStudied: null,
};

export function getProgress(): Progress {
  if (typeof window === "undefined") return defaultProgress;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: Progress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markAsKnown(wordId: string): void {
  const progress = getProgress();
  progress.known = Array.from(new Set([...progress.known, wordId]));
  progress.learning = progress.learning.filter((id) => id !== wordId);
  saveProgress(progress);
}

export function markAsLearning(wordId: string): void {
  const progress = getProgress();
  progress.learning = Array.from(new Set([...progress.learning, wordId]));
  progress.known = progress.known.filter((id) => id !== wordId);
  saveProgress(progress);
}

export function unmark(wordId: string): void {
  const progress = getProgress();
  progress.known = progress.known.filter((id) => id !== wordId);
  progress.learning = progress.learning.filter((id) => id !== wordId);
  saveProgress(progress);
}

export function recordQuizResult(wordId: string, correct: boolean): void {
  const progress = getProgress();
  progress.quizResults.push({ wordId, correct, date: new Date().toISOString() });
  updateStreak(progress);
  saveProgress(progress);
}

function updateStreak(progress: Progress): void {
  const today = new Date().toDateString();
  if (progress.lastStudied === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  progress.streak = progress.lastStudied === yesterday ? progress.streak + 1 : 1;
  progress.lastStudied = today;
}

export function resetProgress(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
