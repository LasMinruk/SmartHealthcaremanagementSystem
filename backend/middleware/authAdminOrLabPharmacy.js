import jwt from "jsonwebtoken";

// Middleware that accepts either Admin or Lab/Pharmacy token
const authAdminOrLabPharmacy = async (req, res, next) => {
  try {
    const { atoken, lbtoken } = req.headers;

    // Check if either token exists
    if (!atoken && !lbtoken) {
      return res.json({ success: false, message: "Not Authorized. Login Again." });
    }

    // Try to verify admin token first
    if (atoken) {
      try {
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
        if (token_decode === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
          req.adminAuth = true;
          return next();
        }
      } catch (error) {
        // Admin token invalid, try lab/pharmacy token
      }
    }

    // Try to verify lab/pharmacy token
    if (lbtoken) {
      try {
        const token_decode = jwt.verify(lbtoken, process.env.JWT_SECRET);
        if (token_decode === process.env.PHARMACY_EMAIL + process.env.PHARMACY_PASSWORD) {
          req.labPharmacyAuth = true;
          return next();
        }
      } catch (error) {
        // Lab/pharmacy token invalid
      }
    }

    // If neither token is valid
    return res.json({ success: false, message: "Not Authorized. Login Again." });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authAdminOrLabPharmacy;