import { createReducer, on } from "@ngrx/store";
import { loadLocalStorage, addLocalFile, removeLocalFile, addDirectory, removeDirectory, updateLocalFile } from "./local-storage.actions";
import { LocalStorage } from "./local-storage.interface";

export const initialState: LocalStorage = {
    files: [],
    // deletedFiles: [],
    folders: [],
    // maxSpace: 5, //1 = 1gb
    // spaceUsed: 0 //in bytes
}
 
const _reducer = createReducer(initialState,
  on(loadLocalStorage, (state, action) => {
      return {
        ...state,
        ...action.data
      } 
  }),
  on(addLocalFile, (state, action) => {
    if (action.indexOnFiles !== -1){
      const updatedFiles = [...state.files]
      updatedFiles[action.indexOnFiles] = action.file
      return {
        ...state,
        files: updatedFiles
      }
    }
    
    const files = [...state.files, action.file]
    return {
      ...state,
      files
    }
  }),
  on(removeLocalFile, (state, action) => {
    return {
      ...state,
      files: state.files.filter(e => e.key !== action.key)
    }
  }),
  on(addDirectory, (state, action) => {
    return {
      ...state,
      folders: [...state.folders, action.folder]
    }
  }),
  on(removeDirectory, (state, action) => {
    return {
      ...state,
      folders: state.folders.filter(e => e.name !== action.name)
    }
  }),
  on(updateLocalFile, (state, action) => {
    const files = [...state.files]
    const targetIndex = files.findIndex(e => e.key === action.file.key)
    if (targetIndex === -1){
      return state 
    }

    files[targetIndex] = { ...files[targetIndex], ...action.file }

    return {
      ...state,
      files
    }
  })
);
 

export function localStorageReducer(state, action) {
    return _reducer(state, action);
  }