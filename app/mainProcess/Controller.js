const EventEmitter = require("events").EventEmitter;
const event = new EventEmitter();
const request = require('superagent');
const path = require('path');
const fs = require('fs');
const http = require('http');
const Setting = require('./setting');
const coroutine = require("coroutine");

// 得到 setting
const config = Setting.getInstance().setting;
const publicSettings = config.public;
const privateSettings = config.private;

function removeAllChildren(node) {
    while(node.hasChildNodes()) 
    {  
        node.removeChild(node.firstChild);
    }  
}

Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};

Array.prototype.contains = function ( needle ) {
    for (i in this) {
        if (this[i] == needle) return true;
    }
    return false;
};

Array.prototype.removeElm = function(dx) {
    for (i in this) {
        if (this[i] == dx) 
            break;
        else
            return;
    }
    this.splice(i, 1);
};

function deepCopy(obj) {
    var result = Array.isArray(obj) ? [] : {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') {
            result[key] = deepCopy(obj[key]);   //递归复制
        } else {
            result[key] = obj[key];
        }
        }
    }
    return result;
}

Date.prototype.Format = function(fmt) {
    var o = {
        "M+" : this.getMonth() + 1,
        "d+" : this.getDate(),
        "h+" : this.getHours(),
        "m+" : this.getMinutes(),
        "s+" : this.getSeconds(),
        "q+" : Math.floor((this.getMonth() + 3) / 3),
        "S" : this.getMilliseconds()
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

HTMLDivElement.prototype.hide = function () {
    this.classList.add("hide");
};

HTMLDivElement.prototype.show = function () {
    this.classList.remove("hide");
};

HTMLDivElement.prototype.toggle = function () {
    this.classList.toggle("hide");
};

function getVoice(audioElm, word, country) {
    if (audioElm === undefined || word === undefined || country === undefined)
        throw "insufficent parms"
    let filePath = `${publicSettings["root"]}${publicSettings["voice"]}${word}.mp3`;
    if (fs.existsSync(filePath)) {
        audioElm.src = filePath;
        audioElm.load();
    } else {
        let file = '';
        http.get(`http://dict.youdao.com/dictvoice?word=${word}&country=${country}`, (res)=>{
            res.setEncoding("binary");
            res.on('data',(chunk) => {
                file += chunk;
            })
            res.on('end',() => {
                fs.writeFile(filePath, file, "binary", (err)=>{
                    if (err) throw err;
                    audioElm.src = filePath;
                    audioElm.load();
                });
            })
        })
    }
}

class Controller {

    // 构造方法 初始化数据
    constructor(wordList, learnPattern, learnDoms) {
        if (!wordList || !learnDoms) {
            throw "wordList is empty or undefined";
        }
        if (!learnPattern) {
            throw "learnPattern is empty or undefined";
        }
        // init timer
        this._startTime = Date.parse(new Date());
        // init data
        this._learnDoms = learnDoms;
        this._wlName = wordList.name;
        this._wl = wordList.body
        this._wlkeyConstList = Object.keys(wordList.body);
        this._wlkeysVarList = Object.keys(wordList.body);
        this._lp = learnPattern;
        this._isNotify = false;
        this._isFirstReview = true;
        // init index
        this._index = 0;
        this._lpIndex = 0;
        // init necessary array
        this._wrongList = [];
        // add listener
        addListener(this);
        // initPannel();
        // empty
        this._needReview = []
        // declear funcs
        function addListener(env) {
            event.on("doRight", (word) => {
                if (env._wrongList.length != 0) {
                    env._wrongList.removeElm(word);
                }
                // index + 1
                // console.log(env._wrongList);
                env._index += 1;
                env.next();
            });
            event.on("doWrong", (word) => {
                if (env._lp[env._lpIndex].name != "学习模式" && env._needReview.indexOf(word) < 0) {
                    env._needReview.push((word+'>'+env._wl[word]))
                }
                // for review 
                env._wrongList.push(word);
                // for index
                env._wrongList.push(word);
                // console.log(env._wrongList);
                // 1,2,3,4; 1,2 3,4; 1,2,1 3,4; 1,2,1,3,4;
                if (env._index < env._wlkeysVarList.length - 1) {
                    let tmp = env._wlkeysVarList.splice(env._index+2)
                    env._wlkeysVarList.push(word)
                    env._wlkeysVarList = deepCopy(env._wlkeysVarList.concat(tmp))
                    // for index+2
                    env._wrongList.push(word);
                }
                // env._index += 1;
                env.next();
            });
            event.on("doCan", (word) => {
                env._learnDoms.maskBox.hide();
                env._learnDoms.optionsBox.show();
            });
            event.on("doCant", (word) => {
                env._learnDoms.answerBox.show();
                setTimeout(function(){event.emit("doWrong", word)}, 3000);
            });
            event.on("doReview", (args) => {
                if (env._isFirstReview) {
                    // 不需要拼接，直接替换
                    env._wlkeysVarList = deepCopy(env._wrongList);
                    env._isFirstReview = false;
                } else {
                    // 非首次复习，需要把错误的题目扩充一次
                    for(var i=0, len=env._wrongList.length; i<len; i++) {
                        env._wrongList.push(env._wrongList[i]);
                    }
                    env._wlkeysVarList = deepCopy(env._wrongList);
                }
                // test 625
                // console.log(env._wlkeyConstList)
                // console.log(env._wlkeysVarList)
                // console.log(env._wrongList)
                env._wrongList = [];
                env._index = 0;
                env.next();
            });
            event.on("changeLP", (args) => {
                // test 625
                // console.log(env._wlkeyConstList)
                // 重置复习相关变量
                env._isFirstReview = false;
                env._wlkeysVarList = deepCopy(env._wlkeyConstList);
                env._index = 0;
                env._lpIndex += 1;
                env.next();
            });
            event.on("end", (args) => {
                // save review file to disk
                if (env._needReview.length != 0) {
                    fs.writeFileSync((publicSettings.root + publicSettings.txt + env._wlName + "-review" + ".txt"), env._needReview.join('\n'))
                    alert("以将过多错误的单词存入单词表：" + env._wlName + "-review")
                }
                // alert time
                let end = Date.parse(new Date());
                let time = (end - env._startTime)/1000
                alert("背词总时间："+ time +"s  平均："+time/env._wlkeyConstList.length+"s/word")
                // 是否注册提醒服务
                if (env._isNotify === true && publicSettings.email != "") {
                    let title = env._wlName;
                    let content = `${env._wlName} 需要复习<br/>`;
                    for (let i=0, len=env._wlkeyConstList.length; i<len; i++) {
                        content += `<p>${env._wlkeyConstList[i]}</p>`
                    }
                    env.erollNotify(title, content);
                }
                env._learnDoms.welldoneBox.show();
                env._learnDoms.learnAera.hide();
                return;
            });
        }
        
        function initPannel() {
            const panelBtnList = [{
                "name": "重新开始",
                "event": "click",
                "function": () => {
                    event.emit("restart");
                }
            }, {
                "name": "结束",
                "event": "click",
                "function": () => {
                    event.emit("end");
                }
            }];
            removeAllChildren(learnDoms.panelBox);
            for (let i=0, len=panelBtnList.length; i<len; i++) {
                let tempBtn = document.createElement("button");
                tempBtn.innerHTML = panelBtnList[i]["name"];
                tempBtn.classList.add("btn","btn-wrong");
                tempBtn.addEventListener(panelBtnList[i]["event"], panelBtnList[i]["function"]);
                learnDoms.panelBox.appendChild(tempBtn);
            }
        }
    }

    // next step
    next() {
        // clear structure of data; 
        let curLM = {
                "name": "",
                "isShowQuestion": "",
                "isShowQuestion": "",
                "questionLanguage": "",
                "isQuestionAudio": "",
                "isShowMaskBox": "",
                "isShowOptionBox": "",
                "optionLanguage": "",
                "isRandomOption": "",
                "isShowAnswerBox": "",
                "answerLanguage": "",
                "isAnswerAudio": "",
                "isRegisterNotify": ""
            }, 
            curWord = "";
        // init data;
        curWord = this._wlkeysVarList[this._index];
        curLM = this._lp[this._lpIndex];
        initLearnProgress(this);
        this._isNotify = curLM.isRegisterNotify == true ? curLM.isRegisterNotify : this._isNotify;
        // emit different event;
        if (this._index == this._wlkeysVarList.length) {
            if (this._wrongList.length != 0) {
                event.emit("doReview");
                return;
            } 
            else {
                if (this._lpIndex == this._lp.length - 1) {
                    event.emit("end");
                    return;
                } else {
                    event.emit("changeLP");
                    return;
                }
            }
        }
        // init dom
        initQuestionBox(this);
        initMask(this);
        initOptions(this);
        initLearnPhaseIndictor(this);
        initAnswer(this);
        // set visible as lm
        if (curLM.isQuestionAudio) {
            getVoice(this._learnDoms["questionVoice"], curWord, 2);
            this._learnDoms.questionVoice.play();
        }
        if (!curLM.isShowQuestion)
            this._learnDoms.questionBox.hide();
        else
            this._learnDoms.questionBox.show();
        if (!curLM.isShowMaskBox) {
            // 不显示遮罩层 仍需判断是否显示选项
            this._learnDoms.maskBox.hide();
            if (!curLM.isShowOptionBox)
                this._learnDoms.optionsBox.hide();
            else 
                this._learnDoms.optionsBox.show();
        } else {
            // 若显示遮罩层 则选项需要先隐藏，直道被触发 doCan 事件
            this._learnDoms.maskBox.show();
            this._learnDoms.optionsBox.hide();
        }
        if (!curLM.isShowMaskBox && !curLM.isShowOptionBox) {
            setTimeout(function(){event.emit("doRight", curWord)}, 1500);
        }
        // declear function
        function initQuestionBox (env) {
            if (curLM.questionLanguage === "EN") {
                env._learnDoms["questionContent"].classList.remove("ch-question");
                env._learnDoms["questionContent"].innerHTML = curWord;
            }
            else {
                env._learnDoms["questionContent"].classList.add("ch-question");
                env._learnDoms["questionContent"].innerHTML = env._wl[curWord];
            }
        }
        function initMask (env) {
            let mask = env._learnDoms["mask"];
            removeAllChildren(mask);
            let maskBtnList = [{
                "name": "认识",
                "event": "click",
                "function": function(e) {
                    event.emit("doCan", e.target.getAttribute("data-word"));
                }
            }, {
                "name": "不认识",
                "event": "click",
                "function": function(e) {
                    event.emit("doCant", e.target.getAttribute("data-word"));
                }
            }];
            for (let i=0, len=maskBtnList.length; i<len; i++) {
                let tempBtn = document.createElement("button");
                tempBtn.innerHTML = maskBtnList[i]["name"];
                tempBtn.classList.add("btn","btn-warning");
                tempBtn.setAttribute("data-word", curWord);
                tempBtn.addEventListener(maskBtnList[i]["event"], maskBtnList[i]["function"]);
                mask.appendChild(tempBtn);
            }
            env._learnDoms.maskBox.show();
            env._learnDoms.optionsBox.hide();
        }
        function initOptions (env) {
            let options = env._learnDoms["options"];
            let curEN = env._wlkeysVarList[env._index];
            // 随机选取正确位置
            let rightPosition = parseInt(4*Math.random());
            let optionsList = [];
            let wlLength = env._wlkeyConstList.length;
            for (let i=0; i<3; i++) {
                let r = env._wlkeyConstList[parseInt(wlLength*Math.random())];
                if (r != curEN) {
                    optionsList.push(r);
                } else {
                    optionsList.push(env._wlkeyConstList[parseInt(wlLength*Math.random() * wlLength*Math.random()) % (wlLength - 1)]);
                }
            }
            optionsList.insert(rightPosition, curEN);
            // 填充答案（生成li标签）
            removeAllChildren(env._learnDoms.options);
            for (let i=0; i<optionsList.length; i++) {
                let li = document.createElement("li");
                li.classList.add("option", "option-default");
                li.dataset.option = optionsList[i];
                li.addEventListener("click", (e) => {
                    if (e.target.dataset.option === curEN) {
                        // doright
                        if (curLM.isAnswerAudio)
                            env._learnDoms.answerVoice.play();
                        if (curLM.isShowAnswer) {
                            env._learnDoms.answerBox.show();
                        }
                        e.target.classList.add("option-right");
                        // // 为所有选项添加 英文注释
                        // for (let i=0; i<4; i++) {
                        //     children[i].innerHTML = "【"+children[i].dataset.option+"】"+children[i].innerHTML
                        // }
                        // 延迟触发事件
                        setTimeout(function(){event.emit("doRight", curWord)}, 1500);
                    } else {
                        // dowrong
                        env._learnDoms.answerVoice.play();
                        if (curLM.isShowAnswer) {
                            env._learnDoms.answerBox.show();
                        }
                        let children = env._learnDoms.options.childNodes;
                        children[rightPosition].classList.add("option", "option-right");
                        e.target.classList.add('option-wrong');
                        // 为所有选项添加 英文注释
                        for (let i=0; i<4; i++) {
                            children[i].innerHTML = "【"+children[i].dataset.option+"】"+children[i].innerHTML
                        }
                        setTimeout(function(){event.emit("doWrong", curWord)}, 2500);
                    }
                }, { once: true })
                // todo: 针对ZH 可以设置显示部分大意
                if (curLM.optionLanguage === "ZH") {
                    li.innerHTML = env._wl[[optionsList[i]]];
                } else {
                    li.innerHTML = optionsList[i];
                }
                env._learnDoms.options.append(li);
            }
        }
        function initLearnPhaseIndictor (env) {
            env._learnDoms.learnPhaseIndictor.innerHTML = curLM.name;
        }
        function initLearnProgress (env) {
            env._learnDoms.learnProgress.innerHTML = `已完成： ${env._index + 1} / ${env._wlkeysVarList.length}`
        }
        function initAnswer (env) {
            if (curLM.answerLanguage === "EN")
                env._learnDoms.answerContent.innerHTML = curWord;
            else
                env._learnDoms.answerContent.innerHTML = env._wl[curWord];
            env._learnDoms.answerBox.hide();
            getVoice(env._learnDoms["answerVoice"], curWord, 2);
        }
    }

    erollNotify(title, content) {
        let eroll_api = "http://39.108.211.73:3000/notice/post";
        let post = {
            "userId": publicSettings.email,
            "title": title,
            "content": content,
            "times": 0,
            "NextTime": new Date().Format("yyyy-MM-dd hh:mm:ss")
        };
        request
            .post(eroll_api)
            .send(post)
            .set('Accept', 'application/json')
            .end(function(err, res){
                if (res.body.code == 200) {
                    alert("已为您注册提醒服务");
                } else {
                    alert(`注册提醒服务出错，msg: ${res.body.msg}`);
                }
            });
    }
}

module.exports = Controller;