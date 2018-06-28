let obj = {};
let song = "发如雪";
obj.singer = "周杰伦";

Object.defineProperty(obj, 'music', {
    // value: '七里香',
    configurable: true, //可以删除
    //writable: true, //可以修改对象
    enumerable: true, //可以枚举对象
    // ☆ get,set设置时不能设置writable和value，它们代替了二者且是互斥的
    get() {
        return song;
    },
    set(val) {
        song = val;
    }
});

obj.music = '黑色毛衣';
console.log(obj);
