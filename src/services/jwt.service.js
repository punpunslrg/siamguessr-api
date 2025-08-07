import jwt from 'jsonwebtoken';

const jwtService = {};


jwtService.genAccessToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: "HS256",
        expiresIn: "1h"
    });
};


jwtService.genRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    );
};


jwtService.verifyToken = (token, secret) => {
    return jwt.verify(token, secret, {
        algorithms: ['HS256']
    });
};

export default jwtService;