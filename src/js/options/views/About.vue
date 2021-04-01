<template>
    <div class="about">
        <el-main>
            <div class="title">关于</div>
            <div class="content">
                <div class="tip">
                    <p>Cruise Radar是Cruise的配套工具，她可以帮助你快速发现和订阅当前浏览网站的RSS，项目采用MIT许可开源，使用完全免费</p>
                </div>
            </div>
        </el-main>
    </div>
</template>

<script>
export default {
    name: 'About',
    data: () => ({
    }),
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
