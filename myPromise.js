var fs=require('fs');

function MyPromise(job){
    this.state='PENDING';
    this.wait=false||job;

    if(job instanceof MyPromise){
        job.next=this;
    }else if(typeof job=='function'){
        this.doJob=job;
    }
}
MyPromise.resolve=function(data){
    var newPromise=new MyPromise();
    newPromise.resolve(data);
    return newPromise;
};
MyPromise.reject=function(err){
    var newPromise=new MyPromise();
    newPromise.reject(err);
    return newPromise;
};
MyPromise.all=function(tasks){
    var tasksPromise=new MyPromise(true),
        results=[];
    for(var i= 0,l=tasks.length,count=l;i<l;i++){
        (function (ii){
            var task=tasks[ii];
            task.then(function(result){
                /* one task resolved */
                results.push(result);
                if(--count==0)tasksPromise.resolve(results);
            },function(err){
                /* a task rejected */
                tasksPromise.reject({index:ii,error:err});
            })
        })(i);
    }
    return tasksPromise;
};
MyPromise.prototype.then=function(afterResolve,afterReject){
    this.afterResolve=afterResolve;
    this.afterReject=afterReject;
    new MyPromise(this);

    if(this.state=='PENDING'){
        /* not fulfilled yet */
        if(this.doJob){
            this.doJob(this.resolve.bind(this),this.reject.bind(this));

        }else if(!this.wait){
            /* no job to do and not waiting for previous Promise */
            this.resolve();
        }

    }else {
        /* already fulfilled, do post-processing */
        this.postProcess();
    }
    return this.next;

};

MyPromise.prototype.catch=function(afterReject){
    return this.then(null,afterReject);
};

MyPromise.prototype.resolve=function(result){
    this.state='RESOLVED';
    this.result=result;
    this.next && this.postProcess();
};
MyPromise.prototype.reject=function(result){
    this.state='REJECTED';
    this.result=result;
    this.next && this.postProcess();
};
MyPromise.prototype.postProcess=function(){
    var processor=this.state=='RESOLVED'?this.afterResolve:this.afterReject;
    if(processor){
        /* some post-processing to do */
        try{
            var processedResult=processor(this.result);
        }catch (e){
            return this.next.reject(e);
        }
        if(processedResult instanceof MyPromise){
            processedResult.then(this.next.resolve.bind(this.next),this.next.reject.bind(this.next));
        }else{
            this.next.resolve(processedResult);
        }
    }else{
        /* no port-processing function provided */
        this.state=='RESOLVED'?this.next.resolve(this.result):this.next.reject(this.result);
    }
};

function readFileJob(file,resolve,reject){
    fs.readFile(file,'utf8',function(err,content){
        if(err){
            reject(err);
        }else{
            resolve(content);
        }
    });
}

var readFile1=new MyPromise(readFileJob.bind(null,'add-m'));
var readFile2=new MyPromise(readFileJob.bind(null,'change-me'));

MyPromise.all([readFile1,readFile2]).then(function(results){
    console.log(results);
}).catch(function(err){
    console.log(err);
});