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
        const { name, discountType, discountValue, startDate, endDate, productId, regularPrice } = req.body;

        if (!productId || !regularPrice) {
            return res.status(400).json({ success: false, message: 'Product ID and regular price are required' });
        }

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
            endDate,
            products: [productId]
        });

        await offer.save();

        // Calculate sale price
        let salePrice = parseFloat(regularPrice);
        if (offer.discountType === 'percentage') {
            salePrice = salePrice * (1 - offer.discountValue / 100);
        } else {
            salePrice = salePrice - offer.discountValue;
        }

        // Update product
        await Product.findByIdAndUpdate(productId, {
            offer: offer._id,
            salePrice: Math.max(0, Math.round(salePrice))
        });

        res.status(200).json({ 
            success: true, 
            message: 'Offer created and assigned successfully', 
            offer 
        });
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ success: false, message: 'Error creating offer' });
    }
};

const assignOfferToProduct = async (req, res) => {
    try {
        const { productId, offerId, discountValue, startDate, endDate, regularPrice } = req.body;

        if (!productId || !regularPrice) {
            return res.status(400).json({ success: false, message: 'Product ID and regular price are required' });
        }

        let offer;
        if (offerId) {
            // Update existing offer
            offer = await Offer.findById(offerId);
            if (!offer) {
                return res.status(404).json({ success: false, message: 'Offer not found' });
            }

            // Update offer details
            offer.discountValue = discountValue || offer.discountValue;
            offer.startDate = startDate || offer.startDate;
            offer.endDate = endDate || offer.endDate;

            if (new Date(offer.endDate) <= new Date(offer.startDate)) {
                return res.status(400).json({ success: false, message: 'End date must be after start date' });
            }

            if (offer.discountType === 'percentage' && (offer.discountValue < 0 || offer.discountValue > 100)) {
                return res.status(400).json({ success: false, message: 'Percentage discount must be between 0 and 100' });
            }

            await offer.save();
        } else {
            return res.status(400).json({ success: false, message: 'Offer ID is required for assignment' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (new Date() > new Date(offer.endDate)) {
            return res.status(400).json({ success: false, message: 'Offer has expired' });
        }

        // Calculate sale price
        let salePrice = parseFloat(regularPrice);
        if (offer.discountType === 'percentage') {
            salePrice = salePrice * (1 - offer.discountValue / 100);
        } else {
            salePrice = salePrice - offer.discountValue;
        }

        // Update product
        await Product.findByIdAndUpdate(productId, {
            offer: offer._id,
            salePrice: Math.max(0, Math.round(salePrice))
        });

        // Add product to offer if not already included
        if (!offer.products.includes(productId)) {
            offer.products.push(productId);
            await offer.save();
        }

        res.status(200).json({ 
            success: true, 
            message: offerId ? 'Offer updated and assigned successfully' : 'Offer assigned successfully',
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