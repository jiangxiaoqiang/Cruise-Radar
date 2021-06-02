import { getRules, getRulesDate, refreshRules } from '../common/rules';
import { commandSandbox } from '../common/utils';
import { getConfig } from '../common/config';
let config;
let rules = {};
import RSSParser from 'rss-parser';
const rssParser = new RSSParser();

window.pageRSS = {};
window.pageRSSHub = {};
window.websiteRSSHub = {};

function schedule(time = +new Date() + config.refreshTimeout * 1000) {
    chrome.alarms.create('refreshRules', {
        when: time,
        periodInMinutes: config.refreshTimeout / 60,
    });
}

function initSchedule() {
    getRulesDate((lastDate) => {
        if (!lastDate || +new Date() - lastDate > config.refreshTimeout * 1000) {
            refreshRules();
            schedule();
        } else {
            schedule(lastDate + config.refreshTimeout * 1000);
        }
    });
}

chrome.storage.onChanged.addListener((result) => {
    if (result.config) {
        config = result.config.newValue;
    }
    if (result.rules) {
        getRules((rul) => {
            rules = rul;
        });
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refreshRules') {
        refreshRules();
    }
});

chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === 'active') {
        initSchedule();
    }
});

getConfig((conf) => {
    config = conf;

    getRules((rul) => {
        rules = rul;
        initSchedule();
    });
});

chrome.browserAction.setBadgeBackgroundColor({
    color: '#FF2800',
});

chrome.browserAction.setBadgeTextColor &&
    chrome.browserAction.setBadgeTextColor({
        color: '#fff',
    });

/**
 * 设置插件RSS订阅源气泡提示文本
 */
function setBadge(tabId) {
    chrome.storage.local.get('cruiseSubList', function (result) {
        const subList = result.cruiseSubList;
        if (subList === undefined || subList.length === 0) {
            setBadgeTextImpl(tabId, '#FF2800');
            return;
        }
        const channels = window.pageRSS[tabId];
        if(havingChannelUnsubscribed(channels,subList)){
            setBadgeTextImpl(tabId, '#FFFF00');
            return;
        }
        if (allChannelSubscribed(channels, subList)) {
            setBadgeTextImpl(tabId, '#008000');
        } else {
            setBadgeTextImpl(tabId, '#FF2800');
        }
    });
}

/**
 * 是否包含订阅后又取消订阅的频道
 * 决定提示气泡显示颜色
 * 订阅后又取消订阅显示黄色
 * 只要包含任意一个订阅后取消订阅显示黄色
 * @param {*} channels
 * @param {*} subList
 * @returns
 */
 function havingChannelUnsubscribed(channels, subList) {
    if (channels === undefined || channels.length === 0 || subList === undefined || subList.length === 0) {
        return false;
    }
    let havingUnsubcribe = false;
    const subListUrl = subList.map((item) => item.subUrl);
    channels.forEach((channel) => {
        const isContains = subListUrl.indexOf(channel.url);
        if (isContains > 0) {
            var subListItem = subList.find(item=>item.subUrl === channel.url);
            if(subListItem.subStatus === 0){
                return true;
            }
        }
    });
    return havingUnsubcribe;
}

/**
 * 是否订阅过所有频道
 * 决定提示气泡显示颜色
 * 如果已经订阅，用户则可直接忽略，节省时间
 * @param {*} channels
 * @param {*} subList
 * @returns
 */
function allChannelSubscribed(channels, subList) {
    if (channels === undefined || channels.length === 0 || subList === undefined || subList.length === 0) {
        return false;
    }
    let allSubcribe = true;
    const subListUrl = subList.map((item) => item.subUrl);
    channels.forEach((channel) => {
        const isContains = subListUrl.indexOf(channel.url);
        if (isContains < 0) {
            allSubcribe = false;
            return allSubcribe;
        }
    });
    return allSubcribe;
}

function setBadgeTextImpl(tabId, color) {
    const pageRssCount = window.pageRSS[tabId] ? window.pageRSS[tabId].length : 0;
    const pageRSSHubCount = window.pageRSSHub[tabId] ? window.pageRSSHub[tabId].length : 0;
    const websiteRSSHubCount = window.websiteRSSHub[tabId] && window.websiteRSSHub[tabId].length ? ' ' : '';
    setBackgroundColor(color);
    chrome.browserAction.setBadgeText({
        text: config.notice.badge ? (pageRssCount + pageRSSHubCount || websiteRSSHubCount) + '' : '',
        tabId,
    });
}

function setBackgroundColor(color) {
    /*
    如果已经订阅频道，显示绿色
    如果未订阅频道，显示红色
    如果有订阅后又取消订阅的频道，显示黄色
    又任意一个订阅后又取消订阅的频道即显示黄色
    有一个URL未订阅即未订阅，所有URL订阅算已订阅
    */
    chrome.browserAction.setBadgeBackgroundColor({
        color: color,
    });
}

function getPageRSSHub(url, tabId, done) {
    chrome.tabs.sendMessage(
        tabId,
        {
            text: 'getHTML',
        },
        (html) => {
            commandSandbox(
                'getPageRSSHub',
                {
                    url,
                    html,
                    rules,
                },
                done
            );
        }
    );
}

function getWebsiteRSSHub(url, done) {
    commandSandbox(
        'getWebsiteRSSHub',
        {
            url,
            rules,
        },
        done
    );
}

export function handleRSS(feeds, tabId, useCache) {
    if (useCache && window.pageRSS[tabId]) {
        setBadge(tabId);
    } else {
        chrome.tabs.get(tabId, (tab) => {
            feeds &&
                feeds.forEach((feed) => {
                    feed.image = tab.favIconUrl || feed.image;
                });
            window.pageRSS[tabId] = (feeds && feeds.filter((feed) => !feed.uncertain)) || [];

            getWebsiteRSSHub(tab.url, (feeds) => {
                window.websiteRSSHub[tabId] = feeds || [];
                setBadge(tabId);
            });

            getPageRSSHub(tab.url, tabId, (feeds) => {
                window.pageRSSHub[tabId] = feeds || [];
                setBadge(tabId);
            });
        });

        feeds &&
            feeds
                .filter((feed) => feed.uncertain)
                .forEach((feed) => {
                    rssParser.parseURL(feed.url, (err, result) => {
                        if (!err) {
                            feed.title = result.title;
                            window.pageRSS[tabId].push(feed);
                            setBadge(tabId);
                        }
                    });
                });
    }
}

export function removeRSS(tabId) {
    delete window.pageRSS[tabId];
    delete window.websiteRSSHub[tabId];
    delete window.pageRSSHub[tabId];
}

export function addPageRSS(feed, tabId) {
    if (feed) {
        chrome.tabs.get(tabId, (tab) => {
            feed.image = tab.favIconUrl || feed.image;
            window.pageRSS[tabId].push(feed);
            setBadge(tabId);
        });
    }
}

export function getAllRSS(tabId) {
    return {
        pageRSS: window.pageRSS[tabId] || {},
        websiteRSSHub: window.websiteRSSHub[tabId] || {},
        pageRSSHub: window.pageRSSHub[tabId] || {},
    };
}
