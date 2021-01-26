//使用方式:
// 1.用apktool反编译 目标apk,将libfrida-gadget.so放入libs/armeabi-v7a    libs/arm64-v8a文件夹中.
// 2 查看manifest,找到入口activity(搜索intent filter里同时有 main和default的)的包名路径.   也可以使用topactivity  这个app直接查看activity路径. (google play下载)
// 3 在smali里找到那个activity,用文本编辑器/sublime text打开,找到oncreate方法,加入load so的字节码:
// const-string v0, "frida-gadget"
//  invoke-static {v0}, Ljava/lang/System;->loadLibrary(Ljava/lang/String;)V
// 4 用apktool重新打包. 可使用debug签名. debug签名位于mac的.android/debug.keystore
  //以上操作参考: https://www.jianshu.com/p/bab4f4714d98
//局限性说明:  1. 只能针对apktool能反编译的apk. 有些加固的,反编译失败
//            2 只能针对开发者未校验签名的apk.(好消息是,市面上大多数没有做)
//
 // so可用性验证: 运行重新打包后的apk, 会停留在入口页,然后在pc命令行输入frida -U gadget.
// 如果app正常使用,则说明成功注入. 此apk可以当做frida server使用,可以接受方法注入了


//
// adb push okhttp4.dex /data/local/tmp/
// frida -U  Gadget -l ignore2.js --no-pause
setImmediate(function() {
    console.log("[*] Starting script");
    Java.perform(function () {
        Java.openClassFile("/data/local/tmp/okhttp4.dex").load();
        var OKhttpAOp = Java.use("com.hss01248.frida.ignoressldez.OKhttpAOp");
        var Builder = Java.use("okhttp3.OkHttpClient$Builder");
        console.log(Builder);
        Builder.build.implementation = function () {
            console.log(OKhttpAOp.doIgnore(this));
            console.log("注入成功");
            return this.build();
        };
        console.log("hook_okhttp3...");
    });
});