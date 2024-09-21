const SIZE = 5; 
let bingoStates = Array(SIZE).fill(null).map(() => Array(SIZE).fill(false));
let bingoMessages = [];
let flag = "";
let flagShown = false;
let bingoFirstShown = false;

function generateBingoCard() {
    const table = document.getElementById('bingoTable');
    const phrases = [
        '我会使用IDA',
        '我知道异常处理',
        '我知道MD5',
        '我知道SMC',
        '我会Patch',

        '我知道PE结构',
        '我知道天堂之门',
        '我愿意学习逆向工程',
        '我知道控制流平坦化',
        '我知道TLS',

        '我知道Base64',
        '我会写Python',
        '我知道本题的flag',
        '我会写C++',
        '我知道DES',

        '我知道.NET',
        '我会脱壳',
        '我会写汇编',
        '我知道花指令',
        '我知道大端序和小端序',
        
        '我会使用angr',
        '我知道函数调用约定',
        '我知道RC4',
        '我知道导入表和导出表',
        '我会使用OllyDbg',
    ];
    let numbers = phrases.slice();
    
    let html = '<tbody>';
    for (let i = 0; i < SIZE; i++) {
        html += '<tr>';
        for (let j = 0; j < SIZE; j++) {
            let value = numbers[i * SIZE + j];
            html += `<td onclick="markCell(this, ${i}, ${j})">${value}</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody>';
    table.innerHTML = html;
}

async function markCell(cell, row, col) {
    if (bingoStates[row][col]) {
        return;
    }
    while (true) {
        let res = await sendQuestion(row,col);
        if (res == null) {
            return;
        } else if (res) {
            break;
        }
    }
    cell.classList.toggle('clicked');
    bingoStates[row][col] = true; // Toggle the clicked state
    checkBingo();
}

async function sendQuestion(row,col) {
    const questions = [
        "IDA中查找字符串的快捷键为",
        "Windows操作系统默认的异常处理机制的简称为",
        "MD5的第三个链接变量初始值为（用十六进制表示）",
        "表示“一个可读可写可执行的代码段”的段属性为（用十六进制表示）",
        "nop指令的机器码为（用十六进制表示）",

        "PE文件的前两个字符为",
        "天堂之门通过retf指令将CS寄存器设置为（用十六进制表示）",
        "好！很有精神！",
        "第一次出现控制流平坦化这个混淆方式的项目为",
        "TLS回调函数的第一个参数的参数名为",

        "标准Base64的转换表为",
        "hashtable在Python中对应的数据结构的关键字为",
        "本题的flag为",
        "C++中定义虚函数的关键字为",
        "DES的密钥长度为（单位为bit）",

        ".NET运行时提供自动内存管理的机制的简称为",
        "pushad对应的出栈指令为",
        "将 mov eax, 5 转化为AT&T格式的汇编",
        "花指令的英文为",
        "0x0a0b0c0d采用大端序存储时最高位地址存储的字节为（用十六进制表示）",

        "angr的主类的类名为",
        "C语言默认缺省的函数调用约定为",
        "RC4 S盒初始置换中swap()函数被执行的次数为",
        "与导入表中IMAGE_IMPORT_DESCRIPTOR对应的数据结构为导出表中的",
        "INT3断点的机器码为（用十六进制表示）"
    ];

    let pos = row * 5 + col;
    if (pos == 7) {
        alert(questions[pos]);
        return true;
    }
    let userAnswer = prompt(questions[pos]);
    if (userAnswer == null) {
        return null;
    }
    userAnswer = userAnswer.trim();
    let isCorrect = await checkAnswer(pos,userAnswer);
    if (pos == 12 && isCorrect) {
        flag = userAnswer;
    }
    return isCorrect;
}

async function checkAnswer(pos, userAnswer) {
    const buffer = stringToInt64Array(userAnswer);
    if (!buffer) {
        return 0;
    } 
    const response = await fetch("answerChecker.wasm");
    const bytes = await response.arrayBuffer();
    const obj = await WebAssembly.instantiate(bytes);
    var result = obj.instance.exports.check(pos, buffer[0], buffer[1], buffer[2], buffer[3], buffer[4], buffer[5], buffer[6], buffer[7]);
    return result !== 0; 
}

function checkBingo() {
    const messages = [];
    
    // Check rows and columns
    for (let i = 0; i < SIZE; i++) {
        if (bingoStates[i].every(state => state)) {
            messages.push(`Row ${i + 1} Bingo`);
        }
        if (bingoStates.every(row => row[i])) {
            messages.push(`Column ${i + 1} Bingo`);
        }
    }

    // Check diagonals
    const diagonal1 = Array.from({ length: SIZE }, (_, i) => bingoStates[i][i]);
    const diagonal2 = Array.from({ length: SIZE }, (_, i) => bingoStates[i][SIZE - 1 - i]);

    if (diagonal1.every(state => state)) {
        messages.push('Diagonal 1 Bingo');
    }
    if (diagonal2.every(state => state)) {
        messages.push('Diagonal 2 Bingo');
    }

    // Display all unique Bingo messages
    if (messages.length > 0) {
        const uniqueMessages = [...new Set(messages)];
        uniqueMessages.forEach(msg => {
            if (!bingoMessages.includes(msg)) {
                bingoMessages.push(msg);
                if (bingoStates.flat().every(state => state) && !flagShown) {
                    alert(flag);
                    flagShown = true;
                } else if(!bingoFirstShown) {
                    alert("Bingo! 填满25个格子你就能得到flag！");
                    bingoFirstShown = true;
                } else if(!flagShown) {
                    alert("Bingo!");
                }
            }
        });
    }
}

function stringToInt64Array(str) {
    if (str.length > 64) {
        return;
    }

    const buffer = new ArrayBuffer(64);
    const view = new DataView(buffer);

    for (let i = 0; i < str.length; i++) {
        view.setUint8(i, str.charCodeAt(i));
    }

    const int64Array = [];
  
    for (let i = 0; i < 8; i++) {
        const offset = i * 8;
        const int64 = view.getBigUint64(offset, true);
        int64Array.push(int64);
    }

    return int64Array;
}

// Generate the bingo card when the page loads
window.onload = generateBingoCard;