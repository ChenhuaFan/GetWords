const parent = document.querySelector('.setting-items-list');
const Setting = require('../mainProcess/setting');

const fs = require('fs')

const rootDic = document.getElementById("rootDic")
const desktop = document.getElementById("desktop")
const email = document.getElementById("email")
const noRootBox = document.getElementById("noRootBox")
const noRootSetting = document.getElementById("noRootSetting")
const haveRootSetting = document.getElementById("haveRootSetting")


// 得到 setting
let config = Setting.getInstance().setting;
let publicSettings = config.public;
const privateSettings = config.private;

if(!fs.existsSync(publicSettings.root)) {
    config.public.root = ""
    Setting.save(config)
}

desktop.addEventListener("change", (event)=>{
    fs.mkdir(desktop.files[0].path+'/word_root/', (err)=>{
        fs.mkdirSync(desktop.files[0].path+'/word_root/'+publicSettings.txt)
        fs.mkdirSync(desktop.files[0].path+'/word_root/'+publicSettings.voice)
        config.public.root = desktop.files[0].path+'/word_root/'
        Setting.save(config)
        // alert("成功！接下来您可以设置邮箱。所有设置重新打开软件后生效。")
        location.reload();
    })

})

rootDic.addEventListener("change", (event)=>{
    console.log(rootDic.files[0].path)
    config.public.root = rootDic.files[0].path+'/'
    console.log(config)
    Setting.save(config)
    alert("保存成功")
    location.reload();
})

email.addEventListener("change", (event)=>{
    config.public.email = email.value
    console.log(config)
    Setting.save(config)
    alert("保存成功")
    location.reload();
})

console.log(config)

if (publicSettings.root == "") {
    haveRootSetting.classList.add("hide")
    noRootSetting.classList.remove("hide")
    noRootBox.classList.remove("hide")
} else {
    haveRootSetting.classList.remove("hide")
    noRootSetting.classList.add("hide")
    noRootBox.classList.add("hide")
}

// 初始化界面
email.value = publicSettings.email || ""

// let keys = Object.keys(publicSettings);

// for(let i=0; i<keys.length; i++) {
//     let li = document.createElement('li');
//     li.innerHTML = keys[i] + ": ";
//     let span = document.createElement('span');
//     span.innerHTML = publicSettings[keys[i]];
//     li.appendChild(span);
//     parent.appendChild(li);
// }
