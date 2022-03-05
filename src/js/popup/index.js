// import '../../css/popup.less';
import ClipboardJS from 'clipboard';
import { getConfig } from '../common/config';
import { subChannel } from '../common/cruise';
import settingIcon from '../../svg/setting.svg';
import aboutIcon from '../../svg/about.svg';
import MD5 from 'md5.js';
// import { Message } from 'element-ui';
let config;

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
                ${item.isDocs ? `<a href="${url}" class="rss-action">文档</a>` : `<div class="rss-action rss-copy" data-clipboard-text="${url}">复制</div>`} 
                ${config.submitto.feedly ? `<input id="${url}" icon="${item.image}" url="${encodeURI(url)}" type="submit" value="订阅" class="rss-action rss-submitto-feedly"></input>` : ''}       
            </li>
            `;
            chrome.storage.local.get('cruiseSubList', function (result) {
                let isSub = false;
                const subList = result.cruiseSubList;
                subList.forEach((item) => {
                    // 结尾带斜线的情况
                    const matchUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
                    if (item.subUrl == matchUrl) {
                        isSub = true;
                    }
                    // 解析的地址为http，实际已经订阅了https的情况
                    const parser = document.createElement('a');
                    parser.href = matchUrl;
                    const channelSecUrl = parser.protocol === 'http:' ? matchUrl.replace('http://', 'https://') : matchUrl;
                    if (item.subUrl == channelSecUrl) {
                        isSub = true;
                    }
                });
                if (isSub) {
                    document.querySelectorAll('input').forEach((element) => {
                        if (element.id == url) {
                            element.setAttribute('value', '已订阅');
                        }
                    });
                }
            });
        });
        if (document.querySelector(`.${type} ul`)) {
            document.querySelector(`.${type} ul`).innerHTML = result;
            document.querySelector(`.${type}`).style.display = 'block';
        }
        document.body.classList.add('something');
    }
}

document.querySelector('.icons-setting').innerHTML = settingIcon;
document.querySelector('.icons-about').innerHTML = aboutIcon;

function handleCallback(feeds) {
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

    document.querySelectorAll('input').forEach((e) => {
        e.addEventListener('click', (innerEvent) => {
            innerEvent.preventDefault();
            const subText = e.getAttribute('value');
            if (subText === '已订阅') {
                Message('已订阅此频道');
                return;
            }
            if (subText === '处理中') {
                Message('请求处理中...');
                return;
            }
            if (subText === '订阅') {
                e.setAttribute('value', '处理中');
                subChannel(e, 0);
            }
        });
    });
}

chrome.tabs.query(
    {
        active: true,
        currentWindow: true,
    },
    (tabs) => {
        const tabId = tabs[0].id;
        getConfig((conf) => {
            config = conf;
            // 向background发送消息获取所有RSS地址
            chrome.runtime.sendMessage(
                null,
                {
                    text: 'getAllRSS',
                    tabId: tabId,
                },
                (feeds) => {
                    handleCallback(feeds);
                }
            );
        });
    }
);
