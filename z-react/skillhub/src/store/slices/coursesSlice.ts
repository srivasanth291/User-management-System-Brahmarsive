import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Course, Module } from '../../types';
import { api, postJson } from '../../api/client';

interface CoursesState { items: Course[]; loading: boolean; error: string | null }
const initialState: CoursesState = { items: [], loading: false, error: null };

type ServerModule = { id: number; title: string; videoTitle: string; videoUrl: string; explanation: string; questions: Array<{id:number;question:string;options:Array<{id:number;text:string;isCorrect?:boolean}>}> };
function fromServerModule(m: ServerModule): Module & {id:number} {
  const quizzes = m.questions.map(question => {
    const options = question.options.map((option, index) => ({
      ...option, key: String.fromCharCode(65 + index)
    }));
    return {
      id: question.id, question: question.question,
      options: Object.fromEntries(options.map(option => [option.key, option.text])),
      optionIds: Object.fromEntries(options.map(option => [option.key, option.id])),
      correct: options.find(option => option.isCorrect)?.key || ''
    };
  });
  return {id: m.id, moduleTitle: m.title, videoTitle: m.videoTitle,
    videoUrl: m.videoUrl, blogText: m.explanation, quizzes};
}
function toServerModule(m: Module) {
  return {
    title: m.moduleTitle, videoTitle: m.videoTitle, videoUrl: m.videoUrl, explanation: m.blogText,
    questions: (m.quizzes || []).filter(q => q.question?.trim()).map(q => ({
      question: q.question,
      options: Object.entries(q.options).map(([key, text]) => ({text, isCorrect: q.correct === key}))
    }))
  };
}
async function hydrate(course: Course): Promise<Course> {
  const result = await api(`/api/courses/${course.id}/modules`);
  return {...course, modules:(result.modules || []).map(fromServerModule)};
}
export const fetchCourses = createAsyncThunk('courses/fetch', async () => {
  const result = await api('/api/courses');
  return await Promise.all((result.courses || []).map((c:Course)=>hydrate(c)));
});
export const addCourse = createAsyncThunk('courses/add', async (course: Omit<Course,'id'>) => {
  const result = await api('/api/courses', postJson({
    title: course.title, category: course.category, description: course.description,
    thumbnailUrl: course.thumbnailUrl, instructorId: course.instructorId,
    status: 'published', modules: course.modules.map(toServerModule)
  }));
  return hydrate(result.course);
});
export const updateCourse = createAsyncThunk('courses/update', async ({id,changes,updatedCourse}:{id:string|number;changes?:Partial<Course>;updatedCourse?:Partial<Course>}, { getState }) => {
  const {modules, title, category, description, thumbnailUrl, instructorId, status} = changes || updatedCourse || {};
  const original = (getState() as { courses: CoursesState }).courses.items.find(course => String(course.id) === String(id));
  if (modules && !original) throw new Error('Reload the course before editing');
  const edits = modules?.flatMap(module => {
    const previous = original?.modules.find(item => item.id === module.id);
    const payload = toServerModule(module);
    return previous && JSON.stringify(toServerModule(previous)) === JSON.stringify(payload)
      ? [] : [{id: module.id, ...payload}];
  });
  const removed = modules && original?.modules.flatMap(item =>
    item.id && !modules.some(module => module.id === item.id) ? [item.id] : []);
  const result = await api(`/api/courses/${id}`, {method:'PATCH',body:JSON.stringify({
    title, category, description, thumbnailUrl, instructorId, status, moduleEdits: edits, removedModuleIds: removed
  })});
  return await hydrate(result.course);
});
export const deleteCourse = createAsyncThunk('courses/delete',async (id:string|number)=>{await api(`/api/courses/${id}`,{method:'DELETE'});return String(id);});
const slice=createSlice({name:'courses',initialState,reducers:{clearCourses(state){state.items=[];state.error=null;}},extraReducers:builder=>{
  builder.addCase(fetchCourses.pending,state=>{state.loading=true;state.error=null;});
  builder.addCase(fetchCourses.fulfilled,(state,action)=>{state.loading=false;state.items=action.payload;});
  builder.addCase(fetchCourses.rejected,(state,action)=>{state.loading=false;state.error=action.error.message||'Unable to load courses';});
  builder.addCase(addCourse.fulfilled,(state,action)=>{state.items.unshift(action.payload);});
  builder.addCase(updateCourse.fulfilled,(state,action)=>{const i=state.items.findIndex(c=>String(c.id)===String(action.payload.id));if(i>=0)state.items[i]=action.payload;});
  builder.addCase(deleteCourse.fulfilled,(state,action)=>{state.items=state.items.filter(c=>String(c.id)!==action.payload);});
}});
export const {clearCourses}=slice.actions;
export default slice.reducer;
