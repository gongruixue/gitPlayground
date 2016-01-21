/**
 * you can new a Promise from a to-do job(function)
 * or a Promise or nothing,
 *
 * @param job
 * @constructor
 */
function MyPromise(job){
    this.state='PENDING';
    /* a flag denoting whether the Promise is waiting for something to be done*/
    this.wait=false||job;

    if(job instanceof MyPromise){
        /* if constructed from another Promise,
         * this one will wait for that Promise to be resolved or rejected */
        job.next=this;
    }else if(typeof job=='function'){
        /* if constructed from a function,it will alter
        the state of Promise accordingly when it's done */
        this.doJob=job;
    }
}
/**----------- Class methods -------------**/
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

/**------------- instance methods ----------**/
/**
 * If created from another Promise X,the Promise will be settled immediately
 * after X is settled and after-resolve-or-reject function returns,
 * and is waiting for `then` function to be called to go to the next step;
 * If created from a function,the func is called upon calling the Promise's `then` function
 * and then inside it the Promise will be resolved or rejected
 * If created from nothing,the Promise is immediately resolved when `then` is called
 *
 * @param afterResolve
 * @param afterReject
 * @returns {*}
 * return a new Promise whose state depends on
 * the state and postProcessing function of this one
 */
MyPromise.prototype.then=function(afterResolve,afterReject){
    this.afterResolve=afterResolve;
    this.afterReject=afterReject;
    new MyPromise(this);

    if(this.state=='PENDING'){
        /* not fulfilled yet */
        if(this.doJob){
            try{
                this.doJob(this.resolve.bind(this),this.reject.bind(this));
            }catch (e){
                this.reject(e);
            }

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
    this.result=result instanceof Error ? result:new Error(result);
    this.next && this.postProcess();
};
/**
 * Called by `then` when state of the Promise is `settled`
 * the state and the result of after-resolve-or-reject function will
 * decide together the sate of the `next` Promise returned by `then`
 */
MyPromise.prototype.postProcess=function(){
    /* choose to call after-resolve-or-reject function according to the state */
    var processor=this.state=='RESOLVED'?this.afterResolve:this.afterReject;
    if(processor){
        /* some post-processing to do */
        try{
            var processedResult=processor(this.result);
        }catch (e){
            /* if error occurs then the `next` Promise shall be rejected */
            return this.next.reject(e);
        }
        if(processedResult instanceof MyPromise){
            /* if the processor returns a Promise, settle it by calling `then`
             * and make this Promise dependent on it */
            processedResult.then(this.next.resolve.bind(this.next),this.next.reject.bind(this.next));
        }else{
            /* if no error occurs and a value returned,
            the `next` Promise shall be resolved with this value */
            this.next.resolve(processedResult);
        }
    }else{
        /* No port-processing function of the current state provided,
         * the `next` Promise shall be directly settled with this state */
        this.state=='RESOLVED'?this.next.resolve(this.result):this.next.reject(this.result);
    }
};
