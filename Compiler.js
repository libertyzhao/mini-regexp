let Lexer = require('./Lexer')
let Parser = require('./Parser')
let Input = require('./Input')
let PreProcess = require('./PreProcess')
let NfaMachine = require('./NfaMachine');

let preProcess = new PreProcess(`D   [0-9]`);
let input = new Input();
let lexer = new Lexer(input);
let parser = new Parser(lexer);
let nfaMachine = new NfaMachine(parser);

let inputString = `[0-9].ab*`;
console.log(`输入公式：${inputString}`);
input.setInput(preProcess.process(inputString));

nfaMachine.run();
nfaMachine.test(`01abbb`);
