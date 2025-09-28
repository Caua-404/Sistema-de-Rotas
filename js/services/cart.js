function ensureCartStorage(){
  if(window.MR_CART) return;
  const LS_KEY = 'mr_cart';
  const indexById = {};
  const lookup = (restaurantId, itemId) => {
    const r = window.MR_CATALOG.restaurants.find(r=>r.id===restaurantId);
    const cat = window.MR_CATALOG.menus[restaurantId].find(c=>c.items.some(i=>i.id===itemId));
    const item = cat.items.find(i=>i.id===itemId);
    return { r, item };
  };
  function load(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)||'{"items":[]}'); }catch{ return {items:[]}; }
  }
  function save(state){ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  function state(){
    const s = load();
    let subtotal = 0;
    const items = s.items.map(it=>{
      const { item } = lookup(it.restaurantId, it.itemId);
      const total = item.price * it.qty;
      subtotal += total;
      return { ...it, title:item.title, price:item.price, total };
    });
    return { items, subtotal };
  }
  function addItem({ restaurantId, itemId, qty }){
    const s = load();
    const key = `${restaurantId}:${itemId}`;
    const row = s.items.find(x=>`${x.restaurantId}:${x.itemId}`===key);
    if(row){ row.qty += qty; } else { s.items.push({ restaurantId, itemId, qty }); }
    save(s);
  }
  function clear(){ save({items:[]}); }
  window.MR_CART = { state, addItem, clear, LS_KEY };
}
