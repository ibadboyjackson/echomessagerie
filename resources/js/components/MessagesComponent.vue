<template>
    <div class="card">
        <div class="card-header">John Doe</div>
        <div class="card-body conversations__body">
            <Message :message="message" v-for="message in messages" :key="message.id" :user="user"></Message>
            <form method="post">
                <div class="form-group">
                    <textarea name="content" v-model="content" :class="{'form-control' : true, 'is-invalid': errors['content']}" placeholder=" Type your message" @keypress.enter="sendMessage"></textarea>
                    <div class="invalid-feedback" v-if="errors['content']">{{ errors['content'].join(', ')}}</div>
                </div>
            </form>
            <div class="conversations__loading" v-if="loading">
                <div class="loader"></div>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">

    import Message from './MessageComponent'
    import {mapGetters} from 'vuex'
    export default
    {
        components:
        {
            Message
        },
        data (){
            return{
                content: '',
                errors: {},
                loading: false
            }
        },
        computed:
        {
            ...mapGetters(['user']),
            messages: function ()
            {
                  return this.$store.getters.messages(this.$route.params.id)
            },
            count: function ()
            {
                return this.$store.getters.conversation(this.$route.params.id).count
            }
        },
        mounted ()
        {
            this.loadMessages()
            this.$messages = this.$el.querySelector('.conversations__body')
        },
        watch:
        {
            '$route.params.id': function ()
            {
                this.loadMessages()
            }
        },
        methods:
        {
            async loadMessages ()
            {
                let response = await this.$store.dispatch('loadMessages', this.$route.params.id)
                this.scrollBot()

                if(this.messages.length < this.count){
                    this.$messages.addEventListener('scroll', this.onScroll())
                }
            },
            async onScroll () {
              if(this.$messages.scrollTop === 0){
                  this.loading = true
                  this.$messages.removeEventListener('scroll', this.onScroll())
                  await this.$store.dispatch('loadPreviousMessage', this.$route.params.id)

                  if(this.messages.length < this.count){
                      this.$messages.addEventListener('scroll', this.onScroll())
                  }

                  this.loading = false
              }
            },
            scrollBot ()
            {
                this.$nextTick(() => {
                    this.$messages.scrollTop = this.$messages.scrollHeight
                })
            },
            async sendMessage (e)
            {
                if (e.shiftKey === false) {
                    this.loading = true
                    this.errors = {}
                    e.preventDefault()
                    try {
                         await this.$store.dispatch('sendMessage', {
                            content: this.content,
                            user_id: this.$route.params.id
                        })
                        this.content = ''
                        this.scrollBot()
                    }catch (e) {
                        if(e.errors){
                            this.errors = e.errors
                        }else {
                            console.error(e)
                        }
                    }
                    this.loading = false
                }
            }
        }
    }
</script>
