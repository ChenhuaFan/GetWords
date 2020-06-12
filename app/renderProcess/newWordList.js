(function() {
    const newWlOl = document.getElementById("newWlOl");
    const newWlInput = document.getElementById("newWlInput");
    const newWlBtn = document.getElementById("newWlBtn");
    const newWlSaveBtn = document.getElementById("newWlSaveBtn");
    const newWlFileInput = document.getElementById("newWlFileInput");
    const newWlSaveFileBtn = document.getElementById("newWlSaveFileBtn");

    const WordList = require("../mainProcess/wordList");
    const EventEmitter = require('events').EventEmitter; 
    const request = require('superagent');
    const event = new EventEmitter();

    // 得到 setting
    const Setting = require('../mainProcess/setting');
    const config = Setting.getInstance().setting;
    const publicSettings = config.public;
    const privateSettings = config.private;

    let curWord = "";
    let curMean = "";
    let fileName = "";
    let newWordList = {};
    let isUnSavedWord = false;

    newWlInput.focus();

    let calSign = (str) => {
        var crypto = require('crypto');
        var h = crypto.createHash('md5');
        h.update(str);
        return (h.digest('hex')).toLocaleUpperCase(); //'11eb1cc525474f34a4eaf2ebc90d421f'
    }

    let getExplanation = (word, wordList) => {
        let sign = calSign(privateSettings["dic_id"] + word + "2" + privateSettings["dic_key"]);
        request
            .post(privateSettings["dic_api_http"])
            .type('form')
            .send({"q": word})
            .send({"from": "EN"})
            .send({"to": "zh-CHS"})
            .send({"appKey": privateSettings["dic_id"]})
            .send({"salt": "2"})
            .send({"sign": sign})
            .end((err, res) => {
                try {
                    let body = res.body.basic.explains
                    let tempI = 0
                    temp = []
                    tempI = 0
                    // wordList[word] = ().join(privateSettings["mean-split-flag"]);
                    for(let i=0, len=body.length; i<len; i++) {
                        if (body[i].indexOf(")人名；") > -1 || body[i].indexOf("的三单形式）") > -1 || body[i].indexOf("的现在分词）") > -1) {
                            continue
                        } else {
                            // console.log(mean[i] + " | " + i)
                            temp[tempI] = body[i]
                            tempI += 1
                        }
                    }
                    wordList[word] = temp.join(privateSettings["mean-split-flag"])
                } catch (error) {
                    wordList[word] = res.body.translation;
                }
                event.emit("olChange");
            })
    }

    function removeAllChildren(node) {
        while(node.hasChildNodes()) 
        {  
            node.removeChild(node.firstChild);  
        }  
    }

    let enterToType = (event) => {
        curWord = event.target.value;
        if((event.keyCode || event.which) == 13){
            addWord(curWord);
        }
    }

    let changeWrongWord = (event) => {
        // 更改状态
        isUnSavedWord = true;
        let target = event.target;
        let value = target.innerHTML;
        target.innerHTML = "";
        let input = document.createElement("input")
        input.value = value;
        input.type = "text";
        input.classList.add("change-input");
        input.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        input.addEventListener("keyup", (event) => {
            curWord = event.target.value;
            if((event.keyCode || event.which) == 13){
                changeWord(value, curWord);
                isUnSavedWord = false;
                newWlInput.focus();
            }
        });
        target.appendChild(input);
        input.focus();
    }

    let changeWrongMean = (event) => {
        // 更改状态
        isUnSavedWord = true;
        let target = event.target;
        let value = target.innerHTML;
        target.innerHTML = "";
        let input = document.createElement("input")
        input.value = value;
        input.type = "text";
        input.classList.add("change-input");
        input.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        input.addEventListener("keyup", (event) => {
            let word = (event.target.parentNode).getAttribute('data-word') ;
            curMean = event.target.value;
            if((event.keyCode || event.which) == 13){
                changeMean(word, curMean);
                isUnSavedWord = false;
                newWlInput.focus();
            }
        });
        target.appendChild(input);
        input.focus();
    }

    let updateOl = () => {
        // 根据对象刷新ol
        removeAllChildren(newWlOl);
        let words = Object.keys(newWordList);
        for (i in words) {
            let tempLi = document.createElement("li");
            let spanWord = document.createElement("span");
            let spanMean = document.createElement("span");
            spanWord.innerHTML = words[i];
            spanMean.innerHTML = newWordList[words[i]];
            spanMean.classList.add("new-wl-ol-mean");
            spanMean.setAttribute ('data-word', words[i]);
            tempLi.appendChild(spanWord);
            tempLi.appendChild(spanMean);
            newWlOl.appendChild(tempLi);
            // add listener
            spanMean.addEventListener("click", (event) => {changeWrongMean(event)});
            spanWord.addEventListener("click", (event) => {changeWrongWord(event)});
            if (words.length > publicSettings["warningNumber"]) {
                tempLi.classList.add("out-of-warning-number");
                newWlInput.placeholder = `超过${publicSettings["warningNumber"]}个单词会让效率下降`
            }
            if (words.length > publicSettings["errorNumber"]) {
                tempLi.classList.add("out-of-max-number");
                newWlInput.placeholder = `警告！超过${publicSettings["errorNumber"]}个单词会让效率“严重”下降`
            }
        }
        // 清空 聚焦 滚动条在底部
        newWlInput.value = "";
        newWlInput.focus();
        newWlOl.scrollTop = newWlOl.scrollHeight;
        // 恢复 修改状态
        isUnSavedWord = false;
    };

    event.on("olChange", (args) => {
        updateOl();
    });

    let addWord = (word) => {
        if (word == "") {
            return;
        }
        // 添加单词 先留空
        newWordList[word] = "";
        getExplanation(word, newWordList);
    }

    let changeWord = (oldWord, word) => {
        // 修改单词
        if (oldWord == "")
            return;
        delete newWordList[oldWord]
        if (word == "") {
            event.emit("olChange");
            return;
        }
        addWord(word);
    }

    let changeMean = (word, mean) => {
        newWordList[word] = mean;
        event.emit("olChange");
    }

    let saveWordList = (fileName, wordList) => {
        if (Object.keys(wordList).length == 0 || fileName == "") {
            alert("当前不可保存单词表，您可能试图保存一张空表.");
            return;
        }
        let wl = {
            name: fileName,
            body: wordList
        }
        // save!
        let res = WordList.write(wl);
        if (!res.status) {
            alert(res.info);
        } else {
            // close this window
            alert("保存成功");
            window.close();
        }
    }

    newWlInput.addEventListener("keyup", (event) => {
        enterToType(event);
    })

    newWlBtn.addEventListener("click", (event) => {
        addWord(curWord);
    });

    newWlSaveBtn.addEventListener("click", (event) => {
        if(isUnSavedWord == true) {
            alert("您存在未保存的单词修改。");
            return;
        }
        // show
        newWlFileInput.classList.toggle("hide");
        newWlSaveFileBtn.classList.toggle("hide");
        // focus
        newWlFileInput.focus();
    });

    newWlFileInput.addEventListener("keyup", (event) => {
        fileName = event.target.value;
        if((event.keyCode || event.which) == 13){
            saveWordList(fileName, newWordList);
        }
    });

    newWlSaveFileBtn.addEventListener("click", (event) => {
        saveWordList(fileName, newWordList);
    });
})("EVE");