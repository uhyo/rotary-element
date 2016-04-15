var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
//座標
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.trax = function (dx) {
        return new Point(this.x + dx, this.y);
    };
    Point.prototype.tray = function (dy) {
        return new Point(this.x, this.y + dy);
    };
    return Point;
}());
//回路の構成要素
var CircuitElement = (function () {
    function CircuitElement() {
    }
    return CircuitElement;
}());
//箱である
var BoxElement = (function (_super) {
    __extends(BoxElement, _super);
    function BoxElement(size, center) {
        _super.call(this);
        this.size = size;
        this.center = center;
        this.input = {
            east: null,
            south: null,
            west: null,
            north: null
        };
        this.output = {
            east: null,
            south: null,
            west: null,
            north: null
        };
    }
    BoxElement.prototype.getPoint = function (dir, inout) {
        //ポイントを教える
        var _a = this, size = _a.size, _b = _a.center, x = _b.x, y = _b.y;
        var hsize = size / 2, qsize = size / 4;
        switch (dir) {
            case "east":
                return new Point(x + hsize, y + (inout === "in" ? -qsize : qsize));
            case "south":
                return new Point(x + (inout === "in" ? qsize : -qsize), y + hsize);
            case "west":
                return new Point(x - hsize, y + (inout === "in" ? qsize : -qsize));
            case "north":
                return new Point(x + (inout === "in" ? -qsize : qsize), y - hsize);
        }
        return new Point(x, y);
    };
    //接続情報
    BoxElement.prototype.setInput = function (d, c) {
        this.input[d] = c;
    };
    BoxElement.prototype.setOutput = function (d, c) {
        this.output[d] = c;
    };
    //何かあれする
    BoxElement.prototype.getSomeOutput = function () {
        for (var _i = 0, _a = ["east", "south", "west", "north"]; _i < _a.length; _i++) {
            var d = _a[_i];
            if (this.output[d] != null) {
                return this.output[d];
            }
        }
        return null;
    };
    //これはどの方向から？
    BoxElement.prototype.getInputDir = function (path) {
        for (var _i = 0, _a = ["east", "south", "west", "north"]; _i < _a.length; _i++) {
            var d = _a[_i];
            if (this.input[d] === path) {
                return d;
            }
        }
        return null;
    };
    //この方向のpathは？
    BoxElement.prototype.getOutputPath = function (dir) {
        return this.output[dir];
    };
    return BoxElement;
}(CircuitElement));
//ロータリー素子
var RotaryElement = (function (_super) {
    __extends(RotaryElement, _super);
    function RotaryElement() {
        _super.apply(this, arguments);
        //state
        this.state = "vertical";
    }
    RotaryElement.prototype.handleToken = function (d) {
        if (this.state === "horizontal") {
            //横（東西）
            if (d === "east") {
                //東から西へ
                return "west";
            }
            if (d === "west") {
                return "east";
            }
            if (d === "north") {
                //北から
                this.state = "vertical";
                return "west";
            }
            if (d === "south") {
                //南から
                this.state = "vertical";
                return "east";
            }
            return null;
        }
        else {
            //縦（南北）
            if (d === "south") {
                return "north";
            }
            if (d === "north") {
                return "south";
            }
            if (d === "east") {
                this.state = "horizontal";
                return "north";
            }
            if (d === "west") {
                this.state = "horizontal";
                return "south";
            }
            return null;
        }
    };
    //rendering
    RotaryElement.prototype.render = function (ctx) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";
        var _a = this, size = _a.size, _b = _a.center, x = _b.x, y = _b.y;
        //枠を描画
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        //中心の丸を描画
        ctx.beginPath();
        ctx.arc(x, y, size / 8, 0, Math.PI * 2, false);
        ctx.fill();
        //状態を描画
        ctx.beginPath();
        if (this.state === "horizontal") {
            ctx.moveTo(x - size / 16 * 7, y);
            ctx.lineTo(x + size / 16 * 7, y);
        }
        else {
            ctx.moveTo(x, y - size / 16 * 7);
            ctx.lineTo(x, y + size / 16 * 7);
        }
        ctx.stroke();
    };
    RotaryElement.prototype.getState = function () {
        return this.state;
    };
    RotaryElement.prototype.setState = function (state) {
        this.state = state;
    };
    return RotaryElement;
}(BoxElement));
//入出力
var IO = (function (_super) {
    __extends(IO, _super);
    function IO(size, center, name) {
        _super.call(this, size, center);
        this.name = name;
    }
    IO.prototype.render = function (ctx) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#777777";
        var _a = this, size = _a.size, _b = _a.center, x = _b.x, y = _b.y;
        //枠を描画
        ctx.strokeRect(x - size / 2, y - size / 2, size, size);
        //中身を描画
        ctx.fillStyle = "#000000";
        ctx.font = "14px sans-serif";
        var w = ctx.measureText(this.name).width;
        ctx.fillText(this.name, x - w / 2, y + size / 4);
    };
    return IO;
}(BoxElement));
var InputSource = (function (_super) {
    __extends(InputSource, _super);
    function InputSource() {
        _super.apply(this, arguments);
    }
    return InputSource;
}(IO));
var OutputDestination = (function (_super) {
    __extends(OutputDestination, _super);
    function OutputDestination() {
        _super.apply(this, arguments);
    }
    return OutputDestination;
}(IO));
//path
var Path = (function (_super) {
    __extends(Path, _super);
    function Path() {
        _super.apply(this, arguments);
        //位置情報
        this.path = [];
        this.length = 0;
    }
    //rendering
    Path.prototype.render = function (ctx) {
        var _a = this.path, st = _a[0], en = _a.slice(1);
        if (st == null) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#333333";
        ctx.fillStyle = "#333333";
        ctx.moveTo(st.x, st.y);
        for (var _i = 0, en_1 = en; _i < en_1.length; _i++) {
            var _b = en_1[_i], x = _b.x, y = _b.y;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        //矢印を描画
        var e1 = en.pop();
        var e2 = en.pop() || st;
        if (e1 && e2) {
            //方向を調べる
            var dx = e1.x - e2.x;
            var dy = e1.y - e2.y;
            var deg = Math.atan2(dy, dx);
            ctx.save();
            ctx.translate(e1.x, e1.y);
            ctx.rotate(deg);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-10, -5);
            ctx.lineTo(-10, 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    };
    Path.prototype.setConnection = function (input, output) {
        this.input = input;
        this.output = output;
    };
    Path.prototype.setPath = function (path) {
        this.path = path.slice();
    };
    Path.prototype.getOutput = function () {
        return this.output;
    };
    return Path;
}(CircuitElement));
//回路
var Circuit = (function () {
    function Circuit() {
        this.elements = [];
    }
    Circuit.prototype.add = function (e) {
        this.elements.push(e);
    };
    Circuit.prototype.render = function (canvas) {
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var _i = 0, _a = this.elements; _i < _a.length; _i++) {
            var e = _a[_i];
            e.render(ctx);
        }
    };
    //構成要素を得たい
    Circuit.prototype.getIO = function (name) {
        for (var _i = 0, _a = this.elements; _i < _a.length; _i++) {
            var e = _a[_i];
            if (e instanceof IO && e.name === name) {
                return e;
            }
        }
        return null;
    };
    return Circuit;
}());
//回路をレンダリングするやつ
var CircuitRenderer = (function () {
    function CircuitRenderer(circuit) {
        this.circuit = circuit;
        //現在
        this.running = false;
        this.speed = 300;
        this.ctx = document.getElementById('light').getContext('2d');
    }
    CircuitRenderer.prototype.renderCircuit = function () {
        var canvas = document.getElementById('main');
        this.circuit.render(canvas);
    };
    //入力
    CircuitRenderer.prototype.input = function (name) {
        //開始boxを探す
        var input = this.circuit.getIO(name);
        if (!input)
            return;
        //これに接続するPathを探す
        var path = input.getSomeOutput();
        this.ridePath(path, 0);
    };
    CircuitRenderer.prototype.setSpeed = function (speed) {
        this.speed = speed;
    };
    CircuitRenderer.prototype.stop = function () {
        if (this.running) {
            window.cancelAnimationFrame(this.requestID);
            this.running = false;
            this.requestID = null;
        }
    };
    CircuitRenderer.prototype.start = function () {
        var _this = this;
        if (this.running) {
            this.stop();
        }
        this.running = true;
        var handler = function () {
            _this.frame();
            if (_this.running === true) {
                _this.requestID = window.requestAnimationFrame(handler);
            }
        };
        this.lastTime = Date.now();
        handler();
    };
    CircuitRenderer.prototype.frame = function () {
        //描画
        var _a = this, ctx = _a.ctx, path = _a.path, segStart = _a.segStart, segDir = _a.segDir, position = _a.position, lastTime = _a.lastTime;
        var now = Date.now();
        var el = now - lastTime; //経過時間
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = "#ff0000";
        if (path) {
            //円を描画
            var x = segStart.x + Math.cos(segDir) * position;
            var y = segStart.y + Math.sin(segDir) * position;
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2, false);
            ctx.fill();
            //進行
            var pos = this.position += this.speed * el / 1000;
            if (pos >= this.segLength) {
                this.nextSeg();
            }
        }
        this.lastTime = now;
    };
    //segが終わった
    CircuitRenderer.prototype.nextSeg = function () {
        var path = this.path;
        //debugger;
        if (this.segnum < path.path.length - 2) {
            this.ridePath(path, this.segnum + 1);
            return;
        }
        else {
            //このpathはもう終わりだから次のpathに
            var o = path.getOutput();
            if (o instanceof Path) {
                //まだpathが続く？
                this.ridePath(o, 0);
                return;
            }
            else if (o instanceof RotaryElement) {
                //方向を取得
                var d = o.getInputDir(path);
                if (d != null) {
                    //oに突っ込む
                    var d2 = o.handleToken(d);
                    //変わったかも
                    this.renderCircuit();
                    var path2 = o.getOutputPath(d2);
                    if (path2 != null) {
                        //次のpathがみつかった
                        this.ridePath(path2, 0);
                        return;
                    }
                }
            }
        }
        //だめだったら終了
        this.stop();
    };
    //このpathに乗る
    CircuitRenderer.prototype.ridePath = function (path, segnum) {
        this.path = path;
        this.segnum = segnum;
        var ps = path.path;
        var segS = ps[segnum];
        var segE = ps[segnum + 1];
        if (segS == null || segE == null) {
            throw new Error("???");
        }
        var sx = segS.x, sy = segS.y;
        var ex = segE.x, ey = segE.y;
        //このsegの距離を計算
        this.segLength = Math.sqrt(Math.pow(sx - ex, 2) + Math.pow(sy - ey, 2));
        //角度も計算
        this.segStart = segS;
        this.segDir = Math.atan2(ey - sy, ex - sx);
        this.position = 0;
    };
    return CircuitRenderer;
}());
//文字列から回路構成
function buildCircuit(code) {
    var ROTERY_SIZE = 40;
    var circuit = new Circuit();
    var lines = code.split(/(?:\r\n|\r|\n)+/g).filter(function (x) { return !!x; });
    var table = {};
    var inputs = [];
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var l = line.replace(/\s+/g, "");
        //comment
        var r1 = l.match(/^(\w+):(\d+),(\d+)(?:,(\w))?$/);
        if (r1) {
            //ロータリー素子を追加
            var ro = new RotaryElement(ROTERY_SIZE, new Point(Number(r1[2]), Number(r1[3])));
            if (r1[4] === "h" || r1[4] === "H") {
                ro.setState("horizontal");
            }
            circuit.add(ro);
            table[r1[1]] = ro;
        }
        var r2 = l.match(/^(\w+|"\w+")(\.[ESWN])?->(\w+|"\w+")(\.[ESWN])?:((?:\d+(?:,\d+)?)?(?:->(?:\d+(?:,\d+)?)?)*)$/i);
        if (r2) {
            //パスを追加
            var p = new Path();
            var start = table[r2[1]];
            var end = table[r2[3]];
            var ps = r2[5].split("->");
            if (ps.length === 1 && ps[0] === "") {
                //何もない場合は
                ps = [];
            }
            var l_1 = ps.length;
            //座標のあれ
            var saved_x = null;
            var saved_y = null;
            //座標を適当に補完
            var start_d = r2[2] && charDir(r2[2][1]);
            var end_d = r2[4] && charDir(r2[4][1]);
            var s_p = start.getPoint(start_d, "out");
            var e_p = end.getPoint(end_d, "in");
            saved_x = s_p.x;
            saved_y = s_p.y;
            //座標を作る
            var path = [];
            //始点
            path.push(new Point(saved_x, saved_y));
            //縦か横か
            var vertical = start_d === "south" || start_d === "north";
            for (var i = 0; i < l_1; i++) {
                var xs = ps[i].split(",").filter(function (x) { return !!x; }).map(Number);
                var x = void 0, y = void 0;
                if (xs.length === 0) {
                    if (i === l_1 - 1) {
                        //最後なので特別に終点情報を使って補完
                        if (vertical) {
                            x = saved_x;
                            y = e_p.y;
                        }
                        else {
                            x = e_p.x;
                            y = saved_y;
                        }
                    }
                    else {
                        x = saved_x;
                        y = saved_y;
                    }
                }
                else if (xs.length === 1) {
                    //xとyのどちらか補完
                    if (i === l_1 - 1) {
                        if (vertical) {
                            x = e_p.x;
                            y = xs[0];
                        }
                        else {
                            x = xs[0];
                            y = e_p.y;
                        }
                    }
                    else {
                        if (vertical) {
                            //縦に進んでいる（ので横は分かっている）
                            x = saved_x;
                            y = xs[0];
                        }
                        else if (saved_y == null) {
                            x = xs[0];
                            y = saved_y;
                        }
                        else {
                            x = xs[0];
                            y = saved_y;
                        }
                    }
                }
                else {
                    x = xs[0];
                    y = xs[1];
                }
                if (x == null || y == null) {
                    throw new Error("座標がたりない");
                }
                path.push(new Point(x, y));
                //横/縦逆転
                vertical = !vertical;
                saved_x = x;
                saved_y = y;
            }
            //終点も追加
            path.push(new Point(e_p.x, e_p.y));
            p.setPath(path);
            circuit.add(p);
            //接続をあれする
            p.setConnection(start, end);
            start.setOutput(start_d, p);
            end.setInput(end_d, p);
        }
        var r3 = l.match(/^(IN|OUT)"(\w+)":(\d+),(\d+)$/i);
        if (r3) {
            //入出力
            var po = new Point(Number(r3[3]), Number(r3[4]));
            var isin = /^in$/i.test(r3[1]);
            var name_1 = r3[2];
            var ro = isin ? new InputSource(ROTERY_SIZE, po, name_1) : new OutputDestination(ROTERY_SIZE, po, name_1);
            circuit.add(ro);
            table[("\"" + r3[2] + "\"")] = ro;
            if (isin) {
                inputs.push(name_1);
            }
        }
    }
    //回路ができたのでレンダラ
    var renderer = new CircuitRenderer(circuit);
    return {
        circuit: circuit,
        inputs: inputs,
        renderer: renderer
    };
}
//回路を構成する文字列
var code = "\n//\u5165\u51FA\u529B\nIN \"a1\": 40, 130\nIN \"a2\": 40, 260\nOUT \"b1\": 760, 130\nOUT \"b2\": 760, 260\n\nq1: 180, 390, H\nq2: 400, 390\nq3: 620, 390\n\na11: 180, 130\na12: 400, 130\na13: 620, 130\na21: 180, 260\na22: 400, 260\na23: 620, 260\n\n//\u7DDA\nq1.S -> q1.S: 450 ->\nq2.S -> q2.S: 450 ->\nq3.S -> q3.S: 450 ->\n\na11.S -> a21.N:\na12.S -> a22.N:\na13.S -> a23.N:\n\na21.N -> a11.S:\na22.N -> a12.S:\na23.N -> a13.S:\n\na21.S -> q1.N:\na22.S -> q2.N:\na23.S -> q3.N:\n\nq1.N -> a21.S:\nq2.N -> a22.S:\nq3.N -> a23.S:\n\nq1.W -> a11.N: 130 -> 80 ->\nq2.W -> a12.N: 350 -> 80 ->\nq3.W -> a13.N: 570 -> 80 ->\n\na11.N -> q1.E: 80 -> 230 ->\na12.N -> q2.E: 80 -> 450 ->\na13.N -> q3.E: 80 -> 670 ->\n\na11.E -> a12.W:\na12.E -> a13.W:\na21.E -> a22.W:\na22.E -> a23.W:\n\na11.W -> a12.E: 110 -> 50 -> 470 ->\n\na12.W -> a22.E: 300 -> 200 -> 500 -> \n\na13.W -> a21.E: 550 -> 180 -> 260 ->\n\na21.W -> a23.E: 110 -> 320 -> 700 ->\n\na22.W -> a11.E: 280 -> \n\na23.W -> a13.E: 540 -> 200 -> 700 ->\n\n\"a1\".E -> a11.W:\n\n\"a2\".E -> a21.W:\n\na13.E -> \"b1\".W:\na23.E -> \"b2\".W:\n";
//ad hoc
document.getElementById('code').value = code;
loadCircuit();
//1moji kar
function charDir(char) {
    switch (char) {
        case "e":
        case "E":
            return "east";
        case "s":
        case "S":
            return "south";
        case "w":
        case "W":
            return "west";
        case "n":
        case "N":
            return "north";
    }
    return null;
}
//loadCircuit
function loadCircuit() {
    //コードからあれする
    var code = document.getElementById('code').value;
    var _a = buildCircuit(code), circuit = _a.circuit, inputs = _a.inputs, renderer = _a.renderer;
    var speed = document.getElementById('speed');
    renderer.renderCircuit();
    //
    //入力ボタンを作る
    var buttons = document.getElementById('buttons');
    //全部消去
    while (buttons.hasChildNodes()) {
        buttons.removeChild(buttons.firstChild);
    }
    //ボタンを設置
    var _loop_1 = function(name_2) {
        var b = document.createElement("input");
        b.type = "button";
        b.value = name_2 + " \u3092\u5165\u529B";
        buttons.appendChild(b);
        b.addEventListener("click", function (e) {
            renderer.input(name_2);
            renderer.setSpeed(Number(speed.value));
            renderer.start();
        }, false);
    };
    for (var _i = 0, inputs_1 = inputs; _i < inputs_1.length; _i++) {
        var name_2 = inputs_1[_i];
        _loop_1(name_2);
    }
    //速度変更に対応
    document.getElementById('speed').addEventListener('input', function (e) {
        renderer.setSpeed(Number(speed.value));
    }, false);
}
