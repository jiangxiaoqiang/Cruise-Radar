import { Message } from "element-ui";
import { defaultConfig } from '../common/config';

export function fetchAuthToken(username,password){
    const req = new XMLHttpRequest();
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + "/post/user/login";
    const urlParams = {
        "phone": username,
        "password": password,
    };
    req.open("POST", baseUrl, true);
    req.setRequestHeader("Content-type", "application/json");
    req.send(JSON.stringify(urlParams));
    req.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
            var body = req.response;
            var res = JSON.parse(body);
            if(res && res.result && res.result.token){
                var authToken = res.result.token;
                return authToken;
            }
        }
    }
}

export function getCachedAuthToken(times){
    var cachedToken = "";
    if(times > 3){
        return "";
    }
    chrome.storage.local.get('cruiseToken', (result) => {
        if (result.cruiseToken && result.cruiseToken != "") {
            cachedToken = JSON.stringify(result);
        } else {
            fetchAuthToken("+8615683761628","12345678");
            ++times;
            getCachedAuthToken(times);
        }
    });
    return cachedToken;
}

export function subChannel(e,retryTimes){
    if(retryTimes > 3){
        Message("无法获取用户授权信息，订阅失败");
        return;
    }
                            
    chrome.storage.local.get('cruiseToken', (result) => {
        if(result.cruiseToken == null){
            result.cruiseToken = fetchAuthToken("+8615683761628","12345678");
        }
        var rssUrl = e.getAttribute('url');
        const req = new XMLHttpRequest();
        const apiUrl = defaultConfig.cruiseApi;
        const baseUrl = apiUrl + "/post/sub/source/add-by-plugin/";
        const urlParams ={
            subUrl:rssUrl
        }; 

        req.open("POST", baseUrl, true);
        req.setRequestHeader("token",result.cruiseToken);
        req.setRequestHeader("Content-type", "application/json");
        req.send(JSON.stringify(urlParams));
        console.info("已发送订阅请求...");
        req.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                var body = req.response;
                console.info("订阅返回结果："+body);
                var res = JSON.parse(body);
                if(res && (res.statusCode === "904" || res.statusCode === "907")){
                    console.error("登录失效，重新尝试登录");
                    var authToken = fetchAuthToken("+8615683761628","12345678");
                    chrome.storage.local.set({
                        cruiseToken: authToken
                    },function(resp){
                        retryTimes++;
                        subChannel(e,retryTimes,token);
                    });
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
                    console.error("订阅出错" + body);
                    Message("订阅出错," + res.msg);
                }
            }
        }
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
