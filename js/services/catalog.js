// Exponho via window para uso simples nas páginas
function importCatalogToGlobal(){
  if(window.MR_CATALOG) return;
  window.MR_CATALOG = {
    restaurants: [
      { id: 'r1', name: 'Lanchonete 99', rating: 4.6, etaMin: 20, etaMax: 35, distanceKm: 1.8, fee: 4.9, categories: ['lanche','brasileira'], banner: 'https://picsum.photos/640/360?1', isOpen: true },
      { id: 'r2', name: 'Pizzaria da Vila', rating: 4.8, etaMin: 25, etaMax: 45, distanceKm: 3.4, fee: 6.9, categories: ['pizza'], banner: 'https://picsum.photos/640/360?2', isOpen: true },
      { id: 'r3', name: 'Sushi GO', rating: 4.4, etaMin: 35, etaMax: 55, distanceKm: 5.2, fee: 0, categories: ['japonesa'], banner: 'https://picsum.photos/640/360?3', isOpen: false },
    ],
    menus: {
      'r1': [
        { id: 'c1', title: 'Combos', items:[
          { id:'i101', title:'Combo X-Salada', desc:'X-salada + batata + refri', price: 29.9, image:'https://picsum.photos/320/220?x1' },
          { id:'i102', title:'Combo X-Burger', desc:'X-burger + batata + refri', price: 27.9, image:'https://picsum.photos/320/220?x2' },
        ]},
        { id:'c2', title:'Hambúrgueres', items:[
          { id:'i103', title:'X-Salada', price: 19.9, image:'https://picsum.photos/320/220?x3' },
          { id:'i104', title:'X-Bacon', price: 22.9, image:'https://picsum.photos/320/220?x4' },
        ]},
      ],
      'r2': [
        { id:'c1', title:'Pizzas Tradicionais', items:[
          { id:'i201', title:'Mussarela', price: 39.9, image:'https://picsum.photos/320/220?p1' },
          { id:'i202', title:'Calabresa', price: 42.9, image:'https://picsum.photos/320/220?p2' },
        ]},
      ],
      'r3': [
        { id:'c1', title:'Sushis', items:[
          { id:'i301', title:'Hossomaki', price: 34.9, image:'https://picsum.photos/320/220?s1' },
        ]},
      ],
    }
  };
}
