const fs = require('fs');
const path = require('path');

// set LearnModel object.
class LearnModel {

    static getInstance() {
        if (! LearnModel.lm) {
             LearnModel.lm = new  LearnModel();
        }
        return  LearnModel.lm;
    }

    constructor() {
        let json = fs.readFileSync(path.join(__dirname, "../assests/learnModel.json"));
        this._learnModel = JSON.parse(json.toString());
    }

    get learnModel() {
        return this._learnModel;
    }

    set learnModel(value) {
        this._learnModel = value;
    }
}

module.exports = LearnModel;