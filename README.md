# Mobile Shop Admin Website

A fully mobile-responsive admin website for managing a mobile shop, built with HTML, CSS, and JavaScript. All data is stored locally using localStorage.

## Features

- **Admin Login**: Secure login system with default credentials
- **Stock Management**: Add, edit, delete products with quantity tracking and low-stock alerts
- **Product Management**: Full CRUD operations with image support
- **Shop Customization**: Customize shop name, logo, and theme color
- **Billing System**: Add items to cart, automatic totals, discount, and GST calculation
- **Invoice Generation**: Generate and download PDF invoices using jsPDF
- **UPI Payment QR**: Generate UPI payment QR codes using qrcode.js
- **QR Scanner**: Optional QR code scanner for payment verification

## Getting Started

1. Open `index.html` in a modern web browser
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

## Usage

### Dashboard
- View total products, low stock items, and total sales
- Monitor low stock alerts

### Products
- Click "Add Product" to create new products
- Edit or delete existing products
- Upload product images (supports URLs or file uploads)
- Set low stock alert thresholds

### Billing
- Search and add products to cart
- Adjust quantities in cart
- Apply discount percentage
- Apply GST percentage
- Generate invoice and download as PDF

### Settings
- Customize shop name and logo
- Change theme color
- Set UPI ID and generate payment QR codes
- Use QR scanner to scan payment QR codes

## Technical Details

- **Storage**: All data is stored in browser localStorage
- **Libraries Used**:
  - jsPDF (v2.5.1) - PDF generation
  - qrcode.js (v1.0.0) - QR code generation
  - html5-qrcode (v2.3.8) - QR code scanning

## Browser Compatibility

Works best on modern browsers (Chrome, Firefox, Safari, Edge) with localStorage support.

## Notes

- Data persists in browser localStorage
- Clear browser data to reset the application
- QR scanner requires camera permissions
- PDF generation works best with Chrome/Edge browsers

