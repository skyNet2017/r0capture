import frida
import sys

# frida -U -f Gadget -l ignore.js --no-pause
# frida -U  Gadget -l ignore.js --no-pause
scr = """
setImmediate(function() {
    console.log("[*] Starting script");
    Java.perform(function () {
        Java.choose("android.view.View", {
             "onMatch":function(instance){
                  console.log("[*] Instance found: " + instance.toString());
             },
             "onComplete":function() {
                  console.log("[*] Finished heap search")
             }
        });
    });
}); 
"""

# 采用 remote 方式必须进行端口转发  或者使用get_usb_device()
rdev = frida.get_usb_device()
# 目标应用包名
session = rdev.attach("Gadget")

script = session.create_script(scr)

def on_message(message, data):
    print(message)

script.on("message", on_message)
script.load()