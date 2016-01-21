var co = require('co');
var fs = require('fs');

function run(){
    function* test(){
        try{
            var file = yield readFile;

        }catch (e){
            //throw e;
            console.log(e);
        }
        var added = yield {data:file+'\r*********'};
        return added;
    }

    var readFile = new Promise(function(resolve,reject){
        fs.readFile('./packae.json','utf8',function(err,data){
            if(err)return reject(err);
            resolve(data);
        });
    });

    co(test).then(function(res){
        console.log(res);
    },function(err){
        console.log(err);
    });
}


function tryGen(){
    function* genFunc(){
        try{
            yield 1;

        }catch (e){

        }

        yield 2;
        yield 3;
        return 4;
    }

    var gen = genFunc(),result;
    console.log(result = gen.next());
    try{
        console.log(result = gen.throw(new Error ));

    }catch (e){
        console.log(result);
    }
    console.log(result = gen.next());
    console.log(result = gen.next());
}
tryGen();