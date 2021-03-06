/**
 * Copyright 2017 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ----------------------------------------------------------------------------
 */
'use strict'

const express = require("express")

const app = express();





const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true}).then(() => {
  console.log("DB CONNECTED")
})


const port = 8000;

app.listen(port, () => {
  console.log(`app is running at ${port}`);
});

// These requires inform webpack which styles to build
require('bootstrap')
require('../styles/main.scss')

const m = require('mithril')

const api = require('./src/services/api')
const transactions = require('./src/services/transactions')
const navigation = require('./src/components/navigation')

const AddFishForm = require('./src/views/add_fish_form')
const AgentDetailPage = require('./src/views/agent_detail')
const AgentList = require('./src/views/list_agents')
const FishList = require('./src/views/list_fish')
const FishDetail = require('./src/views/fish_detail')
const Dashboard = require('./src/views/dashboard')
const LoginForm = require('./src/views/login_form')
const PropertyDetailPage = require('./src/views/property_detail')
const SignupForm = require('./src/views/signup_form');
const { lowerFirst } = require("lodash");

/**
 * A basic layout component that adds the navbar to the view.
 */
const Layout = {
  view (vnode) {
    return [
      vnode.attrs.navbar,
      m('.content.container', vnode.children)
    ]
  }
}

const loggedInNav = () => {
  const links = [
    ['/create', 'Add Fish'],
    ['/fish', 'View Fish'],
    ['/agents', 'View Agents']
  ]
  return m(navigation.Navbar, {}, [
    navigation.links(links),
    navigation.link('/profile', 'Profile'),
    navigation.button('/logout', 'Logout')
  ])
}

const loggedOutNav = () => {
  const links = [
    ['/fish', 'View Fish'],
    ['/agents', 'View Agents']
  ]
  return m(navigation.Navbar, {}, [
    navigation.links(links),
    navigation.button('/login', 'Login/Signup')
  ])
}

/**
 * Returns a route resolver which handles authorization related business.
 */
const resolve = (view, restricted = false) => {
  const resolver = {}

  if (restricted) {
    resolver.onmatch = () => {
      if (api.getAuth()) return view
      m.route.set('/login')
    }
  }

  resolver.render = vnode => {
    if (api.getAuth()) {
      return m(Layout, { navbar: loggedInNav() }, m(view, vnode.attrs))
    }
    return m(Layout, { navbar: loggedOutNav() }, m(view, vnode.attrs))
  }

  return resolver
}

/**
 * Clears user info from memory/storage and redirects.
 */
const logout = () => {
  api.clearAuth()
  transactions.clearPrivateKey()
  m.route.set('/')
}

/**
 * Redirects to user's agent page if logged in.
 */
const profile = () => {
  const publicKey = api.getPublicKey()
  if (publicKey) m.route.set(`/agents/${publicKey}`)
  else m.route.set('/')
}

/**
 * Build and mount app/router
 */
document.addEventListener('DOMContentLoaded', () => {
  m.route(document.querySelector('#app'), '/', {
    '/': resolve(Dashboard),
    '/agents/:publicKey': resolve(AgentDetailPage),
    '/agents': resolve(AgentList),
    '/create': resolve(AddFishForm, true),
    '/fish/:recordId': resolve(FishDetail),
    '/fish': resolve(FishList),
    '/login': resolve(LoginForm),
    '/logout': { onmatch: logout },
    '/profile': { onmatch: profile },
    '/properties/:recordId/:name': resolve(PropertyDetailPage),
    '/signup': resolve(SignupForm)
  })
})
