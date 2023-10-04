const jwt =  require('jsonwebtoken')
const authenticate = (req, res, next) => {
    try {
        const headerToken = req.header('authToken');
        const verify = jwt.verify(headerToken, process.env.JWT_SECRET_KEY);
        if (!verify) return res.status(401).json({ error: "User authrntication failed. Please login again." });
        req.id = verify.id;
        next();
    } catch (e) {
        return res.status(401).json({ error: "User authentication failed. Please login again." });
    }
}
module.exports =  authenticate;