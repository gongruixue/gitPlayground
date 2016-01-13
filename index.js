var fs=require('fs');

function MyPromise(job){
    this.state='PENDING';
    if(job instanceof MyPromise){
        job.next=this;
        this.prev=job;
    }else if(typeof job=='function'){
        this.doJob=job;
    }
}
MyPromise.resolve=function(data){
    var newPromise=new MyPromise();
    newPromise.resolve(data);
    return newPromise;
};
MyPromise.prototype.then=function(afterResolve,afterReject){
    this.afterResolve=afterResolve;
    this.afterReject=afterReject;
    new MyPromise(this);
    var that=this;

    if(this.state=='PENDING'){
        /* not fulfilled yet */
        if(this.doJob){
            this.doJob(function(data){
                that.resolve.call(that,data);
            },function(err){
                that.reject.call(that,err);
            });

        }else if(!this.prev){
            this.resolve();
        }

    }else if (this.state=='RESOLVED'){
        /* already resolved */
        this.postResolve();
    }else{
        /* already rejected */
        this.postReject();
    }
    return this.next;

};

MyPromise.prototype.resolve=function(result){
    this.state='RESOLVED';
    this.result=result;
    this.postResolve();
};
MyPromise.prototype.reject=function(result){
    this.state='REJECTED';
    this.result=result;
    this.postReject();
};
MyPromise.prototype.postResolve=function(){
    if(this.afterResolve){
        var resolvedVal=this.afterResolve(this.result);
        if(resolvedVal instanceof MyPromise){
            resolvedVal.then(this.next.resolve.bind(this.next),this.next.reject.bind(this.next));
        }else {
            this.next.resolve.call(this.next,resolvedVal);
        }
    }
};
MyPromise.prototype.postReject=function(){
    if(this.afterReject){
        var rejectedErr=this.afterReject(this.result);
        if(rejectedErr instanceof MyPromise){
            rejectedErr.then(this.next.resolve.bind(this.next),this.next.reject.bind(this.next));
        }else{
            this.next.reject.call(this.next,rejectedErr);
        }
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

var readFile1=new MyPromise(readFileJob.bind(null,'add-me'));
var readFile2=new MyPromise(readFileJob.bind(null,'change-me'));

var str='';
var step1=MyPromise.resolve('hhhhhh\n').then(function(data){
    str+=data;
    return readFile1;
});

var step2=step1.then(function(data){
    str+=data+'****\n';
    return readFile2;
});
var step3=step2.then(function(data){
    str+=data+'^^^\n';
    return str;
});
setTimeout(function(){
    step3.then(function(result){
        console.log(result);
    });
},1000);
