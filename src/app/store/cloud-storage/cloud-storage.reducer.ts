import { createReducer, on } from "@ngrx/store";
import { initializeStorage, fileUploaded } from "./cloud-storage.actions";
import { CloudStorage } from "./cloud-storage.interface";

export const initialState: CloudStorage = {
    files: [],
    deletedFiles: [],
    folders: [],
    maxSpace: 5, //1 = 1gb
    spaceUsed: 0 //in bytes
}
 
const _reducer = createReducer(initialState,
  on(initializeStorage, (state, action) => {
    const spaceUsed = action.data.files.reduce((prev, val) => prev + val.size , 0)
      return {
        ...state,
        ...action.data,
        spaceUsed
      } 
  }),
  on(fileUploaded, (state, action) => {
    if (action.indexOnFiles !== -1){
      const updatedFiles = [...state.files]
      updatedFiles[action.indexOnFiles] = action.file
      return {
        ...state,
        files: updatedFiles,
        spaceUsed: updatedFiles.reduce((prev, val) => prev + val.size , 0)
      }
    }
    
    const files = [...state.files, action.file]
    const spaceUsed = files.reduce((prev, val) => prev + val.size , 0)
    return {
      ...state,
      files,
      spaceUsed
    }
  })
);
 

export function cloudStorageReducer(state, action) {
    return _reducer(state, action);
  }