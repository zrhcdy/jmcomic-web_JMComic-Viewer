const settingOptions={
    'reading-mode':['default','paper','yellow-paper'],
    'img-server':["0","1","2","3"]
}
const settingOptionsText={
    'reading-mode':['默认','纸质','黄纸'],
    'img-server':['线路1','线路2','线路3','线路4']
}
export function getSetting(){
    const setting=JSON.parse(localStorage.getItem('setting') || "{}")
    for(let item in settingOptions){
        if(!setting[item]){
            setting[item]=settingOptions[item][0]
        }
    }
    setSetting(setting)
    return setting
}
export function setSetting(setting){
    localStorage.setItem('setting',JSON.stringify(setting))
}
export {
    settingOptions,
    settingOptionsText
}