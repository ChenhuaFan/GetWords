const fs = require('fs');
const path = require('path');

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(path.join(__dirname, '../assests/db.json'));
const db = low(adapter);

class Setting {
    constructor() {
        try {
            let json = ""
            // 从 lowdb 读取，若没有，从文件读取
            if(!db.has('setting').value()) {
                json = fs.readFileSync(path.join(__dirname, '../assests/setting.json')).toString();
                db.set('setting', json).write()
            } else {
                json = db.get('setting').value()
            }
            this._setting = JSON.parse(json);
            console.log(json)
        } catch (error) {
            console.log("没有根目录")
        }
    }

    get setting() {
        return this._setting;
    }

    set setting(value) {
        this._setting = value;
    }
        
    static getInstance() {
        if (!Setting._setting) {
            Setting._setting = new Setting();
        }
        return Setting._setting;
    }

    static save(newSetting) {
        // fs.writeFileSync(path.join(__dirname, '../assests/setting.json'), JSON.stringify(newSetting))
        db.set('setting', JSON.stringify(newSetting)).write()
    }
}

module.exports = Setting;