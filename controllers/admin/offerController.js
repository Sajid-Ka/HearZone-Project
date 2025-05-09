const Offer = require('../../models/offerSchema');
const Product = require('../../models/productSchema');

const getOfferPage = async (req, res) => {
    try {
        const offers = await Offer.find().populate('products');
        res.render('offers', { offers });
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.redirect('/admin/pageError');
    }
};

const createOffer = async (req, res) => {
    try {
        const { name, discountType, discountValue, startDate, endDate } = req.body;
        
        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
            return res.status(400).json({ success: false, message: 'Percentage discount must be between 0 and 100' });
        }

        const offer = new Offer({
            name,
            discountType,
            discountValue,
            startDate,
            endDate
        });

        await offer.save();
        res.status(200).json({ success: true, message: 'Offer created successfully', offer });
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ success: false, message: 'Error creating offer' });
    }
};

const assignOfferToProduct = async (req, res) => {
    try {
        const { productId, offerId } = req.body;
        
        const [product, offer] = await Promise.all([
            Product.findById(productId),
            Offer.findById(offerId)
        ]);

        if (!product || !offer) {
            return res.status(404).json({ success: false, message: 'Product or offer not found' });
        }

        if (new Date() > new Date(offer.endDate)) {
            return res.status(400).json({ success: false, message: 'Offer has expired' });
        }

        // Calculate sale price
        let salePrice = product.regularPrice;
        if (offer.discountType === 'percentage') {
            salePrice = product.regularPrice * (1 - offer.discountValue / 100);
        } else {
            salePrice = product.regularPrice - offer.discountValue;
        }

        // Update product
        await Product.findByIdAndUpdate(productId, {
            offer: offerId,
            salePrice: Math.max(0, Math.round(salePrice))
        });

        // Add product to offer
        if (!offer.products.includes(productId)) {
            offer.products.push(productId);
            await offer.save();
        }

        res.status(200).json({ 
            success: true, 
            message: 'Offer assigned successfully',
            salePrice: Math.max(0, Math.round(salePrice))
        });
    } catch (error) {
        console.error('Error assigning offer:', error);
        res.status(500).json({ success: false, message: 'Error assigning offer' });
    }
};

const removeOfferFromProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.offer) {
            await Offer.updateOne(
                { _id: product.offer },
                { $pull: { products: productId } }
            );
        }

        await Product.findByIdAndUpdate(productId, {
            offer: null,
            salePrice: 0
        });

        res.status(200).json({ success: true, message: 'Offer removed successfully' });
    } catch (error) {
        console.error('Error removing offer:', error);
        res.status(500).json({ success: false, message: 'Error removing offer' });
    }
};

module.exports = {
    getOfferPage,
    createOffer,
    assignOfferToProduct,
    removeOfferFromProduct
};