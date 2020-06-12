const filesList = document.getElementById('filesList');
const nextPage = document.getElementById('nextPage');
const prePage = document.getElementById('prePage');
const reReload = document.getElementById('reReload');
const pageProgress = document.getElementById('page-progress');

const WordList = require("../mainProcess/wordList");
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();
const { BrowserWindow } = require('electron').remote;
const path = require('path');
const fs = require('fs');
const { shell } = require('electron')
const os = require('os')
const clipboard = require('electron').clipboard

// 得到 setting
const Setting = require('../mainProcess/setting');
const config = Setting.getInstance().setting;
const publicSettings = config.public;
const privateSettings = config.private;

(function () {

  // 变量声明
  let fileList = [];
  let txtList = [];
  let maxPage = 0;
  let index = 0;
  let itemsPerPage = publicSettings["itemsPerPage"];

  // event
  event.on("loadReady", (args) => {
    analyzeList();
    render();
  });

  // 函数声明
  function init() {
    WordList.getAllWordList((err, files) => {
      // if (err)
      //     throw err;
      fileList = files;
      event.emit("loadReady");
    });
  }

  function removeAllChildren(node) {
    while (node.hasChildNodes()) {
      node.removeChild(node.firstChild);
    }
  }

  String.prototype.isContain = function (str) {
    return this.indexOf(str) >= 0;
  }

  // 视图渲染
  function analyzeList() {
    if (!fileList) {
      return
    }
    txtList = [];
    let j = 0;
    for (let i = 0; i < fileList.length; i++) {
      if (fileList[i].isContain(".txt")) {
        j += 1;
        txtList.push(fileList[i].split(".txt")[0]);
      }
    }
    if (j % itemsPerPage != 0)
      maxPage = parseInt(j / itemsPerPage);
    else
      maxPage = parseInt(j / itemsPerPage) - 1;
    txtList.sort();
  }

  function render() {
    removeAllChildren(filesList);
    let i = index == 0 ? 0 : itemsPerPage * index - 1;
    let endIndex = itemsPerPage * (index + 1) - 1;
    endIndex = endIndex > txtList.length ? txtList.length : endIndex;
    for (i; i < endIndex; i++) {
      let li = document.createElement("li");
      li.classList.add("file-item");
      li.setAttribute("data-file", txtList[i]);
      li.innerHTML = txtList[i];
      li.addEventListener("click", (event) => {
        let filePath = `${publicSettings["root"]}${publicSettings["txt"]}${event.target.getAttribute("data-file")}.txt`
        if (!shell.showItemInFolder(filePath))
          alert("文件打开失败");
        clipboard.writeText(event.target.getAttribute("data-file"))
      })
      filesList.appendChild(li);
    }
    pageProgress.innerHTML = `当前页: ${index + 1} / ${maxPage + 1}`;
  }

  // 注册监听
  newWordListBtn.addEventListener("click", (event) => {
    // 开启新窗口
    const modalPath = path.join('file://', __dirname, '../sections/wordList/newList.html')
    let win = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true
      },
      width: 650,
      height: 700,
      minWidth: 650,
      minHeight: 700
    })
    win.on('close', () => { win = null })
    win.loadURL(modalPath)
    // win.webContents.openDevTools();
    win.show()
  })

  nextPage.addEventListener("click", (event) => {
    if (index + 1 > maxPage)
      return;
    index += 1;
    render();
  })

  prePage.addEventListener("click", (event) => {
    if (index - 1 < 0)
      return;
    index -= 1;
    render();
  })

  reReload.addEventListener("click", (event) => {
    init();
  })

  // 函数入口
  init();

})();
