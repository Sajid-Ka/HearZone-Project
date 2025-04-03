const Cart = require('../../models/cartSchema');
const Product = require('../../models/productSchema');
const Wishlist = require('../../models/wishlistSchema'); // Assuming you have a wishlist model


// Get cart items
const getCartItems = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                populate: [
                    { path: 'category', select: 'name isListed' },
                    { path: 'brand', select: 'brandName isBlocked' }
                ]
            });

        if (!cart || !cart.items.length) {
            return res.render('user/cart', {
                cart: { items: [] },
                subTotal: 0,
                discountAmount: 0,
                finalAmount: 0
            });
        }

        // Process cart items
        const updatedItems = [];
        let needsUpdate = false;

        for (const item of cart.items) {
            if (!item.productId) {
                needsUpdate = true;
                continue;
            }

            const product = item.productId;

            // Check various blocking conditions
            if (product.isBlocked || 
                !product.category || 
                !product.category.isListed ||
                !product.brand ||
                product.brand.isBlocked) {
                needsUpdate = true;
                continue;
            }

            // Use salePrice or regularPrice as the item's price
            const currentPrice = product.salePrice || product.regularPrice;
            if (!item.price || item.price !== currentPrice) {
                item.price = currentPrice;
                item.totalPrice = currentPrice * item.quantity;
                needsUpdate = true;
            }

            // Adjust quantity if it exceeds stock
            if (item.quantity > product.quantity) {
                item.quantity = Math.max(1, product.quantity);
                item.totalPrice = currentPrice * item.quantity;
                needsUpdate = true;
            }

            updatedItems.push(item);
        }

        // Update cart if necessary
        if (needsUpdate) {
            cart.items = updatedItems;
            cart.calculateTotals();
            await cart.save();
        }

        return res.render('user/cart', {
            cart,
            subTotal: cart.subTotal,
            discountAmount: cart.discountAmount,
            finalAmount: cart.finalAmount
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        return res.status(500).render('user/error', { message: 'Failed to load cart' });
    }
};
    
// Add to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId, quantity = 1 } = req.body;
        const MAX_QUANTITY_PER_ITEM = 5;

        // Check if product exists with populated category and brand
        const product = await Product.findById(productId)
            .populate('category')
            .populate('brand');

        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        // Check if product itself is blocked
        if (product.isBlocked) {
            return res.status(400).json({
                success: false,
                message: 'This product is currently unavailable'
            });
        }

        // Check if category exists and is listed
        if (!product.category || !product.category.isListed) {
            return res.status(400).json({
                success: false,
                message: 'This product category is not available'
            });
        }

        // Check if brand exists and is not blocked
        if (!product.brand || product.brand.isBlocked) {
            return res.status(400).json({
                success: false,
                message: 'This product brand is currently unavailable'
            });
        }

        // Check if product is in stock
        if (product.quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Product is out of stock'
            });
        }

        // Check if requested quantity exceeds stock
        const requestedQuantity = Number(quantity);
        if (isNaN(requestedQuantity) || requestedQuantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quantity requested'
            });
        }

        if (requestedQuantity > product.quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.quantity} units available in stock`
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if product already in cart
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Calculate new quantity if we add this request
            const newQuantity = cart.items[existingItemIndex].quantity + requestedQuantity;
            
            // Check if new quantity exceeds max limit
            if (newQuantity > MAX_QUANTITY_PER_ITEM) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum limit is ${MAX_QUANTITY_PER_ITEM} units per product. You already have ${cart.items[existingItemIndex].quantity} in your cart.`
                });
            }
            
            // Check if new quantity exceeds stock
            if (newQuantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.quantity} units available in stock. You already have ${cart.items[existingItemIndex].quantity} in your cart.`
                });
            }

            // Update quantity and price
            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].totalPrice = (product.salePrice || product.regularPrice) * newQuantity;
        } else {
            // Check if requested quantity exceeds max limit for new item
            if (requestedQuantity > MAX_QUANTITY_PER_ITEM) {
                return res.status(400).json({
                    success: false,
                    message: `Maximum limit is ${MAX_QUANTITY_PER_ITEM} units per product`
                });
            }

            // Add new product to cart
            cart.items.push({
                productId,
                quantity: requestedQuantity,
                price: product.salePrice || product.regularPrice,
                totalPrice: (product.salePrice || product.regularPrice) * requestedQuantity
            });

            // Remove from wishlist if exists
            await Wishlist.updateOne(
                { userId },
                { $pull: { products: { productId } } }
            );
        }

        // Calculate totals and save
        cart.calculateTotals();
        await cart.save();

        return res.status(200).json({
            success: true,
            message: existingItemIndex > -1 ? 'Product quantity increased in your cart' : 'Product added to cart successfully',
            cartCount: cart.items.reduce((total, item) => total + item.quantity, 0),
            removedFromWishlist: existingItemIndex === -1,
            newQuantity: existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : requestedQuantity
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add product to cart'
        });
    }
};

    
// Update cart item quantity
const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId, quantity, action } = req.body;
        const MAX_QUANTITY_PER_ITEM = 5;
        
        if (!['increment', 'decrement', 'set'].includes(action)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid action' 
            });
        }
        
        // Find cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }
        
        // Find product in cart
        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );
        
        if (itemIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found in cart' 
            });
        }
        
        // Get product details for stock check
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }
        
        let newQuantity;
        if (action === 'increment') {
            newQuantity = cart.items[itemIndex].quantity + 1;
        } else if (action === 'decrement') {
            newQuantity = cart.items[itemIndex].quantity - 1;
        } else {
            newQuantity = Number(quantity);
        }

        if (newQuantity > MAX_QUANTITY_PER_ITEM) {
            return res.status(400).json({ 
                success: false, 
                message: `Maximum limit is ${MAX_QUANTITY_PER_ITEM} units per product`
            });
        }
        
        // Calculate new quantity based on action
        if (action === 'increment') {
            newQuantity = cart.items[itemIndex].quantity + 1;
        } else if (action === 'decrement') {
            newQuantity = cart.items[itemIndex].quantity - 1;
        } else {
            newQuantity = Number(quantity);
        }
        
        // Validate quantity
        if (newQuantity < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'Quantity cannot be less than 1' 
            });
        }
        
        if (newQuantity > product.stock) {
            return res.status(400).json({ 
                success: false, 
                message: `Only ${product.stock} units available in stock` 
            });
        }
        
        // Update quantity and total price
        cart.items[itemIndex].quantity = newQuantity;
        cart.items[itemIndex].totalPrice = product.price * newQuantity;
        
        // Calculate totals and save
        cart.calculateTotals();
        await cart.save();
        
        return res.status(200).json({ 
            success: true, 
            message: 'Cart updated successfully',
            item: cart.items[itemIndex],
            subTotal: cart.subTotal,
            discountAmount: cart.discountAmount,
            finalAmount: cart.finalAmount
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to update cart' 
        });
    }
}
    

// Remove item from cart
const removeItem = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { productId } = req.body;
        
        // Update cart by removing the item
        const result = await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId } } },
            { new: true }
        );
        
        if (!result) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found or item not in cart' 
            });
        }
        
        // Recalculate totals
        result.calculateTotals();
        await result.save();
        
        return res.status(200).json({ 
            success: true, 
            message: 'Item removed from cart',
            cartCount: result.items.length,
            subTotal: result.subTotal,
            discountAmount: result.discountAmount,
            finalAmount: result.finalAmount
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to remove item from cart' 
        });
    }
}
    

// Clear cart
const clearCart = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Clear all items from cart
        const result = await Cart.findOneAndUpdate(
            { userId },
            { 
                $set: { 
                    items: [],
                    subTotal: 0,
                    discountAmount: 0,
                    finalAmount: 0
                } 
            },
            { new: true }
        );
        
        if (!result) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            message: 'Cart cleared successfully' 
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to clear cart' 
        });
    }
}


module.exports = {
    getCartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart
};