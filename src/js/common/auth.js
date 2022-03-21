import { defaultConfig } from '../common/config';
import { subChannel } from '../common/cruise';
import { RequestHandler } from 'js-wheel/dist/src/net/rest/RequestHandler';
import { ResponseCode } from 'js-wheel/dist/src/net/rest/ResponseCode';
import LocalStorage from 'js-wheel/dist/src/utils/data/LocalStorage';
import ConfigHandler from 'js-wheel/dist/src/config/ConfigHandler';
import BaseMethods from 'js-wheel/dist/src/utils/data/BaseMethods';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

export async function handleAccessTokenExpire(deviceId, e, retryTimes) {
    const refreshToken = await LocalStorage.readLocalStorage('x-refresh-token');
    const urlParams = {
        deviceId: deviceId,
        app: 1,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    };
    refreshAccessToken(urlParams, e, retryTimes);
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
                handleRefreshTokenExpire(urlParams, e, retryTimes);
            }
            if (res && res.resultCode === '200') {
                const accessToken = res.result.accessToken;
                chrome.storage.local.set(
                    {
                        'x-access-token': accessToken,
                    },
                    function () {
                        retryTimes = retryTimes + 1;
                        subChannel(e, retryTimes);
                    }
                );
            }
        });
}

export function handleRefreshTokenExpire(params, e, retryTimes) {
    chrome.storage.local.get('username', (resp) => {
        const userName = resp.username;
        if (BaseMethods.isNull(userName)) {
            Message('请配置用户名');
            return;
        }
        chrome.storage.local.get('password', (pwdResp) => {
            const password = pwdResp.password;
            if (BaseMethods.isNull(password)) {
                Message('请配置密码');
                return;
            }
            const urlParams = {
                phone: userName,
                app: 1,
                deviceId: params.appdeviceId,
                password: password,
                refresh_token: params.refresh_token,
                grant_type: 'refresh_token',
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
                ConfigHandler.init(configBase);
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
                        'x-access-token': accessToken,
                        'x-refresh-token': refreshToken,
                    },
                    function () {
                        retryTimes = retryTimes + 1;
                        subChannel(e, retryTimes);
                    }
                );
            }
        });
}
