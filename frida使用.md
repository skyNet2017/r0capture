# frida使用

分为两大步:

* apk放入firda的so并重新打包
* 运行apk并注入脚本

## 操作参考

[Frida 安装和使用](https://www.jianshu.com/p/bab4f4714d98)

[安卓 App 逆向课程之五 frida 注入 Okhttp 抓包下篇](https://cloud.tencent.com/developer/article/1669631)





# 一 apk放入firda的so并重新打包

### 1.放入动态库:

用apktool反编译 目标apk,将libfrida-gadget.so放入libs/armeabi-v7a    libs/arm64-v8a文件夹中.

### 2 找入口类:

查看manifest,找到入口activity(搜索intent filter里同时有 main和default的)的包名路径.   也可以使用topactivity  这个app直接查看activity路径. (google play下载)

### 3 加上load 动态库的代码:

在smali里找到那个activity,用文本编辑器/sublime text打开,找到oncreate方法,加入load so的字节码:

```java
const-string v0, "frida-gadget"
invoke-static {v0}, Ljava/lang/System;->loadLibrary(Ljava/lang/String;)V
```

### 4 重新打包签名:

用apktool重新打包. 可使用debug签名. debug签名位于mac的.android/debug.keystore.

还有对齐等命令操作,稍微繁琐,参考:[Frida 安装和使用](https://www.jianshu.com/p/bab4f4714d98)



### 5 so可用性验证

运行重新打包后的apk, 会停留在入口页,然后在pc命令行输入frida -U gadget.
如果app正常使用,则说明成功注入. 此apk可以当做frida server使用,可以接受方法注入了

## 局限性说明

* 只能针对apktool能反编译的apk. 有些加固的,反编译失败
* 只能针对开发者未校验签名的apk.(好消息是,市面上大多数没有做)



# 二 hook

> 思路: java代码编译成dex,用frida加载,针对性hook

* 新建一个Android studio工程,去掉Androidx依赖. 写java代码,编译成apk.

* 解压apk,把dex push到/data/local/tmp/路径下

* 用frida加载,然后调用代码.



## 拿此处打网络日志来举例:

>  通过注入httplogingInterceptor来查看日志,绕过代理抓包的各种限制.

java源码为:

```java
public class OKhttpAOp {

    public static String doIgnore(OkHttpClient.Builder builder){
        try {
            builder.hostnameVerifier(new HostnameVerifier() {
                @Override
                public boolean verify(String hostname, SSLSession session) {
                    return true;
                }
            });
            builder.addInterceptor(new HttpLoggingInterceptor(new HttpLoggingInterceptor.Logger() {
                @Override
                public void log(String message) {
                //必须用Log. 因为HttpLoggingInterceptor内置的Logger在非debug时不打印.
                //此处还可以增加保存到文件等逻辑.
                //不能使用chuck通知栏抓包工具. 因为后续只加载dex,没有加载res文件.
                    Log.i("myhttp",message);
                }
            }).setLevel(HttpLoggingInterceptor.Level.BODY));
            return "xx";
        } catch (Throwable e) {
            e.printStackTrace();
            return e.getMessage();
        }
    }
```

编译打包,解压后拿到dex,重命名为okhttp4.dex. 已经放到本目录下.

![image-20210126110930777](https://gitee.com/hss012489/picbed/raw/master/picgo/1611630576013-image-20210126110930777.jpg)

![image-20210126110956253](https://gitee.com/hss012489/picbed/raw/master/picgo/1611630596289-image-20210126110956253.jpg)

adb push 到手机目录:

```shell
adb push okhttp4.dex /data/local/tmp/
```

然后启动已经安装的那个重新打包的app

会停留在启动页

在命令行输入:

```shell
frida -U  Gadget -l ignore2.js --no-pause
```

发现打印xx就是注入成功

![image-20210126111328824](https://gitee.com/hss012489/picbed/raw/master/picgo/1611630808858-image-20210126111328824.jpg)

然后在Android studio的logcat里,使用myhttp过滤,即可查看网络日志了:

![image-20210126111613590](https://gitee.com/hss012489/picbed/raw/master/picgo/1611630973630-image-20210126111613590.jpg)