module.exports = {
    entry: './src/window.js',
    output: {
      path: __dirname + '/dist',
        filename: 'bundle.js'
    },
    externals: {
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                  presets: ['es2017', 'react'],
                  plugins: ["transform-class-properties"]
                },
            }
        ]
    },
    devtool: 'source-map'
};
