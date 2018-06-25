// Cart Constructor
module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function(mobile, mobileID, amount, provider, image) {
        var storedItem = this.items[mobileID];
        if (!storedItem) {
            storedItem = this.items[mobileID] = {item: mobile, qty: 0, price: 0, provider: provider, img: image};
        }
        storedItem.qty += parseInt(amount);
        storedItem.price = storedItem.qty * parseInt(storedItem.item.salePrice);
        this.totalQty += parseInt(amount);
        this.totalPrice += storedItem.price;
    };

    this.removeItem = function(id) {
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].price;
        delete this.items[id];
    };

    this.removeAll = function() {
        this.totalPrice = 0;
        this.totalQty = 0;
        for (var id in this.items) {
            delete this.items[id];
        }
    }

    this.decreaseByOne = function(id) {
        this.items[id].qty--;
        this.items[id].price -= parseInt(this.items[id].item.salePrice);
        this.totalQty--;
        this.totalPrice -= parseInt(this.items[id].item.salePrice);

        if (this.items[id].qty <= 0) {
            delete this.items[id];
        }
    };

    this.increaseByOne = function(id) {
        this.items[id].qty++;
        this.items[id].price += parseInt(this.items[id].item.salePrice);
        this.totalQty++;
        this.totalPrice += parseInt(this.items[id].item.salePrice);
    }

    this.generateArray = function() {
        var arr = [];
        console.log('items: ' + this.items);
        for (var id in this.items) {
            arr.push(this.items[id]);
        }

        return arr;
    };
};