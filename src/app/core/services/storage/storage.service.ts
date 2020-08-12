import { Injectable } from '@angular/core';
import AWS from 'aws-sdk'
import {  StorageUploadFile, StorageFolder, StorageFile } from './storage.interfaces'
import dayjs from 'dayjs'
import { convertBytes, getFileExtension } from './file.utils'
import rxjs from 'rxjs'
import { FileUpload } from '../../../dashboard/dashboard.component';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private identityId?: string
  private idToken!: string
  private readonly bucketName = process.env.S3_BUCKET_NAME
  private readonly region = process.env.S3_REGION
  private s3!: AWS.S3


  getAdapter() {
      return this.s3
  }

  setIdentityId(id: string){
      this.identityId = id
  }

  getIdentityId(){
      if (!this.identityId){
          console.error("No identity id found for the user, we have to act on this")
          return ''
      }
      return this.identityId
  }

  init(idToken: string){
      AWS.config.region = this.region;
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
          Logins: {
              [process.env.COGNITO_LOGIN_URL]: idToken
          },
      });
      AWS.config.getCredentials(err => { if (err){ console.error(err)}})

      this.setIdentityId((AWS.config.credentials as any).identityId)
      this.idToken = idToken
      this.s3 = new AWS.S3({
          apiVersion: '2006-03-01',
          params: {Bucket: this.bucketName},
      });
      
      return this.s3
  }

  async getRootObjects(): Promise<{ fileObjects: AWS.S3.Object[], foldersObjects: AWS.S3.CommonPrefixList, deletedFiles: AWS.S3.DeleteMarkerEntry[] }>{
      try {
          const data = await this.s3.listObjectsV2({  
              Bucket: this.bucketName, 
              Prefix: this.getIdentityId() + "/", Delimiter: '/',
          }).promise()
          
          const deleted = await this.s3.listObjectVersions({ 
              Bucket: this.bucketName, 
              Prefix:this.getIdentityId() + "/" 
          }).promise()
          const latestDeleted = deleted.DeleteMarkers?.filter(e => e.IsLatest) || []
          return { fileObjects: data.Contents ?? [], foldersObjects: data.CommonPrefixes ?? [], deletedFiles: latestDeleted}
      }
      catch(ex){
          return { fileObjects: [], foldersObjects: [], deletedFiles: []} 
      }
  }

  cleanFolderName(name: string){
      return name.replace(this.identityId!, '').replace(/\//g, '').trim()
  }


  getFoldersFromObjects({ fileObjects, foldersObjects}: {fileObjects: AWS.S3.Object[], foldersObjects: AWS.S3.CommonPrefixList }){
      const folders: StorageFolder[] = []
      const files: StorageFile[] = []
      
      for(const folder of foldersObjects){
          folders.push({
              files: [],
              folders: [],
              createdAt: dayjs(),
              key: folder.Prefix as string,
              name: this.cleanFolderName(folder.Prefix as string)
          })
      }

      for(const file of fileObjects){
          files.push({
              key: file.Key as string,
              name: this.cleanFolderName(file.Key as string),
              createdAt: dayjs(),
              size: file.Size ?? 0,
              prettySize: convertBytes(file.Size ?? 0),
              extension: getFileExtension(file.Key!),
              lastModifiedAt: dayjs(file.LastModified)
          })
      }
      return { files, folders }
  }

  async upload(upload: FileUpload, abortSubject: rxjs.Subject<FileUpload>, onProgressChange: (percentage: number) => void): Promise<string | null> {
      const stream = this.s3.upload({
          Key: `${this.identityId}/${upload.name}`,
          Body: upload.buffer,
          ContentLength: upload.size,
          ContentType: upload.type,
          Bucket: this.bucketName
      })
      abortSubject.subscribe(signal => {
          if (signal){
              stream.abort()
              abortSubject.unsubscribe()
          }
      })
      stream.on('httpUploadProgress', progress => {
            const percentage = Math.round((progress.loaded / progress.total * 100))
          onProgressChange(percentage)
      })
      try {
          const result = await stream.promise()
          return result.Key
      }
      catch(ex){
          if (!ex?.message.includes('abort')){
              console.error(ex)
          }
          return null
      }
  }

  async deleteFile(key: string): Promise<{ success: boolean, error?: string}> {
      try {
          const result = await this.s3.deleteObject({
              Bucket: this.bucketName,
              Key: key
          }).promise()

          this.s3.deleteObjectTagging()
          console.log("Delete file result")
          console.log(result)
          return { success: true }
      }
      catch(ex){
          return { success: false, error: ex.message }
      }
  }

  async renameFile(file: StorageFile, name: string): Promise<{ success: boolean, error?: string, file?: StorageFile }> {
      try {
          console.log("Renaming from ")
          console.log({ file, name})
          const newKey = `${this.identityId}/${name}`
          console.log({
              newKey,
              oldKey: file.key
          })
          const result = await this.s3.copyObject({
              CopySource: `${this.bucketName}/${this.identityId}/${file.name}`, //file.key,
              Key: newKey,
              Bucket: this.bucketName
          }).promise()

          const deleteOld = await this.deleteFile(file.key)
          if (!deleteOld.success){
              console.error("Error deleting the old, revert the copy")
              console.log(deleteOld.error)
          }

          console.log(result)
          return { success: true, file: { ...file, key: newKey, name } }
      }
      catch(ex){
          return { success: false, error: ex.message }
      }
  }

  async getObjectBody(key: string): Promise<any> {
      try {
        const result = await this.s3.getObject({ 
            Bucket: this.bucketName,
            Key: key,
        }).promise()
        return result.Body
      }
      catch(ex){
          return null 
      }
  }

  /**@todo Not working yet, please view https://docs.aws.amazon.com/AmazonS3/latest/dev/DeleteMarker.html */
  async recoverFile(key: string): Promise<{ success: boolean, error?: string}> {
      try {
          const result = await this.s3.listObjectVersions({
              Bucket: this.bucketName,
              Prefix: this.getIdentityId() + "/" + this.cleanFolderName(key) 
          }).promise()
          if (result.DeleteMarkers!.length > 0){
              for(const marker of result.DeleteMarkers!){
                  if (marker.IsLatest){
                      console.log("Deleting the latest marker")
                      console.log(marker)
                      const res = await this.s3.deleteObject({
                          Key: marker.Key!,
                          Bucket: this.bucketName,
                          VersionId: marker.VersionId
                      }).promise()
                      console.log({
                          Marker: res.DeleteMarker,
                          Charged: res.RequestCharged,
                          Vers: res.VersionId
                      })
                      console.log(res)
                  }
              }
          }
          // const result = await this.s3.restoreObject({
          //     Bucket: this.bucketName,
          //     Key: key,
          //     // Key: "eu-west-2:1fdf2733-7ebe-43ca-b859-de2164d2e422/04-wallpaper_macos-mojave.jpg",
              
          // }).promise()
          console.log("Recover result")
          console.log(result)
          return { success: true }
      }
      catch(ex){
          return { success: false, error: ex }
      }
  }

  async permanentDeleteFile(key: string){
      return true 
  }
}
