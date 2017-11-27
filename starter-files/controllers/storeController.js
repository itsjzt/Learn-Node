const mongoose = require('mongoose')
const Store = mongoose.model('Store')

exports.homePage = (req, res) => {
  res.render('index')
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStores = async (req, res) => {
  // 1. Query the database of all stores.
  const stores = await Store.find()
  res.render('stores', { title: 'Stores', stores })
}

exports.editStore = async (req, res) => {
  // 1. find store of given ID
  const store = await Store.findOne({ _id: req.params.id })
  // 2. conform that they are the owner of store
  // TODO
  // 3. render out the edit form so they can edit them 
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
  // find the store and update them
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return a new store instead of the old
    runValidators: true 
  }).exec()
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store ➡</a>`)
  res.redirect(`/stores/${store._id}/edit`)
  // Redirect them the store and tell them it worked
}