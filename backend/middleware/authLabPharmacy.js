import jwt from "jsonwebtoken";

// Lab/Pharmacy authentication middleware
const authLabPharmacy = async (req, res, next) => {
  try {
    const { lbtoken } = req.headers; // Changed from ltoken to lbtoken
    
    if (!lbtoken) {
      return res.json({ success: false, message: "Not Authorized. Login Again." });
    }

    // Verify the token
    const token_decode = jwt.verify(lbtoken, process.env.JWT_SECRET);

    // Check if token matches Lab/Pharmacy credentials
    if (token_decode !== process.env.PHARMACY_EMAIL + process.env.PHARMACY_PASSWORD) {
      return res.json({ success: false, message: "Not Authorized. Login Again." });
    }

    // If verification passes, attach to request
    req.labPharmacyAuth = true;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Not Authorized. Login Again." });
  }
};

export default authLabPharmacy;