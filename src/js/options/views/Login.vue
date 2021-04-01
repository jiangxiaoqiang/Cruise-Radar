<template>
    <div class="login">
        <div class="title">登录</div>
        <div class="setting-name">用户名：</div>
        <div class="setting-input">
            <el-input @change="saveConfig" placeholder="请输入你的用户名"></el-input>
        </div>
        <div class="setting-name">密码：</div>
        <div class="setting-input">
            <el-input @change="saveConfig" placeholder="请输入你的密码"></el-input>
        </div>
        <div class="setting-input">
            <el-button size="medium" @click="addRssSubscribe">登录</el-button>
        </div>
    </div>
</template>

<script>
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
        saveConfig() {
            saveConfig(this.config, () => {
                this.$message({
                    message: '保存成功',
                    type: 'success'
                });
            });
        },
        addRssSubscribe(url){
            const req = new XMLHttpRequest();
            const baseUrl = "http://121.196.199.223:11014/post/sub/source/temp/add";
            const urlParams = `url=${encodeURI(url)}&userId=7`;

            req.open("POST", baseUrl, true);
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            req.send(urlParams);

            req.onreadystatechange = function() { // Call a function when the state changes.
                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                    console.log("Got response 200!");
                }
            }
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
