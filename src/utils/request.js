let baseUrl;

if (process.env.NODE_ENV === "development") {
  baseUrl = "http://192.168.1.241:8018";
} else if (process.env.NODE_ENV === "production") {
  baseUrl = "https://door.lctools.com";
}

export default {
  request(options) {
    const userInfo = uni.getStorageSync("userInfo");
    options.header = {
      ...options.header,
      Authorization: userInfo.token,
    };
    return new Promise((resolve, reject) => {
      uni.request({
        ...options,
        success: (res) => {
          if (options.native) {
            resolve(res);
          }
          if (res.statusCode === 200) {
            if (res.data.code == 200) {
              resolve(res.data);
            }
            if (res.data.code == 400) {
              reject(res.data);
            }
          } else {
            console.log("请求的接口没有找到");
            reject(res);
          }
        },
      });
    });
  },
  get(url, data = {}, options = {}) {
    options.url = baseUrl + url;
    options.data = data;
    options.method = "get";
    return this.request(options);
  },
  post(url, data = {}, options = {}) {
    options.url = baseUrl + url;
    options.data = data;
    options.method = "post";
    return this.request(options);
  },
};
