


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
                console.log("token1:" + authToken);
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
        if (result.cruiseToken) {
            console.log("tokenstringify:" + JSON.stringify(result));
            cachedToken = JSON.stringify(result);
        } else {
            console.log("token:wwwww");
            fetchAuthToken("+8615683761628","12345678");
            ++times;
            getCachedAuthToken(times);
        }
    });
    console.log("cachedToken:" + cachedToken);
    return cachedToken;
}

export function subChannel(e){
    getCachedAuthToken(0);
                            
    chrome.storage.local.get('cruiseToken', (result) => {
        var rssUrl = e.getAttribute('url');
        const req = new XMLHttpRequest();
        const baseUrl = "http://121.196.199.223:11014/post/sub/source/add";
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
                console.log(body);
            }
        }
    });                          
}