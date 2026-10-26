const ObjectId = require('mongodb').ObjectId
// need the conversation for ObjectId to update and delete routes
module.exports = function (app, passport, db) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  // DASHBOARD SECTION =========================
  app.get('/profile', isLoggedIn, function (req, res) {
    console.log('filtering by user:', req.user._id)
    //find all of the transactions in the array and order it by date
    db.collection('transactions').find({ userId: req.user._id }).sort({ date: -1 }).toArray((err, transactions) => {
      if (err) return console.log(err)
      //need to create variables for deposits, withdrawals, wants and needs

      let depositAmt = 0
      let purchaseAmt = 0
      let wantsTotal = 0
      let needsTotal = 0
      //for each transaction, find out its is a deposit or purchase
      transactions.forEach(function (t) {
        //if the transaction was income then that is the deposit amount
        if (t.type === 'income') {
          depositAmt += t.amount
        } else {
          // if it is not income coming in then it is a purchase going out
          purchaseAmt += t.amount
          if (t.kind === 'want') {
            wantsTotal += t.amount
          } else {
            if (t.kind === 'need') {
              needsTotal += t.amount
            }
          }
        }
      })

      let balance = depositAmt - purchaseAmt


      res.render('profile.ejs', {
        user: req.user,
        transactions: transactions,
        balance: balance,
        depositAmt: depositAmt,
        purchaseAmt: purchaseAmt,
        wantsTotal: wantsTotal,
        needsTotal: needsTotal
      });
    });
  });


  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout(() => {
      console.log('User has logged out!')
    });
    res.redirect('/');
  });

  // transaction routes ===============================================================
  // transaction
  app.post('/transactions', (req, res) => {
    //transaction details we'll pull
    db.collection('transactions').insertOne({
      description: req.body.description,
      amount: Number(req.body.amount),
      type: req.body.type,
      category: req.body.category,
      kind: req.body.kind,
      date: req.body.date,
      userId: req.user._id
    }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })

  //edit a transaction amount
  app.put('/transactions', (req, res) => {
    db.collection('transactions')
      //we get the _id because two entries can look alike but their id's cant
      .findOneAndUpdate({
        _id: ObjectId(req.body.id),
        userId: req.user._id
      }, {
        //set the amount in the array to the new number
        $set: {
          amount: Number(req.body.amount)
        }
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })

  app.delete('/transactions', (req, res) => {
    db.collection('transactions').findOneAndDelete(
      {
        //delete by objectId to get rid of specific 
        _id: ObjectId(req.body.id),
        userId: req.user._id
      }, (err, result) => {
        if (err) return res.send(err)
        res.send('Transaction deleted!')
      })
  })

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function (req, res) {
    let user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });
}

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}