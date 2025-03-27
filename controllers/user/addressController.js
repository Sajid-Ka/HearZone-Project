const Address = require('../../models/addressSchema');

const getAddressPage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const address = await Address.findOne({ userId }).lean();
        
        res.render('user/address', {
            title: 'Manage Addresses',
            addresses: address ? address.addresses : [],
            user: req.session.user,
            currentRoute: '/address',
            messages: req.session.messages || {}
        });
        delete req.session.messages;
    } catch (error) {
        console.error('Error in getAddressPage:', error);
        res.render('user/address', {
            title: 'Manage Addresses',
            addresses: [],
            user: req.session.user,
            currentRoute: '/address',
            messages: { error: 'Error loading addresses' }
        });
    }
};

const addAddress = async (req, res) => {
    try {
        console.log('req.body:', req.body);
        const userId = req.session.user.id;
        const {
            addressType, name, city, landmark, state, pinCode, phone, altPhone, isDefault
        } = req.body;

        // Validate required fields
        const requiredFields = { addressType, name, city, landmark, state, pinCode, phone };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                return res.status(400).json({ message: `Please fill in all required fields (${key} is empty)` });
            }
        }

        // Additional validation
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ message: 'Phone number must be 10 digits' });
        }
        if (altPhone && !/^\d{10}$/.test(altPhone)) {
            return res.status(400).json({ message: 'Alternate phone number must be 10 digits' });
        }
        if (!/^\d{6}$/.test(pinCode)) {
            return res.status(400).json({ message: 'Pin code must be 6 digits' });
        }

        // Find or create address document
        let addressDoc = await Address.findOne({ userId });
        if (!addressDoc) {
            addressDoc = new Address({ userId, addresses: [] });
        }

        // Prepare new address
        const newAddress = {
            addressType,
            name,
            city,
            landmark,
            state,
            pinCode,
            phone,
            altPhone: altPhone || '',
            isDefault: isDefault === 'on'
        };

        // Handle default address
        if (newAddress.isDefault) {
            addressDoc.addresses.forEach(addr => addr.isDefault = false);
        }

        // Add new address
        addressDoc.addresses.push(newAddress);
        await addressDoc.save();

        res.status(200).json({ message: 'Address added successfully' });
    } catch (error) {
        console.error('Error in addAddress:', error);
        res.status(500).json({ message: 'Error adding address: ' + error.message });
    }
};


const editAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.id;
        const addressData = {
            addressType: req.body.addressType,
            name: req.body.name,
            city: req.body.city,
            landmark: req.body.landmark,
            state: req.body.state,
            pinCode: req.body.pinCode,
            phone: req.body.phone,
            altPhone: req.body.altPhone || '',
            isDefault: req.body.isDefault === 'on'
        };

        const address = await Address.findOne({ userId });
        if (!address) throw new Error('Address not found');

        const addressIndex = address.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) throw new Error('Address not found');

        if (addressData.isDefault) {
            address.addresses.forEach(addr => addr.isDefault = false);
        }
        address.addresses[addressIndex] = { ...address.addresses[addressIndex], ...addressData };
        await address.save();

        req.session.messages = { success: 'Address updated successfully' };
        res.redirect('/address');
    } catch (error) {
        console.error('Error in editAddress:', error);
        req.session.messages = { error: 'Error updating address' };
        res.redirect('/address');
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.id;

        const address = await Address.findOne({ userId });
        if (!address) throw new Error('Address not found');

        address.addresses = address.addresses.filter(addr => addr._id.toString() !== addressId);
        await address.save();

        req.session.messages = { success: 'Address deleted successfully' };
        res.redirect('/address');
    } catch (error) {
        console.error('Error in deleteAddress:', error);
        req.session.messages = { error: 'Error deleting address' };
        res.redirect('/address');
    }
};

module.exports = {
    getAddressPage,
    addAddress,
    editAddress,
    deleteAddress
};