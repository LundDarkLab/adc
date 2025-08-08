module.exports = {
    proxy: "localhost:8000",
    files: [
        "**/*.php",
        "**/*.html",
        "**/*.js", 
        "**/*.css",
        "**/*.json"
    ],
    ignore: [
        "node_modules/**",
        "vendor/**",
        "logs/**",
        ".git/**",
        "*.log"
    ],
    reloadDelay: 200,
    open: false,
    notify: true,
    logLevel: "info"
};
