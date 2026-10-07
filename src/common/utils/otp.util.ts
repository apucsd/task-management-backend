export const generateOtp = (): number => {
    return Math.floor(100000 + Math.random() * 900000);
};

export const generateOtpExpiry = () => {
    return new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
};
