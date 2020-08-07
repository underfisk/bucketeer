# Bucketeer
A file management desktop application inspired by Google drive using AWS S3, Angular 10 and AWS Cognito
The UI is similar to Google drive trying to make an alternative personal application using my private S3 buckets
to sync locally with my computer

## Motivation
I was learning deeply how S3 works behind the scenes and at the same time i decided that it was a good alternative building
my own application to safely manage my private files under my private S3 bucket.
This app might can be deployed, the root S3 bucket is encrypted and not shared accross users, each Cognito user has its own 
private space.

## Install/Run
1. Clone this repo https://github.com/underfisk/bucketeer
2. Install NPM modules using yarn/npm (preferable yarn)
3. Running locally you just have to run "yarn run electron:local"
4. In order to build you simply build according to the target OS (check npm scripts)

## Contribute
Feel free to create any improvement for this application, i believe this application is really useful for some use cases
even though its not web based, it is useful to sync your desktop files with the cloud
and manage to fetch them when needed.
