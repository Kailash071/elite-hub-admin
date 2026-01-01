import { type Request, type Response } from "express"

export async function redirectWithFlash(
  req: Request,
  res: Response,
  url: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!req.session) {
      console.log("No session available for redirect with flash")
      res.redirect(url)
      resolve()
      return
    }

    // Ensure session is marked for saving (touch it)
    req.session.touch && req.session.touch()

    // Save session to persist flash messages
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session before redirect:", err)
        // Still redirect even if session save fails
        res.redirect(url)
        reject(err)
      } else {
        res.redirect(url)
        resolve()
      }
    })
  })
}

// Export all controllers with explicit naming to avoid conflicts
export * as DashboardController from './DashboardController.js';
export * as ProductsController from './ProductsController.js';
export * as AdminController from './AdminController.js';
export * as BrandsController from './BrandsController.js';
export * as CategoriesController from './CategoriesController.js';
export * as CustomersController from './CustomersController.js';
export * as OrdersController from './OrdersController.js';
export * as CouponsController from './CouponsController.js';
