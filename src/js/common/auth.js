import { defaultConfig } from '../common/config';
import { subChannel } from '../common/cruise';
import { RequestHandler } from 'js-wheel/dist/src/net/rest/RequestHandler';
import { ResponseCode } from 'js-wheel/dist/src/net/rest/ResponseCode';
import LocalStorage from 'js-wheel/dist/src/utils/data/LocalStorage';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

export function handleAccessTokenExpire(deviceId, e, retryTimes) {
    chrome.storage.local.get('refreshToken', (result) => {
        const refreshToken = result.refreshToken;
        const urlParams = {
            deviceId: deviceId,
            app: 1,
            refresh_token: refreshToken,
        };
        refreshAccessToken(urlParams, e, retryTimes);
    });
}

export function refreshAccessToken(urlParams, e, retryTimes) {
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + '/post/auth/access_token/refresh';
    fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify(urlParams),
    })
        .then((res) => res.json())
        .then((res) => {
            console.log(res);
            if (res && res.resultCode === '00100100004017') {
                // refresh token expired
                handleRefreshTokenExpire(urlParams.deviceId, e, retryTimes);
            }
            if (res && res.resultCode === '200') {
                const accessToken = res.result.accessToken;
                chrome.storage.local.set(
                    {
                        accessToken: accessToken,
                    },
                    function () {
                        retryTimes = retryTimes + 1;
                        subChannel(e, retryTimes);
                    }
                );
            }
        });
}

// https://stackoverflow.com/questions/69983708/how-to-make-the-javascript-null-check-more-clear
export function isNull(value) {
    // any falsy value: https://developer.mozilla.org/en-US/docs/Glossary/Falsy
    if (!value) {
        return true;
    }
    if (typeof value === 'object') {
        // empty array
        if (Array.isArray(value) && value.length === 0) {
            return true;
        }
        // empty object
        if (value.toString() === '[object Object]' && JSON.stringify(value) === '{}') {
            return true;
        }
    }
    return false;
}

export function handleRefreshTokenExpire(deviceId, e, retryTimes) {
    chrome.storage.local.get('username', (resp) => {
        const userName = resp.username;
        if (isNull(userName)) {
            Message('请配置用户名');
            return;
        }
        chrome.storage.local.get('password', (pwdResp) => {
            const password = pwdResp.password;
            if (isNull(password)) {
                Message('请配置密码');
                return;
            }
            const urlParams = {
                phone: userName,
                app: 1,
                deviceId: deviceId,
                password: password,
            };
            refreshRefreshToken(urlParams, e, retryTimes);
        });
    });
}

export async function refreshRefreshToken(urlParams, e, retryTimes) {
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + '/post/auth/refresh_token/refresh';
    fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify(urlParams),
    })
        .then((res) => res.json())
        .then((res) => {
            // https://stackoverflow.com/questions/33527653/babel-6-regeneratorruntime-is-not-defined
            if ((res && res.resultCode === ResponseCode.REFRESH_TOKEN_EXPIRED) || (res && res.resultCode === ResponseCode.REFRESH_TOKEN_INVALID)) {
                const configBase = {
                    appId: 1,
                    baseAuthUrl: 'https://api.poemhub.top',
                    userLoginUrlPath: '/post/user/plugin/login',
                    accessTokenUrlPath: '/post/auth/refresh_token/refresh',
                    refreshTokenUrlPath: '/post/auth/access_token/refresh',
                };
                console.log(configBase);
                ConfigHandler.stupidInit(configBase);
                LocalStorage.setLocalStorage('username', urlParams.phone);
                LocalStorage.setLocalStorage('password', urlParams.password);
                RequestHandler.handleRefreshTokenInvalid();
                retryTimes = retryTimes + 1;
                subChannel(e, retryTimes);
            }
            if (res && res.resultCode === '200') {
                const accessToken = res.result.accessToken;
                const refreshToken = res.result.refreshToken;
                chrome.storage.local.set(
                    {
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                    },
                    function () {
                        retryTimes = retryTimes + 1;
                        subChannel(e, retryTimes);
                    }
                );
            }
        });
}
