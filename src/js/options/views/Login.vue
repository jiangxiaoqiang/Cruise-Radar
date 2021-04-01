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
            <el-button size="medium" @click="toHotkey">登录</el-button>
        </div>
    </div>
</template>

<script>


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
