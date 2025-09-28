// Insere itens no seu menu lateral existente (sem editar HTML antigo)
(function(){
  const ensure = ()=>{
    const aside = document.querySelector('#sidebar');
    if(!aside) return;
    const ul = aside.querySelector('ul') || aside.appendChild(Object.assign(document.createElement('ul'),{className:'menu'}));
    const links = [
      { href:'home.html', label:'Restaurantes' },
      { href:'cart.html', label:'Checkout' },
      { href:'track.html', label:'Acompanhar' },
      { href:'courier.html', label:'Motoboy' },
    ];
    links.forEach(l=>{
      if(ul.querySelector(`a[href="${l.href}"]`)) return;
      const li = document.createElement('li'); li.innerHTML = `<a href="${l.href}">${l.label}</a>`;
      ul.appendChild(li);
    });
  };
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', ensure); } else { ensure(); }
})();
