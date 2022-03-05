import '../../css/options.scss';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';
import App from './App.vue';
import About from './views/About.vue';
import Login from './views/Login.vue';
import { Container, Menu, MenuItem, Aside, Header, Main, Footer, Input, Checkbox, Message, Loading, Collapse, CollapseItem, Button, Progress, Tooltip } from 'element-ui';

Vue.use(VueRouter);
Vue.use(Container);
Vue.use(Menu);
Vue.use(MenuItem);
Vue.use(Aside);
Vue.use(Header);
Vue.use(Main);
Vue.use(Footer);
Vue.use(Input);
Vue.use(Checkbox);
Vue.use(Loading.directive);
Vue.use(Collapse);
Vue.use(CollapseItem);
Vue.use(Button);
Vue.use(Progress);
Vue.use(Tooltip);
Vue.use(VueI18n);

Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.config.productionTip = false;

const i18n = new VueI18n({
    locale: localStorage.getItem('lang') || 'zh',
    messages: messages,
});

locale.i18n((key, value) => i18n.t(key, value));

const routes = [
    { path: '/', redirect: '/about' },
    { path: '/about', component: About },
    { path: '/login', component: Login },
];
const router = new VueRouter({
    routes,
});

new Vue({
    render: (h) => h(App),
    router,
    i18n,
}).$mount('#app');
