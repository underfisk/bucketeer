import { StorageFile, StorageFolder } from '../../core/services/storage/storage.interfaces'

export interface CloudStorage {
    files: StorageFile[]
    folders: StorageFolder[]
    maxSpace: number 
    spaceUsed: number 
    deletedFiles: any[]
}