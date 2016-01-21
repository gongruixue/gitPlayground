var koa = require('koa');
var app = koa();

/* middlewares */
function* responseTime(next){
    var start = new Date;
    yield next;
    var resTime = new Date - start;
    this.set('X-Response-Time',resTime+'ms');
}

function* logger(next){
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
}


app.use(responseTime,function* (){
    this.body = 'Hello world';
});

app.listen(3000,function(){
    console.log('Server listening on 3000')
});
