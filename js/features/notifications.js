export async function ensurePermission(){
  if(!('Notification' in window)) return false;
  if(Notification.permission === 'granted') return true;
  const p = await Notification.requestPermission();
  return p === 'granted';
}

export function notify(title, body){
  if(!('Notification' in window)) return;
  if(Notification.permission!=='granted') return;
  return new Notification(title, { body });
}
