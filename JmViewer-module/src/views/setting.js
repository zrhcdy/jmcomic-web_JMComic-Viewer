import { getSetting, setSetting, settingOptions, settingOptionsText } from "../store/getSetting.js"

export function updateSettingPage(){
    const itemDoms=document.querySelectorAll('div[data-option]')
    const setting=getSetting()
    
    for(let itemDom of itemDoms){
        const optionDom=itemDom.querySelector('.item-option')
        let optionName=itemDom.dataset.option
        optionDom.dataset.value=setting[optionName]
        optionDom.textContent=settingOptionsText[optionName][settingOptions[optionName].indexOf(optionDom.dataset.value)]
        itemDom.addEventListener('click',()=>{
            let options=settingOptions[optionName]
            
            if(!options)return
            
            let valueIndex=options.indexOf(optionDom.dataset.value)
            if(valueIndex<=-1)return
            valueIndex++
            if(valueIndex>=options.length)valueIndex=0
            setting[optionName]=options[valueIndex]
            optionDom.dataset.value=options[valueIndex]
            optionDom.textContent=settingOptionsText[optionName][valueIndex]
            setSetting(setting)
        })
    }
}