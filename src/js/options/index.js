import '../../css/options.scss';
import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './App.vue';
import Setting from './views/Setting.vue';
import About from './views/About.vue';
import Login from './views/Login.vue'
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

Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.config.productionTip = false;

const routes = [
    { path: '/', redirect: '/setting' },
    { path: '/setting', component: Setting },
    { path: '/about', component: About },
    { path: '/login', component: Login },
];
const router = new VueRouter({
    routes,
});

new Vue({
    render: (h) => h(App),
    router,
}).$mount('#app');
