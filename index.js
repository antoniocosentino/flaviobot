const cluster = require('cluster');

const goForkYourself = () => {
    const worker = cluster.fork();

    worker.on('exit', (code, signal) => {
        const timestamp = (new Date).toLocaleString();

        if (signal || code !== 0) {
            console.log('[%s; %s] [%s] Worker crashed', worker.process.pid, worker.id, timestamp);
        } else {
            console.log('[%s; %s] [%s] Worker exited cleany', worker.process.pid, worker.id, timestamp);
        }

        setTimeout(() => {
            goForkYourself();
        }, 2000);
    });

    worker.on('message', msg => {
        const timestamp = (new Date).toLocaleString();

        console.log('[%s; %s] [%s] %s', worker.process.pid, worker.id, timestamp, msg);
    });
}

if (cluster.isWorker) {
    process.send('Online');
    
    console.log = msg => process.send(msg);

    require('./entrypoint');
} else {
    goForkYourself();
}
