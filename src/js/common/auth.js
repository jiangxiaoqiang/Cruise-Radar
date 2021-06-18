import { defaultConfig } from '../common/config';

export function handleAccessTokenExpire(deviceId){
    chrome.storage.local.get('refreshToken',(result) => {
        var refreshToken = result.refreshToken;
        const urlParams = {
            deviceId: deviceId,
            app: 1,
            refreshToken: refreshToken,
        };
        refreshAccessToken(urlParams);
    });
}

export function refreshAccessToken(urlParams){
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + '/post/auth/access_token/refresh';
    fetch(baseUrl,{
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(urlParams)
    })
    .then((res) => res.json())
    .then((res) => {
        console.log(res);
        if (res && res.resultCode === '00100100004017') {
            // refresh token expired
            handleRefreshTokenExpire(urlParams.deviceId);
        } 
    });
}

export function handleRefreshTokenExpire(deviceId){
    chrome.storage.local.get('username',(resp) => {
        const userName = resp.username;
        if (userName === null || userName === '' || userName === undefined) {
            Message('请配置用户名');
            return;
        }
        chrome.storage.local.get('password',(pwdResp) => {
            const password = pwdResp.password;
            if (password === null || password === '' || password === undefined) {
                Message('请配置密码');
                return;
            }
            const urlParams = {
                phone: userName,
                app: 1,
                deviceId: deviceId,
                password: password,
            };
            refreshRefreshToken(urlParams);
        });
    });
}

export function refreshRefreshToken(urlParams){
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + '/post/auth/refresh_token/refresh';
    fetch(baseUrl,{
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify(urlParams)
    })
    .then((res) => res.json())
    .then((res) => {
        const accessToken = res.result.accessToken;
        const refreshToken = res.result.refreshToken;
        chrome.storage.local.set(
            {
                accessToken: accessToken,
                refreshToken: refreshToken
            },
            function () {
                
            }
        ); 
    });
}



