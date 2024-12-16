import { createSSRApp } from "vue";
import App from "./App.vue";
import uView from "./uni_modules/vk-uview-ui";
uni.$u.config.unit = "rpx";
import "./style.css";

export function createApp() {
  const app = createSSRApp(App);
  app.use(uView);
  return {
    app,
  };
}
