const User = require('../../models/userSchema');

const customerInfo = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;
        const limit = 3;
        const isBlocked = req.query.blocked === 'true';

        let query = {
            isAdmin: false,
            isBlocked: isBlocked,

            //search based name and email
            // $or: [
            //     { name: { $regex: ".*" + search + ".*", $options: "i" } },
            //     { email: { $regex: ".*" + search + ".*", $options: "i" } }
            // ]

            //search based only names
            name: { $regex: ".*" + search + ".*", $options: "i" }
        };

        const userData = await User.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .exec();

        const count = await User.countDocuments(query);
        const totalPages = Math.ceil(count / limit);

        res.render("admin/customers", {
            data: userData,
            totalPages: totalPages,
            currentPage: page,
            search: search,
            isBlocked: isBlocked,
            admin: req.session.admin
        });
    } catch (error) {
        console.error(error);
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }
        res.status(500).send("Internal Server Error");
    }
};

const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;

        // Block the user
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } });

        // Destroy all sessions for this user
        if (req.sessionStore) {
            const sessions = await new Promise((resolve, reject) => {
                req.sessionStore.all((err, sessions) => {
                    if (err) reject(err);
                    else resolve(sessions);
                });
            });

            

            const destroyPromises = [];
            for (let sessionId in sessions) {
                const sessionData = sessions[sessionId];
                
                // Destroy session if it belongs to the blocked user and is not an admin-only session
                if (sessionData.user && sessionData.user.id === id.toString() && !sessionData.admin) {
                    destroyPromises.push(
                        new Promise((resolve, reject) => {
                            req.sessionStore.destroy(sessionId, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        })
                    );
                }
            }

            await Promise.all(destroyPromises);
            

            // If the current session has the blocked user but is an admin session, preserve it
            if (req.session.user && req.session.user.id === id.toString() && req.session.admin) {
                delete req.session.user; // Remove user data but keep admin session
            }
        }

        res.redirect('/admin/users?success=block');
    } catch (error) {
        console.error('Error in customerBlocked:', error);
        res.redirect('/admin/users?error=Failed to block customer');
    }
};

const customerUnblocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
        res.redirect('/admin/users?success=unblock');
    } catch (error) {
        res.redirect('/admin/users?error=Failed to unblock customer');
    }
};

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked,
};