// Backend (controller file)
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
            messages: req.session.messages || {},
            errors: {}  // Add errors object for form validation
        });
        delete req.session.messages;
    } catch (error) {
        console.error('Error in getAddressPage:', error);
        res.render('user/address', {
            title: 'Manage Addresses',
            addresses: [],
            user: req.session.user,
            currentRoute: '/address',
            messages: { error: 'Error loading addresses' },
            errors: {}
        });
    }
};


// addAddress
const addAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const {
            addressType, name, city, landmark, state, pinCode, phone, altPhone, isDefault
        } = req.body;

        const errors = {};

        // Validate required fields
        const requiredFields = { addressType, name, city, landmark, state, pinCode, phone };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
            }
        }

        // More permissive validation patterns
        const namePattern = /^[A-Za-z\s\-']+$/;
        const addressPattern = /^[A-Za-z0-9\s\-.,'()]+$/;
        
        if (name && !namePattern.test(name.trim())) {
            errors.name = 'Please enter a valid name';
        }
        
        if (city && !addressPattern.test(city.trim())) {
            errors.city = 'Please enter a valid city name';
        }
        
        if (state && !addressPattern.test(state.trim())) {
            errors.state = 'Please enter a valid state name';
        }
        
        if (landmark && !addressPattern.test(landmark.trim())) {
            errors.landmark = 'Please enter a valid landmark';
        }

        // Phone validation
        if (phone && !/^\d{10}$/.test(phone.trim())) {
            errors.phone = 'Phone must be exactly 10 digits';
        }
        
        if (altPhone && altPhone.trim() !== '' && !/^\d{10}$/.test(altPhone.trim())) {
            errors.altPhone = 'Alternate phone must be exactly 10 digits';
        }
        
        if (pinCode && !/^\d{6}$/.test(pinCode.trim())) {
            errors.pinCode = 'PIN code must be exactly 6 digits';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        // Rest of your address saving logic...
        let addressDoc = await Address.findOne({ userId });
        if (!addressDoc) {
            addressDoc = new Address({ userId, addresses: [] });
        }

        const newAddress = {
            addressType: addressType.trim(),
            name: name.trim(),
            city: city.trim(),
            landmark: landmark.trim(),
            state: state.trim(),
            pinCode: pinCode.trim(),
            phone: phone.trim(),
            altPhone: altPhone ? altPhone.trim() : '',
            isDefault: isDefault === 'on'
        };

        if (newAddress.isDefault) {
            addressDoc.addresses.forEach(addr => (addr.isDefault = false));
        }

        addressDoc.addresses.push(newAddress);
        await addressDoc.save();

        res.status(200).json({ success: true, message: 'Address added successfully' });
    } catch (error) {
        console.error('Error in addAddress:', error);
        res.status(500).json({ 
            errors: { 
                general: 'An error occurred while saving the address' 
            } 
        });
    }
};


const getEditAddressPage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.id;
        
        const addressDoc = await Address.findOne({ userId });
        if (!addressDoc) {
            req.session.messages = { error: 'Address not found' };
            return res.redirect('/address');
        }
        
        const address = addressDoc.addresses.find(addr => addr._id.toString() === addressId);
        if (!address) {
            req.session.messages = { error: 'Address not found' };
            return res.redirect('/address');
        }
        
        res.render('user/edit-address', {
            title: 'Edit Address',
            address,
            addressId,
            user: req.session.user,
            currentRoute: '/address',
            messages: req.session.messages || {},
            errors: {}
        });
        delete req.session.messages;
    } catch (error) {
        console.error('Error in getEditAddressPage:', error);
        req.session.messages = { error: 'Error loading address' };
        res.redirect('/address');
    }
};


// editAddress
const editAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.id;
        const addressData = {
            addressType: req.body.addressType || '',
            name: req.body.name || '',
            city: req.body.city || '',
            landmark: req.body.landmark || '',
            state: req.body.state || '',
            pinCode: req.body.pinCode || '',
            phone: req.body.phone || '',
            altPhone: req.body.altPhone || '',
            isDefault: req.body.isDefault === 'on' || req.body.isDefault === true
        };

        const errors = {};

        // Validate required fields
        const requiredFields = { 
            addressType: addressData.addressType, 
            name: addressData.name, 
            city: addressData.city, 
            landmark: addressData.landmark, 
            state: addressData.state, 
            pinCode: addressData.pinCode, 
            phone: addressData.phone 
        };
        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
            }
        }

        // Validate alphabets only
        const alphaOnlyRegex = /^[A-Za-z\s]+$/;
        if (addressData.name && !alphaOnlyRegex.test(addressData.name)) errors.name = 'Name must contain only alphabets';
        if (addressData.city && !alphaOnlyRegex.test(addressData.city)) errors.city = 'City must contain only alphabets';
        if (addressData.state && !alphaOnlyRegex.test(addressData.state)) errors.state = 'State must contain only alphabets';
        if (addressData.landmark && !alphaOnlyRegex.test(addressData.landmark)) errors.landmark = 'Landmark must contain only alphabets';

        // Validate numbers only
        if (addressData.phone && !/^\d{10}$/.test(addressData.phone)) errors.phone = 'Phone number must be exactly 10 digits';
        if (addressData.altPhone && !/^\d{10}$/.test(addressData.altPhone)) errors.altPhone = 'Alternate phone must be exactly 10 digits';
        if (addressData.pinCode && !/^\d{6}$/.test(addressData.pinCode)) errors.pinCode = 'Pin code must be exactly 6 digits';

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const addressDoc = await Address.findOne({ userId });
        if (!addressDoc) throw new Error('Address not found');

        const addressIndex = addressDoc.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) throw new Error('Address not found');

        const currentAddress = addressDoc.addresses[addressIndex];

        // Check for changes including isDefault explicitly
        const hasChanges = (
            addressData.addressType !== (currentAddress.addressType || '') ||
            addressData.name !== (currentAddress.name || '') ||
            addressData.city !== (currentAddress.city || '') ||
            addressData.landmark !== (currentAddress.landmark || '') ||
            addressData.state !== (currentAddress.state || '') ||
            addressData.pinCode !== (currentAddress.pinCode || '') ||
            addressData.phone !== (currentAddress.phone || '') ||
            addressData.altPhone !== (currentAddress.altPhone || '') ||
            addressData.isDefault !== currentAddress.isDefault
        );

        if (!hasChanges) {
            return res.status(200).json({ message: 'No changes detected', noChanges: true });
        }

        // Update "Set as Default" logic
        if (addressData.isDefault) {
            addressDoc.addresses.forEach((addr, index) => {
                if (index !== addressIndex) {
                    addr.isDefault = false;
                }
            });
        }

        // Update the address
        addressDoc.addresses[addressIndex] = { 
            ...currentAddress, 
            ...addressData,
            _id: currentAddress._id // Preserve the original ID
        };

        await addressDoc.save();

        res.status(200).json({ 
            message: 'Address updated successfully', 
            noChanges: false 
        });
    } catch (error) {
        console.error('Error in editAddress:', error);
        res.status(500).json({ errors: { general: 'Error updating address: ' + error.message } });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const addressId = req.params.id;

        const address = await Address.findOne({ userId });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        const initialLength = address.addresses.length;
        address.addresses = address.addresses.filter(addr => addr._id.toString() !== addressId);

        if (address.addresses.length === initialLength) {
            return res.status(404).json({ error: 'Address not found in list' });
        }

        await address.save();
        
        // Return JSON response instead of redirect
        res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error in deleteAddress:', error);
        res.status(500).json({ error: 'Error deleting address: ' + error.message });
    }
};

module.exports = {
    getAddressPage,
    addAddress,
    getEditAddressPage,
    editAddress,
    deleteAddress
};