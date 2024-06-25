let  products = [];
let cart = [];

//* selectors
const selectors = {
    products: document.querySelector('.products'),
    cartBtn: document.querySelector('.cart__btn'),
    cartQty: document.querySelector('.cart__qty'),
    cartClose: document.querySelector('.cart--close'),
    cart: document.querySelector('.cart'),
    cartOverlay: document.querySelector('.cart--overlay'),
    cartClear: document.querySelector('.cart--clear'),
    cartBody: document.querySelector('.cart__body'),
    cartTotal: document.querySelector('.cart__footer--total'),
    filterButtons: document.querySelectorAll('.filter__btn'),
    searchInput: document.querySelector('.search__input')
}


//* event listeners
const setupListeners = () => {
    document.addEventListener('DOMContentLoaded', initStore);

    //product event
    selectors.products.addEventListener('click', addToCart);

    // cart events
    selectors.cartBtn.addEventListener('click', showCart);
    selectors.cartClose.addEventListener('click', hideCart);
    selectors.cartOverlay.addEventListener('click', hideCart);
    selectors.cartBody.addEventListener('click', updateCart);
    selectors.cartClear.addEventListener('click', clearCart);
};

//* event handlers
const initStore = () => {
    loadCart();
    loadProducts('https://fakestoreapi.com/products/')
    .then(renderProducts)
    .finally(renderCart);
};

const searchProduct = () => {
    const searchTerm = selectors.searchInput.value.toLowerCase();
    const item = selectors.products.querySelectorAll('.product')
    
    for(let i = 0; i < item.length; i++) {
        const itemTitle = item[i].querySelector('.product h3');
        if(itemTitle.innerHTML.toLowerCase().indexOf(searchTerm) > -1) {
            item[i].classList.remove('hide--product');
        } else {
            item[i].classList.add('hide--product');
        }
    }
};

selectors.searchInput.addEventListener('keyup', searchProduct);

selectors.searchInput.addEventListener('input', searchProduct);

const filterProducts = e => {
    document.querySelector('.active--btn').classList.remove('active--btn');
    e.target.classList.add('active--btn');
    const cards = document.querySelectorAll('.products .product');
    cards.forEach(card => {
        card.classList.add('hide--product');
        if(card.dataset.name === e.target.dataset.name || e.target.dataset.name === "all") {
            card.classList.remove('hide--product');
        }
    });
}

selectors.filterButtons.forEach(button => button.addEventListener('click', filterProducts)
);

const showCart = () => {
    selectors.cart.classList.add('show');
    selectors.cartOverlay.classList.add('show');
};

const hideCart = () => {
    selectors.cart.classList.remove('show');
    selectors.cartOverlay.classList.remove('show');
};

const clearCart = () => {
    cart = [];
    saveCart();
    renderCart();
    setTimeout(hideCart, 500);
};

const addToCart = (e) => {
    if(e.target.hasAttribute('data-id')) {
        const id = parseInt(e.target.dataset.id);
        const inCart = cart.find(x => x.id === id);

        if(inCart) {
            alert('Item is already in cart.');
            return;
        }

        cart.push({ id, qty: 1 });
        saveCart();
        renderCart();
        showCart();
    }
};

const removeFromCart = (id) => {
    cart = cart.filter(x => x.id!== id);
    // if the last item is remove, close the cart
    cart.length === 0 && setTimeout(hideCart, 500);
};

const increaseQty = (id) => {
    const item = cart.find(x => x.id === id);
    if(!item) return;

    item.qty++;
};

const decreaseQty = (id) => {
    const item = cart.find(x => x.id === id);
    if(!item) return;

    item.qty--;

    if(item.qty === 0) removeFromCart(id);
};

const updateCart = (e) => {
    if(e.target.hasAttribute('data-btn')) {
        const cartItem = e.target.closest('.cart__body--item')
        const id = parseInt(cartItem.dataset.id);
        const btn = e.target.dataset.btn;

        btn === 'incr' && increaseQty(id);
        btn === 'decr' && decreaseQty(id);

        saveCart();
        renderCart();
    }
};

const saveCart = () => {
    localStorage.setItem('shop-for-all', JSON.stringify(cart));
};

const loadCart = () => {
    cart = JSON.parse(localStorage.getItem('shop-for-all')) || [];
};

//* render functions
const renderCart = () => {
    // show cart qty in navbar
    const cartQty = cart.reduce((sum, item) => {
        return sum + item.qty;
    }, 0);
    selectors.cartQty.textContent = cartQty;
    selectors.cartQty.classList.toggle('visible', cartQty);

    // show cart total
    selectors.cartTotal.textContent = calculateTotal().format();

    //show empty cart
    if(cart.length === 0) {
        selectors.cartBody.innerHTML = `
            <div class="cart__body--empty">
                <h3>Your cart is empty.</h3>
            </div>
        `;
        return;
    }

    //show cart items
    selectors.cartBody.innerHTML = cart.map(({ id, qty }) => {

        // get product info of each cart item
        const product = products.find(x => x.id === id);

        const { title, image, price } = product;

        const amount = price * qty;

        return `
            <div class="cart__body--item" data-id="${id}">
                <img src="${image}" alt="${title}">
                <div class="cart__body--item-detail">
                    <h3>${title}</h3>
                    <h5>${price.format()}</h5>
                    <div class="cart-item-amount">
                        <i class="bi bi-dash-lg" data-btn="decr"></i>
                        <span class="qty">${qty}</span>
                        <i class="bi bi-plus-lg" data-btn="incr"></i>
                        <span class="cart-item-price">${amount.format()}</span>
                    </div>
                </div>
            </div>
        `

        
    }).join('');
};

const renderProducts = () => {
    selectors.products.innerHTML = products.map(product => {
        const { id, title, image, price, category } = product;
        // check if product is already in cart
        const inCart = cart.find(x => x.id === id);

        // make the add to cart button disabled if already in cart
        const disabled = inCart? 'disabled' : '';

        // changed the text if already in cart
        const text = inCart? 'Added in Cart' : 'Add to Cart';

        return `
        <div class="product" data-name="${category}">
            <img src="${image}" alt="${title}">
            <h3>${title}</h3>
            <h5>${price.format()}</h5>
            <button ${disabled} data-id=${id}>${text}</button>
        </div>
                `;
    }).join('');
};


//* API functions
const loadProducts =async (apiURL) => {
    try {
        const response = await fetch(apiURL);
        if(!response.ok) {
            throw new Error(`http error! status=${response.status}`);
        }
        products = await response.json();
    } catch (err) {
        console.log('fetch error:', err);
    }
};

//* helper functions
const calculateTotal = () => {
    return cart.map(({ id, qty }) => {
        const { price } = products.find(x => x.id === id);
        return price * qty;
    }).reduce((sum, number) => {
        return sum + number;
    }, 0);
};

Number.prototype.format = function() {
    return this.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    });
};

//* initialize
setupListeners();


