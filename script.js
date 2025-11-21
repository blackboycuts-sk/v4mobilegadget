// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Data Storage Keys
const STORAGE_KEYS = {
    ADMIN: 'mobileShopAdmin',
    PRODUCTS: 'mobileShopProducts',
    SETTINGS: 'mobileShopSettings',
    SALES: 'mobileShopSales'
};

// Default Admin Credentials
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123'
};

// Initialize Application
function initializeApp() {
    // Check if admin exists, if not create default
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(DEFAULT_ADMIN));
    }

    // Initialize data structures
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            shopName: 'Mobile Shop',
            shopAddress: '',
            shopGSTIN: '',
            shopLogo: '',
            themeColor: '#007bff',
            upiId: ''
        }));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify([]));
    }

    // Check if user is logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        showDashboard();
    } else {
        showLogin();
    }

    // Setup event listeners
    setupEventListeners();
    loadSettings();
}

// Setup Event Listeners
function setupEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            switchTab(page);
        });
    });

    // Products
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('cancelProductBtn').addEventListener('click', closeProductModal);
    document.querySelector('#productModal .close').addEventListener('click', closeProductModal);

    // Product image upload
    document.getElementById('uploadProductImageBtn').addEventListener('click', () => {
        document.getElementById('productImageFile').click();
    });
    document.getElementById('productImageFile').addEventListener('change', handleProductImageUpload);

    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
    document.getElementById('uploadLogoBtn').addEventListener('click', () => {
        document.getElementById('logoFile').click();
    });
    document.getElementById('logoFile').addEventListener('change', handleLogoUpload);
    document.getElementById('generateUPIQRBtn').addEventListener('click', generateUPIQR);

    // QR Scanner
    document.getElementById('scanQRBtn').addEventListener('click', startQRScanner);

    // Billing
    document.getElementById('productSearch').addEventListener('input', filterBillingProducts);
    document.getElementById('billDiscountPercent').addEventListener('input', calculateCartTotal);
    document.getElementById('previewInvoiceBtn').addEventListener('click', previewInvoice);
    document.getElementById('generateInvoiceBtn').addEventListener('click', generateInvoice);
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);

    // History
    document.getElementById('historySearch').addEventListener('input', loadHistory);
    document.getElementById('historyDateFrom').addEventListener('change', loadHistory);
    document.getElementById('historyDateTo').addEventListener('change', loadHistory);
    document.getElementById('clearHistoryFiltersBtn').addEventListener('click', clearHistoryFilters);

    // Reports
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    document.getElementById('exportCSVBtn').addEventListener('click', exportReportToCSV);

    // Invoice modal
    document.getElementById('closeInvoiceModal').addEventListener('click', closeInvoiceModal);
    document.getElementById('closeInvoiceBtn').addEventListener('click', closeInvoiceModal);
    document.getElementById('downloadInvoiceBtn').addEventListener('click', downloadInvoicePDF);

    // Close modal on outside click
    window.addEventListener('click', function(event) {
        const productModal = document.getElementById('productModal');
        const invoiceModal = document.getElementById('invoiceModal');
        if (event.target === productModal) {
            closeProductModal();
        }
        if (event.target === invoiceModal) {
            closeInvoiceModal();
        }
    });
}

// Authentication
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const admin = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN));

    if (username === admin.username && password === admin.password) {
        sessionStorage.setItem('isLoggedIn', 'true');
        showDashboard();
    } else {
        alert('Invalid username or password!');
    }
}

function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    showLogin();
    clearCart();
}

function showLogin() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('dashboardPage').classList.remove('active');
}

function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
    loadDashboard();
    loadProducts();
    loadBillingProducts();
}

// Navigation
function switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-page') === tabName) {
            tab.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    switch(tabName) {
        case 'dashboard':
            document.getElementById('dashboardTab').classList.add('active');
            loadDashboard();
            break;
        case 'products':
            document.getElementById('productsTab').classList.add('active');
            loadProducts();
            break;
        case 'billing':
            document.getElementById('billingTab').classList.add('active');
            loadBillingProducts();
            break;
        case 'history':
            document.getElementById('historyTab').classList.add('active');
            loadHistory();
            break;
        case 'reports':
            document.getElementById('reportsTab').classList.add('active');
            break;
        case 'settings':
            document.getElementById('settingsTab').classList.add('active');
            loadSettingsForm();
            break;
    }
}

// Dashboard
function loadDashboard() {
    const products = getProducts();
    const lowStockItems = products.filter(p => p.quantity <= p.lowStockAlert);
    const sales = getSales();
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('lowStockCount').textContent = lowStockItems.length;
    document.getElementById('totalSales').textContent = `₹${totalSales.toFixed(2)}`;

    // Display low stock alerts
    const alertsContainer = document.getElementById('lowStockAlerts');
    if (lowStockItems.length === 0) {
        alertsContainer.innerHTML = '<p class="empty-state">No low stock items</p>';
    } else {
        alertsContainer.innerHTML = lowStockItems.map(item => `
            <div class="alert-item">
                <p><strong>${item.name}</strong> - Only ${item.quantity} left (Alert at ${item.lowStockAlert})</p>
            </div>
        `).join('');
    }
}

// Products Management
function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function loadProducts() {
    const products = getProducts();
    const grid = document.getElementById('productsGrid');

    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No products yet. Click "Add Product" to get started.</p></div>';
        return;
    }

    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image || 'https://via.placeholder.com/150'}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/150'">
            <div class="product-info">
                <div class="product-name">${product.name}${product.quantity <= product.lowStockAlert ? '<span class="low-stock-badge">Low Stock</span>' : ''}</div>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
                <div class="product-quantity">Stock: ${product.quantity}</div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-small" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('modalTitle');

    if (productId) {
        const product = getProducts().find(p => p.id === productId);
        if (product) {
            title.textContent = 'Edit Product';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productQuantity').value = product.quantity;
            document.getElementById('productLowStock').value = product.lowStockAlert;
            document.getElementById('productImage').value = product.image || '';
            document.getElementById('productDescription').value = product.description || '';
        }
    } else {
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('productId').value = '';
    }

    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('productForm').reset();
}

function handleProductSubmit(e) {
    e.preventDefault();
    const products = getProducts();
    const productId = document.getElementById('productId').value;
    const product = {
        id: productId ? parseInt(productId) : Date.now(),
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value),
        lowStockAlert: parseInt(document.getElementById('productLowStock').value),
        image: document.getElementById('productImage').value,
        description: document.getElementById('productDescription').value
    };

    if (productId) {
        const index = products.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            products[index] = product;
        }
    } else {
        products.push(product);
    }

    saveProducts(products);
    closeProductModal();
    loadProducts();
    loadBillingProducts();
    loadDashboard();
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        const products = getProducts().filter(p => p.id !== id);
        saveProducts(products);
        loadProducts();
        loadBillingProducts();
        loadDashboard();
    }
}

function handleProductImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('productImage').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Billing System
let cart = [];

function getCart() {
    return cart;
}

function addToCart(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    if (product.quantity <= 0) {
        alert('Product is out of stock!');
        return;
    }

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.quantity < product.quantity) {
            cartItem.quantity++;
        } else {
            alert('Not enough stock available!');
            return;
        }
    } else {
        cart.push({
            ...product,
            quantity: 1,
            itemDiscount: 0,  // Item-level discount percentage
            itemGST: 0        // Item-level GST percentage
        });
    }

    updateCartDisplay();
    calculateCartTotal();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    calculateCartTotal();
}

function updateCartQuantity(productId, newQuantity) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > product.quantity) {
        alert('Not enough stock available!');
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
            const input = document.querySelector(`input[data-product-id="${productId}"][data-type="qty"]`);
            if (input) input.value = cartItem.quantity;
        }
        return;
    }

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity = parseInt(newQuantity);
    }

    updateCartDisplay();
    calculateCartTotal();
}

function updateItemDiscount(productId, discountPercent) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.itemDiscount = parseFloat(discountPercent) || 0;
    }
    updateCartDisplay();
    calculateCartTotal();
}

function updateItemGST(productId, gstPercent) {
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.itemGST = parseFloat(gstPercent) || 0;
    }
    updateCartDisplay();
    calculateCartTotal();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    calculateCartTotal();
}

function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-state"><p>Cart is empty</p></div>';
        return;
    }

    cartContainer.innerHTML = cart.map(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscount = itemSubtotal * ((item.itemDiscount || 0) / 100);
        const itemTaxable = itemSubtotal - itemDiscount;
        const itemGST = itemTaxable * ((item.itemGST || 0) / 100);
        const itemTotal = itemTaxable + itemGST;

        return `
        <div class="cart-item">
            <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/50'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
                <div class="cart-item-discount">
                    <label>Discount (%):</label>
                    <input type="number" value="${item.itemDiscount || 0}" min="0" max="100" 
                           data-product-id="${item.id}" data-type="discount"
                           onchange="updateItemDiscount(${item.id}, this.value)">
                </div>
                <div class="cart-item-gst">
                    <label>GST (%):</label>
                    <input type="number" value="${item.itemGST || 0}" min="0" max="100" 
                           data-product-id="${item.id}" data-type="gst"
                           onchange="updateItemGST(${item.id}, this.value)">
                </div>
                <div style="font-size: 0.85rem; margin-top: 5px; color: var(--primary-color);">
                    Item Total: ₹${itemTotal.toFixed(2)}
                </div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <input type="number" value="${item.quantity}" min="1" data-product-id="${item.id}" data-type="qty" onchange="updateCartQuantity(${item.id}, this.value)">
                <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})">&times;</button>
        </div>
    `;
    }).join('');
}

function calculateCartTotal() {
    // Calculate per-item totals
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalTaxable = 0;
    let totalGST = 0;

    cart.forEach(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscount = itemSubtotal * ((item.itemDiscount || 0) / 100);
        const itemTaxable = itemSubtotal - itemDiscount;
        const itemGST = itemTaxable * ((item.itemGST || 0) / 100);

        subtotal += itemSubtotal;
        totalItemDiscount += itemDiscount;
        totalTaxable += itemTaxable;
        totalGST += itemGST;
    });

    // Apply bill-level discount
    const billDiscountPercent = parseFloat(document.getElementById('billDiscountPercent').value) || 0;
    const billDiscountAmount = totalTaxable * (billDiscountPercent / 100);
    const finalTaxable = totalTaxable - billDiscountAmount;
    
    // Recalculate GST on final taxable amount (if needed, or keep item-level GST)
    // For simplicity, keeping item-level GST and just applying bill discount
    const grandTotal = finalTaxable + totalGST;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('billDiscountAmount').textContent = `₹${billDiscountAmount.toFixed(2)}`;
    document.getElementById('totalTaxable').textContent = `₹${finalTaxable.toFixed(2)}`;
    document.getElementById('totalGSTAmount').textContent = `₹${totalGST.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `₹${grandTotal.toFixed(2)}`;
}

function loadBillingProducts() {
    const products = getProducts();
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
    );

    const container = document.getElementById('billingProductsList');
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No products found</p></div>';
        return;
    }

    container.innerHTML = filteredProducts.map(product => `
        <div class="billing-product-item" onclick="addToCart(${product.id})">
            <img src="${product.image || 'https://via.placeholder.com/50'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/50'">
            <div class="billing-product-info">
                <div class="billing-product-name">${product.name}</div>
                <div class="billing-product-price">₹${product.price.toFixed(2)}</div>
                <div class="billing-product-stock">Stock: ${product.quantity}${product.quantity <= product.lowStockAlert ? ' (Low Stock)' : ''}</div>
            </div>
        </div>
    `).join('');
}

function filterBillingProducts() {
    loadBillingProducts();
}

// Invoice Generation
function getNextInvoiceNumber() {
    const sales = getSales();
    if (sales.length === 0) return 1;
    const lastInvoice = sales[sales.length - 1];
    const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[1]) || 0;
    return lastNum + 1;
}

function previewInvoice() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;

    if (!customerName || !customerPhone) {
        alert('Please fill in customer name and phone number!');
        return;
    }

    const invoiceData = buildInvoiceData();
    const settings = getSettings();
    displayInvoice(invoiceData, settings, false);
}

function buildInvoiceData() {
    // Calculate totals
    let subtotal = 0;
    let totalItemDiscount = 0;
    let totalTaxable = 0;
    let totalGST = 0;

    const items = cart.map(item => {
        const itemSubtotal = item.price * item.quantity;
        const itemDiscount = itemSubtotal * ((item.itemDiscount || 0) / 100);
        const itemTaxable = itemSubtotal - itemDiscount;
        const itemGST = itemTaxable * ((item.itemGST || 0) / 100);
        const itemTotal = itemTaxable + itemGST;

        subtotal += itemSubtotal;
        totalItemDiscount += itemDiscount;
        totalTaxable += itemTaxable;
        totalGST += itemGST;

        return {
            name: item.name,
            quantity: item.quantity,
            rate: item.price,
            taxableValue: itemTaxable,
            gstPercent: item.itemGST || 0,
            gstAmount: itemGST,
            total: itemTotal,
            discount: itemDiscount,
            discountPercent: item.itemDiscount || 0
        };
    });

    const billDiscountPercent = parseFloat(document.getElementById('billDiscountPercent').value) || 0;
    const billDiscountAmount = totalTaxable * (billDiscountPercent / 100);
    const finalTaxable = totalTaxable - billDiscountAmount;
    const grandTotal = finalTaxable + totalGST;

    return {
        invoiceNumber: 'INV-' + getNextInvoiceNumber().toString().padStart(6, '0'),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        customer: {
            name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            gstin: document.getElementById('customerGSTIN').value || '',
            warrantyNote: document.getElementById('warrantyNote').value || ''
        },
        items,
        subtotal,
        totalItemDiscount,
        billDiscountPercent,
        billDiscountAmount,
        totalTaxable: finalTaxable,
        totalGST,
        grandTotal
    };
}

function generateInvoice() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;

    if (!customerName || !customerPhone) {
        alert('Please fill in customer name and phone number!');
        return;
    }

    const invoiceData = buildInvoiceData();
    const settings = getSettings();

    // Save sale
    const sales = getSales();
    sales.push({
        ...invoiceData,
        timestamp: new Date().toISOString()
    });
    saveSales(sales);

    // Update product quantities
    const products = getProducts();
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.quantity -= cartItem.quantity;
        }
    });
    saveProducts(products);

    // Display invoice
    displayInvoice(invoiceData, settings, true);
    
    // Clear cart and customer fields
    clearCart();
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerGSTIN').value = '';
    document.getElementById('warrantyNote').value = '';
    
    loadProducts();
    loadBillingProducts();
    loadDashboard();
}

function displayInvoice(invoiceData, settings, isSaved = false) {
    const invoiceContent = document.getElementById('invoiceContent');
    
    invoiceContent.innerHTML = `
        <div class="invoice" id="invoicePreview">
            <div class="invoice-header">
                ${settings.shopLogo ? `<img src="${settings.shopLogo}" alt="Logo" style="max-width: 150px; max-height: 80px;">` : ''}
                <h1>${settings.shopName || 'Mobile Shop'}</h1>
                ${settings.shopAddress ? `<p style="font-size: 0.9rem; margin-top: 5px;">${settings.shopAddress}</p>` : ''}
                ${settings.shopGSTIN ? `<p style="font-size: 0.85rem;">GSTIN: ${settings.shopGSTIN}</p>` : ''}
                <h2 style="margin-top: 15px;">TAX INVOICE</h2>
            </div>
            <div class="invoice-details">
                <div>
                    <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
                    <p><strong>Date:</strong> ${invoiceData.date}</p>
                    ${invoiceData.time ? `<p><strong>Time:</strong> ${invoiceData.time}</p>` : ''}
                </div>
                <div>
                    <p><strong>Customer Name:</strong> ${invoiceData.customer.name}</p>
                    <p><strong>Phone:</strong> ${invoiceData.customer.phone}</p>
                    ${invoiceData.customer.gstin ? `<p><strong>GSTIN:</strong> ${invoiceData.customer.gstin}</p>` : ''}
                    ${invoiceData.customer.warrantyNote ? `<p><strong>Note:</strong> ${invoiceData.customer.warrantyNote}</p>` : ''}
                </div>
            </div>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Taxable Value</th>
                        <th>GST %</th>
                        <th>GST Amount</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.items.map(item => `
                        <tr>
                            <td>${item.name}${item.discountPercent > 0 ? ` (Disc: ${item.discountPercent}%)` : ''}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.rate.toFixed(2)}</td>
                            <td>₹${item.taxableValue.toFixed(2)}</td>
                            <td>${item.gstPercent > 0 ? item.gstPercent + '%' : '-'}</td>
                            <td>${item.gstAmount > 0 ? '₹' + item.gstAmount.toFixed(2) : '-'}</td>
                            <td>₹${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="invoice-total">
                <div class="invoice-total-row">
                    <span>Subtotal:</span>
                    <span>₹${invoiceData.subtotal.toFixed(2)}</span>
                </div>
                ${invoiceData.totalItemDiscount > 0 ? `
                    <div class="invoice-total-row">
                        <span>Item Discounts:</span>
                        <span>-₹${invoiceData.totalItemDiscount.toFixed(2)}</span>
                    </div>
                ` : ''}
                ${invoiceData.billDiscountAmount > 0 ? `
                    <div class="invoice-total-row">
                        <span>Bill Discount (${invoiceData.billDiscountPercent}%):</span>
                        <span>-₹${invoiceData.billDiscountAmount.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="invoice-total-row">
                    <span>Total Taxable:</span>
                    <span>₹${invoiceData.totalTaxable.toFixed(2)}</span>
                </div>
                <div class="invoice-total-row">
                    <span>Total GST:</span>
                    <span>₹${invoiceData.totalGST.toFixed(2)}</span>
                </div>
                <div class="invoice-total-row final">
                    <span>Grand Total:</span>
                    <span>₹${invoiceData.grandTotal.toFixed(2)}</span>
                </div>
            </div>
            ${!isSaved ? '<p style="text-align: center; color: var(--warning-color); margin-top: 20px;"><strong>PREVIEW - Not Saved</strong></p>' : ''}
        </div>
    `;

    document.getElementById('invoiceModal').classList.add('active');
    window.invoiceData = invoiceData;
    window.invoiceSettings = settings;
    window.isInvoiceSaved = isSaved;
}

function closeInvoiceModal() {
    document.getElementById('invoiceModal').classList.remove('active');
}

function downloadInvoicePDF() {
    // Check if invoice data exists
    if (!window.invoiceData || !window.invoiceSettings) {
        alert('Invoice data not found. Please generate an invoice first.');
        return;
    }

    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page.');
        return;
    }

    // Show loading message
    const downloadBtn = document.getElementById('downloadInvoiceBtn');
    if (downloadBtn) {
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Generating PDF...';
        downloadBtn.disabled = true;
        
        // Use basic PDF method (more reliable)
        setTimeout(() => {
            try {
                downloadBasicPDF();
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            } catch (error) {
                console.error('Error generating PDF:', error);
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
                alert('Error generating PDF: ' + (error.message || 'Please try again'));
            }
        }, 100);
    } else {
        // Fallback if button not found
        try {
            downloadBasicPDF();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF: ' + (error.message || 'Please try again'));
        }
    }
}

function downloadBasicPDF() {
    if (!window.invoiceData || !window.invoiceSettings) {
        alert('Invoice data not found. Please generate an invoice first.');
        return;
    }

    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const invoiceData = window.invoiceData;
        const settings = window.invoiceSettings;

    // Header
    let yPos = 20;
    if (settings.shopLogo) {
        try {
            doc.addImage(settings.shopLogo, 'PNG', 10, yPos, 40, 20);
            yPos += 25;
        } catch(e) {
            yPos += 5;
        }
    }
    doc.setFontSize(18);
    doc.text(settings.shopName || 'Mobile Shop', 10, yPos);
    yPos += 7;
    if (settings.shopAddress) {
        doc.setFontSize(10);
        const addressLines = doc.splitTextToSize(settings.shopAddress, 180);
        addressLines.forEach(line => {
            doc.text(line, 10, yPos);
            yPos += 5;
        });
    }
    if (settings.shopGSTIN) {
        doc.text(`GSTIN: ${settings.shopGSTIN}`, 10, yPos);
        yPos += 5;
    }
    yPos += 5;
    doc.setFontSize(14);
    doc.text('TAX INVOICE', 10, yPos);
    yPos += 10;

    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 10, yPos);
    yPos += 5;
    doc.text(`Date: ${invoiceData.date}`, 10, yPos);
    yPos += 5;
    if (invoiceData.time) {
        doc.text(`Time: ${invoiceData.time}`, 10, yPos);
        yPos += 5;
    }
    yPos += 5;
    doc.text(`Customer: ${invoiceData.customer.name}`, 10, yPos);
    yPos += 5;
    doc.text(`Phone: ${invoiceData.customer.phone}`, 10, yPos);
    if (invoiceData.customer.gstin) {
        yPos += 5;
        doc.text(`GSTIN: ${invoiceData.customer.gstin}`, 10, yPos);
    }
    yPos += 10;

    // Table header
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Description', 10, yPos);
    doc.text('Qty', 75, yPos);
    doc.text('Rate', 90, yPos);
    doc.text('Taxable', 115, yPos);
    doc.text('GST%', 140, yPos);
    doc.text('GST', 155, yPos);
    doc.text('Total', 175, yPos);
    yPos += 5;
    doc.line(10, yPos, 200, yPos);
    yPos += 5;

    // Table rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    invoiceData.items.forEach(item => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const name = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
        doc.text(name, 10, yPos);
        doc.text(item.quantity.toString(), 75, yPos);
        // Use INR or Rs. prefix instead of rupee symbol for better PDF compatibility
        doc.text('Rs. ' + item.rate.toFixed(2), 90, yPos);
        doc.text('Rs. ' + item.taxableValue.toFixed(2), 115, yPos);
        doc.text(item.gstPercent > 0 ? item.gstPercent + '%' : '-', 140, yPos);
        doc.text(item.gstAmount > 0 ? 'Rs. ' + item.gstAmount.toFixed(2) : '-', 155, yPos);
        doc.text('Rs. ' + item.total.toFixed(2), 175, yPos);
        yPos += 7;
    });

    yPos += 3;
    doc.line(10, yPos, 200, yPos);
    yPos += 8;

    // Totals
    doc.setFontSize(10);
    doc.text('Subtotal: Rs. ' + invoiceData.subtotal.toFixed(2), 120, yPos);
    yPos += 6;
    if (invoiceData.totalItemDiscount > 0) {
        doc.text('Item Discounts: -Rs. ' + invoiceData.totalItemDiscount.toFixed(2), 120, yPos);
        yPos += 6;
    }
    if (invoiceData.billDiscountAmount > 0) {
        doc.text('Bill Discount: -Rs. ' + invoiceData.billDiscountAmount.toFixed(2), 120, yPos);
        yPos += 6;
    }
    doc.text('Total Taxable: Rs. ' + invoiceData.totalTaxable.toFixed(2), 120, yPos);
    yPos += 6;
    doc.text('Total GST: Rs. ' + invoiceData.totalGST.toFixed(2), 120, yPos);
    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total: Rs. ' + invoiceData.grandTotal.toFixed(2), 120, yPos);

    doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`);
    } catch (error) {
        console.error('Error in downloadBasicPDF:', error);
        alert('Error generating PDF: ' + (error.message || 'Unknown error'));
        throw error;
    }
}

// Settings
function getSettings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
}

function saveSettings() {
    const settings = {
        shopName: document.getElementById('shopName').value,
        shopAddress: document.getElementById('shopAddress').value,
        shopGSTIN: document.getElementById('shopGSTIN').value,
        shopLogo: document.getElementById('shopLogo').value,
        themeColor: document.getElementById('themeColor').value,
        upiId: document.getElementById('upiId').value
    };

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    loadSettings();
    alert('Settings saved successfully!');
}

function loadSettings() {
    const settings = getSettings();
    
    // Apply theme color
    if (settings.themeColor) {
        document.documentElement.style.setProperty('--primary-color', settings.themeColor);
    }

    // Update header
    if (settings.shopName) {
        document.getElementById('shopNameHeader').textContent = settings.shopName;
    }
}

function loadSettingsForm() {
    const settings = getSettings();
    document.getElementById('shopName').value = settings.shopName || '';
    document.getElementById('shopAddress').value = settings.shopAddress || '';
    document.getElementById('shopGSTIN').value = settings.shopGSTIN || '';
    document.getElementById('shopLogo').value = settings.shopLogo || '';
    document.getElementById('themeColor').value = settings.themeColor || '#007bff';
    document.getElementById('upiId').value = settings.upiId || '';
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('shopLogo').value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// UPI QR Code Generation
function generateUPIQR() {
    const upiId = document.getElementById('upiId').value;
    const amount = document.getElementById('upiAmount').value;
    
    if (!upiId) {
        alert('Please enter UPI ID');
        return;
    }

    // Create UPI payment string
    let upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(getSettings().shopName || 'Shop')}&am=${amount || ''}&cu=INR`;
    
    const qrContainer = document.getElementById('upiQRCode');
    qrContainer.innerHTML = '<div id="qr-code-container"></div>';

    // Generate QR code
    const qrDiv = document.getElementById('qr-code-container');
    new QRCode(qrDiv, {
        text: upiString,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: 3 // H (High error correction)
    });

    const infoP = document.createElement('p');
    infoP.style.marginTop = '10px';
    infoP.textContent = `UPI ID: ${upiId}`;
    qrContainer.appendChild(infoP);
}

// QR Scanner
let qrScanner = null;

function startQRScanner() {
    const container = document.getElementById('qrScannerContainer');
    const resultDiv = document.getElementById('qrScanResult');
    
    if (qrScanner) {
        qrScanner.clear();
        qrScanner = null;
        container.innerHTML = '';
        resultDiv.classList.remove('active');
        document.getElementById('scanQRBtn').textContent = 'Scan QR Code';
        return;
    }

    container.innerHTML = '<div id="qr-reader" style="width: 100%;"></div>';
    resultDiv.classList.remove('active');
    document.getElementById('scanQRBtn').textContent = 'Stop Scanner';

    if (typeof Html5Qrcode !== 'undefined') {
        qrScanner = new Html5Qrcode("qr-reader");
        qrScanner.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                resultDiv.innerHTML = `<p><strong>Scanned:</strong> ${decodedText}</p>`;
                resultDiv.classList.add('active');
                qrScanner.stop();
                qrScanner = null;
                document.getElementById('scanQRBtn').textContent = 'Scan QR Code';
            },
            (errorMessage) => {
                // Ignore errors
            }
        ).catch((err) => {
            console.error("Unable to start scanning", err);
            alert('Unable to start camera. Please check permissions.');
            container.innerHTML = '';
            document.getElementById('scanQRBtn').textContent = 'Scan QR Code';
        });
    } else {
        alert('QR Scanner library not loaded. Please check your internet connection.');
    }
}

// Sales
function getSales() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES) || '[]');
}

function saveSales(sales) {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
}

// History
function loadHistory() {
    try {
        const container = document.getElementById('historyList');
        if (!container) {
            console.error('History list container not found');
            return;
        }

        const sales = getSales();
        
        // Check if we have any sales
        if (!sales || sales.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No bills found. Generate invoices to see them here.</p></div>';
            return;
        }

        const searchInput = document.getElementById('historySearch');
        const dateFromInput = document.getElementById('historyDateFrom');
        const dateToInput = document.getElementById('historyDateTo');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const dateFrom = dateFromInput ? dateFromInput.value : '';
        const dateTo = dateToInput ? dateToInput.value : '';

        let filtered = sales.filter(sale => {
            // Filter out invalid sales (missing required fields)
            return sale && sale.invoiceNumber && sale.customer && sale.customer.name;
        });

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(sale => {
                const invoiceMatch = sale.invoiceNumber && sale.invoiceNumber.toLowerCase().includes(searchTerm);
                const nameMatch = sale.customer && sale.customer.name && sale.customer.name.toLowerCase().includes(searchTerm);
                const phoneMatch = sale.customer && sale.customer.phone && sale.customer.phone.includes(searchTerm);
                return invoiceMatch || nameMatch || phoneMatch;
            });
        }

        // Filter by date
        if (dateFrom) {
            filtered = filtered.filter(sale => {
                if (!sale.timestamp) return false;
                try {
                    const saleDate = new Date(sale.timestamp);
                    return saleDate >= new Date(dateFrom);
                } catch (e) {
                    return false;
                }
            });
        }
        if (dateTo) {
            filtered = filtered.filter(sale => {
                if (!sale.timestamp) return false;
                try {
                    const saleDate = new Date(sale.timestamp);
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59);
                    return saleDate <= toDate;
                } catch (e) {
                    return false;
                }
            });
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => {
            try {
                const dateA = new Date(a.timestamp || a.date || 0);
                const dateB = new Date(b.timestamp || b.date || 0);
                return dateB - dateA;
            } catch (e) {
                return 0;
            }
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No bills found matching your search criteria.</p></div>';
            return;
        }

        container.innerHTML = filtered.map(sale => {
            // Safely get values with defaults
            const invoiceNumber = sale.invoiceNumber || 'N/A';
            const grandTotal = sale.grandTotal || sale.total || 0;
            const customerName = (sale.customer && sale.customer.name) || 'Unknown';
            const customerPhone = (sale.customer && sale.customer.phone) || 'N/A';
            const date = sale.date || (sale.timestamp ? new Date(sale.timestamp).toLocaleDateString() : 'N/A');
            const time = sale.time || '';
            const itemsCount = (sale.items && sale.items.length) || 0;

            return `
                <div class="history-item" onclick="viewInvoiceFromHistory('${invoiceNumber}')">
                    <div class="history-item-header">
                        <h3>${invoiceNumber}</h3>
                        <span style="font-size: 1.2rem; font-weight: bold; color: var(--primary-color);">Rs. ${grandTotal.toFixed(2)}</span>
                    </div>
                    <div class="history-item-details">
                        <div><strong>Customer:</strong> ${customerName}</div>
                        <div><strong>Phone:</strong> ${customerPhone}</div>
                        <div><strong>Date:</strong> ${date} ${time}</div>
                        <div><strong>Items:</strong> ${itemsCount}</div>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); viewInvoiceFromHistory('${invoiceNumber}')">View</button>
                        <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); downloadInvoiceFromHistory('${invoiceNumber}')">Download PDF</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading history:', error);
        const container = document.getElementById('historyList');
        if (container) {
            container.innerHTML = '<div class="empty-state"><p>Error loading bill history. Please refresh the page.</p></div>';
        }
    }
}

function clearHistoryFilters() {
    document.getElementById('historySearch').value = '';
    document.getElementById('historyDateFrom').value = '';
    document.getElementById('historyDateTo').value = '';
    loadHistory();
}

function viewInvoiceFromHistory(invoiceNumber) {
    const sales = getSales();
    const sale = sales.find(s => s.invoiceNumber === invoiceNumber);
    if (sale) {
        const settings = getSettings();
        displayInvoice(sale, settings, true);
    }
}

function downloadInvoiceFromHistory(invoiceNumber) {
    const sales = getSales();
    const sale = sales.find(s => s.invoiceNumber === invoiceNumber);
    if (sale) {
        const settings = getSettings();
        window.invoiceData = sale;
        window.invoiceSettings = settings;
        window.isInvoiceSaved = true;
        downloadInvoicePDF();
    }
}

// Reports
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateFrom = document.getElementById('reportDateFrom').value;
    const dateTo = document.getElementById('reportDateTo').value;
    const sales = getSales();
    const products = getProducts();

    let filtered = sales;
    if (dateFrom) {
        filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            return saleDate >= new Date(dateFrom);
        });
    }
    if (dateTo) {
        filtered = filtered.filter(sale => {
            const saleDate = new Date(sale.timestamp);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59);
            return saleDate <= toDate;
        });
    }

    const container = document.getElementById('reportResults');
    window.currentReportData = { type: reportType, data: filtered, products };

    switch(reportType) {
        case 'daily':
            generateDailyReport(filtered, container);
            break;
        case 'monthly':
            generateMonthlyReport(filtered, container);
            break;
        case 'tax':
            generateTaxSummary(filtered, container);
            break;
        case 'topsellers':
            generateTopSellers(filtered, container);
            break;
        case 'lowstock':
            generateLowStockReport(products, container);
            break;
    }
}

function generateDailyReport(sales, container) {
    const dailyData = {};
    sales.forEach(sale => {
        const date = sale.date || (sale.timestamp ? new Date(sale.timestamp).toLocaleDateString() : 'Unknown');
        if (!dailyData[date]) {
            dailyData[date] = { count: 0, total: 0, gst: 0, products: new Set() };
        }
        dailyData[date].count++;
        const grandTotal = parseFloat(sale.grandTotal) || parseFloat(sale.total) || 0;
        const totalGST = parseFloat(sale.totalGST) || 0;
        dailyData[date].total += grandTotal;
        dailyData[date].gst += totalGST;
        
        // Collect product names
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                if (item.name) {
                    dailyData[date].products.add(item.name);
                }
            });
        }
    });

    const rows = Object.entries(dailyData).map(([date, data]) => {
        const productList = Array.from(data.products).join(', ') || 'N/A';
        return `
        <tr>
            <td>${date}</td>
            <td>${data.count}</td>
            <td>Rs. ${isNaN(data.total) ? '0.00' : data.total.toFixed(2)}</td>
            <td>Rs. ${isNaN(data.gst) ? '0.00' : data.gst.toFixed(2)}</td>
            <td style="font-size: 0.85rem; max-width: 300px;">${productList}</td>
        </tr>
    `;
    }).join('');

    const totalSales = sales.reduce((sum, s) => {
        const grandTotal = parseFloat(s.grandTotal) || parseFloat(s.total) || 0;
        return sum + grandTotal;
    }, 0);
    const totalGST = sales.reduce((sum, s) => {
        return sum + (parseFloat(s.totalGST) || 0);
    }, 0);

    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Bills</th>
                    <th>Total Sales</th>
                    <th>Total GST</th>
                    <th>Products Sold</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="report-summary">
            <h3>Summary</h3>
            <div class="report-summary-row">
                <span>Total Bills:</span>
                <span>${sales.length}</span>
            </div>
            <div class="report-summary-row">
                <span>Total Sales:</span>
                <span>Rs. ${isNaN(totalSales) ? '0.00' : totalSales.toFixed(2)}</span>
            </div>
            <div class="report-summary-row">
                <span>Total GST:</span>
                <span>Rs. ${isNaN(totalGST) ? '0.00' : totalGST.toFixed(2)}</span>
            </div>
        </div>
    `;
}

function generateMonthlyReport(sales, container) {
    const monthlyData = {};
    sales.forEach(sale => {
        const saleDate = sale.timestamp ? new Date(sale.timestamp) : (sale.date ? new Date(sale.date) : new Date());
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { count: 0, total: 0, gst: 0, products: new Set() };
        }
        monthlyData[monthKey].count++;
        const grandTotal = parseFloat(sale.grandTotal) || parseFloat(sale.total) || 0;
        const totalGST = parseFloat(sale.totalGST) || 0;
        monthlyData[monthKey].total += grandTotal;
        monthlyData[monthKey].gst += totalGST;
        
        // Collect product names
        if (sale.items && Array.isArray(sale.items)) {
            sale.items.forEach(item => {
                if (item.name) {
                    monthlyData[monthKey].products.add(item.name);
                }
            });
        }
    });

    const rows = Object.entries(monthlyData).map(([month, data]) => {
        const productList = Array.from(data.products).join(', ') || 'N/A';
        return `
        <tr>
            <td>${month}</td>
            <td>${data.count}</td>
            <td>Rs. ${isNaN(data.total) ? '0.00' : data.total.toFixed(2)}</td>
            <td>Rs. ${isNaN(data.gst) ? '0.00' : data.gst.toFixed(2)}</td>
            <td style="font-size: 0.85rem; max-width: 300px;">${productList}</td>
        </tr>
    `;
    }).join('');

    const totalSales = sales.reduce((sum, s) => {
        const grandTotal = parseFloat(s.grandTotal) || parseFloat(s.total) || 0;
        return sum + grandTotal;
    }, 0);
    const totalGST = sales.reduce((sum, s) => {
        return sum + (parseFloat(s.totalGST) || 0);
    }, 0);

    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Bills</th>
                    <th>Total Sales</th>
                    <th>Total GST</th>
                    <th>Products Sold</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="report-summary">
            <h3>Summary</h3>
            <div class="report-summary-row">
                <span>Total Bills:</span>
                <span>${sales.length}</span>
            </div>
            <div class="report-summary-row">
                <span>Total Sales:</span>
                <span>Rs. ${isNaN(totalSales) ? '0.00' : totalSales.toFixed(2)}</span>
            </div>
            <div class="report-summary-row">
                <span>Total GST:</span>
                <span>Rs. ${isNaN(totalGST) ? '0.00' : totalGST.toFixed(2)}</span>
            </div>
        </div>
    `;
}

function generateTaxSummary(sales, container) {
    let totalTaxable = 0;
    let totalGST = 0;
    const gstBreakdown = {};

    sales.forEach(sale => {
        totalTaxable += sale.totalTaxable || 0;
        totalGST += sale.totalGST || 0;
        
        sale.items.forEach(item => {
            if (item.gstPercent > 0) {
                const key = item.gstPercent + '%';
                if (!gstBreakdown[key]) {
                    gstBreakdown[key] = { taxable: 0, gst: 0 };
                }
                gstBreakdown[key].taxable += item.taxableValue;
                gstBreakdown[key].gst += item.gstAmount;
            }
        });
    });

    const rows = Object.entries(gstBreakdown).map(([rate, data]) => `
        <tr>
            <td>${rate}</td>
            <td>₹${data.taxable.toFixed(2)}</td>
            <td>₹${data.gst.toFixed(2)}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>GST Rate</th>
                    <th>Taxable Value</th>
                    <th>GST Amount</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div class="report-summary">
            <h3>Summary</h3>
            <div class="report-summary-row">
                <span>Total Taxable:</span>
                <span>₹${totalTaxable.toFixed(2)}</span>
            </div>
            <div class="report-summary-row">
                <span>Total GST:</span>
                <span>₹${totalGST.toFixed(2)}</span>
            </div>
        </div>
    `;
}

function generateTopSellers(sales, container) {
    const productSales = {};
    
    sales.forEach(sale => {
        sale.items.forEach(item => {
            if (!productSales[item.name]) {
                productSales[item.name] = { quantity: 0, revenue: 0 };
            }
            productSales[item.name].quantity += item.quantity;
            productSales[item.name].revenue += item.total;
        });
    });

    const sorted = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20);

    const rows = sorted.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.revenue.toFixed(2)}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Quantity Sold</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function generateLowStockReport(products, container) {
    const lowStock = products.filter(p => p.quantity <= p.lowStockAlert);
    
    if (lowStock.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No low stock items</p></div>';
        return;
    }

    const rows = lowStock.map(product => `
        <tr>
            <td>${product.name}</td>
            <td>${product.quantity}</td>
            <td>${product.lowStockAlert}</td>
            <td>₹${product.price.toFixed(2)}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Current Stock</th>
                    <th>Alert Level</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function exportReportToCSV() {
    if (!window.currentReportData) {
        alert('Please generate a report first');
        return;
    }

    const { type, data, products } = window.currentReportData;
    let csv = '';
    let filename = '';

    switch(type) {
        case 'daily':
            csv = 'Date,Bills,Total Sales,Total GST\n';
            const dailyData = {};
            data.forEach(sale => {
                const date = sale.date;
                if (!dailyData[date]) {
                    dailyData[date] = { count: 0, total: 0, gst: 0 };
                }
                dailyData[date].count++;
                dailyData[date].total += sale.grandTotal;
                dailyData[date].gst += sale.totalGST || 0;
            });
            Object.entries(dailyData).forEach(([date, d]) => {
                csv += `${date},${d.count},${d.total.toFixed(2)},${d.gst.toFixed(2)}\n`;
            });
            filename = 'daily-sales.csv';
            break;
        case 'monthly':
            csv = 'Month,Bills,Total Sales,Total GST\n';
            const monthlyData = {};
            data.forEach(sale => {
                const date = new Date(sale.timestamp);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { count: 0, total: 0, gst: 0 };
                }
                monthlyData[monthKey].count++;
                monthlyData[monthKey].total += sale.grandTotal;
                monthlyData[monthKey].gst += sale.totalGST || 0;
            });
            Object.entries(monthlyData).forEach(([month, d]) => {
                csv += `${month},${d.count},${d.total.toFixed(2)},${d.gst.toFixed(2)}\n`;
            });
            filename = 'monthly-sales.csv';
            break;
        case 'tax':
            csv = 'GST Rate,Taxable Value,GST Amount\n';
            const gstBreakdown = {};
            data.forEach(sale => {
                sale.items.forEach(item => {
                    if (item.gstPercent > 0) {
                        const key = item.gstPercent + '%';
                        if (!gstBreakdown[key]) {
                            gstBreakdown[key] = { taxable: 0, gst: 0 };
                        }
                        gstBreakdown[key].taxable += item.taxableValue;
                        gstBreakdown[key].gst += item.gstAmount;
                    }
                });
            });
            Object.entries(gstBreakdown).forEach(([rate, d]) => {
                csv += `${rate},${d.taxable.toFixed(2)},${d.gst.toFixed(2)}\n`;
            });
            filename = 'tax-summary.csv';
            break;
        case 'topsellers':
            csv = 'Product,Quantity Sold,Revenue\n';
            const productSales = {};
            data.forEach(sale => {
                sale.items.forEach(item => {
                    if (!productSales[item.name]) {
                        productSales[item.name] = { quantity: 0, revenue: 0 };
                    }
                    productSales[item.name].quantity += item.quantity;
                    productSales[item.name].revenue += item.total;
                });
            });
            Object.entries(productSales)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .forEach(([name, d]) => {
                    csv += `${name},${d.quantity},${d.revenue.toFixed(2)}\n`;
                });
            filename = 'top-sellers.csv';
            break;
        case 'lowstock':
            csv = 'Product,Current Stock,Alert Level,Price\n';
            const lowStock = products.filter(p => p.quantity <= p.lowStockAlert);
            lowStock.forEach(product => {
                csv += `${product.name},${product.quantity},${product.lowStockAlert},${product.price.toFixed(2)}\n`;
            });
            filename = 'low-stock-items.csv';
            break;
    }

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.updateItemDiscount = updateItemDiscount;
window.updateItemGST = updateItemGST;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.viewInvoiceFromHistory = viewInvoiceFromHistory;
window.downloadInvoiceFromHistory = downloadInvoiceFromHistory;

