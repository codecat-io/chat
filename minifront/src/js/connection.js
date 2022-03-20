const handlers = {};
const notify = (ev, ...args) => (handlers[ev] || []).forEach(h => h(...args));
const watch = (ev, fn) => (handlers[ev] = handlers[ev] || []).push(fn);
let conPromise = null;

const connect = () => {
  conPromise = new Promise(resolve => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.addEventListener('message', (raw)=>{
      try{
        notify('packet', srv, raw);
        const msg = JSON.parse(raw.data);
        if(msg.op) notify('op:'+msg.op.type, srv, msg);
        else notify('message', srv, msg);
      } catch(err) {
        notify('packet:error', srv, raw, err);
        console.error(err);
      }
    });
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('close', () => {
      console.log('Disconnected - reconect attempt in 1s');
      setTimeout(() => connect(), 1000);
    });
  }).then((ws) => {
    notify('ready', srv);
    return ws;
  })
}
connect();

const getCon = async () => {
  const con = await conPromise;
  if(con.readyState === 1) return con;
  else new Promise(resolve => setTimeout(() => getCon().then(resolve), 100));
}

const srv = {
  send: async (msg) => {
    msg._raw = msg._raw ? msg._raw : JSON.stringify(msg);
    const con = await getCon();
    con.send(msg._raw);
  },
  on: (...arg) => {
    watch(...arg);
    return srv;
  }
}

export default srv;
