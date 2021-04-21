import { Message } from "element-ui";
import { defaultConfig } from '../common/config';

export function fetchAuthTokenEnhance(username,password,e,retryTimes){
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + "/post/user/login";
    const urlParams = {
        "phone": username,
        "password": password,
    };
    fetch(baseUrl,{
        method: 'POST',
        headers:{
            "Content-type": "application/json"
        },
        body:JSON.stringify(urlParams)
    })
    .then(response =>{
        return response.json()
    })
    .then(res => {
        if(res && res.result && res.result.token){
            var authToken = res.result.token;
            console.log("获取token：" + authToken);
            chrome.storage.local.set({
                cruiseToken: authToken
            },function(resp){
                retryTimes++;
                subChannel(e,retryTimes);
            });
        }
    })
    .catch(error =>{
        console.error(error);
    });
}

export function getUserInfoEnhance(e,retryTimes){
    chrome.storage.local.get("username",function(resp){
        const userName = resp.username;
        if(userName === null||userName === ''||userName === undefined){
            Message("请配置用户名");
            return;
        }
        chrome.storage.local.get("password",function(pwres){
            const password = pwres.password;
            if(password === null||password === ''||password === undefined){
                Message("请配置密码");
                return;
            }
            fetchAuthTokenEnhance(userName,password,e,retryTimes);
        });
    });
}

export function handleSub(urlParams,baseUrl,result,e,retryTimes){
    fetch(baseUrl,{
        method: 'POST',
        headers:{
            "Content-type": "application/json",
            "token": result.cruiseToken
        },
        body:JSON.stringify(urlParams)
    })
    .then(res => {
        return res.json();
    })
    .then(res => {
        if(res && (res.statusCode === "904" || res.statusCode === "907")){
            getUserInfoEnhance(e, retryTimes);
        }else if(res && res.result && res.statusCode === "200"){
            // 更新缓存订阅列表
            var subList = res.result;
            chrome.storage.local.set({
                cruiseSubList: subList
            },function(resp){
                e.setAttribute('value','已订阅');
                Message("订阅成功");
            });
        }else{
            e.setAttribute('value','订阅');
            Message("订阅失败，" + res.msg);
        }
    })
    .catch(error =>{
        console.error(error);
    });
}

export function composeRequest(e,result, retryTimes){
    var rssUrl = e.getAttribute('url');
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + "/post/sub/source/add-by-plugin/";
    const urlParams ={
        subUrl:rssUrl
    }; 
    handleSub(urlParams, baseUrl, result, e, retryTimes);
}

export function subChannelTest(e){

    chrome.storage.local.set({ttt:"a"});

}

export function subChannel(e,retryTimes){
    if(retryTimes > 3){
        Message("无法获取用户授权信息，订阅失败");
        e.setAttribute('value','订阅');
        return;
    }
                            
    chrome.storage.local.get('cruiseToken', (result) => {
        if(result.cruiseToken == null){
            result.cruiseToken = getUserInfoEnhance(e,retryTimes);
        }
        composeRequest(e, result, retryTimes);
    });                          
}

/**
 * is already sub channel
 * @param {*} url 
 */
export async function isAlreadySubChannel(url) {
    var p = new Promise(function(resolve, reject){
        chrome.storage.local.get("cruiseSubList", function(options){
            resolve(options.cruiseSubList);
        })
    });

    const configOut = await p;
    console.log(configOut);
}
