const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/')
    isPhoto ? next(null, true) : next({ message: "this file type isn't allowed" }, false)
  }
}

exports.homePage = (req, res) => {
  res.render('index')
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async (req, res, next) => {
  // check if there is any file to resize
  if (!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1]
  req.body.photo = `${uuid.v4()}.${extension}`
  // now we resize
  const photo = await jimp.read(req.file.buffer)
  await photo.resize(800, jimp.AUTO)
  await photo.write(`./public/uploads/${req.body.photo}`)
  // once file is saved, keep going
  next()
}

exports.createStore = async (req, res) => {
  req.body.author = req.user._id
  const store = await (new Store(req.body)).save()
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}

exports.getStores = async (req, res) => {
  // 1. Query the database of all stores.
  const stores = await Store.find()
  res.render('stores', { title: 'Stores', stores })
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id) ) {
    throw Error('You must own a store to edit it!')
  }
}

exports.editStore = async (req, res) => {
  // 1. find store of given ID
  const store = await Store.findOne({ _id: req.params.id })
  // 2. conform that they are the owner of store
  confirmOwner(store, req.user)
  // 3. render out the edit form so they can edit them
  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
  // set the location to be a point
  req.body.location.type = 'Point'
  // find the store and update them
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return a new store instead of the old
    runValidators: true
  }).exec()
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store ➡</a>`)
  res.redirect(`/stores/${store._id}/edit`)
  // Redirect them the store and tell them it worked
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug }).populate('author')
  if (!store) return next()
  res.render('store', { store, title: store.name })
}

exports.getStoreByTag = async (req, res) => {
  const tag = req.params.tag
  const tagQuery = tag || { $exists: true }

  const tagsPromise = Store.getTagsList()
  const storesPromise = Store.find({ tags: tagQuery})
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise])

  res.render('tag', { tags, title: 'Tags', tag, stores })
}

// api
exports.searchStores = async (req, res) => {
  const stores = await Store
  // first find the stores
  .find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  // then sort them
  .sort({
    score: {$meta: 'textScore'}
  })
  // limit to only 5
  .limit(5)
  res.json(stores)
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat)
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000 // 10 km
      }
    }
  }

  const stores = await Store.find(q)
  .select('slug name description location')
  .limit(10)
  res.json(stores)
}