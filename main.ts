//座標
class Point{
    constructor(public x:number, public y:number){
    }
    public trax(dx:number):Point{
        return new Point(this.x+dx, this.y);
    }
    public tray(dy:number):Point{
        return new Point(this.x, this.y+dy);
    }
}

//ロータリー素子
type RotaryState = "horizontal" | "vertical";
type RotaryDirection = "east" | "south" | "west" | "north";

interface DirectionMap<T>{
    east: T;
    south: T;
    west: T;
    north: T;
}


//回路の構成要素
abstract class CircuitElement{
    abstract render(ctx:CanvasRenderingContext2D):void;
}

//箱である
abstract class BoxElement extends CircuitElement{
    //座標
    protected center:Point;
    //大きさ
    protected size:number;

    //接続情報
    protected input : DirectionMap<Path>;
    protected output : DirectionMap<Path>;

    constructor(size:number, center:Point){
        super();
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
    public getPoint(dir:RotaryDirection, inout:"in" | "out"):Point{
        //ポイントを教える
        const {size, center:{x, y}} = this;
        const hsize = size/2, qsize = size/4;
        switch(dir){
            case "east":
                return new Point(x+hsize, y + (inout==="in" ? -qsize : qsize));
            case "south":
                return new Point(x + (inout==="in" ? qsize : -qsize), y+hsize);
            case "west":
                return new Point(x-hsize, y + (inout==="in" ? qsize : -qsize));
            case "north":
                return new Point(x + (inout==="in" ? -qsize : qsize), y-hsize);
        }
        return new Point(x, y);
    }
    //接続情報
    public setInput(d:RotaryDirection, c:CircuitElement):void{
        this.input[d] = c;
    }
    public setOutput(d:RotaryDirection, c:CircuitElement):void{
        this.output[d] = c;
    }

    //何かあれする
    public getSomeOutput():Path{
        for(let d of ["east","south","west","north"]){
            if(this.output[d]!=null){
                return this.output[d];
            }
        }
        return null;
    }
    //これはどの方向から？
    public getInputDir(path:Path):RotaryDirection{
        for(let d of ["east","south","west","north"]){
            if(this.input[d]===path){
                return d as RotaryDirection;
            }
        }
        return null;
    }
    //この方向のpathは？
    public getOutputPath(dir:RotaryDirection):Path{
        return this.output[dir];
    }
}

//ロータリー素子
class RotaryElement extends BoxElement{
    //state
    private state : RotaryState = "vertical";

    public handleToken(d:RotaryDirection):RotaryDirection{
        if(this.state==="horizontal"){
            //横（東西）
            if(d==="east"){
                //東から西へ
                return "west";
            }
            if(d==="west"){
                return "east";
            }
            if(d==="north"){
                //北から
                this.state = "vertical";
                return "west";
            }
            if(d==="south"){
                //南から
                this.state = "vertical";
                return "east";
            }
            return null;
        }else{
            //縦（南北）
            if(d==="south"){
                return "north";
            }
            if(d==="north"){
                return "south";
            }
            if(d==="east"){
                this.state = "horizontal";
                return "north";
            }
            if(d==="west"){
                this.state = "horizontal";
                return "south";
            }
            return null;
        }
    }
    //rendering
    public render(ctx:CanvasRenderingContext2D):void{
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";

        const {size, center:{x, y}} = this;
        //枠を描画
        ctx.strokeRect(x-size/2, y-size/2, size, size);

        //中心の丸を描画
        ctx.beginPath();
        ctx.arc(x, y, size/8, 0, Math.PI*2, false);
        ctx.fill();

        //状態を描画
        ctx.beginPath();
        if(this.state==="horizontal"){
            ctx.moveTo(x-size/16*7, y);
            ctx.lineTo(x+size/16*7, y);
        }else{
            ctx.moveTo(x, y-size/16*7);
            ctx.lineTo(x, y+size/16*7);
        }
        ctx.stroke();
    }

    public getState():RotaryState{
        return this.state;
    }
    public setState(state:RotaryState):void{
        this.state = state;
    }

}

//入出力
abstract class IO extends BoxElement{
    public name:string;
    constructor(size:number, center:Point, name:string){
        super(size, center);
        this.name = name;
    }

    public render(ctx:CanvasRenderingContext2D):void{
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#777777";

        const {size, center:{x, y}} = this;
        //枠を描画
        ctx.strokeRect(x-size/2, y-size/2, size, size);
        //中身を描画
        ctx.fillStyle = "#000000";
        ctx.font = "14px sans-serif";
        const w = ctx.measureText(this.name).width;
        ctx.fillText(this.name, x-w/2, y+size/4);
    }
}

class InputSource extends IO{
}

class OutputDestination extends IO{
}

//path
class Path extends CircuitElement{
    //線
    private input: CircuitElement;
    private output: CircuitElement;

    //位置情報
    public path:Array<Point> = [];
    public length:number = 0;

    //rendering
    public render(ctx):void{
        const [st, ...en] = this.path;
        if(st==null){
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#333333";
        ctx.fillStyle = "#333333";
        ctx.moveTo(st.x, st.y);
        for(let {x, y} of en){
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        //矢印を描画
        let e1 = en.pop();
        let e2 = en.pop() || st;
        if(e1 && e2){
            //方向を調べる
            const dx = e1.x - e2.x;
            const dy = e1.y - e2.y;
            const deg = Math.atan2(dy, dx);
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
    }
    
    public setConnection(input:CircuitElement, output:CircuitElement):void{
        this.input = input;
        this.output = output;
    }
    public setPath(path:Array<Point>):void{
        this.path=[...path];
    }
    public getOutput():CircuitElement{
        return this.output;
    }
}


//回路
class Circuit{
    private elements : Array<CircuitElement> = [];
    constructor(){
    }
    public add(e:CircuitElement):void{
        this.elements.push(e);
    }
    public render(canvas:HTMLCanvasElement):void{
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(let e of this.elements){
            e.render(ctx);
        }
    }

    //構成要素を得たい
    public getIO(name:string):IO{
        for(let e of this.elements){
            if(e instanceof IO && e.name===name){
                return e;
            }
        }
        return null;
    }
}

//ひとつのt−おくん
interface Token{
    //現在走行中のpath
    path:Path;
    //現在走行中のseg
    segnum:number;
    segLength:number;
    segStart:Point;
    segDir:number;
    position:number;
}
//回路をレンダリングするやつ
class CircuitRenderer{
    private speed:number;   // px/s

    private ctx:CanvasRenderingContext2D;

    //現在
    private running:boolean = false;
    private requestID:any;
    private tokens:Array<Token> = [];

    private lastTime:number;
    constructor(private circuit:Circuit){
        this.speed = 300;
        this.ctx = (document.getElementById('light') as HTMLCanvasElement).getContext('2d');
    }
    public renderCircuit(){
        const canvas = document.getElementById('main') as HTMLCanvasElement;
        this.circuit.render(canvas);
    }
    //入力
    public input(name:string):void{
        //開始boxを探す
        const input = this.circuit.getIO(name);
        if(!input)return;

        //これに接続するPathを探す
        const path = input.getSomeOutput();
        const token:Token = {
            path: null,
            segnum: null,
            segLength: null,
            segStart: null,
            segDir: null,
            position: null
        };
        this.tokens.push(token);
        this.ridePath(token, path, 0);
    }
    public setSpeed(speed:number):void{
        this.speed = speed;
    }

    public stop():void{
        if(this.running){
            window.cancelAnimationFrame(this.requestID);
            this.running=false;
            this.requestID=null;
        }
    }
    public start():void{
        if(this.running){
            this.stop();
        }
        this.running=true;
        const handler = ()=>{
            this.frame();
            if(this.running===true){
                this.requestID = window.requestAnimationFrame(handler);
            }
        };
        this.lastTime = Date.now();
        handler();
    }
    private frame():void{
        //描画
        const {ctx, tokens, lastTime}=this;
        const now = Date.now();
        const el = now - lastTime;  //経過時間
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.fillStyle="#ff0000";
        for(let token of tokens){
            const {path, segnum, segLength, segStart, segDir, position} = token;
            //円を描画
            const x = segStart.x + Math.cos(segDir)*position;
            const y = segStart.y + Math.sin(segDir)*position;
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI*2, false);
            ctx.fill();
            //進行
            const pos = token.position += this.speed*el/1000;
            if(pos >= segLength){
                this.nextSeg(token);
            }
        }
        this.lastTime = now;
    }
    //segが終わった
    private nextSeg(token:Token):void{
        const {path, segnum}=token;
        //debugger;
        if(segnum < path.path.length-2){
            this.ridePath(token, path, segnum+1);
            return;
        }else{
            //このpathはもう終わりだから次のpathに
            const o = path.getOutput();
            if(o instanceof Path){
                //まだpathが続く？
                this.ridePath(token, o, 0);
                return;
            }else if(o instanceof RotaryElement){
                //方向を取得
                const d = o.getInputDir(path);
                if(d!=null){
                    //oに突っ込む
                    const d2 = o.handleToken(d);
                    //変わったかも
                    this.renderCircuit();
                    const path2 = o.getOutputPath(d2);
                    if(path2!=null){
                        //次のpathがみつかった
                        this.ridePath(token, path2, 0);
                        return;
                    }
                }
            }
        }
        //だめだったら終了
        this.destroy(token);
    }
    //このpathに乗る
    private ridePath(token:Token, path:Path, segnum:number):void{
        token.path = path;
        token.segnum = segnum;

        const ps = path.path;
        const segS = ps[segnum];
        const segE = ps[segnum+1];
        if(segS==null || segE==null){
            throw new Error("???");
        }
        const {x:sx, y:sy} = segS;
        const {x:ex, y:ey} = segE;
        //このsegの距離を計算
        token.segLength = Math.sqrt(Math.pow(sx-ex,2) + Math.pow(sy-ey,2));
        //角度も計算
        token.segStart = segS;
        token.segDir = Math.atan2(ey-sy, ex-sx);
        token.position = 0;
    }
    private destroy(token:Token):void{
        //トークンが終了
        this.tokens = this.tokens.filter(t=>t!==token);
        if(this.tokens.length===0){
            this.stop();
        }
    }
}

//文字列から回路構成
function buildCircuit(code:string):{circuit: Circuit; inputs: Array<string>; renderer: CircuitRenderer}{
    const ROTERY_SIZE = 40;
    const circuit = new Circuit();
    const lines = code.split(/(?:\r\n|\r|\n)+/g).filter(x=>!!x);

    const table:{[id:string]:BoxElement} = {};

    const inputs:Array<string> = [];

    for(let line of lines){
        const l = line.replace(/\s+/g,"");
        //comment
        const r1 = l.match(/^(\w+):(\d+),(\d+)(?:,(\w))?$/);
        if(r1){
            //ロータリー素子を追加
            const ro = new RotaryElement(ROTERY_SIZE, new Point(Number(r1[2]), Number(r1[3])));
            if(r1[4]==="h" || r1[4]==="H"){
                ro.setState("horizontal");
            }
            circuit.add(ro);
            table[r1[1]] = ro;
        }
        const r2 = l.match(/^(\w+|"[^\"]+")(\.[ESWN])?->(\w+|"[^\"]+")(\.[ESWN])?:((?:\*|\d+(?:,\d+)?)?(?:->(?:\*|\d+(?:,\d+)?)?)*)$/i);
        if(r2){
            //パスを追加
            const p = new Path();
            const start = table[r2[1]];
            const end = table[r2[3]];
            let ps = r2[5].split("->");
            if(ps.length===1 && ps[0]===""){
                //何もない場合は
                ps = [];
            }
            const l = ps.length;
            //座標のあれ
            let saved_x = null;
            let saved_y = null;
            //座標を適当に補完
            const start_d = r2[2] && charDir(r2[2][1]);
            const end_d = r2[4] && charDir(r2[4][1]); 
            const s_p = start.getPoint(start_d, "out");
            const e_p = end.getPoint(end_d, "in");

            saved_x = s_p.x;
            saved_y = s_p.y;
            //座標を作る
            const path:Array<Point> = [];
            //始点
            path.push(new Point(saved_x, saved_y));
            //縦か横か
            let vertical = start_d==="south" || start_d==="north";
            for(let i=0; i<l; i++){
                const xs = ps[i].split(",").filter(x=>!!x && x!=="*").map(Number);
                let x,y;
                if(xs.length===0){
                    if(i===l-1){
                        //最後なので特別に終点情報を使って補完
                        if(vertical){
                            x=saved_x;
                            y=e_p.y;
                        }else{
                            x=e_p.x;
                            y=saved_y;
                        }
                    }else{
                        x=saved_x;
                        y=saved_y;
                    }
                }else if(xs.length===1){
                    //xとyのどちらか補完
                    if(i===l-1){
                        if(vertical){
                            x=e_p.x;
                            y=xs[0];
                        }else{
                            x=xs[0];
                            y=e_p.y;
                        }
                    }else{
                        if(vertical){
                            //縦に進んでいる（ので横は分かっている）
                            x=saved_x;
                            y=xs[0];
                        }else if(saved_y==null){
                            x=xs[0];
                            y=saved_y;
                        }else{
                            x=xs[0];
                            y=saved_y;
                        }
                    }
                }else{
                    x=xs[0];
                    y=xs[1];
                }
                if(x==null || y==null){
                    throw new Error("座標がたりない");
                }
                path.push(new Point(x,y));
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
        const r3 = l.match(/^(IN|OUT)"(\w+)":(\d+),(\d+)$/i);
        if(r3){
            //入出力
            const po=new Point(Number(r3[3]), Number(r3[4]));
            const isin = /^in$/i.test(r3[1]);
            const name = r3[2];
            const ro = isin ? new InputSource(ROTERY_SIZE, po, name) : new OutputDestination(ROTERY_SIZE, po, name);
            circuit.add(ro);
            table[`"${r3[2]}"`] = ro;
            if(isin){
                inputs.push(name);
            }
        }
    }

    //回路ができたのでレンダラ
    const renderer = new CircuitRenderer(circuit);
    return {
        circuit,
        inputs,
        renderer
    };
}

//回路を構成する文字列
const code = `
//入出力
IN "a1": 40, 130
IN "a2": 40, 260
OUT "b1": 760, 130
OUT "b2": 760, 260

q1: 180, 390, H
q2: 400, 390
q3: 620, 390

a11: 180, 130
a12: 400, 130
a13: 620, 130
a21: 180, 260
a22: 400, 260
a23: 620, 260

//線
q1.S -> q1.S: 450 ->
q2.S -> q2.S: 450 ->
q3.S -> q3.S: 450 ->

a11.S -> a21.N:
a12.S -> a22.N:
a13.S -> a23.N:

a21.N -> a11.S:
a22.N -> a12.S:
a23.N -> a13.S:

a21.S -> q1.N:
a22.S -> q2.N:
a23.S -> q3.N:

q1.N -> a21.S:
q2.N -> a22.S:
q3.N -> a23.S:

q1.W -> a11.N: 130 -> 80 ->
q2.W -> a12.N: 350 -> 80 ->
q3.W -> a13.N: 570 -> 80 ->

a11.N -> q1.E: 80 -> 230 ->
a12.N -> q2.E: 80 -> 450 ->
a13.N -> q3.E: 80 -> 670 ->

a11.E -> a12.W:
a12.E -> a13.W:
a21.E -> a22.W:
a22.E -> a23.W:

a11.W -> a12.E: 110 -> 50 -> 470 ->

a12.W -> a22.E: 300 -> 200 -> 500 -> 

a13.W -> a21.E: 550 -> 180 -> 260 ->

a21.W -> a23.E: 110 -> 320 -> 700 ->

a22.W -> a11.E: 280 -> 

a23.W -> a13.E: 540 -> 200 -> 700 ->

"a1".E -> a11.W:

"a2".E -> a21.W:

a13.E -> "b1".W:
a23.E -> "b2".W:
`;
/*
const code = `
IN "0": 40, 130
IN "1": 40, 260 

OUT "OUT0": 360, 130
OUT "OUT1": 360, 260

q: 200, 195

"0".E -> q.N: *
"1".E -> q.W: 150 -> *
q.S -> "OUT0".W: 230 -> 260 -> *
q.N -> "OUT1".W: 160 -> 280 -> *

q.E -> q.S: 240 -> 250 -> *
q.W -> q.E: 150 -> 110 -> 240 -> *
`;
*/
//ad hoc
(document.getElementById('code') as HTMLInputElement).value=code;

loadCircuit();


//1moji kar
function charDir(char:string):RotaryDirection{
    switch(char){
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
function loadCircuit():void{
    //コードからあれする
    const code = (document.getElementById('code') as HTMLTextAreaElement).value;
    const {circuit, inputs, renderer} = buildCircuit(code);
    
    const speed = document.getElementById('speed') as HTMLInputElement;

    renderer.renderCircuit();
    
    //

    //入力ボタンを作る
    const buttons = document.getElementById('buttons');
    //全部消去
    while(buttons.hasChildNodes()){
        buttons.removeChild(buttons.firstChild);
    }
    //ボタンを設置
    for(let name of inputs){
        const b = document.createElement("input");
        b.type="button";
        b.value=`${name} を入力`;
        buttons.appendChild(b);
        b.addEventListener("click",(e)=>{
            renderer.input(name);
            renderer.setSpeed(Number(speed.value));
            renderer.start();
        },false);
    }
    //速度変更に対応
    document.getElementById('speed').addEventListener('input',(e)=>{
        renderer.setSpeed(Number(speed.value));
    },false);
}
