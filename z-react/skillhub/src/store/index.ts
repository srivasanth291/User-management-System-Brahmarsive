import { configureStore } from '@reduxjs/toolkit';
import courses from './slices/coursesSlice';
import { Module } from '../types';
export const store=configureStore({reducer:{courses}});
export type RootState=ReturnType<typeof store.getState>;
export type AppDispatch=typeof store.dispatch;
export interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  instructorId?: string;
  createdBy?: string;
  status?: "draft" | "published" | "archived";
  description: string;
  thumbnailUrl: string;
  modules: Module[];
}