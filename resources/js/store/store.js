import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const fetchApi = async function (url, options = {}) {
let response = await  fetch(url, {
        credentials: 'same-origin',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        ...options
    });
    if(response.ok){
        return response.json()
    }else {
        throw await response.json()
    }
};

export default new Vuex.Store({
    strict: true,
    state: {
        user: null,
        conversations: {}
    },
    getters: {

        user: function (state) {
            return state.user
        },
        conversations: function (state) {
            return state.conversations
        },

        conversation: function (state) {
            return function(id){
                return state.conversations[id] || {}
            }
        },

        messages: function (state) {
          return function (id) {
              let conversation = state.conversations[id]

              if(conversation && conversation.messages)
              {
                  return conversation.messages
              }
              else
              {
                  return []
              }
          }
        }
    },
    mutations: {
        setUser: function (state, user_id) {
            state.user = user_id
        },
        addConversation: function (state, {conversations}) {
            conversations.forEach( function (c) {
                let conversation = state.conversations[c.id] || {messages: [], count: 0}
                conversation = {...conversation, ...c}
                state.conversations = {...state.conversations, ...{[c.id]: conversation}}
            })
        },
        addMessage: function (state, {messages, id, count}) {
            let conversation =    state.conversations[id] || {}
            conversation.messages = messages
            conversation.count = count
            conversation.loaded = true
            state.conversations = {...state.conversations, ...{[id]: conversation}}
        },
        prependMessages: function (state, {messages, id}) {
            let conversation =    state.conversations[id] || {}
            conversation.messages = [...messages, ...conversation.messages]
            state.conversations = {...state.conversations, ...{[id]: conversation}}
        },
        addMessages: function (state, {message, id}) {
            state.conversations[id].count++
            state.conversations[id].messages.push(message)
        },
    },
    actions: {
      loadConversations: async function (context) {
         let response = await fetchApi('/api/conversations')
          context.commit('addConversation', {conversations: response.conversations})
      },
      loadMessages: async function (context, conversation_id) {

          if(!context.getters.conversation(conversation_id).loaded){

              let response = await fetchApi('/api/conversations/' + conversation_id)
              context.commit('addMessage', {messages: response.messages, id: conversation_id, count: response.count})
          }
      },
      sendMessage: async function (context, {content, user_id}){
          let response = await fetchApi('/api/conversations/' + user_id, {
              method: 'POST',
              body: JSON.stringify({
                  content: content
              })
          })
          context.commit('addMessages', {message: response.message, id: user_id})
      },
       loadPreviousMessage: async function (context, conversationId) {
          let message = context.getters.messages(conversationId)[0]
           if(message){
               let url = '/api/conversations/' + conversation_id + '?before' + message.created_at
               let response = await fetchApi(url)
               context.commit('prependMessages', {id: conversationId, message: response.messages})
           }
      }
    }
})
