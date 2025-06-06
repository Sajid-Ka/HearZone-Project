const User = require('../../models/userSchema');

const customerInfo = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect('/admin/login');
    }
    let search = req.query.search || '';
    let page = parseInt(req.query.page) || 1;
    const limit = 5;
    const isBlocked = req.query.blocked === 'true';
    const format = req.query.format || 'html';

    let query = {
      isAdmin: false,
      isBlocked: isBlocked,
      name: { $regex: '.*' + search + '.*', $options: 'i' }
    };

    const userData = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments(query);
    const totalPages = Math.ceil(count / limit);

    if (format === 'json' || req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        data: userData,
        totalPages,
        currentPage: page,
        search,
        isBlocked
      });
    }

    res.render('admin/customers', {
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
    if (req.headers.accept.includes('application/json')) {
      return res
        .status(500)
        .json({ success: false, message: 'Internal Server Error' });
    }
    res.status(500).send('Internal Server Error');
  }
};

const customerBlocked = async (req, res) => {
  try {
    let id = req.query.id || (req.body && req.body.id);

    if (!id) {
      console.error('No user ID provided');
      if (
        req.headers['content-type'] &&
        req.headers['content-type'].includes('application/json')
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'User ID is required' });
      } else {
        return res.redirect('/admin/users?error=User ID is required');
      }
    }

    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });

    try {
      if (req.sessionStore) {
        const sessions = await new Promise((resolve, reject) => {
          req.sessionStore.all((err, sessions) => {
            if (err) {
              console.error('Error fetching sessions:', err);
              reject(err);
            } else {
              resolve(sessions || {});
            }
          });
        });

        for (let sessionId in sessions) {
          const sessionData = sessions[sessionId];

          if (
            sessionData &&
            sessionData.user &&
            sessionData.user.id === id.toString() &&
            !sessionData.admin
          ) {
            await new Promise((resolve, reject) => {
              req.sessionStore.destroy(sessionId, (err) => {
                if (err) {
                  console.error(`Error destroying session ${sessionId}:`, err);
                  reject(err);
                } else {
                  console.log(`Session ${sessionId} destroyed`);
                  resolve();
                }
              });
            });
          }
        }

        if (
          req.session.user &&
          req.session.user.id === id.toString() &&
          req.session.admin
        ) {
          delete req.session.user;
        }
      }
    } catch (sessionError) {
      console.error('Error handling sessions:', sessionError);
    }

    if (
      (req.headers['content-type'] &&
        req.headers['content-type'].includes('application/json')) ||
      (req.headers['accept'] &&
        req.headers['accept'].includes('application/json'))
    ) {
      return res.json({
        success: true,
        message: 'Customer blocked successfully'
      });
    } else {
      return res.redirect('/admin/users?success=block');
    }
  } catch (error) {
    console.error('Error in customerBlocked:', error);

    if (
      (req.headers['content-type'] &&
        req.headers['content-type'].includes('application/json')) ||
      (req.headers['accept'] &&
        req.headers['accept'].includes('application/json'))
    ) {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to block customer' });
    } else {
      return res.redirect('/admin/users?error=Failed to block customer');
    }
  }
};

const customerUnblocked = async (req, res) => {
  try {
    let id = req.query.id || (req.body && req.body.id);

    if (!id) {
      console.error('No user ID provided');
      if (
        req.headers['content-type'] &&
        req.headers['content-type'].includes('application/json')
      ) {
        return res
          .status(400)
          .json({ success: false, message: 'User ID is required' });
      } else {
        return res.redirect('/admin/users?error=User ID is required');
      }
    }

    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });

    if (
      (req.headers['content-type'] &&
        req.headers['content-type'].includes('application/json')) ||
      (req.headers['accept'] &&
        req.headers['accept'].includes('application/json'))
    ) {
      return res.json({
        success: true,
        message: 'Customer unblocked successfully'
      });
    } else {
      return res.redirect('/admin/users?success=unblock');
    }
  } catch (error) {
    console.error('Error in customerUnblocked:', error);

    if (
      (req.headers['content-type'] &&
        req.headers['content-type'].includes('application/json')) ||
      (req.headers['accept'] &&
        req.headers['accept'].includes('application/json'))
    ) {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to unblock customer' });
    } else {
      return res.redirect('/admin/users?error=Failed to unblock customer');
    }
  }
};

module.exports = {
  customerInfo,
  customerBlocked,
  customerUnblocked
};
