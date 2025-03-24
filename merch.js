// Merchandise System for Fantasy Prompt Generator
// Handles T-shirt customization, shopping cart, and checkout

// Configuration for email and payment services
const config = {
    emailjs: {
        serviceId: 'service_fcsd7gr', // EmailJS service ID
        customerTemplateId: 'template_pchevsq', // Original template ID
        newTemplateId: 'template_pchevsq', // Replace this with your new template ID after creating it in EmailJS
        businessTemplateId: 'template_pchevsq'  // Using the same template for business notifications
    },
    businessEmail: 'aicardgen_business@outlook.com',
    testEmail: 'aicardgen_business@outlook.com'
};

// Loading overlay functions
function showLoadingOverlay(message = 'Processing...') {
    // Remove existing overlay if present
    hideLoadingOverlay();
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
        <p>${message}</p>
    `;
    
    // Add to the active modal or body if no modal is open
    const activeModal = document.querySelector('.cart-modal[style*="display: flex"]');
    if (activeModal) {
        const modalContent = activeModal.querySelector('.cart-content');
        if (modalContent) {
            modalContent.style.position = 'relative';
            modalContent.appendChild(overlay);
        } else {
            document.body.appendChild(overlay);
        }
    } else {
        document.body.appendChild(overlay);
    }
}

function hideLoadingOverlay() {
    // Remove any existing overlay
    const existingOverlay = document.getElementById('loadingOverlay');
    if (existingOverlay && existingOverlay.parentNode) {
        existingOverlay.parentNode.removeChild(existingOverlay);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const htmlElement = document.documentElement;
        const moonIcon = '<i class="fas fa-moon"></i>';
        const sunIcon = '<i class="fas fa-sun"></i>';
        
        // Check for saved theme preference or use default
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' ? sunIcon : moonIcon;
        
        // Toggle theme when button is clicked
        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeToggle.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
        });
    }
    
    // Setup view cart button
    const viewCartBtn = document.getElementById('viewCartBtn');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', function() {
            const cartModal = document.getElementById('cartModal');
            if (cartModal) {
                cartModal.style.display = 'flex';
                renderCartItems();
            }
        });
    }
    
    // Initialize cart with data from localStorage
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Initialize cart functionality
    initCart();
    
    // Initialize custom T-shirt designer
    initCustomTshirt();
    
    // Set up Add to Cart button with enhanced functionality
    setupAddToCartButton();
    
    // Create placeholder mockup images if not available
    createMockupDirectory();
});

// Shopping cart functionality
let cart = []; // Will be initialized from localStorage on page load
const cartBadge = document.getElementById('cartBadge');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

// Initialize cart functionality
function initCart() {
    // Check if cart elements exist (they might not on the index.html page)
    if (!document.getElementById('cartIcon')) {
        return; // Exit if we're not on the merch page
    }
    
    // Update cart badge with current count
    updateCartBadge();
    
    // Open cart modal when cart icon is clicked
    document.getElementById('cartIcon').addEventListener('click', function() {
        document.getElementById('cartModal').style.display = 'flex';
        renderCartItems();
    });
    
    // Close cart modal when close button is clicked
    document.getElementById('closeCart').addEventListener('click', function() {
        document.getElementById('cartModal').style.display = 'none';
    });
    
    // Close cart modal when clicking outside the content
    document.getElementById('cartModal').addEventListener('click', function(event) {
        if (event.target === this) {
            this.style.display = 'none';
        }
    });
    
    // Handle send invoice button
    document.getElementById('sendInvoiceBtn').addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        sendInvoiceWithoutPayment();
    });
    
    // Initialize PayPal button in cart if PayPal is available
    initializePayPalButton();
}

// Initialize PayPal button in the cart
function initializePayPalButton() {
    const paypalButtonContainer = document.getElementById('paypalButtonContainer');
    if (!paypalButtonContainer) return;
    
    // Clear any existing buttons
    paypalButtonContainer.innerHTML = '';
    
    // Check if cart is empty
    if (cart.length === 0) {
        paypalButtonContainer.style.display = 'none';
        return;
    } else {
        paypalButtonContainer.style.display = 'block';
    }
    
    // Show loading state
    paypalButtonContainer.innerHTML = `
        <div class="paypal-loading">
            <div class="loading-spinner"></div>
            <span>Loading PayPal...</span>
        </div>
    `;
    
    // Add necessary styles
    if (!document.getElementById('paypal-button-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'paypal-button-styles';
        styleEl.textContent = `
            .paypal-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                background-color: #f8f9fa;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 1rem;
            }
            .loading-spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #0070ba;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                animation: spin 1s linear infinite;
                margin-bottom: 0.5rem;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Set timeout for error handling
    const paypalLoadTimeout = setTimeout(() => {
        console.warn('PayPal loading timed out after 10 seconds');
        paypalButtonContainer.innerHTML = `
            <div class="paypal-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>PayPal is taking too long to load</p>
                <button class="btn btn-primary retry-btn" onclick="initializePayPalButton()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }, 10000);
    
    // Load PayPal script and render button
    loadPayPalScript()
        .then(() => {
            clearTimeout(paypalLoadTimeout);
            if (window.paypal && window.paypal.Buttons) {
                console.log('PayPal SDK loaded successfully, rendering buttons');
                renderPayPalButton();
            } else {
                console.error('PayPal SDK did not load properly');
                throw new Error('PayPal SDK did not initialize correctly');
            }
        })
        .catch(error => {
            clearTimeout(paypalLoadTimeout);
            console.error('Failed to load PayPal:', error);
            paypalButtonContainer.innerHTML = `
                <div class="paypal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not load PayPal checkout</p>
                    <div class="error-details">${error.message}</div>
                    <button class="btn btn-primary retry-btn" onclick="initializePayPalButton()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                    <button class="btn btn-success" onclick="showManualCheckout()">
                        <i class="fas fa-envelope"></i> Contact Us to Order
                    </button>
                </div>
            `;
        });
}

// Function to render the PayPal button
function renderPayPalButton() {
    const paypalButtonContainer = document.getElementById('paypalButtonContainer');
    if (!paypalButtonContainer) return;
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Clear previous PayPal button to avoid duplicates
    paypalButtonContainer.innerHTML = '';
    
    try {
        console.log('Rendering PayPal button with total: $' + total.toFixed(2));
        
        // Check if PayPal SDK is loaded
        if (!window.paypal || !window.paypal.Buttons) {
            console.error('PayPal SDK not available when trying to render button');
            paypalButtonContainer.innerHTML = `
                <div class="paypal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>PayPal is not available</p>
                    <button class="btn btn-primary retry-btn" onclick="initializePayPalButton()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
            return;
        }
        
        // Check if cart is empty or total is invalid
        if (cart.length === 0 || total <= 0) {
            paypalButtonContainer.innerHTML = `
                <div style="padding: 1rem; text-align: center; color: #757575; background-color: #f5f5f5; border-radius: 8px;">
                    <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                    Add items to your cart to enable checkout
                </div>
            `;
            return;
        }
        
        // Create PayPal button
        window.paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'paypal'
            },
            
            // Create order
            createOrder: function(data, actions) {
                showLoadingOverlay('Creating PayPal order...');
                
                // Create order items array for PayPal
                const items = cart.map(item => ({
                    name: `Custom ${formatStyle(item.style)} T-shirt - ${item.color}, Size: ${item.size}`,
                    unit_amount: {
                        currency_code: 'USD',
                        value: parseFloat(item.price).toFixed(2)
                    },
                    quantity: '1'
                }));
                
                return actions.order.create({
                    purchase_units: [{
                        description: 'Custom T-shirt Order',
                        amount: {
                            currency_code: 'USD',
                            value: total.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: total.toFixed(2)
                                }
                            }
                        },
                        items: items
                    }]
                }).then(function(orderId) {
                    console.log('PayPal order created with ID:', orderId);
                    hideLoadingOverlay();
                    return orderId;
                }).catch(function(error) {
                    console.error('Error creating PayPal order:', error);
                    hideLoadingOverlay();
                    showToast('Error creating PayPal order. Please try again.', 'error');
                    throw error;
                });
            },
            
            // Handle approve
            onApprove: function(data, actions) {
                showLoadingOverlay('Processing payment...');
                
                return actions.order.capture().then(function(orderData) {
                    console.log('PayPal payment completed:', orderData);
                    
                    // Close cart modal
                    document.getElementById('cartModal').style.display = 'none';
                    
                    // Extract shipping address if available
                    let shippingAddress = 'Not provided';
                    if (orderData.purchase_units && 
                        orderData.purchase_units[0] && 
                        orderData.purchase_units[0].shipping && 
                        orderData.purchase_units[0].shipping.address) {
                        
                        const addr = orderData.purchase_units[0].shipping.address;
                        shippingAddress = `${addr.address_line_1 || ''} ${addr.address_line_2 || ''}, ${addr.admin_area_2 || ''}, ${addr.admin_area_1 || ''}, ${addr.postal_code || ''}, ${addr.country_code || ''}`.trim();
                    }
                    
                    // Create order data with proper customer structure
                    const orderDetails = {
                        paypal: {
                            orderId: data.orderID,
                            payerId: orderData.payer.payer_id,
                            status: orderData.status,
                            details: orderData
                        },
                        items: cart,
                        total: total,
                        date: new Date().toISOString(),
                        paymentMethod: 'PayPal',
                        customer: {
                            name: `${orderData.payer.name.given_name} ${orderData.payer.name.surname}`,
                            email: orderData.payer.email_address,
                            address: shippingAddress,
                            paypalOrderId: data.orderID
                        }
                    };
                    
                    // Save order to localStorage for reference
                    const orders = JSON.parse(localStorage.getItem('tshirtOrders') || '[]');
                    orders.push(orderDetails);
                    localStorage.setItem('tshirtOrders', JSON.stringify(orders));
                    
                    // Send order confirmation email
                    sendOrderToEmail(orderDetails);
                    
                    // Clear cart after successful payment
                    cart = [];
                    saveCart();
                    updateCartBadge();
                    
                    // Show success message
                    hideLoadingOverlay();
                    showOrderSuccessMessage('PayPal');
                }).catch(function(error) {
                    console.error('PayPal capture error:', error);
                    hideLoadingOverlay();
                    showToast('Payment processing failed. Please try again.', 'error');
                });
            },
            
            onError: function(err) {
                console.error('PayPal error:', err);
                hideLoadingOverlay();
                showToast('Payment processing failed. Please try again or use a different payment method.', 'error');
                
                paypalButtonContainer.innerHTML = `
                    <div class="paypal-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>PayPal payment failed</p>
                        <button class="btn btn-primary retry-btn" onclick="initializePayPalButton()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                    </div>
                `;
            },
            
            onCancel: function() {
                showToast('Payment cancelled. Your cart items are still saved.', 'info');
            }
        }).render('#paypalButtonContainer')
        .catch(error => {
            console.error('Error rendering PayPal button:', error);
            paypalButtonContainer.innerHTML = `
                <div class="paypal-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not initialize PayPal checkout</p>
                    <button class="btn btn-primary retry-btn" onclick="initializePayPalButton()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                    <button class="btn btn-success" onclick="showManualCheckout()">
                        <i class="fas fa-envelope"></i> Contact Us to Order
                    </button>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error initializing PayPal:', error);
        paypalButtonContainer.innerHTML = `
            <div class="paypal-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading PayPal</p>
                <button class="btn btn-primary retry-btn" onclick="initializePayPalButton()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
                <button class="btn btn-success" onclick="showManualCheckout()">
                    <i class="fas fa-envelope"></i> Contact Us to Order
                </button>
            </div>
        `;
    }
}

// Add custom t-shirt to cart
function addCustomToCart(style, size, color, imageUrl, price, designPosition) {
    // Check if we have all required data
    if (!style || !size || !color || !imageUrl || !price || !designPosition) {
        showToast('Error: Some product information is missing. Please try again.');
        return false;
    }
    
    // Exit early if the default placeholder image is being used
    if (imageUrl.includes('placehold.co') || imageUrl.includes('Upload+Your+Image')) {
        showToast('Please upload an image or select one from your generated images!');
        return false;
    }
    
    // Check if an identical item already exists in the cart
    const isDuplicate = cart.some(item => 
        item.style === style && 
        item.size === size && 
        item.color === color && 
        item.imageUrl === imageUrl &&
        Math.abs(item.designPosition.x - designPosition.x) < 5 &&
        Math.abs(item.designPosition.y - designPosition.y) < 5 &&
        Math.abs(item.designPosition.scale - designPosition.scale) < 5 &&
        Math.abs(item.designPosition.rotation - designPosition.rotation) < 5
    );
    
    if (isDuplicate) {
        showToast('This item is already in your cart!');
        return false;
    }
    
    // Log design position
    console.log('Design position:', designPosition);
    
    // Generate a unique ID for this cart item
    const cartItemId = Date.now().toString();
    
    // Flag to prevent adding multiple times
    let itemAdded = false;
    
    try {
        // Get the t-shirt base for the mockup
        const tshirtBase = document.getElementById('tshirtBase');
        const tshirtPreview = document.getElementById('tshirtPreview');
        
        // Create a preview canvas for the complete t-shirt mockup
        const previewCanvas = document.createElement('canvas');
        const previewCtx = previewCanvas.getContext('2d');
        previewCanvas.width = 600;
        previewCanvas.height = 600;
        
        // FIRST, check if we can directly get the image data from the DOM
        // This avoids CORS issues since the image is already loaded in the page
        const tshirtPreviewSrc = tshirtPreview ? tshirtPreview.src : null;
        
        // If we're dealing with a data URL or a same-origin URL, we can proceed normally
        const isDataUrl = imageUrl.startsWith('data:');
        const isSameOrigin = new URL(imageUrl, window.location.href).origin === window.location.origin;
        
        if (isDataUrl || isSameOrigin) {
            // Create temporary image to draw the design - normal flow
            const img = new Image();
            img.crossOrigin = 'Anonymous';  // Handle cross-origin images
            
            img.onload = function() {
                try {
                    // First, capture the t-shirt base by creating a snapshot of the current display
                    const mockupCanvas = document.createElement('canvas');
                    const mockupCtx = mockupCanvas.getContext('2d');
                    mockupCanvas.width = 600;
                    mockupCanvas.height = 600;
                    
                    // Draw background color matching the t-shirt
                    mockupCtx.fillStyle = color === 'black' ? '#000000' : '#ffffff';
                    mockupCtx.fillRect(0, 0, mockupCanvas.width, mockupCanvas.height);
                    
                    // Create a complete mockup with t-shirt and design
                    // This simulates what the user sees on screen
                    const baseImg = new Image();
                    baseImg.crossOrigin = 'Anonymous';  // Add this to prevent canvas tainting
                    baseImg.onload = function() {
                        // Only proceed if item hasn't been added yet
                        if (itemAdded) return;
                        itemAdded = true;
                        
                        // Draw the t-shirt base
                        mockupCtx.drawImage(baseImg, 0, 0, mockupCanvas.width, mockupCanvas.height);
                        
                        try {
                            // Apply the design with proper positioning
                            const designX = (mockupCanvas.width / 2) + designPosition.x;
                            const designY = (mockupCanvas.height / 2) + designPosition.y;
                            
                            mockupCtx.save();
                            mockupCtx.translate(designX, designY);
                            mockupCtx.rotate(designPosition.rotation * Math.PI / 180);
                            mockupCtx.scale(designPosition.scale / 100, designPosition.scale / 100);
                            mockupCtx.globalAlpha = designPosition.transparency / 100;
                            
                            // Calculate dimensions to center the design
                            const dWidth = img.width;
                            const dHeight = img.height;
                            mockupCtx.drawImage(img, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
                            
                            mockupCtx.restore();
                            
                            // Convert to dataURL to save the mockup
                            const mockupImageUrl = mockupCanvas.toDataURL('image/png');
                            
                            // Add the item to the cart with both original image and mockup
                            cart.push({
                                id: cartItemId,
                                style: style,
                                size: size,
                                color: color,
                                imageUrl: imageUrl,
                                previewImageUrl: mockupImageUrl, // Save the complete mockup
                                price: price,
                                designPosition: {
                                    x: designPosition.x,
                                    y: designPosition.y,
                                    scale: designPosition.scale,
                                    rotation: designPosition.rotation,
                                    fade: designPosition.fade,
                                    transparency: designPosition.transparency
                                },
                                addedAt: new Date().toISOString()
                            });
                            
                            saveCart();
                            updateCartBadge();
                            
                            // Show satisfying animation before confirmation message
                            showAddToCartAnimation(mockupImageUrl);
                        } catch (err) {
                            console.error('Error creating design mockup:', err);
                            // Fallback: just use the t-shirt image without the design
                            const folderName = getStyleFolder(style);
                            const fallbackMockupUrl = `./apparel/${folderName}/${folderName}_${color}.png`;
                            console.log("Using fallback mockup:", fallbackMockupUrl);
                            
                            cart.push({
                                id: cartItemId,
                                style: style,
                                size: size,
                                color: color,
                                imageUrl: imageUrl,
                                previewImageUrl: fallbackMockupUrl,
                                price: price,
                                designPosition: designPosition,
                                addedAt: new Date().toISOString()
                            });
                            
                            saveCart();
                            updateCartBadge();
                            showToast('Added custom T-shirt to cart!');
                        }
                    };
                    
                    // Get the current t-shirt base image
                    const tshirtStyle = document.getElementById('tshirtStyle').value;
                    const tshirtColor = document.getElementById('tshirtColor').value;
                    
                    // Use the appropriate t-shirt base image with correct style and color mappings
                    const folderName = getStyleFolder(style);
                    const mockupBaseSrc = `./apparel/${folderName}/${folderName}_${color}.png`;
                    
                    console.log("Loading base image from:", mockupBaseSrc);
                    
                    // Fallback in case the exact mockup isn't available
                    baseImg.onerror = function() {
                        console.warn("Error loading specific mockup, falling back to default");
                        baseImg.src = './apparel/tshirt/tshirt_black.png';
                        
                        // Second fallback to a simple colored rectangle if the image still fails
                        baseImg.onerror = function() {
                            // Only proceed if item hasn't been added yet
                            if (itemAdded) return;
                            
                            // Simply proceed with design on a colored background
                            mockupCtx.fillStyle = color === 'black' ? '#000000' : color === 'white' ? '#f8f8f8' : '#000000';
                            mockupCtx.fillRect(0, 0, mockupCanvas.width, mockupCanvas.height);
                            
                            // Continue with the design overlay
                            applyDesignAndAddToCart(mockupCtx, img, designX, designY, designPosition);
                        };
                    };
                    baseImg.src = mockupBaseSrc;
                    
                } catch (err) {
                    console.error('Error creating mockup:', err);
                    // Fallback: still add to cart but without the mockup
                    if (!itemAdded) {
                        addToCartWithoutMockup();
                    }
                }
            };
            
            img.onerror = function() {
                console.error('Error loading design image');
                // Instead of just showing an error, fallback to a simple version
                if (!itemAdded) {
                    addToCartWithoutMockup();
                }
            };
            
            img.src = imageUrl;
        } else {
            // For cross-origin images that might fail, use a simpler approach
            // Just add to cart without trying to create a complex mockup
            if (!itemAdded) {
                addToCartWithoutMockup();
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error in addCustomToCart:', error);
        showToast('Something went wrong. Please try again.');
        return false;
    }
    
    // Helper function to add the item to cart without mockup image
    function addToCartWithoutMockup() {
        // Prevent duplicate additions
        if (itemAdded) return;
        itemAdded = true;
        
        try {
            // Use the appropriate t-shirt base image with correct style
            const folderName = getStyleFolder(style);
            const mockupImageUrl = `./apparel/${folderName}/${folderName}_${color}.png`;
            console.log("Using direct mockup in fallback:", mockupImageUrl);
            
            // Add the item to cart
            cart.push({
                id: cartItemId,
                style: style,
                size: size,
                color: color,
                imageUrl: imageUrl,
                previewImageUrl: mockupImageUrl, // Use direct path to mockup
                price: price,
                designPosition: designPosition,
                addedAt: new Date().toISOString()
            });
            
            saveCart();
            updateCartBadge();
            showToast('Added custom T-shirt to cart!');
            
        } catch (error) {
            console.error('Error adding to cart:', error);
            // Ultimate fallback - just use the same image for both
            cart.push({
                id: cartItemId,
                style: style,
                size: size,
                color: color,
                imageUrl: imageUrl,
                previewImageUrl: imageUrl, // Fallback to using the same image
                price: price,
                designPosition: designPosition,
                addedAt: new Date().toISOString()
            });
            
            saveCart();
            updateCartBadge();
            showToast('Added custom T-shirt to cart!');
        }
    }
    
    // Helper function to apply design and add to cart
    function applyDesignAndAddToCart(ctx, img, x, y, designPos) {
        try {
            // Prevent duplicate additions
            if (itemAdded) return;
            itemAdded = true;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(designPos.rotation * Math.PI / 180);
            ctx.scale(designPos.scale / 100, designPos.scale / 100);
            ctx.globalAlpha = designPos.transparency / 100;
            
            // Calculate dimensions to center the design
            const dWidth = img.width;
            const dHeight = img.height;
            ctx.drawImage(img, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
            
            ctx.restore();
            
            // Convert to dataURL to save the mockup
            const mockupImageUrl = ctx.canvas.toDataURL('image/png');
            
            // Add the item to the cart
            cart.push({
                id: cartItemId,
                style: style,
                size: size,
                color: color,
                imageUrl: imageUrl,
                previewImageUrl: mockupImageUrl,
                price: price,
                designPosition: {
                    x: designPos.x,
                    y: designPos.y,
                    scale: designPos.scale,
                    rotation: designPos.rotation,
                    fade: designPos.fade,
                    transparency: designPos.transparency
                },
                addedAt: new Date().toISOString()
            });
            
            saveCart();
            updateCartBadge();
            showAddToCartAnimation(mockupImageUrl);
        } catch (err) {
            console.error('Error in applyDesignAndAddToCart:', err);
            addToCartWithoutMockup();
        }
    }
}

// Add custom T-shirt to cart button click handler
function setupAddToCartButton() {
    const addCustomToCartBtn = document.getElementById('addCustomToCart');
    if (!addCustomToCartBtn) return;
    
    // Add a click animation to the button
    addCustomToCartBtn.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.95)';
    });
    
    addCustomToCartBtn.addEventListener('mouseup', function() {
        this.style.transform = 'scale(1)';
    });
    
    addCustomToCartBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    // Handle the actual add to cart functionality
    addCustomToCartBtn.addEventListener('click', function() {
        try {
            // Show loading state on button
            const originalButtonText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
            this.disabled = true;
            
            // Get current values
            const style = document.getElementById('tshirtStyle')?.value || 'regular';
            const size = document.getElementById('tshirtSize')?.value || 'M';
            const color = document.getElementById('tshirtColor')?.value || 'black';
            const tshirtPreview = document.getElementById('tshirtPreview');
            
            if (!tshirtPreview) {
                throw new Error('T-shirt preview element not found');
            }
            
            // Make sure an image is uploaded
            if (tshirtPreview.src.includes('Upload+Your+Image') || 
                tshirtPreview.src.includes('placehold.co') || 
                !tshirtPreview.src) {
                showToast('Please upload an image or select one from your generated images!', 'error');
                this.innerHTML = originalButtonText;
                this.disabled = false;
                return;
            }
            
            // Get design position from tshirt preview element attributes
            // Use default values if attributes are not present
            const designPosition = {
                x: parseInt(tshirtPreview.getAttribute('data-x') || '0'),
                y: parseInt(tshirtPreview.getAttribute('data-y') || '0'),
                scale: parseInt(tshirtPreview.getAttribute('data-scale') || '100'),
                rotation: parseInt(tshirtPreview.getAttribute('data-rotation') || '0'),
                fade: parseInt(tshirtPreview.getAttribute('data-fade') || '50'),
                transparency: parseInt(tshirtPreview.getAttribute('data-transparency') || '85')
            };
            
            // Calculate price based on style
            let price = 29.99;
            if (style === 'longsleeve') {
                price += 5;
            } else if (style === 'croptop') {
                price += 2;
            }
            
            // Add to cart with animation
            const success = addCustomToCart(style, size, color, tshirtPreview.src, price, designPosition);
            
            // Reset button state after a short delay regardless of outcome
            setTimeout(() => {
                this.innerHTML = originalButtonText;
                this.disabled = false;
                
                // If successful, show a feedback toast if not already shown by addCustomToCart
                if (success) {
                    // Focus the cart icon or button to draw attention to it
                    const cartIcon = document.querySelector('.cart-icon') || document.getElementById('viewCartBtn');
                    if (cartIcon) {
                        cartIcon.classList.add('pulse-animation');
                        setTimeout(() => cartIcon.classList.remove('pulse-animation'), 2000);
                    }
                }
            }, success ? 2000 : 500);
            
        } catch (error) {
            console.error('Error in add to cart button handler:', error);
            this.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart - $29.99';
            this.disabled = false;
            showToast('There was an error adding to cart. Please try again.', 'error');
        }
    });
}

// Show an animation when an item is added to cart
function showAddToCartAnimation(imageUrl) {
    // Create a floating image that animates to the cart
    const floatingImage = document.createElement('div');
    floatingImage.className = 'floating-cart-image';
    floatingImage.innerHTML = `<img src="${imageUrl}" alt="Added to cart">`;
    document.body.appendChild(floatingImage);
    
    // Get positions for animation
    const previewImage = document.querySelector('.tshirt-preview-container');
    const cartIcon = document.querySelector('.cart-icon') || document.querySelector('.view-cart-btn');
    
    if (!previewImage || !cartIcon) {
        floatingImage.remove();
        return;
    }
    
    const previewRect = previewImage.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();
    
    // Set starting position
    floatingImage.style.top = `${previewRect.top + previewRect.height/2}px`;
    floatingImage.style.left = `${previewRect.left + previewRect.width/2}px`;
    
    // Apply initial styles
    floatingImage.style.opacity = '1';
    floatingImage.style.transform = 'translate(-50%, -50%) scale(1)';
    
    // Create keyframes for the animation
    const keyframes = [
        { // Starting position
            top: `${previewRect.top + previewRect.height/2}px`,
            left: `${previewRect.left + previewRect.width/2}px`,
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)',
            offset: 0
        },
        { // Midpoint - go up slightly
            top: `${previewRect.top + previewRect.height/2 - 50}px`,
            left: `${previewRect.left + previewRect.width/2 + 50}px`,
            opacity: 0.8,
            transform: 'translate(-50%, -50%) scale(0.8)',
            offset: 0.4
        },
        { // End position - at cart icon
            top: `${cartRect.top + cartRect.height/2}px`,
            left: `${cartRect.left + cartRect.width/2}px`,
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.2)',
            offset: 1
        }
    ];
    
    // Configure the animation
    const options = {
        duration: 800,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
    };
    
    // Start the animation
    floatingImage.animate(keyframes, options);
    
    // Add animation styles if not already present
    if (!document.getElementById('cartAnimationStyles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'cartAnimationStyles';
        styleEl.textContent = `
            .floating-cart-image {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                width: 80px;
                height: 80px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .floating-cart-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            /* Cart icon pulse animation */
            @keyframes cartPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1); }
            }
            
            .cart-pulse {
                animation: cartPulse 0.5s ease-in-out;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Remove the element after animation completes
    setTimeout(() => {
        floatingImage.remove();
        
        // Add pulse animation to cart icon
        cartIcon.classList.add('cart-pulse');
        setTimeout(() => {
            cartIcon.classList.remove('cart-pulse');
        }, 500);
    }, 800);
    
    // Show success toast
    showToast('Item added to cart!', 'success');
}

// Show toast notification with improved styling and animations
function showToast(message, type = 'info') {
    // Remove any existing toasts to prevent stacking
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => {
        document.body.removeChild(toast);
    });
    
    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    // Determine icon based on type
    let icon;
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Set toast content with icon
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add toast styles if not already added
    if (!document.getElementById('toastStyles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'toastStyles';
        styleEl.textContent = `
            .toast-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 16px;
                background-color: white;
                color: var(--text);
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 280px;
                max-width: 400px;
                z-index: 9999;
                animation: slideInRight 0.3s, fadeIn 0.3s;
                border-left: 4px solid var(--primary);
                transform-origin: bottom right;
            }
            
            @media (max-width: 576px) {
                .toast-notification {
                    min-width: calc(100% - 40px);
                    bottom: 70px;
                }
            }
            
            .toast-icon {
                margin-right: 12px;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .toast-message {
                flex: 1;
                font-weight: 500;
            }
            
            .toast-close {
                background: transparent;
                border: none;
                color: var(--text-light);
                cursor: pointer;
                padding: 4px;
                margin-left: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-size: 0.8rem;
                transition: background-color 0.2s, color 0.2s;
            }
            
            .toast-close:hover {
                background-color: rgba(0, 0, 0, 0.05);
                color: var(--text);
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            
            /* Toast types */
            .toast-success {
                border-left-color: #28a745;
            }
            
            .toast-success .toast-icon {
                color: #28a745;
            }
            
            .toast-error {
                border-left-color: #dc3545;
            }
            
            .toast-error .toast-icon {
                color: #dc3545;
            }
            
            .toast-warning {
                border-left-color: #ffc107;
            }
            
            .toast-warning .toast-icon {
                color: #ffc107;
            }
            
            .toast-info {
                border-left-color: var(--primary);
            }
            
            .toast-info .toast-icon {
                color: var(--primary);
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Add to document
    document.body.appendChild(toast);
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        });
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 3000);
}

// Remove item from cart
function removeFromCart(cartItemId) {
    // Find the item in the cart
    const itemIndex = cart.findIndex(item => item.id === cartItemId);
    
    if (itemIndex !== -1) {
        // Get the item to show in toast
        const item = cart[itemIndex];
        
        // Remove the item from the cart
        cart.splice(itemIndex, 1);
        
        // Save the updated cart to localStorage
        saveCart();
        
        // Update cart badge
        updateCartBadge();
        
        // Re-render cart items
        renderCartItems();
        
        // Show confirmation message
        showToast('Item removed from cart!');
        
        // If cart is now empty and modal is open, update display
        if (cart.length === 0) {
            const cartModal = document.getElementById('cartModal');
            if (cartModal && cartModal.style.display === 'flex') {
                renderCartItems(); // This will show the empty cart message
            }
        }
    }
}

// Save cart to local storage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart badge with current count
function updateCartBadge() {
    // Find both cart badges (floating and header)
    const cartBadge = document.getElementById('cartBadge');
    const headerCartBadge = document.getElementById('headerCartBadge');
    
    if (cartBadge) {
        // Update floating cart badge
        cartBadge.textContent = cart.length;
        cartBadge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
    
    if (headerCartBadge) {
        // Update header cart badge
        headerCartBadge.textContent = cart.length;
        headerCartBadge.style.display = cart.length > 0 ? 'flex' : 'none';
    }
}

// Render cart items in the modal with enhanced visual presentation
function renderCartItems() {
    const cartItemsElement = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const cartSubtotalElement = document.getElementById('cartSubtotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const paypalButtonContainer = document.getElementById('paypalButtonContainer');
    
    if (!cartItemsElement || !cartTotalElement) return;
    
    if (cart.length === 0) {
        cartItemsElement.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-bag"></i>
                <p>Your cart is empty</p>
                <p class="empty-cart-subtext">Add some custom merchandise to get started!</p>
                <button class="btn btn-primary" onclick="document.getElementById('cartModal').style.display='none'">
                    Continue Shopping
                </button>
            </div>
        `;
        cartTotalElement.textContent = '$0.00';
        if (cartSubtotalElement) cartSubtotalElement.textContent = '$0.00';
        
        // Disable checkout button if it exists
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('disabled');
        }
        
        // Hide PayPal button container if empty cart
        if (paypalButtonContainer) {
            paypalButtonContainer.style.display = 'none';
        }
        
        return;
    }
    
    // Enable checkout button if it exists
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('disabled');
    }
    
    // Show PayPal button container if cart has items
    if (paypalButtonContainer) {
        paypalButtonContainer.style.display = 'block';
        
        // Check if PayPal button needs to be initialized
        // Only initialize if the container is empty or shows an error
        const needsInitialization = 
            paypalButtonContainer.children.length === 0 || 
            paypalButtonContainer.innerHTML.includes('fa-exclamation-triangle') ||
            !paypalButtonContainer.querySelector('.paypal-button');
            
        if (needsInitialization) {
            initializePayPalButton();
        }
    }
    
    let totalPrice = 0;
    let cartHtml = '';
    
    // Add a cart header with column labels
    cartHtml += `
        <div class="cart-items-header">
            <span class="item-count">${cart.length} item${cart.length > 1 ? 's' : ''} in your cart</span>
            <div class="cart-header-actions">
                <button class="btn-link" onclick="clearCart()">
                    <i class="fas fa-trash-alt"></i> Clear all
                </button>
            </div>
        </div>
    `;
    
    // Sort cart items by most recently added
    const sortedCart = [...cart].sort((a, b) => {
        return new Date(b.addedAt || 0) - new Date(a.addedAt || 0);
    });
    
    sortedCart.forEach(item => {
        // Add the item's price to the total
        totalPrice += parseFloat(item.price);
        
        // Format the item details
        const style = formatStyle(item.style);
        const designDetails = item.designPosition ? 
            `Scale: ${item.designPosition.scale}%, Rotation: ${item.designPosition.rotation}°` : '';
        
        // Get folder name for this item's style
        const folderName = getStyleFolder(item.style);
        const fallbackSrc = `./apparel/${folderName}/${folderName}_${item.color || 'black'}.png`;
        
        cartHtml += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.previewImageUrl || item.imageUrl}" alt="${style} design" 
                         loading="lazy" onerror="this.onerror=null; this.src='${fallbackSrc}';">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">Custom ${style} T-shirt</div>
                    <div class="cart-item-variant">
                        <span class="variant-label">Size:</span> <span class="variant-value">${item.size}</span>
                        <span class="variant-separator">•</span>
                        <span class="variant-label">Color:</span> <span class="variant-value">${item.color}</span>
                    </div>
                    <div class="cart-item-customization" title="${designDetails}">
                        <i class="fas fa-paint-brush" style="margin-right: 5px;"></i> Custom Design
                    </div>
                    <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)}</div>
                    <button class="cart-item-remove" onclick="removeFromCartWithAnimation('${item.id}')">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </div>
            </div>
        `;
    });
    
    // Add CSS for cart items header
    cartHtml = `
        <style>
            .cart-items-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.25rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid var(--border);
            }
            
            .item-count {
                font-weight: 600;
                color: var(--primary);
            }
            
            .btn-link {
                background: none;
                border: none;
                color: var(--text-light);
                cursor: pointer;
                padding: 0.4rem 0.8rem;
                font-size: 0.9rem;
                transition: all 0.2s;
                border-radius: 6px;
            }
            
            .btn-link:hover {
                background-color: rgba(0,0,0,0.05);
                color: #e53935;
            }
            
            .paypal-error {
                text-align: center;
                padding: 1.25rem;
                background-color: #fff8f8;
                border-radius: 8px;
                border: 1px solid rgba(229, 57, 53, 0.2);
                margin-top: 1rem;
            }
            
            .paypal-error i {
                font-size: 1.5rem;
                color: #e53935;
                margin-bottom: 0.75rem;
            }
            
            .paypal-error p {
                margin-bottom: 1rem;
                color: #555;
                font-weight: 500;
            }
            
            .retry-btn {
                margin-bottom: 0.5rem;
            }
        </style>
    ` + cartHtml;
    
    cartItemsElement.innerHTML = cartHtml;
    cartTotalElement.textContent = `$${totalPrice.toFixed(2)}`;
    if (cartSubtotalElement) cartSubtotalElement.textContent = `$${totalPrice.toFixed(2)}`;
}

// Remove an item from cart with animation
function removeFromCartWithAnimation(cartItemId) {
    // Find the cart item element
    const cartItemElement = document.querySelector(`.cart-item[data-id="${cartItemId}"]`);
    
    if (cartItemElement) {
        // Add the removing class for animation
        cartItemElement.classList.add('removing-item');
        
        // After animation completes, remove the item from the cart
        setTimeout(() => {
            // Remove the item from the cart array
            cart = cart.filter(item => item.id !== cartItemId);
            
            // Save updated cart to localStorage
            saveCart();
            
            // Update cart badge
            updateCartBadge();
            
            // Re-render cart items
            renderCartItems();
            
            // Show toast notification
            showToast('Item removed from cart', 'info');
        }, 300); // Match this to your CSS transition time
    } else {
        // If element not found, remove directly
        removeFromCart(cartItemId);
    }
}

// Format style names for display
function formatStyle(style) {
    switch (style) {
        case 'regular': return 'Regular';
        case 'croptop': return 'Crop Top';
        case 'longsleeve': return 'Long Sleeve';
        case 'vneck': return 'V-Neck';
        default: return style;
    }
}

// Custom T-shirt designer functionality
function initCustomTshirt() {
    const imageUpload = document.getElementById('imageUpload');
    const previewImg = document.getElementById('previewImg');
    const tshirtPreview = document.getElementById('tshirtPreview');
    const uploadedImagePreview = document.getElementById('uploadedImagePreview');
    const addCustomToCartBtn = document.getElementById('addCustomToCart');
    const generatedImagesSelect = document.getElementById('generatedImagesSelect');
    const tshirtColorSelect = document.getElementById('tshirtColor');
    const tshirtStyleSelect = document.getElementById('tshirtStyle');
    const tshirtSizeSelect = document.getElementById('tshirtSize');
    const tshirtBase = document.getElementById('tshirtBase');
    const previewBtn = document.getElementById('previewCustomBtn');
    const viewCartBtn = document.getElementById('viewCartBtn');
    
    // Design positioning elements
    const moveUpBtn = document.getElementById('moveUp');
    const moveDownBtn = document.getElementById('moveDown');
    const moveLeftBtn = document.getElementById('moveLeft');
    const moveRightBtn = document.getElementById('moveRight');
    const scaleSlider = document.getElementById('scaleSlider');
    const rotateSlider = document.getElementById('rotateSlider');
    const scaleValue = document.getElementById('scaleValue');
    const rotateValue = document.getElementById('rotateValue');
    const resetPositionBtn = document.getElementById('resetPosition');
    const fadeSlider = document.getElementById('fadeSlider');
    const transparencySlider = document.getElementById('transparencySlider');
    const fadeValue = document.getElementById('fadeValue');
    const transparencyValue = document.getElementById('transparencyValue');
    
    // Design position state
    const designPosition = {
        x: 0, // horizontal offset in pixels
        y: 0, // vertical offset in pixels
        scale: 100, // percentage
        rotation: 0, // degrees
        fade: 50, // fade radius percentage (0-100)
        transparency: 85 // opacity percentage (10-100)
    };
    
    // Make sure we're on the merch page
    if (!imageUpload || !previewImg || !tshirtPreview) {
        return;
    }
    
    // Link the view cart button to open the cart modal
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', function() {
            document.getElementById('cartModal').style.display = 'flex';
            renderCartItems();
        });
    }
    
    // Handle file upload
    imageUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageUrl = e.target.result;
                
                // Process the image for better display on shirts
                processImageForShirt(imageUrl, function(processedUrl) {
                    // Update preview with the processed image
                    document.getElementById('tshirtPreview').src = processedUrl;
                    document.getElementById('previewImg').src = processedUrl;
                    document.getElementById('uploadedImagePreview').style.display = 'block';
                    
                    // Also store for future use
                    document.getElementById('currentDesignImage').value = processedUrl;
                    
                    // Update the preview
                    updatePreview();
                });
            };
            
            reader.onerror = function() {
                alert('Error loading image. Please try another file.');
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // Try to load generated images from localStorage if available
    loadGeneratedImages();
    
    // Handle generated image selection
    generatedImagesSelect.addEventListener('change', function() {
        const selectedImageUrl = this.value;
        if (selectedImageUrl) {
            // Load the image with error handling
            const tempImg = new Image();
            tempImg.onload = function() {
                tshirtPreview.src = selectedImageUrl;
                previewImg.src = selectedImageUrl;
                uploadedImagePreview.style.display = 'block';
                updatePreview();
            };
            tempImg.onerror = function() {
                alert('Error loading the selected image. It may no longer be available.');
                generatedImagesSelect.value = '';
            };
            tempImg.src = selectedImageUrl;
        }
    });
    
    // Handle style changes for preview
    tshirtStyleSelect.addEventListener('change', function() {
        updateTshirtStyle(this.value);
        updatePreview();
    });
    
    // Handle color changes
    if (tshirtColorSelect && tshirtBase) {
        tshirtColorSelect.addEventListener('change', handleTshirtColorChange);
        
        // Set initial color
        const initialColor = tshirtColorSelect.value;
        updateTshirtColor(initialColor);
        updatePreview();
    }
    
    // Handle size changes for preview
    tshirtSizeSelect.addEventListener('change', updatePreview);
    
    // Set initial style
    updateTshirtStyle(tshirtStyleSelect.value);
    
    // Preview button functionality
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            // Show a toast message instead of full preview
            showToast("Design preview updated!");
            
            // Refresh the current preview display
            updatePreview();
        });
    }
    
    // Design positioning functionality
    
    // Move design up
    moveUpBtn.addEventListener('click', function() {
        designPosition.y -= 5; // Move up 5px
        applyDesignPosition();
    });
    
    // Move design down
    moveDownBtn.addEventListener('click', function() {
        designPosition.y += 5; // Move down 5px
        applyDesignPosition();
    });
    
    // Move design left
    moveLeftBtn.addEventListener('click', function() {
        designPosition.x -= 5; // Move left 5px
        applyDesignPosition();
    });
    
    // Move design right
    moveRightBtn.addEventListener('click', function() {
        designPosition.x += 5; // Move right 5px
        applyDesignPosition();
    });
    
    // Scale design
    scaleSlider.addEventListener('input', function() {
        designPosition.scale = parseInt(this.value);
        scaleValue.textContent = `${designPosition.scale}%`;
        applyDesignPosition();
    });
    
    // Rotate design
    rotateSlider.addEventListener('input', function() {
        designPosition.rotation = parseInt(this.value);
        rotateValue.textContent = `${designPosition.rotation}°`;
        applyDesignPosition();
    });
    
    // Fade effect control
    fadeSlider.addEventListener('input', function() {
        designPosition.fade = parseInt(this.value);
        fadeValue.textContent = `${designPosition.fade}%`;
        applyDesignPosition();
    });
    
    // Transparency control
    transparencySlider.addEventListener('input', function() {
        designPosition.transparency = parseInt(this.value);
        transparencyValue.textContent = `${designPosition.transparency}%`;
        applyDesignPosition();
    });
    
    // Reset position
    resetPositionBtn.addEventListener('click', function() {
        designPosition.x = 0;
        designPosition.y = 0;
        designPosition.scale = 100;
        designPosition.rotation = 0;
        designPosition.fade = 50;
        designPosition.transparency = 85;
        
        // Reset UI elements
        scaleSlider.value = 100;
        rotateSlider.value = 0;
        fadeSlider.value = 50;
        transparencySlider.value = 85;
        scaleValue.textContent = '100%';
        rotateValue.textContent = '0°';
        fadeValue.textContent = '50%';
        transparencyValue.textContent = '85%';
        
        applyDesignPosition();
    });
    
    // Apply current position, scale and rotation to the design
    function applyDesignPosition() {
        const tshirtPreview = document.getElementById('tshirtPreview');
        if (!tshirtPreview) return;
        
        // Apply transforms to position the design
        tshirtPreview.style.transform = `translateX(calc(-50% + ${designPosition.x}px)) translateY(${designPosition.y}px) rotate(${designPosition.rotation}deg) scale(${designPosition.scale / 100})`;
        
        // Apply opacity (transparency)
        tshirtPreview.style.opacity = designPosition.transparency / 100;
        
        // Apply simple fade effect that adjusts edge opacity
        // The fade value determines how much the edges fade out
        const fadeLevel = designPosition.fade / 100; // Convert to decimal
        
        // Calculate gradient stops based on fade value
        // Higher fade level = more aggressive edge fading
        const solidCenter = 85 - (fadeLevel * 60); // Larger solid area, but more aggressive fade with higher value
        
        // Create a simple, sharp gradient for a clean edge fade
        const fadeGradient = `radial-gradient(
            ellipse at center,
            black ${solidCenter}%, 
            rgba(0,0,0,0.7) ${solidCenter + 5}%,
            rgba(0,0,0,0.3) ${solidCenter + 10}%, 
            transparent ${solidCenter + 15}%
        )`;
        
        // Apply the gradient mask
        tshirtPreview.style.maskImage = fadeGradient;
        tshirtPreview.style.webkitMaskImage = fadeGradient;
        
        // No additional blur filters for edge fading, just basic image enhancements
        tshirtPreview.style.filter = 'brightness(1.05) contrast(1.1)';
        
        // Store the current position in data attributes for reference
        if (!tshirtPreview.classList.contains('design-position')) {
            tshirtPreview.classList.add('design-position');
        }
        
        // Set data attributes to store position values
        tshirtPreview.setAttribute('data-x', designPosition.x);
        tshirtPreview.setAttribute('data-y', designPosition.y);
        tshirtPreview.setAttribute('data-scale', designPosition.scale);
        tshirtPreview.setAttribute('data-rotation', designPosition.rotation);
        tshirtPreview.setAttribute('data-fade', designPosition.fade);
        tshirtPreview.setAttribute('data-transparency', designPosition.transparency);
    }
    
    // Add custom T-shirt to cart
    // NOTE: Click handler for the Add to Cart button is now set up in the setupAddToCartButton function
    // to prevent duplicate event handlers and multiple cart additions.
    
    // Set the initial design position
    applyDesignPosition();
    
    // Update the initial preview
    updatePreview();
    
    // Make sure background is set correctly at initialization
    const initialShirtColor = tshirtColorSelect ? tshirtColorSelect.value : 'black';
    const shirtDisplayContainer = document.querySelector('.shirt-display-container');
    if (shirtDisplayContainer && initialShirtColor === 'white') {
        shirtDisplayContainer.style.backgroundColor = '#000000';
    }
}

// Update the preview in real-time
function updatePreview() {
    const tshirtPreview = document.getElementById('tshirtPreview');
    const tshirtStyle = document.getElementById('tshirtStyle').value;
    const tshirtColor = document.getElementById('tshirtColor').value;
    const tshirtSize = document.getElementById('tshirtSize').value;
    const shirtDisplayContainer = document.querySelector('.shirt-display-container');
    
    if (!tshirtPreview) return;
    
    // Get design position for current style
    const designPosition = getDesignPosition(tshirtStyle);
    
    // Reset all styles first to avoid inheritance issues
    tshirtPreview.style.boxShadow = 'none';
    tshirtPreview.style.borderRadius = '0';
    tshirtPreview.style.filter = 'none';
    tshirtPreview.style.maskImage = 'none';
    tshirtPreview.style.webkitMaskImage = 'none';
    tshirtPreview.style.backgroundClip = 'none';
    
    // Get current fade value or use default
    const fadeSlider = document.getElementById('fadeSlider');
    const fadeLevel = fadeSlider ? (parseInt(fadeSlider.value) / 100) : 0.5;
    
    // Calculate solid center area based on fade level
    const solidCenter = 85 - (fadeLevel * 60);
    
    // Create a simple radial gradient that fades out at the edges
    const fadeGradient = `radial-gradient(
        ellipse at center,
        black ${solidCenter}%, 
        rgba(0,0,0,0.7) ${solidCenter + 5}%,
        rgba(0,0,0,0.3) ${solidCenter + 10}%, 
        transparent ${solidCenter + 15}%
    )`;
    
    tshirtPreview.style.maskImage = fadeGradient;
    tshirtPreview.style.webkitMaskImage = fadeGradient;
    
    if (tshirtColor === 'white') {
        // For white shirts - set background to black for better contrast with the multiply blend mode
        if (shirtDisplayContainer) {
            shirtDisplayContainer.style.backgroundColor = '#000000';
        }
        tshirtPreview.style.filter = 'brightness(1.05) contrast(1.2)';
        tshirtPreview.style.opacity = '0.9';
        // Use multiply blend mode for white shirts
        tshirtPreview.style.mixBlendMode = 'multiply';
    } else {
        // For black/dark shirts
        if (shirtDisplayContainer) {
            shirtDisplayContainer.style.backgroundColor = ''; // Reset to default
        }
        tshirtPreview.style.filter = 'brightness(1.05) contrast(1.1)';
        tshirtPreview.style.opacity = '0.85';
        // Keep screen blending for dark backgrounds
        tshirtPreview.style.mixBlendMode = 'screen';
    }
    
    // Set position based on style
    tshirtPreview.style.top = designPosition.top;
    tshirtPreview.style.width = designPosition.width;
    
    // Update the price based on style and size
    updatePrice();
}

// Function to calculate and update the price
function updatePrice() {
    const priceElement = document.getElementById('customPrice');
    if (!priceElement) return;
    
    const style = document.getElementById('tshirtStyle').value;
    const size = document.getElementById('tshirtSize').value;
    
    // Base price
    let price = 19.99;
    
    // Add for different styles
    if (style === 'longsleeve') {
        price += 5;
    } else if (style === 'croptop' || style === 'vneck') {
        price += 2;
    }
    
    // Add for larger sizes
    if (size === 'xl') {
        price += 2;
    } else if (size === 'xxl') {
        price += 4;
    }
    
    // Update the price display
    priceElement.textContent = `$${price.toFixed(2)}`;
    
    // Store current price for cart
    document.getElementById('currentItemPrice').value = price.toFixed(2);
}

// Update the T-shirt style preview
function updateTshirtStyle(style) {
    const tshirtBase = document.getElementById('tshirtBase');
    const tshirtPreview = document.getElementById('tshirtPreview');
    if (!tshirtBase || !tshirtPreview) return;
    
    // Get the current color to determine which image to use
    const color = document.getElementById('tshirtColor').value;
    
    // Use existing PNG files from apparel subdirectories
    const styleImages = {
        'regular': `apparel/tshirt/tshirt_${color}.png`,
        'croptop': `apparel/croptop/croptop_${color}.png`,
        'longsleeve': `apparel/longsleeve/longsleeve_${color}.png`,
        'vneck': `apparel/vneck/vneck_${color}.png`
    };
    
    // Get the style image URL
    const styleUrl = styleImages[style] || styleImages.regular;
    
    // Update the background image
    tshirtBase.style.backgroundImage = `url('${styleUrl}')`;
    
    // Log which image we're using
    console.log("Using t-shirt style:", style, "with image:", styleUrl);
    
    // Adjust design positioning based on style
    const designPosition = getDesignPosition(style);
    tshirtPreview.style.top = designPosition.top;
    tshirtPreview.style.width = designPosition.width;
    
    // Apply current color to match the style
    updateTshirtColor(color);
}

// Update the T-shirt canvas background color
function updateTshirtColor(color) {
    const tshirtBase = document.getElementById('tshirtBase');
    if (!tshirtBase) return;
    
    // Get the current style
    const style = document.getElementById('tshirtStyle').value;
    
    // Use the appropriate colored image based on selection
    const styleImages = {
        'regular': `apparel/tshirt/tshirt_${color}.png`,
        'croptop': `apparel/croptop/croptop_${color}.png`,
        'longsleeve': `apparel/longsleeve/longsleeve_${color}.png`,
        'vneck': `apparel/vneck/vneck_${color}.png`
    };
    
    const styleUrl = styleImages[style] || styleImages.regular;
    
    // Update the background image
    tshirtBase.style.backgroundImage = `url('${styleUrl}')`;
    
    // Adjust design contrast for dark backgrounds
    const tshirtImage = document.getElementById('tshirtPreview');
    
    // Update shirt display container background based on shirt color
    const shirtDisplayContainer = document.querySelector('.shirt-display-container');
    if (shirtDisplayContainer) {
        if (color === 'white') {
            // Set black background for white shirts
            shirtDisplayContainer.style.backgroundColor = '#000000';
        } else {
            // Reset to default background for other colors
            shirtDisplayContainer.style.backgroundColor = '';
        }
    }
    
    if (tshirtImage) {
        if (color === 'white') {
            tshirtImage.style.filter = 'brightness(1.05) contrast(1.2)';
        } else {
            // Add a subtle glow for dark backgrounds to make the image pop
            tshirtImage.style.filter = 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))';
        }
    }
}

// Get the position for design based on shirt style
function getDesignPosition(style) {
    switch (style) {
        case 'croptop':
            return { top: '20%', width: '35%' };
        case 'longsleeve':
            return { top: '25%', width: '40%' };
        case 'vneck':
            return { top: '22%', width: '38%' };
        default: // regular
            return { top: '25%', width: '40%' };
    }
}

// Helper function to map style value to folder name
function getStyleFolder(style) {
    // Map style values to folder names
    const styleMap = {
        'regular': 'tshirt',
        'tshirt': 'tshirt',
        'croptop': 'croptop',
        'longsleeve': 'longsleeve',
        'vneck': 'vneck'
    };
    return styleMap[style] || 'tshirt';
}

// Get hex code for color name
function getColorHex(color) {
    const colorMap = {
        'white': '#ffffff',
        'black': '#000000'
    };
    
    return colorMap[color] || color;
}

// Function to save generated image to localStorage for use in merchandise
function saveGeneratedImageForMerch(imageUrl, entityName = '') {
    // Get existing saved images or create a new array
    let savedImages = JSON.parse(localStorage.getItem('generatedImages')) || [];
    
    // Check if this image is already saved
    const isDuplicate = savedImages.some(image => image.url === imageUrl);
    
    if (!isDuplicate) {
        // Add the new image URL with name if available
        savedImages.push({
            url: imageUrl,
            date: new Date().toISOString(),
            name: entityName || ''
        });
        
        // Only keep the last 20 images to prevent localStorage from getting too large
        if (savedImages.length > 20) {
            savedImages = savedImages.slice(savedImages.length - 20);
        }
        
        // Save back to localStorage
        localStorage.setItem('generatedImages', JSON.stringify(savedImages));
        console.log('Image saved for merchandise use');
    }
}

// Load generated images from localStorage
function loadGeneratedImages() {
    const generatedImagesSelect = document.getElementById('generatedImagesSelect');
    if (!generatedImagesSelect) return;
    
    // Clear existing options
    while (generatedImagesSelect.options.length > 1) {
        generatedImagesSelect.remove(1);
    }
    
    const generatedImages = JSON.parse(localStorage.getItem('generatedImages')) || [];
    
    if (generatedImages.length > 0) {
        // Add options for each generated image
        generatedImages.forEach((image, index) => {
            const option = document.createElement('option');
            option.value = image.url;
            
            // Use the saved name if available, otherwise use generic name
            const displayName = image.name ? image.name : `Generated Image ${index + 1}`;
            option.textContent = displayName;
            
            generatedImagesSelect.appendChild(option);
        });
        
        // Check if we have a current image from the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const imageParam = urlParams.get('image');
        
        if (imageParam) {
            // Try to find the image in the generated images
            const matchingOption = Array.from(generatedImagesSelect.options).find(option => 
                option.value === decodeURIComponent(imageParam)
            );
            
            if (matchingOption) {
                // Select the matching image
                generatedImagesSelect.value = matchingOption.value;
                
                // Trigger the change event to update the preview
                const event = new Event('change');
                generatedImagesSelect.dispatchEvent(event);
            } else {
                // If we can't find the exact image, add it as a new option
                const option = document.createElement('option');
                option.value = decodeURIComponent(imageParam);
                option.textContent = 'Current Image';
                generatedImagesSelect.add(option, 1);
                generatedImagesSelect.value = option.value;
                
                // Save this image to localStorage so it's available next time
                saveGeneratedImageForMerch(decodeURIComponent(imageParam), 'Current Image');
                
                // Trigger the change event to update the preview
                const event = new Event('change');
                generatedImagesSelect.dispatchEvent(event);
            }
        }
    } else {
        // Add option to explain there are no images
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No generated images found';
        generatedImagesSelect.appendChild(option);
        
        // Check if we have a current image from the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const imageParam = urlParams.get('image');
        
        if (imageParam) {
            const option = document.createElement('option');
            option.value = decodeURIComponent(imageParam);
            option.textContent = 'Current Image';
            generatedImagesSelect.add(option, 1);
            generatedImagesSelect.value = option.value;
            
            // Save this image to localStorage so it's available next time
            saveGeneratedImageForMerch(decodeURIComponent(imageParam), 'Current Image');
            
            // Trigger the change event to update the preview
            const event = new Event('change');
            generatedImagesSelect.dispatchEvent(event);
        } else {
            // If no images found and no URL parameter, add a sample option
            const sampleOption = document.createElement('option');
            sampleOption.value = '';
            sampleOption.textContent = 'Generate an image first or upload an image';
            generatedImagesSelect.appendChild(sampleOption);
        }
    }
}

// Proceed to checkout
function proceedToCheckout() {
    // Create checkout modal
    const checkoutModal = document.createElement('div');
    checkoutModal.className = 'cart-modal';
    checkoutModal.style.display = 'flex';
    checkoutModal.id = 'checkoutModal';
    
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    checkoutModal.innerHTML = `
        <div class="cart-content" style="max-width: 800px; display: flex; flex-direction: column; height: 95vh; max-height: 700px;">
            <div class="cart-header" style="border-bottom: 1px solid var(--border);">
                <div class="cart-title" style="font-size: 1.4rem; color: var(--primary);">Secure Checkout</div>
                <button class="close-cart" id="closeCheckout">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                <!-- Main checkout container with two columns at desktop -->
                <div style="display: flex; flex-direction: row; flex-wrap: wrap; flex: 1; overflow: auto; padding: 1rem;">
                    <!-- Left column: Order summary -->
                    <div style="flex: 1; min-width: 280px; padding-right: 1rem; border-right: 1px solid var(--border);">
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
                                <i class="fas fa-shopping-cart" style="margin-right: 0.5rem;"></i> Order Summary
                            </h3>
                            
                            <div class="checkout-cart-items" style="max-height: 300px; overflow-y: auto; margin-bottom: 1rem;">
                                ${cart.map(item => `
                                    <div style="display: flex; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                                        <div style="width: 60px; height: 60px; border-radius: 4px; overflow: hidden; margin-right: 0.75rem;">
                                            <img src="${item.previewImageUrl || item.imageUrl}" alt="T-shirt preview" style="width: 100%; height: 100%; object-fit: cover;">
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; margin-bottom: 0.2rem;">Custom ${formatStyle(item.style)} T-shirt</div>
                                            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.2rem;">
                                                Size: ${item.size} · Color: ${item.color}
                                            </div>
                                            <div style="font-weight: 500; color: var(--primary);">$${parseFloat(item.price).toFixed(2)}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div style="background-color: var(--secondary); padding: 1rem; border-radius: 6px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span>Subtotal:</span>
                                    <span>$${total.toFixed(2)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span>Shipping:</span>
                                    <span>$0.00</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span>Tax:</span>
                                    <span>$0.00</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 1.1rem; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                                    <span>Total:</span>
                                    <span>$${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="background-color: var(--secondary); padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                            <h4 style="margin-top: 0; margin-bottom: 0.5rem; color: var(--primary); font-size: 0.9rem;">
                                <i class="fas fa-truck" style="margin-right: 0.5rem;"></i> Delivery Information
                            </h4>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-light);">
                                Your custom t-shirt will be printed and shipped within 3-5 business days.
                                Estimated delivery: 7-10 business days after shipping.
                            </p>
                        </div>
                        
                        <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                <div style="background-color: var(--card-bg); padding: 0.4rem 0.6rem; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                    <i class="fas fa-lock" style="color: var(--success); margin-right: 0.3rem;"></i>
                                    <span style="font-size: 0.8rem;">Secure Payment</span>
                                </div>
                                <div style="background-color: var(--card-bg); padding: 0.4rem 0.6rem; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                    <i class="fas fa-shield-alt" style="color: var(--success); margin-right: 0.3rem;"></i>
                                    <span style="font-size: 0.8rem;">Privacy Protected</span>
                                </div>
                                <div style="background-color: var(--card-bg); padding: 0.4rem 0.6rem; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                    <i class="fas fa-hand-holding-usd" style="color: var(--success); margin-right: 0.3rem;"></i>
                                    <span style="font-size: 0.8rem;">Money-back Guarantee</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right column: Payment options -->
                    <div style="flex: 1; min-width: 280px; padding-left: 1rem;">
                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
                                <i class="fas fa-credit-card" style="margin-right: 0.5rem;"></i> Payment Method
                            </h3>
                            
                            <div class="checkout-options" style="margin-bottom: 1.5rem; display: flex; gap: 1rem;">
                                <button id="creditCardOption" class="btn btn-secondary active" style="flex: 1; position: relative; padding: 1rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                    <i class="fas fa-credit-card" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i> 
                                    Credit Card
                                    <span style="font-size: 0.7rem; color: var(--primary); margin-top: 0.3rem;">Visa/Mastercard</span>
                                </button>
                                <button id="paypalOption" class="btn btn-secondary" style="flex: 1; padding: 1rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                    <i class="fab fa-paypal" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i> 
                                    PayPal
                                    <span style="font-size: 0.7rem; color: var(--text-light); margin-top: 0.3rem;">Fast & Secure</span>
                                </button>
                            </div>
                            
                            <div id="creditCardForm">
                                <form id="checkoutForm">
                                    <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                                        <div style="flex: 1; min-width: 180px;">
                                            <label for="name" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Full Name</label>
                                            <div style="position: relative;">
                                                <i class="fas fa-user" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                                                <input type="text" id="name" required style="width: 100%; padding: 0.7rem 0.7rem 0.7rem 2rem; border-radius: 4px; border: 1px solid var(--border); background-color: var(--card-bg); color: var(--text);">
                                            </div>
                                        </div>
                                        <div style="flex: 1; min-width: 180px;">
                                            <label for="email" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email Address</label>
                                            <div style="position: relative;">
                                                <i class="fas fa-envelope" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                                                <input type="email" id="email" required style="width: 100%; padding: 0.7rem 0.7rem 0.7rem 2rem; border-radius: 4px; border: 1px solid var(--border); background-color: var(--card-bg); color: var(--text);">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-bottom: 1.5rem;">
                                        <label for="address" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Shipping Address</label>
                                        <div style="position: relative;">
                                            <i class="fas fa-home" style="position: absolute; left: 10px; top: 15px; color: var(--text-light);"></i>
                                            <textarea id="address" required rows="3" style="width: 100%; padding: 0.7rem 0.7rem 0.7rem 2rem; border-radius: 4px; border: 1px solid var(--border); background-color: var(--card-bg); color: var(--text);"></textarea>
                                        </div>
                                    </div>
                                    
                                    <div style="margin-bottom: 1.5rem;">
                                        <label for="cardNumber" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Card Number</label>
                                        <div style="position: relative;">
                                            <i class="fas fa-credit-card" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                                            <input type="text" id="cardNumber" required placeholder="XXXX XXXX XXXX XXXX" style="width: 100%; padding: 0.7rem 0.7rem 0.7rem 2rem; border-radius: 4px; border: 1px solid var(--border); background-color: var(--card-bg); color: var(--text);">
                                            <div style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); display: flex; gap: 5px;">
                                                <i class="fab fa-cc-visa" style="font-size: 24px; color: #1A1F71;"></i>
                                                <i class="fab fa-cc-mastercard" style="font-size: 24px; color: #EB001B;"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                                        <div style="flex: 1;">
                                            <label for="expiry" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Expiry Date</label>
                                            <div style="position: relative;">
                                                <i class="fas fa-calendar" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                                                <input type="text" id="expiry" required placeholder="MM/YY" style="width: 100%; padding: 0.7rem 0.7rem 0.7rem 2rem; border-radius: 4px; border: 1px solid var(--border); background-color: var(--card-bg); color: var(--text);">
                                            </div>
                                        </div>
                                        <div style="flex: 1;">
                                            <label for="cvv" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">CVV</label>
                                            <div style="position: relative;">
                                                <i class="fas fa-lock" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                                                <input type="text" id="cvv" required placeholder="123" style="width: 100%; padding: 0.7rem 0.7rem 0.7rem 2rem; border-radius: 4px; border: 1px solid var(--border); background-color: var(--card-bg); color: var(--text);">
                                                <span class="cvv-tooltip" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); cursor: help; color: var(--text-light);" title="3-digit security code on the back of your card">
                                                    <i class="fas fa-question-circle"></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" class="checkout-btn pulse-animation" style="margin-top: 1rem; padding: 1rem; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                                        <i class="fas fa-lock" style="margin-right: 0.5rem;"></i> Complete Order - $${total.toFixed(2)}
                                    </button>
                                    
                                    <div style="text-align: center; margin-top: 1rem; font-size: 0.8rem; color: var(--text-light);">
                                        By completing your order, you agree to our <a href="#" style="color: var(--primary);">Terms of Service</a> and <a href="#" style="color: var(--primary);">Privacy Policy</a>
                                    </div>
                                </form>
                            </div>
                            
                            <div id="paypalForm" style="display: none;">
                                <div style="background-color: var(--secondary); padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
                                    <p style="margin: 0 0 1rem 0;">Click the PayPal button below to complete your purchase securely with PayPal.</p>
                                    
                                    <div id="paypalCheckoutButton" style="margin-top: 1rem;"></div>
                                </div>
                                
                                <div style="text-align: center; margin-top: 1rem; font-size: 0.8rem; color: var(--text-light);">
                                    By completing your order, you agree to our <a href="#" style="color: var(--primary);">Terms of Service</a> and <a href="#" style="color: var(--primary);">Privacy Policy</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(checkoutModal);
    
    // Initialize PayPal button
    initializePayPalButton();
    
    // Add tooltips
    const tooltips = checkoutModal.querySelectorAll('[title]');
    tooltips.forEach(el => {
        el.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('title');
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '0.5rem';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '0.75rem';
            tooltip.style.zIndex = '10000';
            tooltip.style.maxWidth = '200px';
            tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
            tooltip.style.left = (rect.left + rect.width/2 - tooltip.offsetWidth/2) + 'px';
            
            this.addEventListener('mouseleave', function() {
                document.body.removeChild(tooltip);
            }, { once: true });
        });
    });
    
    // Toggle between payment methods
    document.getElementById('creditCardOption').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('paypalOption').classList.remove('active');
        document.getElementById('creditCardForm').style.display = 'block';
        document.getElementById('paypalForm').style.display = 'none';
    });
    
    document.getElementById('paypalOption').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('creditCardOption').classList.remove('active');
        document.getElementById('creditCardForm').style.display = 'none';
        document.getElementById('paypalForm').style.display = 'block';
    });
    
    // Close checkout modal when close button is clicked
    document.getElementById('closeCheckout').addEventListener('click', function() {
        document.body.removeChild(checkoutModal);
    });
    
    // Close checkout modal when clicking outside the content
    checkoutModal.addEventListener('click', function(event) {
        if (event.target === this) {
            document.body.removeChild(this);
        }
    });
    
    // Handle form submission
    document.getElementById('checkoutForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Show loading indicator
        const submitButton = this.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitButton.disabled = true;
        
        // Gather form data
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const address = document.getElementById('address').value;
        const cardNumber = document.getElementById('cardNumber').value;
        
        // Simulate a delay for processing (would be replaced with actual payment processing)
        setTimeout(() => {
            // Create order object for email
            const order = {
                id: 'CC-' + Date.now().toString(),
                date: new Date().toISOString(),
                customer: {
                    name: name,
                    email: email,
                    address: address
                },
                items: cart,
                total: total,
                paymentMethod: 'Credit Card'
            };
            
            // Send order details to email and then show success message
            sendOrderToEmail(order).then(() => {
                // Only remove the modal if it still exists (it might have been removed in sendOrderToEmail)
                if (document.getElementById('checkoutModal')) {
                    document.getElementById('checkoutModal').remove();
                }
                
                // Show success message and reset cart
                showOrderSuccessMessage('Credit Card');
                
                // Clear the cart
                cart = [];
                saveCart();
                updateCartBadge();
            });
            
        }, 2000);
    });
    
    // Add input formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            // Remove non-digits
            let value = this.value.replace(/\D/g, '');
            
            // Add spaces every 4 digits
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            
            // Update input value
            this.value = formattedValue.substring(0, 19); // Limit to 16 digits + 3 spaces
        });
    }
    
    const expiryInput = document.getElementById('expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', function() {
            // Remove non-digits
            let value = this.value.replace(/\D/g, '');
            
            // Format as MM/YY
            if (value.length > 2) {
                this.value = value.substring(0, 2) + '/' + value.substring(2, 4);
            } else {
                this.value = value;
            }
        });
    }
    
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function() {
            // Remove non-digits and limit to 4 characters (some cards have 4-digit CVV)
            this.value = this.value.replace(/\D/g, '').substring(0, 4);
        });
    }
}

// Send order to email 
function sendOrderToEmail(order, isManualRequest = false) {
    return new Promise(async (resolve, reject) => {
        try {
            // Show loading overlay while sending email
            showLoadingOverlay('Sending order confirmation...');
            
            // Log entire order object to debug
            console.log("Complete order object:", JSON.stringify(order));
            
            // We'll work with the original items without converting to data URLs
            const items = order.items || [];
            console.log("Order items:", JSON.stringify(items));
            
            // Extract individual item details for the first item (most orders have one item)
            const firstItem = items[0] || {};
            console.log("First item details:", JSON.stringify(firstItem));
            
            // Format order date
            const orderDate = new Date(order.date || order.orderDate || Date.now()).toLocaleString();
            
            // Generate an order number - prefer existing ID if available
            const orderNumber = order.id || order.customer?.paypalOrderId || order.paypal?.orderId || `ORD-${Date.now()}`;
            
            // Set email subject and notification type based on order type
            const emailSubject = isManualRequest ? 'Your Order Request' : 'Your Order Confirmation';
            const notificationType = isManualRequest ? 'Manual Payment Required' : 'Order Confirmation';
            
            // Create a formatted HTML items list for the email template
            let itemsListHTML = '';
            const orderSummaryText = items.map((item, index) => {
                const itemText = `Item ${index + 1}:\nProduct: Custom ${formatStyle(item.style || item.name || '')} T-shirt\nSize: ${item.size || ''}\nColor: ${item.color || ''}\nPrice: $${parseFloat(item.price || 0).toFixed(2)}`;
                
                // Create HTML row for each item (for table display in email)
                itemsListHTML += `
                <tr>
                    <td>Item ${index + 1}</td>
                    <td>
                        Custom ${formatStyle(item.style || item.name || '')} T-shirt<br>
                        Size: ${item.size || ''}<br>
                        Color: ${item.color || ''}
                    </td>
                    <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
                </tr>`;
                
                return itemText;
            }).join('\n\n-----------------\n\n');
            
            // Ensure we have valid product details with explicit fallbacks
            const productStyle = formatStyle(firstItem.style || firstItem.name || 'T-shirt');
            const productSize = firstItem.size || 'Standard';
            const productColor = firstItem.color || 'Black';
            const productPrice = firstItem.price ? parseFloat(firstItem.price).toFixed(2) : '0.00';
            
            console.log("Formatted product details:", {
                style: productStyle,
                size: productSize,
                color: productColor,
                price: productPrice
            });
            
            // Process images for attachments - leveraging EmailJS Pro features
            let designImageAttachment = null;
            let mockupImageAttachment = null;
            
            // Process design image for attachment (up to 2MB)
            if (firstItem.imageUrl) {
                try {
                    // For EmailJS Pro, we can send binary attachments
                    // Fetch the image as a Blob
                    const designImageResponse = await fetch(firstItem.imageUrl);
                    const designImageBlob = await designImageResponse.blob();
                    
                    // Check image size - EmailJS Pro supports up to 2MB
                    if (designImageBlob.size <= 2 * 1024 * 1024) {
                        designImageAttachment = {
                            name: `design_${orderNumber}.png`,
                            data: designImageBlob
                        };
                    } else {
                        console.warn('Design image exceeds 2MB limit, using URL instead');
                    }
                } catch (error) {
                    console.error('Error processing design image for attachment:', error);
                }
            }
            
            // Process mockup image for attachment (up to 2MB)
            if (firstItem.previewImageUrl) {
                try {
                    // Fetch the mockup image as a Blob
                    const mockupImageResponse = await fetch(firstItem.previewImageUrl);
                    const mockupImageBlob = await mockupImageResponse.blob();
                    
                    // Check image size - EmailJS Pro supports up to 2MB
                    if (mockupImageBlob.size <= 2 * 1024 * 1024) {
                        mockupImageAttachment = {
                            name: `mockup_${orderNumber}.png`,
                            data: mockupImageBlob
                        };
                    } else {
                        console.warn('Mockup image exceeds 2MB limit, using URL instead');
                    }
                } catch (error) {
                    console.error('Error processing mockup image for attachment:', error);
                }
            }
            
            // Customer details - support both structures (direct properties or customer object)
            const customerName = order.customer?.name || order.customerName || 'Customer';
            const customerEmail = order.customer?.email || order.customerEmail || '';
            const customerAddress = order.customer?.address || order.address || 'Not provided';
            
            // Format email parameters for the customer with individual variables
            const emailParams = {
                // Customer info
                to_name: customerName,
                to_email: customerEmail,
                email: customerEmail, // For backward compatibility
                customer_address: customerAddress,
                customer_email: customerEmail,
                customer_name: customerName,
                
                // Order info
                order_id: orderNumber,
                order_date: orderDate,
                payment_method: order.paymentMethod || 'PayPal',
                order_total: parseFloat(order.total || 0).toFixed(2),
                
                // Product details (from first item)
                product_style: productStyle,
                product_size: productSize,
                product_color: productColor,
                product_price: productPrice,
                
                // Image URLs (fallback if attachments don't work)
                product_image: firstItem.imageUrl || 'https://via.placeholder.com/200x200?text=Design',
                mockup_image: firstItem.previewImageUrl || 'https://via.placeholder.com/200x200?text=Mockup',
                
                // New formatted items list for table display
                items_list: itemsListHTML,
                
                // Email content
                subject: emailSubject,
                from_name: 'NextGenStudios',
                notification_type: notificationType,
                is_manual_request: isManualRequest ? "yes" : "no",
                
                // Order summary for text fallback
                order_summary: orderSummaryText
            };
            
            // Add file attachments if available (EmailJS Pro feature)
            if (designImageAttachment || mockupImageAttachment) {
                emailParams.attachments = [];
                
                if (designImageAttachment) {
                    emailParams.attachments.push(designImageAttachment);
                }
                
                if (mockupImageAttachment) {
                    emailParams.attachments.push(mockupImageAttachment);
                }
            }
            
            console.log('Sending order confirmation email with params:', JSON.stringify({
                ...emailParams,
                attachments: emailParams.attachments ? `${emailParams.attachments.length} attachment(s)` : 'none'
            }));
            
            // Send the email using EmailJS with the correct template ID
            emailjs.send(
                config.emailjs.serviceId,
                'template_pchevsq', // Use template ID directly
                emailParams,
                config.emailjs.userId
            )
            .then((response) => {
                console.log('Email sent successfully:', response);
                hideLoadingOverlay();
                resolve(response);
            })
            .catch((error) => {
                console.error('Failed to send email:', error);
                hideLoadingOverlay();
                reject(error);
            });
        } catch (error) {
            console.error('Error in sendOrderToEmail:', error);
            hideLoadingOverlay();
            reject(error);
        }
    });
}

// Show order success message
function showOrderSuccessMessage(paymentMethod) {
    // Create success modal
    const successModal = document.createElement('div');
    successModal.className = 'cart-modal fade-in';
    successModal.style.display = 'flex';
    successModal.id = 'successModal';
    
    successModal.innerHTML = `
        <div class="cart-content success-content">
            <div class="success-icon">
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
            </div>
            <h2 class="success-title">Order Successful!</h2>
            <div class="success-message">
                <p>Thank you for your order! Your payment via <strong>${paymentMethod}</strong> has been processed successfully.</p>
                <p>Your order confirmation has been sent to your email address.</p>
                <p>Our team will contact you soon about your order status.</p>
            </div>
            <div class="order-number">
                <span>Order #${Date.now().toString().slice(-8)}</span>
            </div>
            <button id="closeSuccess" class="checkout-btn pulse-animation">
                <i class="fas fa-shopping-bag"></i> Continue Shopping
            </button>
            <div class="support-info">
                <p>Questions? Contact us at <a href="mailto:aicardgen_business@outlook.com">aicardgen_business@outlook.com</a></p>
            </div>
        </div>
    `;
    
    // Add styles if they don't exist yet
    if (!document.getElementById('success-modal-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'success-modal-styles';
        styleEl.textContent = `
            .success-content {
                text-align: center;
                max-width: 480px;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            }
            
            .success-icon {
                width: 100px;
                height: 100px;
                margin: 0 auto 1.5rem;
            }
            
            .checkmark {
                width: 100%;
                height: 100%;
                display: block;
            }
            
            .checkmark-circle {
                stroke-dasharray: 166;
                stroke-dashoffset: 166;
                stroke-width: 2;
                stroke-miterlimit: 10;
                stroke: var(--success, #4CAF50);
                fill: none;
                animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
            }
            
            .checkmark-check {
                transform-origin: 50% 50%;
                stroke-dasharray: 48;
                stroke-dashoffset: 48;
                stroke-width: 3;
                stroke: var(--success, #4CAF50);
                animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
            }
            
            @keyframes stroke {
                100% {
                    stroke-dashoffset: 0;
                }
            }
            
            .success-title {
                color: var(--primary);
                margin-bottom: 1.5rem;
                font-size: 2rem;
                font-weight: 700;
                animation: fadeInUp 0.8s ease forwards;
            }
            
            .success-message {
                margin-bottom: 2rem;
                line-height: 1.6;
                color: var(--text);
                animation: fadeInUp 1s ease forwards;
            }
            
            .success-message p {
                margin-bottom: 0.75rem;
            }
            
            .order-number {
                margin-bottom: 2rem;
                padding: 0.75rem 1.5rem;
                background-color: var(--secondary);
                border-radius: 8px;
                display: inline-block;
                font-weight: 600;
                animation: fadeInUp 1.2s ease forwards;
            }
            
            .support-info {
                margin-top: 1.5rem;
                font-size: 0.9rem;
                color: var(--text-light);
                animation: fadeInUp 1.4s ease forwards;
            }
            
            .support-info a {
                color: var(--primary);
                text-decoration: none;
                font-weight: 500;
            }
            
            .support-info a:hover {
                text-decoration: underline;
            }
            
            #closeSuccess {
                animation: fadeInUp 1.3s ease forwards;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255,255,255,0.9);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                border-radius: 12px;
            }
            
            .loading-spinner {
                display: inline-block;
                width: 50px;
                height: 50px;
                border: 3px solid rgba(74, 44, 130, 0.2);
                border-radius: 50%;
                border-top-color: var(--primary, #4a2c82);
                animation: spin 1s ease-in-out infinite;
                margin-bottom: 1rem;
            }
            
            .loading-overlay p {
                margin-top: 1rem;
                font-weight: 500;
                color: var(--primary);
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    document.body.appendChild(successModal);
    
    // Add confetti animation
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        // Create a simple confetti fallback if the library isn't available
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '1001';
        document.body.appendChild(confettiContainer);
        
        // Create some confetti elements
        const colors = ['#4a2c82', '#6b42b8', '#9671d9', '#2196F3', '#4CAF50', '#FF9800'];
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 5 + 5 + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.opacity = Math.random() + 0.5;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.top = '-10px';
            confetti.style.left = Math.random() * 100 + '%';
            
            // Add animation
            confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
            confettiContainer.appendChild(confetti);
        }
        
        // Add keyframes for the animation
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(${Math.random() * 360 + 180}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styleSheet);
        
        // Remove the confetti after 4 seconds
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 4000);
    }
    
    // Close success modal and reset cart with animation
    document.getElementById('closeSuccess').addEventListener('click', function() {
        successModal.style.opacity = '0';
        successModal.style.transform = 'scale(0.9)';
        successModal.style.transition = 'all 0.3s ease-out';
        
        setTimeout(() => {
            document.body.removeChild(successModal);
            if (document.getElementById('cartModal')) {
                document.getElementById('cartModal').style.display = 'none';
            }
            
            // Clear cart
            cart = [];
            saveCart();
            updateCartBadge();
        }, 300);
    });
    
    // Also close when clicking outside
    successModal.addEventListener('click', function(event) {
        if (event.target === this) {
            document.getElementById('closeSuccess').click();
        }
    });
}

// Function to check if we're on the image generator page and hook into its functionality
function hookIntoImageGenerator() {
    // Skip this function if we're on the merch page
    if (window.location.pathname.includes('merch.html')) {
        return;
    }
    
    // This would connect with the image generator page to allow
    // users to easily use their generated images on t-shirts
    
    // Check if we're on the main page with the image generator
    const generateImageBtn = document.getElementById('generateImageBtn');
    if (!generateImageBtn) {
        return; // Exit if not on the generator page
    }
    
    // Track current prompt and image to preserve state
    preserveGeneratorState();
    
    // If image preview exists, add notification about merch
    const imagePreviewArea = document.getElementById('imagePreview');
    if (imagePreviewArea) {
        // Use MutationObserver instead of deprecated DOMNodeInserted
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.tagName === 'IMG') {
                        // Save the current image URL to session storage
                        sessionStorage.setItem('currentGeneratedImage', node.src);
                        
                        // Get the entity name if available
                        let entityName = '';
                        const entityNameElement = document.getElementById('entityName');
                        if (entityNameElement) {
                            entityName = entityNameElement.innerText;
                        }
                        
                        // Save to generatedImages in localStorage for merchandise
                        saveGeneratedImageForMerch(node.src, entityName);
                        
                        // Add notification about merch if it doesn't exist
                        if (!document.querySelector('.merch-notification')) {
                            addMerchNotification(node);
                        }
                    }
                });
            });
        });
        
        // Start observing the image preview area for added nodes
        observer.observe(imagePreviewArea, { childList: true });
        
        // Check if there's already an image displayed and add the notification
        const existingImage = imagePreviewArea.querySelector('img');
        if (existingImage && !document.querySelector('.merch-notification')) {
            // Get the entity name if available
            let entityName = '';
            const entityNameElement = document.getElementById('entityName');
            if (entityNameElement) {
                entityName = entityNameElement.innerText;
            }
            
            // Save to generatedImages in localStorage
            saveGeneratedImageForMerch(existingImage.src, entityName);
            addMerchNotification(existingImage);
        }
    }
}

// Function to add a notification about merchandise
function addMerchNotification(imageElement) {
    // Don't add notification if it already exists
    if (document.querySelector('.merch-notification')) {
        return;
    }
    
    // Create the notification
    const merchNotification = document.createElement('div');
    merchNotification.className = 'merch-notification';
    merchNotification.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success); margin-right: 0.5rem;"></i> Image automatically saved to <a href="merch.html" style="color: var(--primary); font-weight: 600;">Merchandise</a>';
    merchNotification.style.marginTop = '1rem';
    merchNotification.style.textAlign = 'center';
    merchNotification.style.padding = '0.75rem';
    merchNotification.style.backgroundColor = 'var(--secondary)';
    merchNotification.style.borderRadius = '6px';
    merchNotification.style.fontSize = '0.95rem';
    
    // Insert the notification after the image
    if (imageElement.parentNode) {
        imageElement.parentNode.insertBefore(merchNotification, imageElement.nextSibling);
    }
}

// For backwards compatibility, keep this function but make it use the new notification
function addSendToMerchButton(imageElement) {
    // Just call our new function
    addMerchNotification(imageElement);
}

// Preserve generator state so it doesn't regenerate when returning from merch
function preserveGeneratorState() {
    // Store the current state when generating a new prompt
    document.getElementById('generateBtn').addEventListener('click', function() {
        sessionStorage.setItem('generatorStatePreserved', 'true');
    });
    
    // Listen for when images are generated
    document.getElementById('generateImageBtn').addEventListener('click', function() {
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview && imagePreview.querySelector('img')) {
            sessionStorage.setItem('currentGeneratedImage', imagePreview.querySelector('img').src);
        }
    });
    
    // Check if we need to restore state (returning from merch page)
    if (document.referrer.includes('merch.html') && sessionStorage.getItem('generatorStatePreserved') === 'true') {
        // Prevent automatic regeneration if we're returning from merch
        const generatePromptsOriginal = window.generatePrompts;
        if (generatePromptsOriginal) {
            window.generatePrompts = function(...args) {
                // Only execute once to prevent regeneration
                if (sessionStorage.getItem('generatorStatePreserved') === 'true') {
                    sessionStorage.removeItem('generatorStatePreserved');
                    console.log('Preserved generator state, not regenerating');
                    return;
                }
                return generatePromptsOriginal.apply(this, args);
            };
        }
    }
}

// Run the hook function when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookIntoImageGenerator);
} else {
    hookIntoImageGenerator();
}

// Helper function to update main index.html to add merchandise link
// This should be called once to modify the main page
function addMerchButtonToMainPage() {
    // This is a placeholder function
    // In a real implementation, we would modify the index.html file
    // to add a button linking to the merchandise page
    
    console.log('This function would add a Merch button to the main page');
    // Example code to add to index.html:
    // <button id="merchBtn" class="btn btn-secondary">
    //     <i class="fas fa-tshirt btn-icon"></i> Merch Shop
    // </button>
}

// Create placeholder mockup images if not available from GitHub
function createPlaceholderMockups() {
    // Check if we can access the apparel/tshirt directory with the correct file
    const testImg = new Image();
    testImg.onerror = function() {
        console.log('T-shirt mockup files not found locally. Defaulting to GitHub URLs.');
    };
    testImg.src = 'apparel/tshirt/tshirt_white.png';
}

// Helper function to process image for better shirt display
function processImageForShirt(imageUrl, callback) {
    // Create a temporary canvas to analyze and process the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Get current t-shirt color
        const tshirtColor = document.getElementById('tshirtColor').value;
        
        // First draw image normally to analyze it
        ctx.drawImage(img, 0, 0);
        
        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Analyze image to detect background type
        const edgePixels = [];
        const centerPixels = [];
        
        // Sample edge pixels
        for (let i = 0; i < canvas.width; i += Math.max(1, Math.floor(canvas.width / 20))) {
            // Top and bottom edges
            edgePixels.push(getPixelAt(data, i, 0, canvas.width));
            edgePixels.push(getPixelAt(data, i, canvas.height - 1, canvas.width));
        }
        
        for (let j = 0; j < canvas.height; j += Math.max(1, Math.floor(canvas.height / 20))) {
            // Left and right edges
            edgePixels.push(getPixelAt(data, 0, j, canvas.width));
            edgePixels.push(getPixelAt(data, canvas.width - 1, j, canvas.width));
        }
        
        // Sample center pixels
        const centerArea = {
            x: Math.floor(canvas.width * 0.25),
            y: Math.floor(canvas.height * 0.25),
            width: Math.floor(canvas.width * 0.5),
            height: Math.floor(canvas.height * 0.5)
        };
        
        for (let y = centerArea.y; y < centerArea.y + centerArea.height; y += Math.max(1, Math.floor(centerArea.height / 10))) {
            for (let x = centerArea.x; x < centerArea.x + centerArea.width; x += Math.max(1, Math.floor(centerArea.width / 10))) {
                centerPixels.push(getPixelAt(data, x, y, canvas.width));
            }
        }
        
        // Analyze the edge and center colors
        const edgeStats = analyzePixels(edgePixels);
        const centerStats = analyzePixels(centerPixels);
        
        // Detect if it's a dark background with light foreground
        const hasDarkBackground = edgeStats.brightness < 100 && centerStats.brightness > edgeStats.brightness;
        
        // Detect if it has a solid background
        const hasUniformBackground = edgeStats.variance < 1000;
        
        // Clear canvas for processing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply specialized processing based on analysis
        if (hasDarkBackground) {
            // Dark background - use special blend mode with background removal for dark shirt
            // Add subtle feathering at the edges
            const featherSize = Math.min(canvas.width, canvas.height) * 0.05;
            
            // Create a gradient mask for feathering
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 
                Math.min(canvas.width, canvas.height) * 0.4 - featherSize,
                canvas.width / 2, canvas.height / 2, 
                Math.min(canvas.width, canvas.height) * 0.5
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            // Draw with specialized processing
            if (tshirtColor === 'black') {
                // For black shirts with dark images, use screen blend mode
                ctx.filter = 'brightness(1.2) contrast(1.3)';
                ctx.drawImage(img, 0, 0);
                
                // Apply soft light filter to enhance details
                ctx.globalCompositeOperation = 'soft-light';
                ctx.fillStyle = '#333333';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Reset composite operation and apply feathering
                ctx.globalCompositeOperation = 'destination-in';
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                // For other shirt colors
                ctx.drawImage(img, 0, 0);
                
                // Apply brightness/contrast adjustments
                ctx.filter = 'brightness(1.1) contrast(1.2)';
                ctx.globalCompositeOperation = 'source-atop';
                ctx.drawImage(img, 0, 0);
                
                // Apply feathering
                ctx.globalCompositeOperation = 'destination-in';
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            // Light or transparent background
            // Apply subtle feathering for seamless integration
            const featherSize = Math.min(canvas.width, canvas.height) * 0.08;
            
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, 
                Math.min(canvas.width, canvas.height) * 0.4 - featherSize,
                canvas.width / 2, canvas.height / 2, 
                Math.min(canvas.width, canvas.height) * 0.45
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            // Draw image with adjustments for t-shirt color
            if (tshirtColor === 'black') {
                // For black shirts
                ctx.filter = 'brightness(1.05) contrast(1.1)';
                ctx.drawImage(img, 0, 0);
                
                // Apply feathering
                ctx.globalCompositeOperation = 'destination-in';
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                // For other colors
                ctx.filter = 'contrast(1.1)';
                ctx.drawImage(img, 0, 0);
                
                // Apply feathering
                ctx.globalCompositeOperation = 'destination-in';
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        // Return the processed image
        if (typeof callback === 'function') {
            canvas.toBlob(function(blob) {
                const processedUrl = URL.createObjectURL(blob);
                callback(processedUrl);
            }, 'image/png');
        }
    };
    
    img.onerror = function() {
        // If image loading fails, return the original URL
        if (typeof callback === 'function') {
            callback(imageUrl);
        }
    };
    
    // Helper function to get pixel data at a specific position
    function getPixelAt(data, x, y, width) {
        const idx = (y * width + x) * 4;
        return {
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
            a: data[idx + 3]
        };
    }
    
    // Helper function to analyze pixels
    function analyzePixels(pixels) {
        let totalBrightness = 0;
        let rValues = [], gValues = [], bValues = [];
        
        pixels.forEach(p => {
            totalBrightness += (p.r + p.g + p.b) / 3;
            rValues.push(p.r);
            gValues.push(p.g);
            bValues.push(p.b);
        });
        
        const avgBrightness = totalBrightness / pixels.length;
        
        // Calculate variance (simplified)
        const variance = calculateVariance(rValues) + calculateVariance(gValues) + calculateVariance(bValues);
        
        return {
            brightness: avgBrightness,
            variance: variance
        };
    }
    
    // Helper function to calculate variance
    function calculateVariance(values) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    }
    
    // Start loading the image
    img.src = imageUrl;
}

// Update image handling in relevant functions
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        
        // Since FileReader provides a data URL, CORS issues are avoided
        // Update preview with the image directly
        const tshirtPreview = document.getElementById('tshirtPreview');
        const previewImg = document.getElementById('previewImg');
        const uploadedImagePreview = document.getElementById('uploadedImagePreview');
        
        if (tshirtPreview) tshirtPreview.src = imageUrl;
        if (previewImg) previewImg.src = imageUrl;
        if (uploadedImagePreview) uploadedImagePreview.style.display = 'block';
        
        // Also store for future use
        const currentDesignImage = document.getElementById('currentDesignImage');
        if (currentDesignImage) currentDesignImage.value = imageUrl;
        
        // Update the preview
        updatePreview();
        
        // Show success toast
        showToast('Image uploaded successfully!', 'success');
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        showToast('Error reading the image file. Please try another.', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Add image processing when t-shirt color changes
function handleTshirtColorChange() {
    const color = document.getElementById('tshirtColor').value;
    updateTshirtColor(color);
    
    // Get current image and process it for the new shirt color
    const currentImage = document.getElementById('tshirtPreview').src;
    if (currentImage && !currentImage.includes('placehold.co')) {
        processImageForShirt(currentImage, function(processedUrl) {
            document.getElementById('tshirtPreview').src = processedUrl;
            updatePreview();
        });
    } else {
        updatePreview();
    }
}

// Create mockup directory if it doesn't exist
function createMockupDirectory() {
    // Check if mock directory exists
    const mockupDir = './apparel/tshirt';
    let mocksExist = false;
    
    // Check if the mockups have already been created in this session
    if (window.tshirtMockups && Object.keys(window.tshirtMockups).length > 0) {
        console.log('Mockups already created in this session');
        return;
    }
    
    // Test if we need to create the mockups by trying to load one
    const testImg = new Image();
    testImg.onload = function() {
        mocksExist = true;
        console.log('Mockup images exist, no need to create placeholders');
    };
    
    testImg.onerror = function() {
        console.log('Creating placeholder mockups for shirts');
        createPlaceholderMockups();
    };
    
    // Try to load test images for both black and white variants
    testImg.src = `${mockupDir}/tshirt_black.png`;
    
    // Also check if white variant is available
    const testWhiteImg = new Image();
    testWhiteImg.onerror = function() {
        console.log('Creating white shirt mockups');
        createPlaceholderMockups();
    };
    testWhiteImg.src = `${mockupDir}/tshirt_white.png`;
}

// Create placeholder mockups if real ones aren't available
function createPlaceholderMockups() {
    // Create canvas-based placeholders for t-shirt mockups
    const styles = ['regular', 'croptop', 'longsleeve', 'vneck'];
    const colors = ['black', 'white'];  // Support both black and white shirts
    
    styles.forEach(style => {
        colors.forEach(color => {
            // Create a canvas mockup
            createMockupCanvas(style, color);
        });
    });
}

// Create a canvas-based mockup for a specific style and color
function createMockupCanvas(style, color) {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set dimensions
        canvas.width = 600;
        canvas.height = 600;
        
        // Fill background
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a basic t-shirt shape
        ctx.beginPath();
        
        // Different shapes based on style
        switch(style) {
            case 'regular':
                // Neck
                ctx.moveTo(250, 100);
                ctx.quadraticCurveTo(300, 80, 350, 100);
                
                // Right shoulder
                ctx.lineTo(450, 150);
                
                // Right sleeve
                ctx.lineTo(470, 220);
                
                // Right side
                ctx.lineTo(400, 500);
                
                // Bottom
                ctx.lineTo(200, 500);
                
                // Left side
                ctx.lineTo(130, 220);
                
                // Left sleeve
                ctx.lineTo(150, 150);
                
                // Back to neck
                ctx.lineTo(250, 100);
                break;
                
            case 'longsleeve':
                // Neck
                ctx.moveTo(250, 100);
                ctx.quadraticCurveTo(300, 80, 350, 100);
                
                // Right shoulder
                ctx.lineTo(450, 150);
                
                // Right sleeve
                ctx.lineTo(500, 300);
                
                // Right sleeve bottom
                ctx.lineTo(440, 320);
                
                // Right side
                ctx.lineTo(400, 500);
                
                // Bottom
                ctx.lineTo(200, 500);
                
                // Left side
                ctx.lineTo(160, 320);
                
                // Left sleeve bottom
                ctx.lineTo(100, 300);
                
                // Left sleeve
                ctx.lineTo(150, 150);
                
                // Back to neck
                ctx.lineTo(250, 100);
                break;
                
            case 'croptop':
                // Neck
                ctx.moveTo(250, 100);
                ctx.quadraticCurveTo(300, 80, 350, 100);
                
                // Right shoulder
                ctx.lineTo(450, 150);
                
                // Right sleeve
                ctx.lineTo(470, 220);
                
                // Right side
                ctx.lineTo(400, 400); // Shorter for crop top
                
                // Bottom
                ctx.lineTo(200, 400); // Shorter for crop top
                
                // Left side
                ctx.lineTo(130, 220);
                
                // Left sleeve
                ctx.lineTo(150, 150);
                
                // Back to neck
                ctx.lineTo(250, 100);
                break;
                
            case 'vneck':
                // Neck (V shape)
                ctx.moveTo(230, 100);
                ctx.lineTo(300, 170);
                ctx.lineTo(370, 100);
                
                // Right shoulder
                ctx.lineTo(450, 150);
                
                // Right sleeve
                ctx.lineTo(470, 220);
                
                // Right side
                ctx.lineTo(400, 500);
                
                // Bottom
                ctx.lineTo(200, 500);
                
                // Left side
                ctx.lineTo(130, 220);
                
                // Left sleeve
                ctx.lineTo(150, 150);
                
                // Back to neck
                ctx.lineTo(230, 100);
                break;
                
            default:
                // Default to regular t-shirt
                ctx.moveTo(250, 100);
                ctx.quadraticCurveTo(300, 80, 350, 100);
                ctx.lineTo(450, 150);
                ctx.lineTo(470, 220);
                ctx.lineTo(400, 500);
                ctx.lineTo(200, 500);
                ctx.lineTo(130, 220);
                ctx.lineTo(150, 150);
                ctx.lineTo(250, 100);
        }
        
        // Fill the t-shirt shape with the selected color
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        
        // Add a subtle shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.lineWidth = 2;
        ctx.strokeStyle = color === 'white' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();
        
        // Add an extra border for white shirts to make them visible
        if (color === 'white') {
            ctx.shadowColor = 'transparent';
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.stroke();
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        
        // Add a collar/detail for certain styles
        if (style === 'regular' || style === 'longsleeve') {
            ctx.beginPath();
            ctx.moveTo(270, 110);
            ctx.quadraticCurveTo(300, 95, 330, 110);
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.stroke();
        }
        
        // Store the mockup
        const mockupUrl = canvas.toDataURL('image/png');
        localStorage.setItem(`mockup-${style}-${color}`, mockupUrl);
        
        console.log(`Created mockup for ${style}-${color}`);
        
        // Add it to a global object for easy access
        if (!window.tshirtMockups) {
            window.tshirtMockups = {};
        }
        window.tshirtMockups[`${style}-${color}`] = mockupUrl;
        
        return mockupUrl;
    } catch (error) {
        console.error('Error creating mockup canvas:', error);
        return null;
    }
}

// Function to test EmailJS at the end of the file
function testEmailJSSetup() {
    // Show loading overlay
    showLoadingOverlay("Testing EmailJS setup...");
    
    try {
        console.log("Testing EmailJS configuration:", config.emailjs);
        
        // Check if EmailJS is properly initialized
        if (!emailjs || !emailjs.send) {
            showToast("EmailJS is not properly initialized.", "error");
            hideLoadingOverlay();
            return;
        }
        
        // Check public key
        if (!emailjs._userID) {
            showToast("EmailJS public key is not set.", "error");
            hideLoadingOverlay();
            return;
        }
        
        // Check if we have the service ID and template ID
        if (!config.emailjs.serviceId || !config.emailjs.customerTemplateId) {
            showToast("EmailJS service ID or template ID is missing.", "error");
            hideLoadingOverlay();
            return;
        }
        
        // Format test parameters
        const testParams = {
            to_name: 'Test User',
            to_email: config.testEmail,
            email: config.testEmail,
            order_number: "TEST-123456",
            order_date: new Date().toLocaleString(),
            payment_method: "Test Payment",
            order_total: "$123.45",
            items_list: "<tr><td>Test Item</td><td>$123.45</td></tr>",
            customer_email: "test@example.com",
            customer_address: "123 Test St, Test City, TC 12345",
            from_name: "NextGenStudios",
            subject: "Test Order Confirmation",
            notification_type: "Test Notification"
        };
        
        console.log("Testing EmailJS setup with parameters:", testParams);
        
        // Send the test email using the business template
        emailjs.send(config.emailjs.serviceId, config.emailjs.businessTemplateId, testParams)
            .then(function(response) {
                console.log("Email test successful:", response);
                hideLoadingOverlay();
                showToast("Email test successful! Check " + config.testEmail + " for the test email.", "success");
            })
            .catch(function(error) {
                console.error("Email test failed:", error);
                hideLoadingOverlay();
                showToast("Email test failed. Check console for details.", "error");
            });
    } catch (e) {
        console.error("Error during test:", e);
        hideLoadingOverlay();
        showToast("Email test failed: " + e.message, "error");
    }
}

// Add a visible test button when not in production
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.includes('preview')) {
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Email Template';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '20px';
    testButton.style.left = '20px';
    testButton.style.zIndex = '9999';
    testButton.style.padding = '12px 20px';
    testButton.style.backgroundColor = '#4a2c82';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '5px';
    testButton.style.cursor = 'pointer';
    testButton.style.fontWeight = 'bold';
    testButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    
    // Hover effects
    testButton.onmouseover = function() {
        this.style.backgroundColor = '#5d3c96';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
        this.style.transition = 'all 0.3s ease';
    };
    
    testButton.onmouseout = function() {
        this.style.backgroundColor = '#4a2c82';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        this.style.transition = 'all 0.3s ease';
    };
    
    testButton.addEventListener('click', testEmailJSSetup);
    document.body.appendChild(testButton);
}

// Test creating a button instance
function checkPayPalStatus() {
    console.log('Checking PayPal integration status...');
    
    // Check if PayPal is loaded
    const isPayPalLoaded = window.paypal !== undefined;
    console.log('PayPal SDK loaded:', isPayPalLoaded);
    
    if (isPayPalLoaded) {
        console.log('PayPal object details:', {
            hasButtons: typeof window.paypal.Buttons === 'function',
            version: window.paypal.version,
            availableComponents: Object.keys(window.paypal)
        });
        
        // Test creating a button instance
        try {
            const buttonInstance = window.paypal.Buttons();
            console.log('Button instance created successfully:', buttonInstance !== undefined);
            
            // Check if render method is available
            console.log('Render method available:', typeof buttonInstance.render === 'function');
        } catch (error) {
            console.error('Error creating button instance:', error);
        }
    }
    
    // Check client ID configuration
    const scriptTag = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (scriptTag) {
        console.log('PayPal script tag found:', scriptTag.src);
        console.log('Client ID:', scriptTag.src.match(/client-id=([^&]+)/)?.[1] || 'Not found');
    } else {
        console.log('PayPal script tag not found in DOM');
    }
    
    showToast('PayPal status checked - see console for details', 'info');
}

// Function to show manual checkout option when PayPal is blocked
function showManualCheckout() {
    // Calculate total
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Create order summary
    const orderSummary = cart.map(item => 
        `${formatStyle(item.style)} T-shirt - Size: ${item.size}, Color: ${item.color} - $${parseFloat(item.price).toFixed(2)}`
    ).join('\n');
    
    // Create a modal for the manual checkout
    const modalContainer = document.createElement('div');
    modalContainer.id = 'manualCheckoutModal';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;
    
    modalContainer.innerHTML = `
        <div style="background-color: white; max-width: 600px; width: 90%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); padding: 1.5rem; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #333; font-size: 1.5rem;">Alternative Checkout</h3>
                <button style="background: none; border: none; font-size: 1.5rem; cursor: pointer;" onclick="document.getElementById('manualCheckoutModal').remove()">×</button>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <p>We've detected that PayPal checkout is being blocked by your browser. You can complete your order with these alternative options:</p>
                
                <div style="background-color: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                    <h4 style="margin-top: 0; color: #333;">Your Order Summary</h4>
                    <div style="margin-bottom: 1rem; white-space: pre-line;">${orderSummary}</div>
                    <div style="font-weight: bold; font-size: 1.1rem; text-align: right;">Total: $${total.toFixed(2)}</div>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <h4 style="margin-top: 0; color: #333;">Option 1: Disable Ad Blocker</h4>
                    <p>Temporarily disable your ad blocker or privacy extensions and try again with PayPal:</p>
                    <ol style="margin-left: 1.5rem;">
                        <li>Look for your ad blocker icon in your browser toolbar</li>
                        <li>Click it and select "Pause" or "Disable for this site"</li>
                        <li>Refresh the page and try the PayPal checkout again</li>
                    </ol>
                    <button class="btn btn-primary" style="width: 100%" onclick="document.getElementById('manualCheckoutModal').remove(); initializePayPalButton();">
                        <i class="fas fa-redo"></i> Try PayPal Again
                    </button>
                </div>
                
                <div style="margin-top: 1.5rem;">
                    <h4 style="margin-top: 0; color: #333;">Option 2: Email Order Request</h4>
                    <p>Send your order details to our team by email:</p>
                    <button class="btn btn-success" style="width: 100%" onclick="sendManualOrderRequest()">
                        <i class="fas fa-envelope"></i> Email Order Request
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
}

// Function to email manual order request
function sendManualOrderRequest() {
    // Calculate total
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Create order summary for email
    const orderItems = cart.map(item => {
        return {
            name: `${formatStyle(item.style)} T-shirt`,
            description: `Size: ${item.size}, Color: ${item.color}`,
            price: parseFloat(item.price).toFixed(2),
            imageUrl: item.imageUrl
        };
    });
    
    // Create a manual order object
    const manualOrder = {
        items: orderItems,
        total: total.toFixed(2),
        paymentMethod: 'Manual Request',
        date: new Date().toISOString()
    };
    
    // Show loading overlay
    showLoadingOverlay('Sending your order request...');
    
    // Send order email with manual checkout flag
    sendOrderToEmail(manualOrder, true)
        .then(() => {
            hideLoadingOverlay();
            
            // Remove the manual checkout modal
            const modal = document.getElementById('manualCheckoutModal');
            if (modal) {
                modal.remove();
            }
            
            // Show success message
            showToast('Your order request has been sent! We will contact you soon with payment instructions.', 'success');
            
            // Don't clear the cart yet - wait for manual payment
        })
        .catch(error => {
            hideLoadingOverlay();
            console.error('Error sending manual order request:', error);
            showToast('There was a problem sending your order request. Please try again or contact us directly.', 'error');
        });
}

// Function to dynamically load the PayPal SDK
function loadPayPalScript() {
    return new Promise((resolve, reject) => {
        // If PayPal is already loaded, resolve immediately
        if (window.paypal && window.paypal.Buttons) {
            console.log('PayPal SDK already loaded, using existing instance');
            resolve();
            return;
        }
        
        // Remove any existing PayPal scripts to avoid conflicts
        const existingScripts = document.querySelectorAll('script[src*="paypal.com/sdk/js"]');
        existingScripts.forEach(script => script.remove());
        
        // Use the client ID provided by the user
        const clientId = "AW_c6BXCMWi5VtGN8v0JKcFGWF7We2jX4EVDUNXPk_b9_X745FIPCSzRmi0KrZAoR4eau38zCVaV_om_";
        
        console.log('Loading PayPal SDK with client ID:', clientId);
        
        // Create and append the script
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
        script.async = true;
        
        script.onload = () => {
            console.log('PayPal SDK loaded successfully');
            resolve();
        };
        
        script.onerror = (error) => {
            console.error('Failed to load PayPal SDK:', error);
            reject(new Error('Failed to load PayPal SDK'));
            
            // Show manual checkout option as fallback
            const paypalButtonContainer = document.getElementById('paypalButtonContainer');
            if (paypalButtonContainer) {
                paypalButtonContainer.innerHTML = `
                    <div class="paypal-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>PayPal checkout unavailable</p>
                        <button class="btn btn-primary retry-btn" onclick="initializePayPalButton()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                        <button class="btn btn-success" onclick="showManualCheckout()">
                            <i class="fas fa-envelope"></i> Contact Us to Order
                        </button>
                    </div>
                `;
            }
        };
        
        document.body.appendChild(script);
    });
}

// Function to send invoice without payment
function sendInvoiceWithoutPayment() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }
    
    // Prompt for customer information
    const customerEmail = prompt("Please enter your email address to receive the invoice:");
    
    // Debug
    console.log("Customer provided email:", customerEmail);
    
    // Validate email
    if (!customerEmail || !customerEmail.includes('@')) {
        showToast('Please provide a valid email address.', 'error');
        return;
    }
    
    // Prompt for customer name
    const customerName = prompt("Please enter your name:", "Customer");
    
    // Prompt for customer address
    const customerAddress = prompt("Please enter your shipping address:", "");
    
    showLoadingOverlay('Sending invoice...');
    
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Get the first item for individual product details
    const firstItem = cart[0] || {};
    
    // Format order items for the email directly
    const itemsList = cart.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                <strong>Custom ${formatStyle(item.style)} T-shirt</strong><br>
                Size: ${item.size}, Color: ${item.color}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">
                $${parseFloat(item.price).toFixed(2)}
            </td>
        </tr>
    `).join('');
    
    // Create a plain text order summary for multiple items
    const orderSummaryText = cart.map((item, index) => 
        `Item ${index + 1}:\nProduct: Custom ${formatStyle(item.style || '')} T-shirt\nSize: ${item.size || ''}\nColor: ${item.color || ''}\nPrice: $${parseFloat(item.price || 0).toFixed(2)}`
    ).join('\n\n-----------------\n\n');
    
    // Process images for attachments - leveraging EmailJS Pro features
    async function processEmailWithAttachments() {
        let designImageAttachment = null;
        let mockupImageAttachment = null;
        
        // Process design image for attachment (up to 2MB)
        if (firstItem.imageUrl) {
            try {
                // Fetch the image as a Blob
                const designImageResponse = await fetch(firstItem.imageUrl);
                const designImageBlob = await designImageResponse.blob();
                
                // Check image size - EmailJS Pro supports up to 2MB
                if (designImageBlob.size <= 2 * 1024 * 1024) {
                    designImageAttachment = {
                        name: `design_invoice_${Date.now()}.png`,
                        data: designImageBlob
                    };
                } else {
                    console.warn('Design image exceeds 2MB limit, using URL instead');
                }
            } catch (error) {
                console.error('Error processing design image for attachment:', error);
            }
        }
        
        // Process mockup image for attachment (up to 2MB)
        if (firstItem.previewImageUrl) {
            try {
                // Fetch the mockup image as a Blob
                const mockupImageResponse = await fetch(firstItem.previewImageUrl);
                const mockupImageBlob = await mockupImageResponse.blob();
                
                // Check image size - EmailJS Pro supports up to 2MB
                if (mockupImageBlob.size <= 2 * 1024 * 1024) {
                    mockupImageAttachment = {
                        name: `mockup_invoice_${Date.now()}.png`,
                        data: mockupImageBlob
                    };
                } else {
                    console.warn('Mockup image exceeds 2MB limit, using URL instead');
                }
            } catch (error) {
                console.error('Error processing mockup image for attachment:', error);
            }
        }
        
        // Simplified direct email sending to customer
        const emailParams = {
            // Customer info
            to_name: customerName || 'Customer',
            to_email: customerEmail,
            email: customerEmail, // For backward compatibility
            customer_address: customerAddress || 'To be provided',
            customer_email: customerEmail,
            customer_name: customerName || 'Customer',
            
            // Order info
            order_id: `INV-${Date.now()}`,
            order_date: new Date().toLocaleString(),
            payment_method: 'Invoice Request (No Payment)',
            order_total: total.toFixed(2),
            
            // Product details (from first item)
            product_style: formatStyle(firstItem.style || ''),
            product_size: firstItem.size || '',
            product_color: firstItem.color || '',
            product_price: parseFloat(firstItem.price || 0).toFixed(2),
            
            // Image URLs (fallback if attachments don't work)
            product_image: firstItem.imageUrl || 'https://via.placeholder.com/200x200?text=Design',
            mockup_image: firstItem.previewImageUrl || 'https://via.placeholder.com/200x200?text=Mockup',
            
            // HTML items list for table display
            items_list: itemsList,
            
            // Email content
            subject: 'Your Invoice Request',
            from_name: 'NextGenStudios',
            notification_type: 'Invoice Request',
            is_manual_request: 'true',
            
            // Order summary for text fallback
            order_summary: orderSummaryText
        };
        
        // Add file attachments if available (EmailJS Pro feature)
        if (designImageAttachment || mockupImageAttachment) {
            emailParams.attachments = [];
            
            if (designImageAttachment) {
                emailParams.attachments.push(designImageAttachment);
            }
            
            if (mockupImageAttachment) {
                emailParams.attachments.push(mockupImageAttachment);
            }
        }
        
        console.log("Invoice email parameters:", JSON.stringify({
            ...emailParams,
            attachments: emailParams.attachments ? `${emailParams.attachments.length} attachment(s)` : 'none'
        }));
        
        // Check EmailJS configuration
        console.log("EmailJS Config:", {
            serviceId: config.emailjs.serviceId,
            templateId: config.emailjs.customerTemplateId,
            publicKey: emailjs._userID
        });
        
        // Send email directly to customer
        return emailjs.send(config.emailjs.serviceId, config.emailjs.customerTemplateId, emailParams)
            .then(function(response) {
                console.log("Invoice email sent to customer:", response);
                
                // Now send notification to business
                const businessParams = {
                    ...emailParams,
                    to_name: 'Shop Admin',
                    to_email: config.businessEmail,
                    email: config.businessEmail, // For backward compatibility
                    subject: 'New Invoice Request'
                };
                
                return emailjs.send(config.emailjs.serviceId, config.emailjs.customerTemplateId, businessParams);
            })
            .then(function(response) {
                console.log("Business notification sent:", response);
                hideLoadingOverlay();
                showToast('Invoice sent successfully!', 'success');
                
                // Close the cart modal
                document.getElementById('cartModal').style.display = 'none';
                
                // Clear the cart
                cart = [];
                saveCart();
                updateCartBadge();
            })
            .catch(function(error) {
                console.error('Error sending invoice:', error);
                console.error("Error details:", {
                    name: error.name,
                    message: error.message,
                    text: error.text,
                    status: error.status
                });
                
                // Show more detailed error
                let errorMessage = 'Failed to send invoice. Please try again.';
                if (error.text) {
                    errorMessage += ' Error: ' + error.text;
                } else if (error.message) {
                    errorMessage += ' Error: ' + error.message;
                }
                
                hideLoadingOverlay();
                showToast(errorMessage, 'error');
            });
    }
    
    // Execute the async function
    processEmailWithAttachments();
}

// Function to test invoice email specifically
function testInvoiceEmail() {
    // Show loading overlay
    showLoadingOverlay("Testing invoice email...");
    
    // Prompt for test email
    const testEmail = prompt("Enter email address for test:");
    if (!testEmail || !testEmail.includes('@')) {
        showToast("Invalid email address", "error");
        hideLoadingOverlay();
        return;
    }
    
    // Prompt for test name
    const testName = prompt("Enter name for test:", "Test Customer");
    
    // Prompt for test address 
    const testAddress = prompt("Enter shipping address for test:", "123 Test Street, Test City, TS1 2AB");
    
    // Create a test order
    const testOrder = {
        id: "TEST-" + Date.now(),
        date: new Date().toISOString(),
        items: [
            {
                id: "test-item-1",
                name: "Test T-Shirt",
                style: "Premium",
                color: "Black",
                size: "L",
                price: 29.99,
                imageUrl: "https://via.placeholder.com/500?text=Test+Design",
                previewImageUrl: "https://via.placeholder.com/500?text=Test+Mockup"
            }
        ],
        total: 29.99,
        paymentMethod: 'Test Invoice',
        customer: {
            id: "test-customer",
            email: testEmail,
            name: testName || 'Test Customer',
            address: testAddress || '123 Test Street, Test City, TS1 2AB, Test Country'
        }
    };
    
    console.log("Testing invoice email with order:", JSON.stringify(testOrder, null, 2));
    
    // Get the first item for individual product details
    const firstItem = testOrder.items[0] || {};
    
    // Format items list for HTML table
    const itemsList = testOrder.items.map(item => `
        <tr>
            <td>${item.name} (${item.style}, ${item.color}, ${item.size})</td>
            <td>$${parseFloat(item.price).toFixed(2)}</td>
        </tr>
    `).join('');
    
    // Create a plain text order summary
    const orderSummaryText = testOrder.items.map((item, index) => 
        `Item ${index + 1}:\nProduct: Custom ${formatStyle(item.style || item.name || '')} T-shirt\nSize: ${item.size || ''}\nColor: ${item.color || ''}\nPrice: $${parseFloat(item.price || 0).toFixed(2)}`
    ).join('\n\n-----------------\n\n');
    
    // Process test images for attachments
    async function processTestEmailWithAttachments() {
        let designImageAttachment = null;
        let mockupImageAttachment = null;
        
        // Process design image for attachment
        if (firstItem.imageUrl) {
            try {
                // Fetch the image as a Blob
                const designImageResponse = await fetch(firstItem.imageUrl);
                const designImageBlob = await designImageResponse.blob();
                
                // Check image size - EmailJS Pro supports up to 2MB
                if (designImageBlob.size <= 2 * 1024 * 1024) {
                    designImageAttachment = {
                        name: `test_design_${Date.now()}.png`,
                        data: designImageBlob
                    };
                } else {
                    console.warn('Test design image exceeds 2MB limit, using URL instead');
                }
            } catch (error) {
                console.error('Error processing test design image for attachment:', error);
            }
        }
        
        // Process mockup image for attachment
        if (firstItem.previewImageUrl) {
            try {
                // Fetch the mockup image as a Blob
                const mockupImageResponse = await fetch(firstItem.previewImageUrl);
                const mockupImageBlob = await mockupImageResponse.blob();
                
                // Check image size - EmailJS Pro supports up to 2MB
                if (mockupImageBlob.size <= 2 * 1024 * 1024) {
                    mockupImageAttachment = {
                        name: `test_mockup_${Date.now()}.png`,
                        data: mockupImageBlob
                    };
                } else {
                    console.warn('Test mockup image exceeds 2MB limit, using URL instead');
                }
            } catch (error) {
                console.error('Error processing test mockup image for attachment:', error);
            }
        }
        
        // Format email parameters
        const emailParams = {
            // Customer info
            to_name: testOrder.customer.name,
            to_email: testOrder.customer.email,
            email: testOrder.customer.email, // For backward compatibility
            customer_address: testOrder.customer.address,
            customer_email: testOrder.customer.email,
            customer_name: testOrder.customer.name,
            
            // Order info
            order_id: `TEST-${Date.now()}`,
            order_date: new Date(testOrder.date).toLocaleString(),
            payment_method: testOrder.paymentMethod,
            order_total: testOrder.total.toFixed(2),
            
            // Product details (from first item)
            product_style: formatStyle(firstItem.style || firstItem.name || ''),
            product_size: firstItem.size || '',
            product_color: firstItem.color || '',
            product_price: parseFloat(firstItem.price || 0).toFixed(2),
            
            // Image URLs (fallback if attachments don't work)
            product_image: firstItem.imageUrl || 'https://via.placeholder.com/200x200?text=Design',
            mockup_image: firstItem.previewImageUrl || 'https://via.placeholder.com/200x200?text=Mockup',
            
            // HTML items list for table display
            items_list: itemsList,
            
            // Email content
            subject: 'Test Invoice Email',
            from_name: 'NextGenStudios',
            notification_type: 'Test Invoice',
            is_manual_request: 'true',
            
            // Order summary for text fallback
            order_summary: orderSummaryText
        };
        
        // Add file attachments if available (EmailJS Pro feature)
        if (designImageAttachment || mockupImageAttachment) {
            emailParams.attachments = [];
            
            if (designImageAttachment) {
                emailParams.attachments.push(designImageAttachment);
            }
            
            if (mockupImageAttachment) {
                emailParams.attachments.push(mockupImageAttachment);
            }
        }
        
        console.log("Email parameters:", JSON.stringify({
            ...emailParams,
            attachments: emailParams.attachments ? `${emailParams.attachments.length} attachment(s)` : 'none'
        }));
        
        // Check if EmailJS is properly initialized
        console.log("EmailJS Config:", {
            serviceId: config.emailjs.serviceId,
            templateId: config.emailjs.customerTemplateId,
            publicKey: emailjs._userID // Check if the public key is set
        });
        
        // Send test email directly
        return emailjs.send(config.emailjs.serviceId, config.emailjs.customerTemplateId, emailParams)
            .then(function(response) {
                console.log("Test invoice email sent successfully:", response);
                hideLoadingOverlay();
                showToast(`Test invoice email sent to ${testEmail}`, 'success');
            })
            .catch(function(error) {
                console.error("Test invoice email failed:", error);
                console.error("Error details:", {
                    name: error.name,
                    message: error.message,
                    text: error.text,
                    status: error.status,
                    stack: error.stack
                });
                hideLoadingOverlay();
                showToast(`Test failed: ${error.name || ''} ${error.message || ''} ${error.text || ''}`, 'error');
            });
    }
    
    // Execute the async function
    processTestEmailWithAttachments();
}

// Add a test invoice button in non-production environments
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.includes('preview')) {
    // Create invoice test button
    const testInvoiceButton = document.createElement('button');
    testInvoiceButton.innerText = 'Test Invoice Email';
    testInvoiceButton.style.position = 'fixed';
    testInvoiceButton.style.bottom = '70px';
    testInvoiceButton.style.right = '20px';
    testInvoiceButton.style.zIndex = '9999';
    testInvoiceButton.style.padding = '10px';
    testInvoiceButton.style.backgroundColor = '#8e44ad';
    testInvoiceButton.style.color = 'white';
    testInvoiceButton.style.border = 'none';
    testInvoiceButton.style.borderRadius = '4px';
    testInvoiceButton.style.cursor = 'pointer';
    
    // Add click event
    testInvoiceButton.addEventListener('click', testInvoiceEmail);
    
    // Add to the page
    document.body.appendChild(testInvoiceButton);
}

// Function for simple EmailJS test (minimal parameters)
function testSimpleEmail() {
    // Create simplified test parameters with explicit values for all fields
    const simpleParams = {
        // Customer info
        to_name: "Test Customer",
        to_email: "test@example.com",
        from_name: "NextGenStudios",
        subject: "Test Order Confirmation",
        
        // Customer details - explicit values
        customer_name: "Test Customer",
        customer_email: "test@example.com",
        customer_address: "123 Test Street, Test City, Test Country",
        
        // Order info - explicit values
        order_id: "ORD-" + Date.now(),
        order_date: new Date().toLocaleString(),
        payment_method: "PayPal",
        order_total: "29.99",
        
        // Product details - explicit values with clear content
        product_style: "Premium",
        product_size: "XL",
        product_color: "Black",
        product_price: "29.99",
        
        // Images - use public URLs for testing
        product_image: "https://via.placeholder.com/200x200?text=Design",
        mockup_image: "https://via.placeholder.com/200x200?text=Mockup",
        
        // Other required fields
        notification_type: "Order Confirmation",
        is_manual_request: "no",
        
        // Order summary
        order_summary: "Item 1:\nProduct: Custom Premium T-shirt\nSize: XL\nColor: Black\nPrice: $29.99",
        
        // HTML table items list for testing
        items_list: `
        <tr>
            <td>Item 1</td>
            <td>
                Custom Premium T-shirt<br>
                Size: XL<br>
                Color: Black
            </td>
            <td>$29.99</td>
        </tr>`
    };
    
    // Prompt for email to test with
    const testEmail = prompt("Enter email address for test (leave empty to use test@example.com):");
    if (testEmail && testEmail.includes('@')) {
        simpleParams.to_email = testEmail;
        simpleParams.customer_email = testEmail;
    }
    
    showLoadingOverlay('Sending test email...');
    
    // Process test images for attachments
    const processAttachments = async () => {
        try {
            let attachments = [];
            
            // Add test image attachments (for EmailJS Pro)
            const testImageUrls = [
                "https://via.placeholder.com/300x300?text=TestDesign",
                "https://via.placeholder.com/300x300?text=TestMockup"
            ];
            
            // Ask whether to test with attachments
            const useAttachments = confirm("Would you like to test with image attachments? (EmailJS Pro feature)");
            
            if (useAttachments) {
                for (let i = 0; i < testImageUrls.length; i++) {
                    try {
                        const response = await fetch(testImageUrls[i]);
                        const blob = await response.blob();
                        
                        // Check size - EmailJS Pro supports up to 2MB
                        if (blob.size <= 2 * 1024 * 1024) {
                            attachments.push({
                                name: `test_image_${i+1}.png`,
                                data: blob
                            });
                        } else {
                            console.warn(`Test image ${i+1} exceeds 2MB limit, skipping attachment`);
                        }
                    } catch (error) {
                        console.error(`Error processing test image ${i+1}:`, error);
                    }
                }
                
                // Add attachments to parameters if available
                if (attachments.length > 0) {
                    simpleParams.attachments = attachments;
                }
            }
            
            console.log('Sending test email with params:', JSON.stringify({
                ...simpleParams,
                attachments: simpleParams.attachments ? `${simpleParams.attachments.length} attachment(s)` : 'none'
            }));
            
            // Send the test email with direct template ID
            return emailjs.send(
                config.emailjs.serviceId,
                'template_pchevsq', // Use template ID directly 
                simpleParams,
                config.emailjs.userId
            );
        } catch (error) {
            throw error;
        }
    };
    
    // Process attachments and send email
    processAttachments()
        .then((response) => {
            console.log('Test email sent successfully:', response);
            hideLoadingOverlay();
            showModal('Test Email Sent', 'A test email has been sent successfully. Please check your inbox.');
        })
        .catch((error) => {
            console.error('Failed to send test email:', error);
            hideLoadingOverlay();
            showModal('Test Email Failed', 'Failed to send test email. Error: ' + JSON.stringify(error));
        });
}

// Convert an image URL to a data URL for email attachment
function convertImageToAttachment(imageUrl) {
    return new Promise((resolve, reject) => {
        try {
            // If it's already a data URL, just return it
            if (imageUrl.startsWith('data:')) {
                resolve(imageUrl);
                return;
            }
            
            // Create a new image element
            const img = new Image();
            
            // Setup onload handler
            img.onload = function() {
                try {
                    // Create canvas and get context
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set canvas dimensions to match image
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image on canvas
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to data URL
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl);
                } catch (err) {
                    console.error('Error converting image to data URL:', err);
                    reject(err);
                }
            };
            
            // Setup error handler
            img.onerror = function(err) {
                console.error('Error loading image for conversion:', err);
                reject(new Error('Failed to load image for conversion'));
            };
            
            // Set crossOrigin for external images (if it's a remote URL)
            if (imageUrl.startsWith('http')) {
                img.crossOrigin = 'anonymous';
            }
            
            // Start loading the image
            img.src = imageUrl;
        } catch (err) {
            console.error('Error in image conversion setup:', err);
            reject(err);
        }
    });
}

// Process item images for email
async function processItemImagesForEmail(items) {
    try {
        // Create a modified copy of the items
        const processedItems = JSON.parse(JSON.stringify(items));
        
        // Process each item
        for (let i = 0; i < processedItems.length; i++) {
            const item = processedItems[i];
            
            // Handle mockup/preview image
            if (item.previewImageUrl) {
                try {
                    const dataUrl = await convertImageToAttachment(item.previewImageUrl);
                    item.previewImageDataUrl = dataUrl;
                } catch (err) {
                    console.warn('Could not convert preview image, falling back to text-only', err);
                }
            }
            
            // Handle original design image
            if (item.imageUrl) {
                try {
                    const dataUrl = await convertImageToAttachment(item.imageUrl);
                    item.imageDataUrl = dataUrl;
                } catch (err) {
                    console.warn('Could not convert design image, falling back to text-only', err);
                }
            }
        }
        
        return processedItems;
    } catch (err) {
        console.error('Error processing images for email:', err);
        return items; // Return original items on error
    }
}

// Add this after the testSimpleEmail function

// Function for bare bones email test with minimal parameters
function testBasicEmail() {
    // Most minimal parameters possible
    const basicParams = {
        to_name: "Test Customer",
        to_email: "test@example.com",
        product_style: "Premium",
        product_size: "XL",
        product_color: "Black",
        product_price: "29.99"
    };
    
    // Prompt for email to test with
    const testEmail = prompt("Enter email address for test (leave empty to use test@example.com):");
    if (testEmail && testEmail.includes('@')) {
        basicParams.to_email = testEmail;
    }
    
    showLoadingOverlay('Sending basic test email...');
    
    console.log('Sending basic test email with params:', JSON.stringify(basicParams));
    
    // Show message about creating a basic template
    alert("Important: For this test to work, create a new template in EmailJS with ONLY the variables: to_name, product_style, product_size, product_color, and product_price. You can use the basic_email_template.html file for this.");
    
    // Prompt for template ID
    const templateId = prompt("Enter your EmailJS template ID (leave empty to use default 'template_pchevsq'):", "template_pchevsq");
    const finalTemplateId = templateId && templateId.trim() !== "" ? templateId : "template_pchevsq";
    
    // Send the test email with direct template ID and minimal parameters
    emailjs.send(
        config.emailjs.serviceId,
        finalTemplateId, 
        basicParams,
        config.emailjs.userId
    )
    .then((response) => {
        console.log('Basic test email sent successfully:', response);
        hideLoadingOverlay();
        showModal('Basic Test Email Sent', 'A basic test email has been sent successfully. Please check your inbox.');
    })
    .catch((error) => {
        console.error('Failed to send basic test email:', error);
        hideLoadingOverlay();
        showModal('Basic Test Email Failed', 'Failed to send basic test email. Error: ' + JSON.stringify(error));
    });
}

// Add a test button for the basic email test in non-production environments
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.includes('preview')) {
    // Create basic test button
    const basicTestButton = document.createElement('button');
    basicTestButton.innerText = 'Basic Email Test';
    basicTestButton.style.position = 'fixed';
    basicTestButton.style.bottom = '170px';
    basicTestButton.style.right = '20px';
    basicTestButton.style.zIndex = '9999';
    basicTestButton.style.padding = '10px';
    basicTestButton.style.backgroundColor = '#2ecc71';
    basicTestButton.style.color = 'white';
    basicTestButton.style.border = 'none';
    basicTestButton.style.borderRadius = '4px';
    basicTestButton.style.cursor = 'pointer';
    
    // Add click event
    basicTestButton.addEventListener('click', testBasicEmail);
    
    // Add to the page
    document.body.appendChild(basicTestButton);
}

// Convert an image URL to a data URL for email attachment
