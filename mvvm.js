// mvvm入口函数  用于整合 数据监听器_observer、 指令解析器_compile、连接Observer和Compile的_watcherTpl
function myVue(options = {}) {  // 防止没传，设一个默认值
    this.$options = options; // 配置挂载
    this.$el = document.querySelector(options.el); // 获取dom
    this._data = options.data;//数据挂载
    this._watcherTpl = {};//watcher池 发布订阅
    this._observer(this._data); //数据劫持
    //#app
    this._compile(this.$el);//渲染
}

// 重写data 的 get set  更改数据的时候，触发watch 更新视图
myVue.prototype._observer = function (obj) {
    var _this = this;
    for (key in obj){  // 遍历数据
        //订阅池
        // _this._watcherTpl.a = [];
        // _this._watcherTpl.b = [];
        _this._watcherTpl[key] = {
            _directives: []
        };
        let value = obj[key]; // 获取属`性值
        let watcherTpl = _this._watcherTpl[key]; // 数据的订阅池
        Object.defineProperty(_this._data, key, { // 数据劫持
            configurable: true,  // 可以删除
            enumerable: true, // 可以遍历
            get() {
                console.log(`${key}获取值：${value}`);
                return value; // 获取值的时候 直接返回
            },
            set(newVal) { // 改变值的时候 触发set
                console.log(`${key}更新：${newVal}`);
                if (value !== newVal) {
                    value = newVal;
                    //_this._watcherTpl.xxx.forEach(item)
                    //[{update:function(){}}]
                    watcherTpl._directives.forEach((item) => { // 遍历订阅池
                        item.update();
                        // 遍历所有订阅的地方(v-model+v-bind+{{}}) 触发this._compile()中发布的订阅Watcher 更新视图
                    });
                }
            }
        })
    };
};

// 模板编译
myVue.prototype._compile = function (el) {
    var _this = this, nodes = el.children; // 获取app的dom
    for (var i = 0, len = nodes.length; i < len; i++) { // 遍历dom节点
        var node = nodes[i];
        if (node.children.length) {
            _this._compile(node);  // 递归深度遍历 dom树
        }

        // 如果有v-model属性，并且元素是INPUT或者TEXTAREA，我们监听它的input事件
        if (node.hasAttribute('v-model') && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')) {
            node.addEventListener('input', (function (key) {
                //attVal = data的值
                var attVal = node.getAttribute('v-model'); // 获取绑定的data
                //找到对应的发布订阅池
                _this._watcherTpl[attVal]._directives.push(new Watcher( // 将dom替换成属性的数据并发布订阅 在set的时候更新数据
                    node,
                    _this,
                    attVal,
                    'value'
                ));
                return function () {
                    //触发set nodes[i].value;
                    _this._data[attVal] = nodes[key].value;  // input值改变的时候 将新值赋给数据 触发set=>set触发watch 更新视图
                }
            })(i));
        }

        if (node.hasAttribute('v-bind')) { // v-bind指令
            var attrVal = node.getAttribute('v-bind'); // 绑定的data
            _this._watcherTpl[attrVal]._directives.push(new Watcher( // 将dom替换成属性的数据并发布订阅 在set的时候更新数据
                node,
                _this,
                attrVal,
                'innerHTML'
            ))
        }

        var reg = /\{\{\s*([^}]+\S)\s*\}\}/g,
            txt = node.textContent;   // 正则匹配{{}}
        if (reg.test(txt)) {
            node.textContent = txt.replace(reg, (matched, placeholder) => {
                // matched匹配的文本节点包括{{}}, placeholder 是{{}}中间的属性名
                var getName = _this._watcherTpl[placeholder]; // 所有绑定watch的数据
                if (!getName._directives) { // 没有事件池 创建事件池
                    getName._directives = [];
                }
                getName._directives.push(new Watcher( // 将dom替换成属性的数据并发布订阅 在set的时候更新数据
                    node,
                    _this,
                    placeholder,
                    'innerHTML'
                ));

                return _this._data[placeholder];
                // return placeholder.split('.').reduce((val, key) => {
                //     return _this._data[key]; // 获取数据的值 触发get 返回当前值
                // }, _this.$el);
            });
        }
    }
}

// new Watcher() 为this._compile()发布订阅+ 在this._observer()中set(赋值)的时候更新视图
function Watcher(el, vm, val, attr) {
    this.el = el; // 指令对应的DOM元素
    this.vm = vm; // myVue实例
    this.val = val; // data
    this.attr = attr; // 真实dom的属性
    this.update(); // 填入数组
}
Watcher.prototype.update = function () {
    //dom.value = this.mvvm._data[data]
    //调用get
    this.el[this.attr] = this.vm._data[this.val]; // 获取data的最新值 赋值给dom 更新视图
};