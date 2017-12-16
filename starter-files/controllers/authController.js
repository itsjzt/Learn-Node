const passport = require('passport')

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed to log in',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
})

exports.logout = (req, res) => {
  req.logout()
  req.flash('success', 'You are now logged out 👋')
  res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
  // check first if the user is authenticate
  if (req.isAuthenticated()) {
    next(); // carry on they are logged in
    return;
  }
  req.flash('error', 'Oops You must be logged In')
  res.redirect('/login')
}