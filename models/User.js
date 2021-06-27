const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10
const secretToken = require('../config/token.js')
//salt 수. 10자리 salt 사용

const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true, // replace white space
        unique: 1
    },
    password: {
        type: String,
        minlength: 5
    },
    lastname: {
        type: String,
        maxlength: 50
    },
    role: {
        type: Number,
        default: 0  // default value
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

userSchema.pre('save', function( next ) {
    var user = this;

    if(user.isModified('password')) {
        // user의 password가 수정될 때만 비밀번호 암호화
        bcrypt.genSalt(saltRounds, function(err, salt) {
            if(err) return next(err)

            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err)
                user.password = hash
                next()
            })
        })
    } else {
        next()
        // 비밀번호 변경이 아닌 경우 바로 save 함수로
    }
})
                   //index.js 에서 사용할 method명
userSchema.methods.comparePassword = function(plainPassword, cb) {
    // plain Password
    bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
        if(err) return cb(err);
        cb(null, isMatch);
    })
}

userSchema.methods.generateToken = function(cb) {
    var user = this;

    // jswonwebtoken을 이용하여 token 생성
    var token = jwt.sign(user._id.toHexString(), secretToken.token)
    user.token = token
    user.save(function(err, user) {
        if(err) return cb(err)
        else cb(null, user)
    })
}

userSchema.statics.findByToken = function (token, cb) {
    var user = this;
    // 토큰 복호화
    jwt.verify(token, secretToken.token, function (err, decoded) {
        // 유저 아이디 이용 유저를 찾은 후
        // 클라이언트에서 가져온 토큰과 DB의 토큰이 일치하는지 확인
        user.findOne( {"_id" : decoded, "token": token}, function (err, user) {
            if(err) return cb(err);
            cb(null, user)
        })
    })
}


const User = mongoose.model('User', userSchema)
module.exports = { User }