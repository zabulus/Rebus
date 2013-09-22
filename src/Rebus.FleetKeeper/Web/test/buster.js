var config = module.exports;

config["My tests"] = {
    environment: "browser",        // or "node"
    rootPath: "../",
    sources: [
        "js/*.js",
        "lib/*.js"
    ],
    tests: [
        "test/*-tests.js"
    ]
};