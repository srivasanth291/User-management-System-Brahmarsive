import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Course, Module } from '../../types';
import { api, postJson } from '../../api/client';

interface CoursesState { items: Course[]; loading: boolean; error: string | null }
const initialState: CoursesState = { items: [], loading: false, error: null };

type ServerModule = { id: number; title: string; videoTitle: string; videoUrl: string; explanation: string; questions: Array<{id:number;question:string;options:Array<{id:number;text:string;isCorrect?:boolean}>}> };
function fromServerModule(m: ServerModule): Module & {id:number} {
  const keys = ['A','B','C'] as const;
  return { id:m.id, moduleTitle:m.title, videoTitle:m.videoTitle, videoUrl:m.videoUrl, blogText:m.explanation,
    quizzes:m.questions.map(q => ({id:q.id,question:q.question, options:Object.fromEntries(keys.map((key,i)=>[key,q.options[i]?.text || ''])) as {A:string;B:string;C:string}, optionIds:Object.fromEntries(keys.map((key,i)=>[key,q.options[i]?.id])), correct:(keys.find((_,i)=>q.options[i]?.isCorrect) || '') as 'A'|'B'|'C'|''})) } as Module & {id:number};
}
function toServerModule(m: Module) {
  return {title:m.moduleTitle,videoTitle:m.videoTitle,videoUrl:m.videoUrl,explanation:m.blogText,
    questions:(m.quizzes || []).filter(q=>q.question?.trim()).map(q=>({question:q.question,options:(['A','B','C'] as const).map(k=>({text:q.options[k],isCorrect:q.correct===k}))}))};
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
  const result = await api('/api/courses',postJson({title:course.title,category:course.category,description:course.description,thumbnailUrl:course.thumbnailUrl,instructorId: course.instructorId}));
  const id = result.course.id;
  try {
    for (const module of course.modules || []) await api(`/api/courses/${id}/modules`,postJson(toServerModule(module)));
    await api(`/api/courses/${id}`,{method:'PATCH',body:JSON.stringify({status:'published'})});
    return await hydrate({...result.course,status:'published'});
  } catch (error) {
    // A draft remains available for repair; never pretend the publish succeeded.
    throw error;
  }
});
export const updateCourse = createAsyncThunk('courses/update', async ({id,changes,updatedCourse}:{id:string|number;changes?:Partial<Course>;updatedCourse?:Partial<Course>}) => {
  const patch = changes || updatedCourse || {};
  const result = await api(`/api/courses/${id}`,{method:'PATCH',body:JSON.stringify(Object.fromEntries(Object.entries({title:patch.title,category:patch.category,description:patch.description,thumbnailUrl:patch.thumbnailUrl,...('instructorId' in patch? { instructorId: patch.instructorId }: {}),...('status' in patch ? {status:(patch as any).status}: {})}).filter(([,v])=>v!==undefined)))});
  // Existing module editing must update server records rather than silently overwrite local state.
  if (patch.modules) {
    const existing = (await api(`/api/courses/${id}/modules`)).modules || [];
    for (const module of existing) await api(`/api/modules/${module.id}`,{method:'DELETE'});
    for (const module of patch.modules) await api(`/api/courses/${id}/modules`,postJson(toServerModule(module)));
  }
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
