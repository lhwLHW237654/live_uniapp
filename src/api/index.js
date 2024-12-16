import request from "@/utils/request";

//开门
export function openDoor() {
  return request.post("/index/openDoor");
}

//获取设备状态
export function getDeviceStatusApi() {
  return request.get("/index/deviceStatus");
}

//获取用户是否授权
export function getAuthorizeApi() {
  return request.get("/index/deviceStatus");
}

//登录
export function loginApi(data) {
  return request.post("/index/login", data);
}

//授权
export function authorizeApi(openid) {
  return request.post("/index/authorize", { openid: openid });
}

//校验用户
export function checkInfoApi(data) {
  return request.post("/index/checkInfoApi", data);
}
