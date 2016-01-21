/**
 * A function which returns a Promise when the generator returns.
 *
 *   Inside the genFunc `yield` could accept a Promise as operand,
 * and the generator shall go into next iteration only after the Promise is settled.
 *   The expression `yield PromiseX` gets a return value if X is resolved
 * and throws an error otherwise, which could be caught by try...catch.
 *
 * @param genFunc :The generator function
 */
function myCo(genFunc){
    var generator = genFunc();

    /**
     * Iterate the generator until it's done
     * @param cb  :called when iteration ends
     * @param prevRst :result of previous iteration
     */
    function iterGen(cb,prevRst){
        /* if the generator has finished iteration,ends recursion */
        if(prevRst && prevRst.done===true){
            return cb(prevRst.value);
        }
        
        /* else go into next iteration */
        var result = generator.next(prevRst && prevRst.value),value = result.value,done = result.done;
        if(value instanceof Promise){
            /* if yields a Promise, settle it first */
            value.then(function(val){
                /* if resolved, go next with the resolved value */
                iterGen(cb,{done:done,value:val});
            },function(err){
                /* if rejected, throw an error */
                if(!err instanceof Error)err= new Error(err);
                /* instead of throwing the error directly,it should be thrown through generator
                * so as to be caught by try...catch block around `yield` expression */
                try{
                    generator.throw(err);
                }catch (e){
                    /* if the err thrown is caught after `yield` expression,
                    it will not be caught here, otherwise it goes here.
                     and the generator has done another iteration with `throw` */
                    cb(e);

                }
            });
        }else{
            /* if yields a value, go next directly with the result */
            iterGen(cb,result);
        }
    }


    /* Return a Promise which will be settled when the generator returns */
    return new Promise(function(resolve,reject){
        iterGen(function(result){
            if(result instanceof Error)reject(result);
            else resolve(result);
        });
    });

}


/*-----------  test  ----------------*/
function tryMyCo(){
    var fs = require('fs');
    myCo(function*(){
        var data = yield new Promise(function(resolve,reject){
            fs.readFile('./packae.json','utf8',function(err,data){
                if(err)reject(err);
                else resolve(data);
            })
        });
        yield 1;
        data += '\r\n*****************';
        return data;
    }).then(function(data){
        console.log(data);
    },function(err){
        throw err;
    }).catch(function(e){
        'e'
        throw e;
    });

}

//tryMyCo();



