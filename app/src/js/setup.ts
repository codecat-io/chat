import { play } from './services/sound';
import { client } from './core';
import { store, actions, methods } from './store';

let sound = false;

client
  // FIXME: temporal fix for mesages not refreshing after some time
  .on('message', () => { try { sound && play(); } catch (err) { /* ignore */ }})
  .on('notification', () => { try { play(); } catch (err) { /* ignore */ } })
  .on('notification', () => { try { navigator.vibrate([100, 30, 100]); } catch (err) { /* ignore */ } });

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sound = true;
  } else {
    sound = false;
  }
});

