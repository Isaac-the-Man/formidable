import Vue from 'vue';
import Vuex from 'vuex';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

Vue.use(Vuex);

// firebase
const config = {
  apiKey: "AIzaSyDY3L11kmQV-rQngdv6u5GSS8k3_V71lpI",
  authDomain: "pas-portal.firebaseapp.com",
  databaseURL: "https://pas-portal.firebaseio.com",
  projectId: "pas-portal",
  storageBucket: "pas-portal.appspot.com",
  messagingSenderId: "1015132118515",
  appId: "1:1015132118515:web:dd8bda5a40900f222a4686",
  measurementId: "G-HQP92CTJH3"
};
firebase.initializeApp(config);

// Get a reference to the database service
const auth = firebase.auth();

export default new Vuex.Store({
  state: {
    isLoggedIn: false,
    admin: null,
    db: firebase.database(),
    config: config
  },
  mutations: {
    setAdmin(state, payload) {
      if (payload) {
        state.admin = payload.user;
        state.isLoggedIn = true;
        console.log('firebase logged in.');
      } else {
        state.admin = null;
        state.isLoggedIn = false;
        console.log('firebase logged out.');
      }
    }
  },
  actions: {
    async login(context, payload) {
      try {
        const res = await auth.signInWithEmailAndPassword(payload.email, payload.password);
        console.log(res);
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
    async logout() {
      await auth.signOut();
    }
  }
})
