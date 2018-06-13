const fs = require('fs');
const lineByLine = require('n-readlines');
const async = require('async');
const bitcoin = require('bitcoin');
const client = new bitcoin.Client({
  host: '192.168.1.13',
  port: 9665,
  user: 'test',
  pass: 'admin',
  timeout: 30000
});

let lines = new lineByLine('hashkeys_vps_2018-6-7.txt');
let line;
let lineNumber = 0;
//1. deal redis-cli data
let map = {};
let last;
let count = 0;
while (line = lines.next()) {
  let data = line.toString('utf-8');
  var value = data.match(/\"(.*)\"/)[1];
  if (lineNumber % 2 == 0) {
    map[value] = { pay: 0.0, back: 0.0 };
    last = value;
  } else {
    map[last].pay = parseFloat(value);
    count++;
  }
  lineNumber++;
}
//console.log(map)
for (let k in map) {
  map[k].back = parseInt(map[k].pay * 0.02);
  if (map[k].back <= 0) {
    map[k].back = 1;
  } else if (map[k].back > 100) {
    map[k].back = 100;
  }
}
let back = 0;
for (let k in map) {
  //console.log(`${k}|${map[k].back}`)
  back += map[k].back;
}
//console.log(back)



//dosend
let sleep = async function (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, time);
  })
};
function shareback(map) {
  let wfcaddr = "";
  let txval = 0;
  //get shareback account balance for at least 6 confirm
  client.getBalance('shareback', 6, function (err, balance, resHeaders) {
    if (err) {
      return console.error(err);
    }
    if (balance < txval + 1) {
      return console.error('insufficient balance');
    }
    //start to send wfc
    client.sendToAddress(wfcaddr, txval, function (err, txid, resHeaders) {
      if (err) {
        return console.error(err)
      }
      console.log(`send to ${wfcaddr} ${txval} wfc success`);
    });
  });
}

function doSend(addr, val) {
  async.waterfall([
    function (callback) {
      client.getBalance('shareback', 3, callback);
    }, function (balance, resHeaders, callback) {
      console.log('shareback\'s balance ' + balance);
      if (balance < val + 1) {
        return callback('insufficient balance');
      }
      return callback(null, balance);
    }, function (balance, callback) {
      client.sendFrom('shareback', addr, val, callback);
    }
  ], function (err, txid, resHeaders) {
    if (err) {
      return console.log(err)
    }
    console.log(`tx:${txid}:${addr}:${val}`);
  });
}

function getBalance(account) {
  client.getBalance(account, 3, (err, balance, res) => {
    console.log(balance)
  });
}

//shareback: wYQdQzgg1GGqxRbe6aT8GJguXhdaqpKpBQ
function getNewAddress(account) {
  client.getNewAddress(account, function (err, address, resHeaders) {
    console.log(arguments);
  });
}






function getmap(file) {
  let lines = new lineByLine(file);
  let line;
  let lineNumber = 0;
  //1. deal redis-cli data
  let map = {};
  let last;
  let count = 0;
  while (line = lines.next()) {
    let data = line.toString('utf-8');
    var value = data.match(/\"(.*)\"/)[1];
    if (lineNumber % 2 == 0) {
      map[value] = { pay: 0.0, back: 0.0 };
      last = value;
    } else {
      map[last].pay = parseFloat(value);
      count++;
    }
    lineNumber++;
  }
  //console.log(map)
  for (let k in map) {
    map[k].back = parseInt(map[k].pay * 0.02);
    if (map[k].back <= 0) {
      map[k].back = 1;
    } else if (map[k].back > 100) {
      map[k].back = 100;
    }
  }
  let back = 0;
  for (let k in map) {
    //console.log(`${k}|${map[k].back}`)
    back += map[k].back;
  }
  return map;
}


function calback(map) {
  for (let k in map) {
    map[k].back = parseInt(map[k].pay * 0.005);
    if (map[k].back <= 0) {
      map[k].back = 1;
    } else if (map[k].back > 50) {
      map[k].back = 50;
    }
  }
  let back = 0;
  for (let k in map) {
    //console.log(`${k}|${map[k].back}`)
    back += map[k].back;
  }
  console.log('back total:' + back);
}

function filter(map){
  for(var k in map){
    if(map[k].pay ==0){
      delete map[k]
    }
  }
}

function print(map){
  for(var k in map){
    console.log(k+":"+map[k].back)
  }
}


async function  _send(map){
  for(var k in map){
    doSend(k,map[k].back)
    //console.log(k+":"+map[k].back)
    await sleep(10000)
  }
}













//getNewAddress('shareback');
//doSend("wb42pquCDAVdh9U22yrqRRXzrd8mz7mPvt", 0.1)
//getBalance("shareback")



let lastmap = getmap('hashkeys_vps_2018-6-8.txt')
let todaymap = getmap('hashkeys_vps_2018-6-13.txt')
//console.log(lastmap)

//console.log(todaymap)



for (var k in todaymap) {
  let pay = todaymap[k].pay - (lastmap[k] ? lastmap[k].pay : 0);
  todaymap[k].pay = pay;
}
//console.log(todaymap)
calback(todaymap)
filter(todaymap)
//console.log(todaymap)
print(todaymap)

//_send(todaymap)

//doSend("waVKy3UZcQbTogj5eqZ2KoyZn17ygBsppe",18.5)