<template>
  <view class="content pr">
    <u-top-tips ref="uTips"></u-top-tips>
    <view class="box pa pc">
      <view class="btn fc c" @click="open" :class="state == 'unLock' ? 'active' : ''">
        <u-icon :name="stateList[state].icon" :color="stateList[state].color" size="64"></u-icon>
        <text class="text">{{ stateList[state].text }}</text>
      </view>
    </view>
    <view class="info pa fc jb c">
      <view class="btnList f">
        <view class="btn1 ac" @click="copy" v-if="!deviceOnline">
          <u-icon name="file-text" color="#eceef2" size="32"></u-icon>
          复制授权信息
        </view>
        <view class="btn2 ac" v-if="debug" @click="add">
          <u-icon name="plus" color="#eceef2" size="32"></u-icon>
        </view>
      </view>
      <view class="footBox"></view>
    </view>
    <view class="id pa" @click="debugFn">{{ uid }}</view>
  </view>
</template>

<script setup>
import Fingerprint2 from "fingerprintjs2";
import { getDeviceStatusApi, openDoor, loginApi, authorizeApi, checkInfoApi } from "@/api/index.js";
import { ref, onMounted } from "vue";
const deviceOnline = ref(false);
const stateList = ref({
  lock: {
    icon: "lock-fill",
    text: "已上锁",
    color: "#565656",
  },
  unLock: {
    icon: "lock-opened-fill",
    text: "已开锁",
    color: "#19be6b",
  },
});
const state = ref("lock");
const uTips = ref(null);
const time = ref(null);
const uid = ref(null);
const errorMsg = ref(null);
async function open() {
  if (!deviceOnline.value) {
    uTips.value.show({
      title: errorMsg.value,
      type: "error",
    });
    return;
  }
  if (state.value == "unLock") {
    return;
  }
  state.value = "unLock";
  openDoor()
    .then(({ data }) => {
      time.value = setTimeout(() => {
        state.value = "lock";
      }, 7000);
    })
    .catch((res) => {
      state.value = "lock";
      uTips.value.show({
        title: res.msg,
        type: "error",
      });
    });
}
function login() {
  const obj = {};
  // #ifdef MP-WEIXIN
  obj.platform = "微信";
  // #endif

  // #ifdef H5
  obj.platform = "H5";
  // #endif

  console.log("%c 🍩 obj", "background:#e41a6a", obj);

  const platform = obj.platform;
  switch (platform) {
    case "H5":
      console.log("%c 🍩 obj", "background:#e41a6a", "执行h5登录");
      h5Login(platform);
      break;
    default:
      console.log("%c 🍩 obj", "background:#e41a6a", "执行微信登录");
      uni.login({
        provider: "weixin",
        success: async ({ code }) => {
          uni.hideLoading();
          const { data } = await loginApi({ code: code, platform: platform });
          uid.value = data.openid;
          uni.setStorageSync("userInfo", data);
          init();
        },
      });
      break;
  }
}

function h5Login(platform) {
  Fingerprint2.get(async (components) => {
    let code = uni.getStorageSync("finger");
    if (!code) {
      const values = components.map((component) => component.value);
      const murmur = Fingerprint2.x64hash128(values.join(""), 31);
      uni.setStorageSync("finger", murmur);
      code = murmur;
    }
    uni.hideLoading();
    const { data } = await loginApi({ code: code, platform: platform });
    uid.value = data.openid;
    uni.setStorageSync("userInfo", data);
    init();
  });
}
async function init() {
  const userInfo = uni.getStorageSync("userInfo");
  uid.value = userInfo.openid;
  getDeviceStatusApi()
    .then(({ data }) => {
      if (data.includes(58277)) {
        deviceOnline.value = true;
        uTips.value.show({
          title: "设备在线",
          type: "success",
        });
      } else {
        deviceOnline.value = true;
        uTips.value.show({
          title: data,
          type: "error",
        });
        errorMsg.value = data;
      }
    })
    .catch((res) => {
      deviceOnline.value = false;
      uTips.value.show({
        title: res.msg,
        type: "error",
        duration: "10000",
      });
      errorMsg.value = res.msg;
    });
}

function copy() {
  uni.showModal({
    title: "将下面代码复制给物业授权",
    content: uid.value,
    confirmText: "复制",
    showCancel: false,
    success: () => {
      uni.setClipboardData({
        data: uid.value,
        success: () => {
          uni.showToast({
            title: "复制成功",
          });
        },
      });
    },
  });
}

onMounted(async () => {
  const userInfo = uni.getStorageSync("userInfo");
  if (!userInfo) {
    uni.showLoading({
      title: "登录中",
    });
    login();
  } else {
    const { data } = await checkInfoApi({ userInfo: userInfo });
    if (data) {
      init();
    } else {
      uni.removeStorageSync("userInfo");
      uni.showLoading({
        title: "登录中",
      });
      login();
    }
  }
});
const debug = ref(false);
const count = ref(0);
const debugTime = ref(null);

function debugFn() {
  if (debugTime.value) {
    clearTimeout(debugTime.value);
  }
  debugTime.value = setTimeout(() => {
    count.value = 0;
  }, 1000);
  count.value++;
  if (count.value >= 10) {
    uni.showModal({
      title: "请输入物业管理员密码",
      content: "",
      editable: true,
      placeholderText: "请输入密码",
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        if (res.content == "1879") {
          uTips.value.show({
            title: "密码正确",
            type: "success",
          });
          debug.value = true;
        } else {
          uni.showToast({
            title: "密码错误",
            icon: "error",
          });
        }
      },
    });
  }
}

function add() {
  uni.showModal({
    title: "粘贴授权的用户编码",
    content: "",
    editable: true,
    placeholderText: "粘贴编码",
    confirmText: "授权",
    cancelText: "取消",
    success: (res) => {
      if (res.content) {
        authorizeApi(res.content)
          .then((res) => {
            uTips.value.show({
              title: res.data,
              type: "success",
            });
          })
          .catch((res) => {
            uTips.value.show({
              title: res.msg,
              type: "error",
              duration: "10000",
            });
            debug.value = false;
          });
      }
    },
  });
}
</script>

<style lang="scss">
.content {
  position: relative;
  width: 100vw;
  height: 100vh;
  background-color: #f8f8f8;
  .box {
    top: 40%;
    .btn {
      vertical-align: middle;
      margin: 220rpx 60rpx;
      width: 300rpx;
      height: 300rpx;
      font-size: 48rpx;
      color: #565656;
      text-shadow: 0rpx -2rpx 2rpx rgba(0, 0, 0, 0.2);
      border-radius: 200rpx;
      text-decoration: none;
      background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #f4f4f4), color-stop(100%, #e3e3e3));
      background-image: -moz-gradient(linear, left top, left bottom, color-stop(0%, #f4f4f4), color-stop(100%, #e3e3e3));
      box-shadow: 0rpx 0rpx 4rpx rgba(0, 0, 0, 0.25), 20rpx 20rpx 30rpx #e3e3e3, -20rpx 20rpx 30rpx #e3e3e3,
        -30rpx -30rpx 30rpx rgba(255, 255, 255, 0.4), 30rpx -30rpx 30rpx rgba(255, 255, 255, 0.4), inset 0rpx 4rpx 0rpx white;
      text {
        margin-top: 10rpx;
      }
    }
    .active {
      color: #19be6b;
      box-shadow: 0rpx 0rpx 6rpx rgba(0, 0, 0, 0.15), 20rpx 20rpx 30rpx rgba(255, 255, 255, 0.4), -20rpx 20rpx 30rpx rgba(255, 255, 255, 0.4),
        -20rpx -20rpx 30rpx #e3e3e3, 20rpx -20rpx 30rpx #e3e3e3, inset 0rpx -6rpx 0rpx rgba(255, 255, 255, 0.4),
        inset 0rpx 6rpx 6rpx rgba(0, 0, 0, 0.04);
    }
  }
  .info {
    bottom: 0%;
    width: 100vw;
    height: 300rpx;
    .btnList {
      width: auto;
      .btn1 {
        margin: 20rpx;
        background-color: #4e4e4e;
        color: #eceef2;
        padding: 25rpx;
        border-radius: 40rpx;
      }
      .btn2 {
        margin: 20rpx;
        background-color: #2e2e2e;
        color: #fff;
        padding: 25rpx;
        border-radius: 50%;
      }
    }
    .footBox {
      background-color: #242424;
      height: 0%;
      width: 100%;
      border-radius: 0 0;
    }
  }
  .id {
    left: 50%;
    bottom: 80rpx;
    transform: translate(-50%);
    color: #d1d1d1;
  }
}
</style>
