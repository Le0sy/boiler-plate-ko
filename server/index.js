const express = require('express')
const app = express()
const port = 5000

const bodyParser = require('body-parser');
// application/x-www-form-urlencoded 타입 데이터 사용 가능
app.use(bodyParser.urlencoded({extended: true}));
// application/json 타입 데이터 사용 가능
app.use(bodyParser.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const { User } = require('./models/User');

const config = require('./config/key');

const { auth } = require('./middleware/auth')



const mongoose = require('mongoose')
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err))


app.get('/', (req, res) => res.send('Hello World! 테스트 입니다.'))

app.post('/api/users/register', (req, res) => {
    // 회원 가입 시 필요한 정보를 Client에서 가져오면,
    // 해당 정보를 DB에 넣어줌.
    const user = new User(req.body)

    //save method는 mongoDB에서 제공
    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err})
        return res.status(200).json({
            success: true
        })
    })
})

app.post('/api/users/login', (req, res) => {
    // 요청된 이메일을 DB에서 탐색
    User.findOne( { email: req.body.email }, (err, user) => {
        if(!user) { // user 데이터가 넘어오지 않았다면
            return res.json({
                loginSuccess: false,
                message: "아이디를 다시 확인해주세요."
            })
        }

    // 요청 이메일이 DB에 있다면, 비밀번호 확인
        user.comparePassword(req.body.password, (err,  isMatch) => { // User.js 에서 생성한 함수
            if(!isMatch) return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다."})
            // 비밀번호가 맞다면 Token 생성
            user.generateToken((err, user) => { // User.js 에서 생성한 함수
                if(err) return res.status(400).send(err);
                // 토큰 저장 : 위치? 쿠키, 로컬스토리지 등... 저장 위치에 따른 장단점
                // 현재는 쿠키에 저장. cookieParser 사용
                res.cookie("x_auth", user.token)
                .status(200)
                .json( { loginSuccess: true, userId: user._id } )
            })
        })
    })
})
                           // end point의 리퀘스트를 받고, callback 함수 이전에 특정 동작 수행
app.get('/api/users/auth', auth , (req, res) => {
    // 아래를 수행한다는 것은 auth가 true임.
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    })
})

app.get('/api/hello', (req, res) => {
    res.send("hello? - test");
})

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id },
        { token: "" }
        , (err, user) => {
            if(err) return res.json({ success:false, err });
            return res.status(200).send({
                success: true
        })
    })
})



app.listen(port, () => console.log(`Example app listening at ${port}!`))
