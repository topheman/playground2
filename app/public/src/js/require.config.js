require.config({
    baseUrl: "./js",
    // paths are analogous to old-school <script> tags, in order to reference js scripts
    paths: {    
//        jQuery: "vendor/jquery-1.7.1.min"
        jQuery: "vendor/zepto.min"
    },
    // configure dependencies and export value aliases for old-school js scripts
    shim: {
        "vendor/Ball": ["vendor/Vector2D"]
    }
});