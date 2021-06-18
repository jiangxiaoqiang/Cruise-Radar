<template>
    <div class="login">
        <div class="title">登录</div>
        <div class="setting-name">用户名：</div>
        <div class="setting-input">
            <el-input @change="saveConfig()" @input.native="change($event)" placeholder="请输入你的用户名" v-model="username"></el-input>
        </div>
        <div class="setting-name">密码：</div>
        <div class="setting-input">
            <el-input @change="saveConfig" placeholder="请输入你的密码" @input.native="change($event)" v-model="password"></el-input>
        </div>
        <div class="setting-input">
            <el-button size="medium" @click="login">登录</el-button>
        </div>
    </div>
</template>

<script>

import { defaultConfig, getConfig, saveConfig } from '../../common/config';

export default {
    name: 'Login',
    data: () => ({
        loading: true,
        defaultConfig,
        config: defaultConfig,
        time: '',
        leftTime: '',
        second: 0,
        refreshDisabled: false,
        isChrome: navigator.userAgent.indexOf('Chrome') !== -1,
        
    }),
    methods: {
        change() {
            this.$forceUpdate();
        },
        saveConfig() {
            chrome.storage.local.set({
                username: this.username,
                password: this.password
            },function(resp){
                
            });
        },
        login(url){
            chrome.storage.local.set({
                username: this.username,
                password: this.password
            },function(resp){
                
            });
        },
        toHotkey() {
            chrome.tabs.create({
                url: 'chrome://extensions/shortcuts'
            });
        },
        refreshRu() {
            this.refreshDisabled = true;
            refreshRules(() => {
                this.second = 0;
                this.time = secondToTime(this.second);
                this.leftTime = secondToTime(this.config.refreshTimeout - this.second);
                this.refreshDisabled = false;
            });
        },
        refreshTime() {
            getRulesDate((date) => {
                this.second = (+new Date - +date) / 1000;
                this.time = secondToTime(this.second);
                this.leftTime = secondToTime(this.config.refreshTimeout - this.second);
                setTimeout(() => {
                    this.refreshTime();
                }, 1000);
            });
        }
    }
}
</script>

<style lang="less" scoped>
a {
    text-decoration: none;
    color: #f5712c;
}

.about {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 10px;
}

.title {
    font-size: 25px;
    font-weight: bold;
    border-bottom: 1px solid #e6e6e6;
    padding-bottom: 10px;
    color: #f5712c;
}

.tip {
    font-size: 14px;
    margin: 20px 0;
    color: #555;
}

.content {
    margin-top: 20px;
    color: #222;
}
</style>
