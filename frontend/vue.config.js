module.exports = {
  devServer: {
    disableHostCheck: true,
  },
  // VUE_APP_PUBLIC_PATH lets the image be served from any prefix (default: site root)
  publicPath: process.env.VUE_APP_PUBLIC_PATH || '/'
};