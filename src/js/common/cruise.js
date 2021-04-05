import { Message } from "element-ui";

export function fetchAuthToken(username,password){
    const req = new XMLHttpRequest();
    const baseUrl = "http://121.196.199.223:11014/post/user/login";
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
                chrome.storage.local.set({
                    cruiseToken: authToken
                });
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
    getCachedAuthToken(0);
                            
    chrome.storage.local.get('cruiseToken', (result) => {
        var rssUrl = e.getAttribute('url');
        const req = new XMLHttpRequest();
        const baseUrl = "http://121.196.199.223:11014/post/sub/source/add-by-plugin/";
        const urlParams ={
            subUrl:rssUrl
        }; 

        req.open("POST", baseUrl, true);
        req.setRequestHeader("token",result.cruiseToken);
        req.setRequestHeader("Content-type", "application/json");
        req.send(JSON.stringify(urlParams));
        
        req.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                var body = req.response;
                console.log("订阅返回结果："+body);
                var res = JSON.parse(body);
                if(res && res.statusCode === "904"){
                    console.log("904");
                    chrome.storage.local.remove(["cruiseToken"],function(){
                        var error = chrome.runtime.lastError;
                        if (error) {
                            console.error(error);
                        }
                        console.log("登录失效，重新尝试登录");
                        getCachedAuthToken(0);
                        setTimeout(function(){  }, 3000);
                        retryTimes++;
                        subChannel(e,retryTimes);
                    });
                }
                if(res && res.result && res.statusCode === "200"){
                    // 更新缓存订阅列表
                    var subList = res.result;
                    chrome.storage.local.set({
                        cruiseSubList: subList
                    },function(resp){
                        e.setAttribute('value','已订阅');
                        Message("订阅成功");
                    });
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
