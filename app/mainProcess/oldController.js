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
}

class Controller {
    constructor(wordList, learnPattern, learnDoms) {
        if (wordList === undefined || wordList === {} || learnDoms === undefined || learnDoms === {}) {
            throw "wordList is empty or undefined";
        }
        if (learnPattern.length === 0 || learnPattern === undefined) {
            throw "learnPattern is empty or undefined";
        }
        this._learnDoms = learnDoms;
        this._wlName = wordList.name;
        this._wl = wordList.body;
        this._wlkeyConst = Object.keys(wordList.body);
        this._wlkeysVar = Object.keys(wordList.body);
        this._lp = learnPattern;
        this.init();
        this.next();
    }

    pause() {
        // 初始化数据
        this._lpIndex = 0;
        this._index = 0;
        this._wrongL = [];
        this._needReviewL = [];
        //
        event.removeAllListeners("doRight");
        event.removeAllListeners("doWrong");
        event.removeAllListeners("wellDone");
    }

    init() {
        // 初始化数据
        this._lpIndex = 0;
        this._index = 0;
        this._wrongL = [];
        this._needReviewL = [];
        event.on("doRight", (args) => {
            // judge end condition
            if (this._index === this._wlkeysVar.length - 1) {
                if (this._lpIndex === this._lp.length - 1) {
                    event.emit("wellDone");
                    return;
                }
                // 检查是否需要复习
                if (this._wrongL.length != 0) {
                    this._learnDoms.Phase.classList.add("review-phase");
                    event.emit("needReview");
                    return
                }
                // 恢复样式将单词表换回
                this._learnDoms.Phase.classList.remove("review-phase");
                this._wlkeysVar = this._wlkeyConst;
                this._index = 0;
                this._lpIndex += 1;
            }
            // index += 1 next & if index === words.len then lpIndex += 1; next;
            this._index += 1;
            this.next();
        });
        event.on("doWrong", (args) => {
            // judge end condition
            if (this._index === this._wlkeysVar.length - 1) {
                if (this._lpIndex === this._lp.length - 1) {
                    event.emit("wellDone");
                    return;
                }
                // 检查是否需要复习
                if (this._wrongL.length != 0) {
                    this._learnDoms.Phase.classList.add("review-phase");
                    event.emit("needReview");
                    return
                }
                // 恢复样式将单词表换回
                this._learnDoms.Phase.classList.remove("review-phase");
                this._wlkeysVar = this._wlkeyConst;
                this._index = 0;
                this._lpIndex += 1;
            }
            // wrongL[] <- words[index];  index +1; next;
            this._wrongL.push(this._wlkeysVar[this._index]);
            this._index += 1;
            this.next();
        });
        event.on("needReview", (args) => {
            this._wlkeysVar = this._wrongL;
            this._index = 0;
            this._lpIndex = 0;
            this._wrongL = [];
            // 重新开始
            this.next();
        });
        event.on("wellDone", (args) => {
            // 完成了！
            this._learnDoms.Phase.classList.remove("review-phase");
            // 是否注册提醒服务
            if (this._lp[this._lpIndex].isRegisterNotify === true) {
                let title = this._wlName;
                let content = `${this._wlName} 需要被复习<br/>`;
                for (let i=0; i<this._wlkeyConst.length; i++) {
                    content += `<p>${this._wlkeyConst[i]}</p>`
                }
                this.erollNotify(title, content);
            }
            alert("恭喜, 你已经完成了所有背诵任务!");
        });
    }

    getVoice(audioElm, word, country) {
        if (audioElm === undefined || word === undefined || country === undefined)
            throw "insufficent parms"
        let filePath = `${publicSettings["root"]}${publicSettings["voice"]}${word}.mp3`;
        if (fs.existsSync(filePath)) {
            audioElm.src = filePath;
            audioElm.play();
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
                        audioElm.play();
                    });
                })
            })
        }
    }

    next() {
        // 开始下一个词
        let curLM = this._lp[this._lpIndex];
        let curEN = this._wlkeysVar[this._index];
        let curZH = this._wl[this._wlkeysVar[this._index]];
        this._learnDoms.Phase.innerHTML = curLM.name;
        // 随机选取正确位置
        let rightPosition = parseInt(4*Math.random());
        // 1
        if (curLM.isShowQuestion === true) {
            this._learnDoms.Question.classList.remove("hide");
        } else {
            this._learnDoms.Question.classList.add("hide");
        }
        // 2
        if (curLM.questionLanguage === "EN") {
            this._learnDoms.Question.innerHTML = curEN;
        } else {
            this._learnDoms.Question.innerHTML = curZH;
        }
        // 3
        if (curLM.isPlayAudio === true) {
            // uk 1, us 2
            this.getVoice(this._learnDoms.Voice, curEN, 2);
        }
        let listOptions = () => {
            // 5
            if (curLM.isShowOptions === true) {
                this._learnDoms.Options.classList.remove("hide");
                // 选择3个错误的word放入数组
                let options = [];
                let wlLength = this._wlkeyConst.length;
                for (let i=0; i<3; i++) {
                    let r = this._wlkeyConst[parseInt(wlLength*Math.random())];
                    if (r != curEN) {
                        options.push(r);
                    } else {
                        options.push(this._wlkeyConst[parseInt(wlLength*Math.random() * wlLength*Math.random()) % (wlLength - 1)]);
                    }
                }
                options.insert(rightPosition, curEN);
                // 填充答案（生成li标签）
                removeAllChildren(this._learnDoms.Options);
                for (let i=0; i<options.length; i++) {
                    let li = document.createElement("li");
                    li.classList.add("btn","btn-option");
                    li.dataset.option = options[i];
                    li.addEventListener("click", (e) => {
                        if (e.target.dataset.option === curEN) {
                            if (curLM.isShowAnswer === true)
                                e.target.classList.add("option-right");
                            // 延迟触发事件
                            setTimeout(function(){event.emit("doRight")}, 1000);
                        } else {
                            if (curLM.isShowAnswer === true) {
                                let children = this._learnDoms.Options.childNodes;
                                children[rightPosition].classList.add("option-right");
                                e.target.classList.add('option-wrong');
                            }
                            setTimeout(function(){event.emit("doWrong")}, 2000);
                        }
                    }, { once: true })
                    // todo: 针对ZH 可以设置显示部分大意
                    if (curLM.optionLanguage === "ZH") {
                        li.innerHTML = this._wl[[options[i]]];
                    } else {
                        li.innerHTML = options[i];
                    }
                    this._learnDoms.Options.append(li);
                }
            } else {
                this._learnDoms.Options.classList.add("hide");
                setTimeout(function(){event.emit("doRight")}, 1500);
            }
        }
        // 4
        if (curLM.isShowMask === true) {
            this._learnDoms.Mask.classList.remove("hide");
            this._learnDoms.Options.classList.add("hide");
            // 加入 会 or 不会
            removeAllChildren(this._learnDoms.Mask);
            let canBtn = document.createElement("li");
            canBtn.classList.add("option");
            canBtn.innerHTML = "会";
            canBtn.addEventListener("click", (e) => {
                this._learnDoms.Mask.classList.add("hide");
                this._learnDoms.Options.classList.remove("hide");
                // 输出选项
                listOptions();
            }, {once: true});
            let noCanBtn = document.createElement("li");
            noCanBtn.classList.add("option");
            noCanBtn.innerHTML = "不会";
            noCanBtn.addEventListener("click", (e) => {
                event.emit("doWrong");
            }, {once: true});
            this._learnDoms.Mask.append(canBtn);
            this._learnDoms.Mask.append(noCanBtn);
        } else {
            this._learnDoms.Mask.classList.add("hide");
            // 输出选项
            listOptions();
        }
        // set progress
        this._learnDoms.Progress.innerHTML = `当前: ${this._index + 1} / ${this._wlkeysVar.length} | 需要复习的单词有： ${this._wrongL.length}`;
    }

    erollNotify(title, content) {
        let eroll_api = "http://120.79.222.170:3000/notice/post";
        let post = {
            "userId": 1,
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