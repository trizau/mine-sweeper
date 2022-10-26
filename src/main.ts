import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

createApp(App).mount("#app");

//阻止safari浏览器双击放大功能
let lastTouchEnd = 0; //更新手指弹起的时间
document.addEventListener("touchstart", function (event) {
  //多根手指同时按下屏幕，禁止默认行为
  if (event.touches.length > 1) {
    event.preventDefault();
  }
});
document.addEventListener(
  "touchend",
  function (event) {
    let now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      //当两次手指弹起的时间小于300毫秒，认为双击屏幕行为
      event.preventDefault();
    } else {
      // 否则重新手指弹起的时间
      lastTouchEnd = now;
    }
  },
  false
);
//阻止双指放大页面
document.addEventListener("gesturestart", function (event) {
  event.preventDefault();
});
// 关闭右键菜单
document.oncontextmenu = () => false;
