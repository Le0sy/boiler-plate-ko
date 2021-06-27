const express = require('express')
const app = express()
const port = 5000
const bodyParser = require('body-parser');
const { User } = require('./models/User');

const config = require('./config/key');

// application/x-www-form-urlencoded 타입 데이터 사용 가능
app.use(bodyParser.urlencoded({extended: true}));

// application/json 타입 데이터 사용 가능
app.use(bodyParser.json());

const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err))


app.get('/', (req, res) => res.send('Hello World! 테스트 입니다.'))

app.post('/register', (req, res) => {
    // 회원 가입 시 필요한 정보를 Client에서 가져오면,
    // 해당 정보를 DB에 넣어줌.
    const  user = new User(req.body)

    //save method는 mongoDB에서 제공
    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.listen(port, () => console.log(`Example app listening at ${port}!`))
