const WordList = require("../mainProcess/wordList");
const LearnModel = require("../mainProcess/learnModel");
const Controller = require("../mainProcess/Controller");

// 得到 setting
const Setting = require('../mainProcess/setting');
const config = Setting.getInstance().setting;
const publicSettings = config.public;
const privateSettings = config.private;

Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};

Array.prototype.contains = function ( needle ) {
    for (i in this) {
        if (this[i] == needle) return true;
    }
    return false;
};

Array.prototype.remove = function(dx)
{
    for (i in this) {
        if (this[i] == dx) break;
    }
    this.splice(i, 1);
};

HTMLDivElement.prototype.hide = function () {
    this.classList.add("hide");
};

HTMLDivElement.prototype.show = function () {
    this.classList.remove("hide");
};

(function(args) {
    // declear element.
    const noRoot = document.getElementById("noRoot"),
        haveRoot = document.getElementById("haveRoot"),
        learnSection = document.getElementById("learnSection"),
        learnName = document.getElementById('learnName'),
        learnBtn = document.getElementById('learnBtn'),
        learnModelList = document.getElementById('learnModelList'),
        choosenLearnModelList = document.getElementById('choosenLearnModelList'),
        step1 = document.getElementById("step1"),
        step2 = document.getElementById("step2"),
        step3 = document.getElementById("step3"),
        panelBox = document.getElementById("panelBox");
    // 答题相关的dom节点
    let learn = {};

    let domsIdList = ["initBox", "learnAera", "panelBox", "learnPhaseIndictor", "questionBox", "questionContent", "questionVoice", "maskBox", "mask", "optionsBox", "options", "answerBox", "answerContent", "answerVoice", "learnProgress", "learnProgress", "welldoneBox"];
    let learnModel = LearnModel.getInstance().learnModel;
    let controller = null;
    let learnModelArr = [];
    let wordList = {};

    function init() {
        // 判断是否有 root
        if (!publicSettings.root) {
            noRoot.classList.remove('hide');
            haveRoot.classList.add("hide");
        } else {
            noRoot.classList.add('hide');
            haveRoot.classList.remove("hide");
        }
        initLearnDoms();
        initWordListInput();
        initLearnModel();
        initLearnBtn();
        initWelldoneBtn();
        initPannel();
    }

    function initLearnDoms () {
        for (let i=0, len = domsIdList.length; i<len; i++) {
            learn[domsIdList[i]] = document.getElementById(domsIdList[i]);
        }
    }
    
    function initLearnModel() {
        for (let key in learnModel) {
            let li = document.createElement("li");
            li.classList.add("btn","btn-default");
            li.innerHTML = learnModel[key].name;
            learnModelList.appendChild(li);
            // 添加监听
            li.addEventListener("click", (event) => {
                // 改变显示
                // event.target.classList.toggle("btn-right");
                // 将其推入数组中
                // if(learnModelArr.contains(learnModel[key])) {
                //     learnModelArr.remove(learnModel[key]);
                // }
                // else {
                learnModelArr.push(learnModel[key]);
                // 推入数组，设置按钮渲染。并添加响应事件
                let child = document.createElement("li")
                child.classList.add("btn","btn-warning");
                child.innerHTML = learnModel[key].name;
                choosenLearnModelList.appendChild(child);
                child.addEventListener("click", (event) => {
                    learnModelArr.remove(learnModel[key]);
                    // 点击删除自己
                    // alert(event.currentTarget)
                    console.log(event.currentTarget)
                    console.log(learnModelArr)
                    let self = event.currentTarget
                    self.parentNode.removeChild(self);
                })
                // }
                // 数组不为空，则 让按钮可用
                if (learnModelArr.length != 0) {
                    learnBtn.classList.remove('btn-disabled');
                    learnBtn.classList.add("btn", "btn-right");
                    learnBtn.removeAttribute("disabled");
                } else {
                    learnBtn.classList.add('btn-disabled');
                    learnBtn.setAttribute("disabled", true);
                }
            })
        }
    }

    function initWelldoneBtn() {
        learn.welldoneBox.addEventListener("click", (event) => {
            learn.welldoneBox.hide();
            learn.initBox.show();
            // reset data.
            controller = null;
            location.reload();
        });
    }

    function initLearnBtn() {
        // learnBtn 逻辑交互部分
        learnBtn.addEventListener('click', (event) => {
            controller = new Controller(wordList.wordList, learnModelArr, learn);
            // prepare view
            learn.initBox.hide();
            learn.learnAera.show();
            // call next() start to learn
            // controller.next(learn);
            controller.next();
        });
    }

    function initWordListInput () {
        learnName.addEventListener('change', (event) => {
            let list = []
            for (let i =0, len=learnName.files.length; i<len; i++) {
                list.push((learnName.files)[i].name)
            }
            // if (WordList.isExist(learnName.value)) {
            //     step2.classList.remove("hide");
            //     step3.classList.remove("hide");
            //     learnSection.classList.remove("how-to-use");
            //     wordList = new WordList(learnName.value);
            // } else {
            //     step2.classList.add("hide");
            //     step3.classList.add("hide");
            //     learnSection.classList.add("how-to-use");
            //     wordList = {};
            // }
            if (list.length > 0) {
                step2.classList.remove("hide");
                step3.classList.remove("hide");
                learnSection.classList.remove("how-to-use");
                wordList = new WordList(list);
            } else {
                step2.classList.add("hide");
                step3.classList.add("hide");
                learnSection.classList.add("how-to-use");
                wordList = {};
            }
        });
    }

    function initPannel() {
        const panelBtnList = [{
            "name": "终止",
            "event": "click",
            "function": () => {
                // set style.
                learn.initBox.show();
                learn.learnAera.hide();
                // reset data.
                controller = null;
                location.reload();
            }
        }];
        for (let i=0, len=panelBtnList.length; i<len; i++) {
            let tempBtn = document.createElement("button");
            tempBtn.innerHTML = panelBtnList[i]["name"];
            tempBtn.classList.add("btn","btn-wrong");
            tempBtn.addEventListener(panelBtnList[i]["event"], panelBtnList[i]["function"]);
            learn.panelBox.appendChild(tempBtn);
        }
    }

    // 入口函数
    init();

})("Eve");

