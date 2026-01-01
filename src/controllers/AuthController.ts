import { type Request, type Response } from "express"
import * as AdminServices from "../services/admin"
import * as CryptoUtility from "../utils/crypto"
import * as SettingService from "../services/setting"
import { redirectWithFlash } from "."

/**
 * Show login page
 */
export function showLogin(req: Request, res: Response): void {
  try {
    let email = req.session?.rememberMe?.email
    let password = req.session?.rememberMe?.password
    const errorMessages = req.flash("error")
    const successMessages = req.flash("success")
    res.render("auth/login.njk", {
      pageTitle: "Login",
      error: errorMessages.length > 0 ? errorMessages[0] : null,
      success: successMessages.length > 0 ? successMessages[0] : null,
      email,
      password,
      remember: email ? true : false,
    })
  } catch (error) {
    console.error("Error rendering login page:", error)
    res.status(500).render("errors/500.njk")
  }
}

/**
 * Handle login form submission
 */
export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, remember } = req.body
    // Basic validation
    if (!email || !password) {
      req.flash("error", "Email id and password is required!")
      return await redirectWithFlash(req, res, "/login")
    }
    const admin = await AdminServices.findAdminByEmail(email)
    if (!admin) {
      req.flash("error", "Admin not found!")
      return await redirectWithFlash(req, res, "/login")
    }
    let validPassword = await CryptoUtility.comparePassword(
      password,
      admin.password
    )
    if (!validPassword) {
      req.flash("error", "Invalid Password!")
      return await redirectWithFlash(req, res, "/login")
    }
    if (remember == "on") {
      if (req.session) req.session.rememberMe = { email, password }
    } else {
      if (req.session) req.session.rememberMe = null
    }
    let setting = await SettingService.getSetting()
    if (!setting) {
      req.flash(
        "error",
        "Application settings not found. Please contact administrator."
      )
      return await redirectWithFlash(req, res, "/login")
    }
    if (req.session) {
      req.session.admin = {
        _id: admin?._id?.toString(),
        email: admin?.email,
        username: admin?.username,
        firstName: admin?.firstName,
        lastName: admin?.lastName,
      }
      req.session.setting = {
        _id: setting?._id?.toString(),
        isMaintenance: setting?.isMaintenance || false,
        maintenanceMessage: setting?.maintenanceMessage || "",
      }
      await new Promise<void>(
        (resolve: () => void, reject: (err?: any) => void) => {
          if (typeof req.session.save === "function") {
            req.session.save((err) => (err ? reject(err) : resolve()))
          } else {
            resolve()
          }
        }
      )

      if (req.session?.admin) {
        req.flash("success", "Welcome to dashboard")
        return await redirectWithFlash(req, res, "/")
      } else {
        req.flash("error", "unable to login")
        return await redirectWithFlash(req, res, "/login")
      }
    }
    return await redirectWithFlash(req, res, "/login")
  } catch (error) {
    console.error("Error handling login:", error)
    req.flash("error", "Something went wrong")
    return await redirectWithFlash(req, res, "/login")
  }
}

/**
 * Show forgot password page
 */
export function showForgotPassword(req: Request, res: Response): void {
  try {
    res.render("auth/forgot-password.njk", {
      csrfToken: "mock-csrf-token",
      pageTitle: "Forgot Password",
      error: req.flash("error"),
      success: req.flash("success"),
    })
  } catch (error) {
    console.error("Error rendering forgot password page:", error)
    res.status(500).render("errors/500.njk")
  }
}

/**
 * Show password reset page
 */
export async function showResetPassword(req: Request, res: Response) {
  try {
    const { token } = req.params

    if (!token) {
      return res.redirect("/forgot-password")
    }
    let validateToken = CryptoUtility.verifyJwtToken(
      token,
      process.env.JWT_SECRET || ""
    )
    if (!validateToken) {
      req.flash("error", "Invalid or expired reset token")
      return redirectWithFlash(req, res, "/forgot-password")
    }

    res.render("auth/reset-password.njk", {
      pageTitle: "Reset Password",
      token: token,
      error: req.flash("error"),
      success: req.flash("success"),
    })
  } catch (error) {
    console.error("Error rendering reset password page:", error)
    res.status(500).render("errors/500.njk")
  }
}

/**
 * Handle GET logout request (clear session and redirect)
 */
export function handleLogout(req: Request, res: Response): void {
  try {
    if (req.session) {
      delete req.session.admin
      req.session.admin = null
      req.session.save((err) => {
        if (err) {
          console.error("Error saving session during logout:", err)
          req.flash("error", "Error during logout. Please try again.")
          res.redirect("/")
        }
      })
    }
    req.flash("success", "Logged out successfully")
    res.redirect("/login")
  } catch (error) {
    console.error("Error handling logout:", error)
    res.redirect("/login")
  }
}

/**
 * Handle forgot password form submission
 */
export async function handleForgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body
    if (!email) {
      req.flash("error", "Email is required")
      return redirectWithFlash(req, res, "/forgot-password")
    }
    const admin = await AdminServices.findAdminByEmail(email)
    if (!admin) {
      req.flash("error", "Admin not found with this e-mail!")
      return redirectWithFlash(req, res, "/forgot-password")
    }
    const token = CryptoUtility.generateJwtToken(
      { email: admin.email },
      undefined,
      "1h"
    )
    if (!token) {
      req.flash("error", "Unable to generate reset token. Please try again.")
      return redirectWithFlash(req, res, "/forgot-password")
    }
    return res.redirect(`/reset-password/${token}`)
  } catch (error) {
    console.error("Error handling forgot password:", error)
    req.flash("error", "Something went wrong")
    return redirectWithFlash(req, res, "/forgot-password")
  }
}

/**
 * Handle password reset form submission
 */
export async function handleResetPassword(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { token, password, confirmPassword } = req.body

    if (!password || !confirmPassword) {
      req.flash("error", "Both password fields are required")
      return redirectWithFlash(req, res, `/reset-password/${token}`)
    }

    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match")
      return redirectWithFlash(req, res, `/reset-password/${token}`)
    }
    let validateToken = CryptoUtility.verifyJwtToken(
      token,
      process.env.JWT_SECRET || ""
    )
    if (
      !validateToken ||
      typeof validateToken === "string" ||
      !validateToken.email
    ) {
      req.flash("error", "Invalid or expired reset token")
      return redirectWithFlash(req, res, "/forgot-password")
    }

    const admin = await AdminServices.findAdminByEmail(validateToken.email)
    if (!admin) {
      req.flash("error", "Admin not found!")
      return redirectWithFlash(req, res, "/forgot-password")
    }
    let hashedPassword = CryptoUtility.hashPassword(password)
    await AdminServices.updateAdminById(admin._id.toString(), {
      password: hashedPassword,
    })
    req.flash(
      "success",
      "Password has been reset successfully. You can now log in."
    )
    return redirectWithFlash(req, res, "/login")
  } catch (error) {
    console.error("Error handling password reset:", error)
    req.flash("error", "Something went wrong")
    return redirectWithFlash(req, res, "/forgot-password")
  }
}
export function showProfile(req: Request, res: Response): void {
  try {
    res.render("modules/profile/index.njk", {
      pageTitle: "Profile",
      pageDescription: "Manage your profile",
      currentPage: "profile",
      breadcrumbs: [
        { text: "Dashboard", url: "/dashboard" },
        { text: "Profile", url: "/profile" },
      ],
      error: req.flash("error"),
      success: req.flash("success"),
      admin: req.session.admin,
      setting: req.session.setting,
    })
  } catch (error) {
    console.error("Error rendering profile page:", error)
    res.status(500).render("errors/500.njk")
  }
}
export async function updateProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log("Update Profile Request Body:", req.body)
    const { firstName, lastName, email, maintenanceMessage, isMaintenance } =
      req.body
    if (!req.session?.admin?._id) {
      req.flash("error", "Unauthorized access. Please log in.")
      return redirectWithFlash(req, res, "/login")
    }
    if(!email){
      req.flash("error", "Email is required.")
      return redirectWithFlash(req, res, "/profile")
    }
    if(!firstName || !lastName){
      req.flash("error", "First name and last name are required.")
      return redirectWithFlash(req, res, "/profile")
    }
    const adminId = req.session.admin._id;
    const updateData: any = {
      firstName,
      lastName,
      email,
    }
    let settingUpdates: any = {}
    if(typeof maintenanceMessage !== "undefined" && maintenanceMessage !== "") {
      settingUpdates.maintenanceMessage = maintenanceMessage
    }
    if (typeof isMaintenance !== "undefined" && isMaintenance !== "") {
      settingUpdates.isMaintenance = isMaintenance === "on" ? true : false
    }
    let updatedAdmin = await AdminServices.updateAdminById(adminId, updateData)
    if (!updatedAdmin) {
      req.flash("error", "Admin not found.")
      return redirectWithFlash(req, res, "/profile")
    }
    if (req.session) {
      req.session.admin.email = updatedAdmin.email
      req.session.admin.firstName = updatedAdmin.firstName
      req.session.admin.lastName = updatedAdmin.lastName
    }

    let updatedSetting = await SettingService.updateSetting(settingUpdates);
    if (req.session&& req.session.setting && updatedSetting) {
      req.session.setting.isMaintenance = updatedSetting?.isMaintenance || false
      req.session.setting.maintenanceMessage = updatedSetting?.maintenanceMessage || ""
    }
    req.flash("success", "Profile updated successfully.")
    return redirectWithFlash(req, res, "/profile")
  } catch (error) {
    console.error("Error updating profile:", error)
    req.flash("error", "Something went wrong while updating profile")
    return redirectWithFlash(req, res, "/profile")
  }
}
/**
 * Redirect to login page
 */
export function redirectToLogin(req: Request, res: Response): void {
  res.redirect("/login")
}
