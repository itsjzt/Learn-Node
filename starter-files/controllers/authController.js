const passport = require('passport')
const crypto = require('crypto')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const promisify = require('es6-promisify')

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

exports.forgot = async (req, res) => {
  // 1. see if the user with that email exists
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    req.flash('error', 'No account with that email exists.')
    res.redirect('/login')
  }
  // 2. set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex')
  user.resetPasswordExpires = Date.now() + (60 * 60 * 1000) // 1 hour from now
  await user.save()
  // 3. send them a token with email
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`
  req.flash('success', `You have been  emailed a password reset link. ${resetURL}`)
  // 4. redirect to login page
  res.redirect('/login')
}

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    req.flash('error', 'Password reset token is invalid or expired')
    return res.redirect('/login')
  }
  // if there is a user
  res.render('reset', { title: 'Reset your password' })
}

exports.confirmedPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next() // keep it going.
    return;
  }
  req.flash('error', 'Passwords do not match!')
  res.redirect('back')
}

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
  if (!user) {
    req.flash('error', 'Password reset token is invalid or expired')
    return res.redirect('/login')
  }

  const setPassword = promisify(user.setPassword, user)
  await setPassword(req.body.password)
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  const updatedUser = await user.save();
  await req.login(updatedUser)
  req.flash('success', '💃 Nice! Your password has been reset! You are now log in!')
  res.redirect('/')
}