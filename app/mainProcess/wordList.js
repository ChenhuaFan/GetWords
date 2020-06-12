const readline = require('readline'); 
const fs = require('fs'); 
const Setting = require('./setting');

// 得到 setting
const config = Setting.getInstance().setting;
const publicSettings = config.public;
const privateSettings = config.private;

// set wordList object.
class WordList {
    constructor(fileName) {
        // fileName is a list.
        this._wl = {
            name: fileName,
            body: {}
        };
        let tempWl = [];
        for (let i=0, len=fileName.length; i<len; i++) {
            let wlRow = fs.readFileSync(publicSettings.root + publicSettings.txt + fileName[i]);
            tempWl.push(...(wlRow.toString().split("\n")));
        }
        // 准备单词表对象
        for (let i=0; i<tempWl.length; i++) {
            let tempVar = tempWl[i].split(privateSettings["word-split-flag"]);
            this._wl.body[tempVar[0]] = tempVar[1];
        }
    }

    // abrogate
    static isExist(fileName) {
        try {
            fs.readFileSync(publicSettings.root + publicSettings.txt + fileName + ".txt");
            return true;
        } catch(e) {
            return false;
        }
    }

    static async getAllWordList(callback) {
        try {
            fs.readdir(publicSettings.root + publicSettings.txt, (err, files) => {
                callback(err, files);
            });
        } catch (error) {
            callback("null", [])
        }
    }

    get wordList() {
        return this._wl;
    }

    set wordList(value) {
        this._wl = value;
    }

    static write(wl) {
        if (WordList.isExist(wl.name))
            return {
                status: false,
                info: "文件已存在"
            };
        let data = "";
        let words = Object.keys(wl.body);
        for(let i=0; i<words.length; i++) {
            if (i == words.length - 1) {
                data += `${words[i]}${privateSettings["word-split-flag"]}${(wl.body)[words[i]]}`;
            } else {
                data += `${words[i]}${privateSettings["word-split-flag"]}${(wl.body)[words[i]]}\n`;
            }
        }
        try {
            fs.writeFileSync(publicSettings.root + publicSettings.txt + wl.name + ".txt", data);
            return {
                status: true
            }
        } catch (error) {
            return {
                status: false,
                info: error
            }
        }
    }

}

module.exports = WordList;