import { Message } from 'element-ui';
import { defaultConfig } from '../common/config';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export function getDeviceFingerPrint(userName, password, e, retryTimes) {
    // Initialize an agent at application startup.
    const fpPromise = FingerprintJS.load();

    // Get the visitor identifier when you need it.
    fpPromise
        .then((fp) => fp.get())
        .then((result) => {
            // This is the visitor identifier:
            const visitorId = result.visitorId;
            console.log(visitorId);
            fetchAuthTokenEnhance(userName, password, e, retryTimes, visitorId);
        });
}

export function fetchAuthTokenEnhance(username, password, e, retryTimes, deviceId) {
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + '/post/user/login';
    const urlParams = {
        phone: username,
        password: password,
        deviceId: deviceId,
        app: 1,
        deviceType: 7,
    };
    fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify(urlParams),
    })
        .then((response) => response.json())
        .then((res) => {
            if (res && res.result && res.result.token) {
                const authToken = res.result.token;
                console.log('获取token：' + authToken);
                chrome.storage.local.set(
                    {
                        cruiseToken: authToken,
                    },
                    function () {
                        retryTimes++;
                        subChannel(e, retryTimes);
                    }
                );
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

export function getUserInfoEnhance(e, retryTimes) {
    chrome.storage.local.get('username', function (resp) {
        const userName = resp.username;
        if (userName === null || userName === '' || userName === undefined) {
            Message('请配置用户名');
            return;
        }
        chrome.storage.local.get('password', function (pwres) {
            const password = pwres.password;
            if (password === null || password === '' || password === undefined) {
                Message('请配置密码');
                return;
            }
            getDeviceFingerPrint(userName, password, e, retryTimes);
        });
    });
}

export function handleSub(urlParams, baseUrl, result, e, retryTimes) {
    fetch(baseUrl, {
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            token: result.cruiseToken,
        },
        body: JSON.stringify(urlParams),
    })
        .then((res) => res.json())
        .then((res) => {
            if (res && (res.statusCode === '904' || res.statusCode === '907')) {
                getUserInfoEnhance(e, retryTimes);
            } else if (res && res.result && res.statusCode === '200') {
                // 更新缓存订阅列表
                const subList = res.result;
                chrome.storage.local.set(
                    {
                        cruiseSubList: subList,
                    },
                    function () {
                        e.setAttribute('value', '已订阅');
                        Message('订阅成功');
                    }
                );
            } else {
                e.setAttribute('value', '订阅');
                Message('订阅失败，' + res.msg);
            }
        })
        .catch((error) => {
            console.error(error);
        });
}

export function composeRequest(e, result, retryTimes) {
    const rssUrl = e.getAttribute('url');
    const iconUrl = e.getAttribute('icon');
    const apiUrl = defaultConfig.cruiseApi;
    const baseUrl = apiUrl + '/post/sub/source/add-by-plugin/';
    const urlParams = {
        subUrl: rssUrl,
        favIconUrl: iconUrl,
    };
    handleSub(urlParams, baseUrl, result, e, retryTimes);
}

export function subChannel(e, retryTimes) {
    if (retryTimes > 3) {
        Message('无法获取用户授权信息，订阅失败');
        e.setAttribute('value', '订阅');
        return;
    }

    chrome.storage.local.get('cruiseToken', (result) => {
        if (result.cruiseToken == null) {
            result.cruiseToken = getUserInfoEnhance(e, retryTimes);
        }
        composeRequest(e, result, retryTimes);
    });
}
