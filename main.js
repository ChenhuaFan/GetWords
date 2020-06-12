const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const url = require('url')
const Setting = require('./app/mainProcess/setting');
const fs = require('fs');

// 得到 setting
const config = Setting.getInstance().setting;
const publicSettings = config.public;
const privateSettings = config.private;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {

  // Create the browser window.
  win = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    width: 900,
    height: 750,
    minWidth: 900,
    minHeight: 750
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  if (!fs.existsSync(publicSettings["root"]))
    // fs.mkdirSync(publicSettings["root"]);
    console.log("主进程：没有根目录")
  else {
    if (!fs.existsSync(publicSettings["root"] + publicSettings["txt"]))
      fs.mkdirSync(publicSettings["root"] + publicSettings["txt"]);
    if (!fs.existsSync(publicSettings["root"] + publicSettings["voice"]))
      fs.mkdirSync(publicSettings["root"] + publicSettings["voice"]);
  }

  // set accelerator
  if (process.platform === 'darwin') {

    var template = [{

      label: 'FromScratch',

      submenu: [{

        label: 'Quit',

        accelerator: 'CmdOrCtrl+Q',

        click: function () { app.quit(); }

      }]

    }, {

      label: 'Edit',

      submenu: [{

        label: 'Undo',

        accelerator: 'CmdOrCtrl+Z',

        selector: 'undo:'

      }, {

        label: 'Redo',

        accelerator: 'Shift+CmdOrCtrl+Z',

        selector: 'redo:'

      }, {

        type: 'separator'

      }, {

        label: 'Cut',

        accelerator: 'CmdOrCtrl+X',

        selector: 'cut:'

      }, {

        label: 'Copy',

        accelerator: 'CmdOrCtrl+C',

        selector: 'copy:'

      }, {

        label: 'Paste',

        accelerator: 'CmdOrCtrl+V',

        selector: 'paste:'

      }, {

        label: 'Select All',

        accelerator: 'CmdOrCtrl+A',

        selector: 'selectAll:'

      }]

    }];

    var osxMenu = Menu.buildFromTemplate(template);

    Menu.setApplicationMenu(osxMenu);

  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
