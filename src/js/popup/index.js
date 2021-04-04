import '../../css/popup.less';
import ClipboardJS from 'clipboard';
import { getConfig } from '../common/config';
import settingIcon from '../../svg/setting.svg';
import aboutIcon from '../../svg/about.svg';
import MD5 from 'md5.js';
let config;

function fetchAuthToken(username,password){
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

function getCachedAuthToken(times){
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

function generateList(type, list) {
    let result = '';
    if (list && list.length) {
        list.forEach((item) => {
            const replaced_url = item.url.replace('{rsshubDomain}', config.rsshubDomain);
            const url = encodeURI(
                type !== 'page-rsshub' || !config.rsshubAccessControl.enabled
                    ? replaced_url
                    : config.rsshubAccessControl.useCode
                    ? `${replaced_url}?code=${new MD5().update(item.path + config.rsshubAccessControl.accessKey).digest('hex')}`
                    : `${replaced_url}?key=${config.rsshubAccessControl.accessKey}`
            );
            result += `
            <li class="rss-item">
                <img class="rss-image" src="${item.image || './rsshub.png'}">
                <a href="${url}" class="rss-info">
                    <div class="rss-title">${item.title}</div>
                    <div class="rss-url">${url.replace('https://', '').replace('http://', '')}</div>
                </a>
                ${
                    item.isDocs
                        ? `<a href="${url}" class="rss-action">文档</a>`
                        : `<div class="rss-action rss-copy" data-clipboard-text="${url}">复制</div>`
                }
                ${
                    config.submitto.ttrss && config.submitto.ttrssDomain
                        ? `<a href="${config.submitto.ttrssDomain.replace(/\/$/, '')}/public.php?op=subscribe&feed_url=${encodeURI(url)}" class="rss-action rss-submitto-ttrss">订阅到 TTRSS</a>`
                        : ''
                }
                ${
                    config.submitto.miniflux && config.submitto.minifluxDomain
                        ? `<a href="${config.submitto.minifluxDomain.replace(/\/$/, '')}/bookmarklet?uri=${encodeURI(url)}" class="rss-action rss-submitto-miniflux">订阅到 Miniflux</a>`
                        : ''
                }
                ${
                    config.submitto.freshrss && config.submitto.freshrssDomain
                        ? `<a href="${config.submitto.freshrssDomain.replace(/\/$/, '')}/i/?c=feed&a=add&url_rss=${encodeURI(url)}" class="rss-action rss-submitto-freshrss">订阅到 FreshRSS</a>`
                        : ''
                }
                ${
                    config.submitto.feedly ? `<a href="http://121.196.199.223:11014/post/sub/source/temp/add?url=${encodeURI(url)}&userId=7" class="rss-action rss-submitto-feedly">订阅到 Cruise</a>` : ''
                } 
                ${
                    config.submitto.feedly ? `<input url="${encodeURI(url)}" type="submit" value="添加" class="rss-action rss-submitto-feedly"></input>` : ''
                }      
            </li>
            `;
        });
        document.querySelector(`.${type} ul`).innerHTML = result;
        document.querySelector(`.${type}`).style.display = 'block';
        document.body.classList.add('something');
    }
}

document.querySelector('.icons-setting').innerHTML = settingIcon;
document.querySelector('.icons-about').innerHTML = aboutIcon;

chrome.tabs.query(
    {
        active: true,
        currentWindow: true,
    },
    (tabs) => {
        const tabId = tabs[0].id;

        getConfig((conf) => {
            config = conf;
            chrome.runtime.sendMessage(
                null,
                {
                    text: 'getAllRSS',
                    tabId: tabId,
                },
                (feeds) => {
                    generateList('page-rss', feeds.pageRSS);
                    generateList('page-rsshub', feeds.pageRSSHub);
                    generateList('website-rsshub', feeds.websiteRSSHub);

                    const clipboard = new ClipboardJS('.rss-copy');
                    clipboard.on('success', function (e) {
                        e.trigger.innerHTML = '已复制';
                        setTimeout(() => {
                            e.trigger.innerHTML = '复制';
                        }, 1000);
                    });

                    document.querySelectorAll('.rss-image').forEach((ele) => {
                        ele.addEventListener('error', function () {
                            this.setAttribute('src', './rsshub.png');
                        });
                    });

                    // handle a label click event
                    document.querySelectorAll('a').forEach((ele) => {
                        ele.addEventListener('click', (e) => {
                            e.preventDefault();
                            chrome.tabs.create({
                                url: ele.getAttribute('href'),
                            });
                            window.close();
                        });
                    });

                    document.querySelectorAll('input').forEach((e)=>{
                        e.addEventListener('click',(innerEvent) =>{
                            innerEvent.preventDefault();
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
                              
                        });
                    });
                }
            );
        });
    }
);
