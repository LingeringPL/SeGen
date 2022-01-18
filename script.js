var variables = [];
var numused = 0;
var times = 1;

const _time = document.getElementById("time");
const _add = document.getElementById("add");
const _variable = document.getElementsByClassName("variable");
const _list = document.getElementById("list");
const _error = document.getElementById("error");

function evalValue(interaction){
    let array = interaction.split(" ");
    for(let i in array){
        if(array[i][0] === "$"){
            array[i] = variables.find(v => v.name == array[i].substring(1)).value;
        }
    }
    return Function("return "+array.join(""));
}

function* pickValue(V){
    V.value ??= 0;
    V.initvalue ??= 0;
    switch(V.returnBeforeEval){
        case true:
            while(true){
                yield V.value;
                V.value = evalValue(V.interaction)();
            }
        case false:
            while(true){
                V.value = evalValue(V.interaction)();
                yield V.value;
            }
    }
}

class Variables{
    constructor(name = `${++numused}`, value = "0", interaction = `$${name} + 1`, returnBeforeEval = true){
        this.name = name;
        this.value = value;
        this.initvalue = value;
        this.interaction = interaction;
        this.returnBeforeEval = returnBeforeEval;
    }
    init(){
        this.value = this.initvalue;
    }
}

function addVariables(init,name,intrct,check=false){
    _add.children[8].innerHTML = "";
    if(Boolean(name) && !new RegExp(/^[A-Za-z0-9_]+$/g).test(name)){
        let div = document.createElement("div")
            .innerText = `Invalid variable name ${name}`;
        _add.children[8].innerHTML = div;
        _add.children[0].value = "";
        throw new Error(`Invalid variable name ${name}`);
    }

    let iinit = Number(init)?init:1;
    let sname = name?name:`${++numused}`;
    let sintrct = intrct?intrct:`$${sname} + 1`;

    let t = variables.findIndex(v => v.name == sname);
    let h = `<div class="arrow">
                <div class="arrowupward">
                    <button class="arrowtop" onclick="rearrangeVariable(${sname},'t')">-</button><br>
                    <button class="arrowup" onclick="rearrangeVariable(${sname},'u')">^</button>
                </div>
                <div class="remove">
                    <button class="remove" onclick="removeVariable(${sname});">x</button>
                </div>
                <div class="arrowdownward">
                    <button class="arrowdown" onclick="rearrangeVariable(${sname},'d')">v</button><br>
                    <button class="arrowbottom" onclick="rearrangeVariable(${sname},'b')">-</button>
                </div>
            </div>
            <div class="info">
                <div>$${sname} = ${iinit}</div>
                <div>changed by ${sintrct}</div>
                <div>
                    <input type="checkbox" class="check" ${check?"checked":""} onclick="variables.find(n=>n.name=='${sname}').returnBeforeEval = this.checked;">Value before changes</input>
                </div>
            </div>`;
    if(t != -1){
        variables[t] = new Variables(sname,iinit,intrct,check);
        _variable[t].innerHTML = h;
    } else {
        variables.push(new Variables(sname,iinit,sintrct,check));
        let div = document.createElement("div");
        div.className = "variable";
        div.id = "variable_"+sname;
        div.innerHTML = h;
        _list.appendChild(div);
    }
    
}

function addVariable(){
    addVariables(_add.children[1].value,_add.children[0].value,_add.children[3].value,_add.children[5].checked);
    for(let i in _add.children)_add.children[i].value = "";
}

function removeVariable(name){
    variables = variables.filter(v => v.name != name);
    _list.removeChild(_variable["variable_"+name]);
}

function rearrangeVariable(name, mode){
    switch(mode){
        case "t":{
            let a = [variables.find(v => v.name == name)];
            a = a.concat(variables.filter(v => v.name != name));
            variables = a;

            let b = [[..._list.children].find(v => v.id == "variable_"+name)];
            b = b.concat([..._list.children].filter(v => v.id != "variable_"+name));
            _list.innerHTML = "";
            for(let i of b){
                _list.appendChild(i);
            }
            break;
        }
        case "u":{
            if(variables.length < 1)break;
            let index = variables.findIndex(v => v.name == name);
            if(index < 1)break;
            let a = variables[index-1];
            variables[index-1] = variables[index];
            variables[index] = a;

            let array = [..._list.children];
            let b = array[index-1];
            array[index-1] = array[index];
            array[index] = b;
            _list.innerHTML = "";
            for(let i of array){
                _list.appendChild(i);
            }
            break;
        }
        case "d":{
            if(variables.length < 1)break;
            let index = variables.findIndex(v => v.name == name);
            if(index == variables.length-1)break;
            let a = variables[index+1];
            variables[index+1] = variables[index];
            variables[index] = a;

            let array = [..._list.children];
            let b = array[index+1];
            array[index+1] = array[index];
            array[index] = b;
            _list.innerHTML = "";
            for(let i of array){
                _list.appendChild(i);
            }
            break;
        }
        case "b":{
            let a = variables.filter(v => v.name != name);
            a.push(variables.find(v => v.name == name));
            variables = a;

            let b = [..._list.children].filter(v => v.id != "variable_"+name);
            b.push([..._list.children].find(v => v.id == "variable_"+name));
            _list.innerHTML = "";
            for(let i of b){
                _list.appendChild(i);
            }
            break;
        }
    }
}


function generate(){
    const input = document.getElementById("text").value;
    const output = document.getElementById("textout");
    if(input.length >= 300||times >= 1000||input.length * times >= 50000||times * variables.length >= 3000){
        let confirm = window.confirm("The generating text will be large.\nAre you sure you want to continue?");
        if(!confirm){
            _error.innerHTML = "Generation cancelled";
            return;
        }
    }
    output.value = "";
    let tmp = "";
    let pV = [];
    for(let n in variables)variables[n].init();
    try{
        _error.innerHTML = "";
        for(let n in variables)pV[n] = pickValue(variables[n]);
        for(let n = times; n > 0; n--){
            tmp = input;
            for(let i in variables){
                tmp = tmp.replace(new RegExp(`\\$${variables[i].name}`, "g"), pV[i].next().value);
            }
            output.value += tmp;
        }
    } catch(e) {
        _error.innerHTML = `${e.name}`;
        switch(e.name){
            case "TypeError":{
                _error.innerHTML += "<br>Maybe some variable is not defined?";
                break;
            }
            case "SyntaxError":{
                _error.innerHTML += "<br>Check the syntax.";
                break;
            }
            case "ReferenceError":{
                _error.innerHTML += "<br>Check some variable name is right after \"$\".";
                break;
            }
            case "RangeError":
            case "InternalError":{
                _error.innerHTML += "<br>Try to optimize some change function.";
                break;
            }
            default:{
                _error.innerHTML += "<br>Unexpected error. Check the syntax.";
                break;
            }
        }
        throw e;
    }
}

async function go(){
    addVariables("1",null,null,true);
}

_time.addEventListener("change", function(){
    if(!(_time.value > 0)){
        _time.value = 1;
    }
    times = Number(_time.value);
});

_add.children[0].addEventListener("change", function(){
    if(variables.findIndex(v => v.name == this.value)+1){
        _add.children[7].textContent = "Update";
    } else {
        _add.children[7].textContent = "Add";
    }
})

document.body.onload = go;
document.getElementById("generate").onclick = generate;
document.getElementById("addbutton").onclick = addVariable;

