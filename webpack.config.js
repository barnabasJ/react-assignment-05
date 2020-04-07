module.exports = {
  // eslint-disable-line no-undef
  entry: "./src/index.tsx",
  module: {
    rules: [{ test: /\.tsx?$/, use: "babel-loader" }],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
};
