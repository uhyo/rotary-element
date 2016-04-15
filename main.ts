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
type RoteryState = "horizontal" | "vertical";
type RoteryDirection = "east" | "south" | "west" | "north" | "none";

interface DirectionMap<T>{
    east: T;
    south: T;
    west: T;
    north: T;
}
type RoteryData = DirectionMap<boolean>;

function dir(d:RoteryDirection):RoteryData{
    const result:RoteryData = {
        east: false,
        south: false,
        west: false,
        north: false
    };
    if(d!=="none"){
        result[d]=true;
    }
    return result;
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

    constructor(size:number, center:Point){
        super();
        this.size = size;
        this.center = center;
    }
    public getPoint(dir:RoteryDirection, inout:"in" | "out"):Point{
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
}

//ロータリー素子
class RoteryElement extends BoxElement{
    //state
    private state : RoteryState = "vertical";
    //接続情報
    private input : DirectionMap<CircuitElement>;
    private output : DirectionMap<CircuitElement>;

    constructor(size:number, center:Point){
        super(size, center);
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
    public handleToken(d:RoteryData):RoteryData{
        this.validate(d);
        const {east, south, west, north} = d;
        if(this.state==="horizontal"){
            //横（東西）
            if(east){
                //東から西へ
                return dir("west");
            }
            if(west){
                return dir("east");
            }
            if(north){
                //北から
                this.state = "vertical";
                return dir("west");
            }
            if(south){
                //南から
                this.state = "vertical";
                return dir("east");
            }
            return dir("none");
        }else{
            //縦（南北）
            if(south){
                return dir("north");
            }
            if(north){
                return dir("south");
            }
            if(east){
                this.state = "horizontal";
                return dir("north");
            }
            if(west){
                this.state = "horizontal";
                return dir("south");
            }
            return dir("none");
        }
    }
    private validate(d:RoteryData):void{
        //複数入力されていないか調べる
        const {east, south, west, north} = d;
        const trues = [east, south, west, north].filter(x=>x);
        if(trues.length > 1){
            throw new Error("RoteryData Validation Error");
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

    public getState():RoteryState{
        return this.state;
    }
    public setState(state:RoteryState):void{
        this.state = state;
    }
    public setInput(input:DirectionMap<CircuitElement>):void{
        for(let d in ["east","south","west","north"]){
            this.input[d] = input[d];
        }
    }
    public setOutput(output:DirectionMap<CircuitElement>):void{
        for(let d in ["east","south","west","north"]){
            this.output[d] = output[d];
        }
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
    
    public setInput(input:CircuitElement):void{
        this.input = input;
    }
    public setOutput(output:CircuitElement):void{
        this.output = output;
    }
    public setPath(path:Array<Point>):void{
        this.path=[...path];
    }
}


//回路
class Circuit{
    private elements : Array<CircuitElement> = [];
    private canvas:HTMLCanvasElement;
    constructor(c:HTMLCanvasElement){
        this.canvas = c;
    }
    public add(e:CircuitElement):void{
        this.elements.push(e);
    }
    public render():void{
        const {canvas} = this;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for(let e of this.elements){
            e.render(ctx);
        }
    }
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

//回路を作る
const circuit = buildCircuit(code);
circuit.render();


//文字列から回路構成
function buildCircuit(code:string):Circuit{
    const ROTERY_SIZE = 40;
    const circuit = new Circuit(document.getElementById('main') as HTMLCanvasElement);
    const lines = code.split(/(?:\r\n|\r|\n)+/g).filter(x=>!!x);

    const table:{[id:string]:BoxElement} = {};

    for(let line of lines){
        const l = line.replace(/\s+/g,"");
        //comment
        const r1 = l.match(/^(\w+):(\d+),(\d+)(?:,(\w))?$/);
        if(r1){
            //ロータリー素子を追加
            const ro = new RoteryElement(ROTERY_SIZE, new Point(Number(r1[2]), Number(r1[3])));
            if(r1[4]==="h" || r1[4]==="H"){
                ro.setState("horizontal");
            }
            circuit.add(ro);
            table[r1[1]] = ro;
        }
        const r2 = l.match(/^(\w+|"\w+")(\.[ESWN])?->(\w+|"\w+")(\.[ESWN])?:((?:\d+(?:,\d+)?)?(?:->(?:\d+(?:,\d+)?)?)*)$/i);
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
                const xs = ps[i].split(",").filter(x=>!!x).map(Number);
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
            console.log([...path]);
            p.setPath(path);
            circuit.add(p);
        }
        const r3 = l.match(/^(IN|OUT)"(\w+)":(\d+),(\d+)$/i);
        if(r3){
            //入出力
            const po=new Point(Number(r3[3]), Number(r3[4]));
            const ro = /^in$/i.test(r3[1]) ? new InputSource(ROTERY_SIZE, po, r3[2]) : new OutputDestination(ROTERY_SIZE, po, r3[2]);
            circuit.add(ro);
            table[`"${r3[2]}"`] = ro;
        }
    }
    return circuit;
}

//1moji kar
function charDir(char:string):RoteryDirection{
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