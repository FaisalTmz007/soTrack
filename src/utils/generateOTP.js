const otpgenerator = require('otp-generator');

const generateOTP = () => {
    return otpgenerator.generate(6, { upperCase: false, specialChars: false, alphabets: false });
}

const otpExpired = () => {
    return new Date(Date.now() + 5 * 60000);
}

module.exports = { generateOTP, otpExpired};