// frida -U  Gadget -l ignore.js --no-pause
setImmediate(function() {
    console.log("[*] Starting script");
    Java.perform(function () {
        //Java.openClassFile("/data/local/tmp/okhttp4.dex").load();
        // 只修改了这一句，换句话说，只是使用不同的拦截器对象。
        //var OKhttpAOp = Java.use("com.hss01248.frida.ignoressldez.OKhttpAOp");
        var MyInterceptor = Java.use("okhttp3.logging.HttpLoggingInterceptor");

        var MyInterceptorObj = MyInterceptor.$new();
        var Builder = Java.use("okhttp3.OkHttpClient$Builder");
        console.log(Builder);
        Builder.build.implementation = function () {
            //this.networkInterceptors().add(MyInterceptorObj);
            this.interceptors().add(MyInterceptorObj);
            console.log("注入成功");
            console.log(this.interceptors());
            //console.log(OKhttpAOp.doIgnore(this));
            return this.build();
        };
        console.log("hook_okhttp3...");
    });
});