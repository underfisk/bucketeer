import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import installExtension, { REDUX_DEVTOOLS } from 'electron-devtools-installer';
import * as fs from 'fs'
import * as chokidar from 'chokidar'
import { debounce } from 'lodash'
import * as trash from 'trash'

let win: BrowserWindow = null;
let activeWatcher: chokidar.FSWatcher

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  // const electronScreen = screen;
  // const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    // x: 0,
    // y: 0,
    // width: size.width,
    // height: size.height,
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: serve,
    },
  });

  if (serve) {
    win.webContents.openDevTools();
    require('devtron').install();
    installExtension(REDUX_DEVTOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err));
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');

  } else {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {

  app.allowRendererProcessReuse = true;
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  app.on('ready', () => {
    const getChildFiles = childPath => {
      let names = fs.readdirSync(childPath);
      let childFiles = [];
      names.map(name => {
        let fullpath = path.join(childPath, name);
        let stat = fs.statSync(fullpath);
        if (!stat.isDirectory()) {
          childFiles.push({
            name: name,
            fullpath: fullpath,
            size: stat.size,
            createdAt: stat.birthtime
          });
        }
      });
      return childFiles;
    };
    
    const createDirectoryItem = (name, fullpath, stat) => {
      return {
        name: name,
        fullpath: fullpath,
        createdAt: stat.birthtime
      };
    };
    
    const getChildDirectories = folderPath => {
      let names = fs.readdirSync(folderPath);
      let children = [];
      names.map(name => {
        let fullpath = path.join(folderPath, name);
        let stat = fs.statSync(fullpath);
        if (stat.isDirectory()) {
          children.push(createDirectoryItem(name,fullpath, stat));
        }
      });
      return children;
    };

    function ensureDirExistsAndWritable(dir) {
      if (fs.existsSync(dir)) {
          try {
              fs.accessSync(dir, fs.constants.W_OK)
          } catch (e) {
              console.error('Cannot access directory')
              return false
          }
      }
      else {
          try {
              fs.mkdirSync(dir)
          }
          catch (e) {
              if (e.code == 'EACCES') {
                  console.log('No permissions on the target dir')
                  return false
              }
              else {
                  console.log(e.code)
              }
              return false
          }
      }
      return true
  }
    const CACHED_FOLDER_PATH = __dirname + '/__cached__'


  ipcMain.on('delete-file', async (e, args) => {
    try {
      await trash(' the file path')
      //TODO send the data
      e.sender.send('file-deleted' )
    }
    catch(ex){
      console.error(ex)
      //TODO send the error and the file
      e.sender.send('delete-file-error')
    }
  })

    ipcMain.on('close-directory', () => {
      if (activeWatcher){
        return activeWatcher.close()
      }
    })

    ipcMain.on('load-directory', (e, args) => {
      /**
       * @todo use fs.Watch to see if the directory changes so we can notify in the app
       * E.g: if user deletes the directory we show an alert
       */
      console.log("Loading the user directory..")
      const DEFAULT_PATH = 'bucketeer'
      const targetDirectory = args.userDirectoryPath || DEFAULT_PATH
      //Ensure the directory exists or create
      const isOkay = ensureDirExistsAndWritable(targetDirectory)

      if (!isOkay){
        return e.sender.send('directory-error', {
          files: [],
          folders: [],
          path
        })
      }

      //Read what's inside that directory (files and folders)
      const folders = getChildDirectories(targetDirectory)
      const files = getChildFiles(targetDirectory)
      //Start a watcher dedicated 
      activeWatcher = chokidar.watch(targetDirectory, { 
        ignoreInitial: true, 
        awaitWriteFinish: true,
        alwaysStat: true,
        followSymlinks: false,
        depth: 1
      })
      activeWatcher
        .on('add', (addedPath, state) => {
          const name = addedPath.replace(targetDirectory,'').replace('/', '')
          e.sender.send('root-file-created', { 
            name, 
            path: addedPath, 
            size: state.size, 
            createdAt: state.birthtime 
          })
        })
        .on('addDir', (folderPath, stats) => {
          const folderName = folderPath.replace(targetDirectory,'').replace('/', '')
          e.sender.send('directory-created', { 
            name: folderName,
            path: folderPath, 
            size: stats.size, 
            createdAt: stats.birthtime 
          })
        })
        .on('change', (changedpath, stats) => {
          e.sender.send('root-file-changed', {
            path: changedpath,
            size: stats.size
          })
        })
        .on('unlinkDir', folderName => {
          //Get the name
          const target = folderName.split(targetDirectory)
          e.sender.send('directory-removed', target[1].replace('/', ''))
        })
        .on('unlink',fileName => {
          e.sender.send('root-file-deleted', fileName.replace('/', ''))
        })

        e.sender.send('directory-loaded', { files, folders })
    })

    // ipcMain.on('fetch-cached-file', async (e, args) => {
    //   console.log("Fetching cached file")
    //   const cachedFile = fs.readFileSync(path.join(CACHED_FOLDER_PATH, '/' + args.key ))
    //   if (cachedFile){
    //     console.log("CACHED KEY FOUND")
    //     console.log(cachedFile)
    //   }
    //   e.sender.send('fetch-cached-file-complete', { key: args.key, data: cachedFile })
    // })
    ipcMain.on('cache-file-locally',  (e, args) => {
      console.log("Saving in cache")
      // try {
      //   fs.writeFileSync(path.join(CACHED_FOLDER_PATH, '/' + args.key), args.data)
      //   e.sender.send('save-cached-file-complete')
      // }
      // catch(ex){
      //   console.error("Fail caching")
      //   e.sender.send('save-cached-file-error')
      // }
    })
  })
} catch (e) {
  // Catch Error
  // throw e;
}
