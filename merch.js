// Merchandise System for Fantasy Prompt Generator
// Handles T-shirt customization, shopping cart, and checkout

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
    
    // Handle checkout button
    document.getElementById('checkoutBtn').addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        proceedToCheckout();
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
    
    // Add a nice container for PayPal button
    paypalButtonContainer.innerHTML = `
        <div class="paypal-button-wrapper">
            <div id="paypal-button-container"></div>
            <div class="payment-security-badge">
                <i class="fas fa-shield-alt"></i> Secure payment via PayPal
            </div>
        </div>
    `;
    
    // Add necessary styles
    if (!document.getElementById('paypal-button-styles')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'paypal-button-styles';
        styleEl.textContent = `
            .paypal-button-wrapper {
                margin-top: 1rem;
                padding: 0.75rem;
                background-color: #f5f7fa;
                border-radius: 8px;
                border: 1px solid #e0e6ed;
            }
            
            .payment-security-badge {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: 0.75rem;
                font-size: 0.85rem;
                color: var(--text-light);
            }
            
            .payment-security-badge i {
                margin-right: 6px;
                color: #0070ba;
            }
        `;
        document.head.appendChild(styleEl);
    }
    
    // Wait for PayPal script to be ready
    if (!window.paypal) {
        console.log('PayPal script not loaded, waiting for it to load...');
        setTimeout(initializePayPalButton, 500);
        return;
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    
    // Render the PayPal button
    window.paypal.Buttons({
        style: {
            layout: 'horizontal',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
        },
        
        createOrder: function(data, actions) {
            // Create the order with current cart items
            return actions.order.create({
                purchase_units: [{
                    amount: {
                        value: total.toFixed(2)
                    },
                    description: 'Custom T-shirt from Fantasy Prompt Generator',
                    payee: {
                        email_address: 'unkownrb@hotmail.com'
                    },
                    items: cart.map(item => ({
                        name: `Custom ${formatStyle(item.style)} T-shirt`,
                        unit_amount: {
                            value: parseFloat(item.price).toFixed(2),
                            currency_code: 'USD'
                        },
                        quantity: 1,
                        description: `Size: ${item.size}, Color: ${item.color}`
                    }))
                }]
            });
        },
        
        onApprove: function(data, actions) {
            // Show loading state
            const paypalBtn = document.getElementById('paypal-button-container');
            if (paypalBtn) {
                paypalBtn.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; padding: 1rem;">
                        <div class="loading-spinner" style="width: 24px; height: 24px; margin-right: 10px;"></div>
                        <span>Processing payment...</span>
                    </div>
                `;
            }
            
            // Capture the funds
            return actions.order.capture().then(function(details) {
                console.log('PayPal transaction completed', details);
                
                // Create order object for email
                const order = {
                    id: data.orderID,
                    date: new Date().toISOString(),
                    customer: {
                        name: details.payer.name.given_name + ' ' + details.payer.name.surname,
                        email: details.payer.email_address,
                        address: details.payer.address ? details.payer.address.address_line_1 : 'Address not provided'
                    },
                    items: cart,
                    total: total,
                    paymentMethod: 'PayPal'
                };
                
                // Send order details to email
                sendOrderToEmail(order).then(() => {
                    // Hide cart modal
                    document.getElementById('cartModal').style.display = 'none';
                    
                    // Show success message and reset cart
                    showOrderSuccessMessage('PayPal');
                    
                    // Clear the cart
                    cart = [];
                    saveCart();
                    updateCartBadge();
                });
            });
        },
        
        onError: function(err) {
            console.error('PayPal error:', err);
            const paypalBtn = document.getElementById('paypal-button-container');
            if (paypalBtn) {
                paypalBtn.innerHTML = `
                    <div style="color: #d32f2f; padding: 1rem; text-align: center; background-color: rgba(211, 47, 47, 0.1); border-radius: 6px;">
                        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
                        PayPal error. Please try again or use another payment method.
                    </div>
                `;
            }
        }
    }).render('#paypal-button-container');
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
                    baseImg.onload = function() {
                        // Only proceed if item hasn't been added yet
                        if (itemAdded) return;
                        itemAdded = true;
                        
                        // Draw the t-shirt base
                        mockupCtx.drawImage(baseImg, 0, 0, mockupCanvas.width, mockupCanvas.height);
                        
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
                    };
                    
                    // Get the current t-shirt base image
                    const tshirtStyle = document.getElementById('tshirtStyle').value;
                    const tshirtColor = document.getElementById('tshirtColor').value;
                    
                    // Use the appropriate t-shirt base image
                    const mockupBaseSrc = `./assets/tshirt-mockups/${tshirtStyle}-${tshirtColor}.png`;
                    // Fallback in case the exact mockup isn't available
                    baseImg.onerror = function() {
                        baseImg.src = './assets/tshirt-mockups/regular-black.png';
                        
                        // Second fallback to a simple colored rectangle if the image still fails
                        baseImg.onerror = function() {
                            // Only proceed if item hasn't been added yet
                            if (itemAdded) return;
                            
                            // Simply proceed with design on a colored background
                            mockupCtx.fillStyle = color === 'black' ? '#000000' : color === 'white' ? '#ffffff' : '#aaaaaa';
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
        
        // Create a basic mockup using canvas
        try {
            // Create a simple canvas for a basic mockup
            const simpleCanvas = document.createElement('canvas');
            const simpleCtx = simpleCanvas.getContext('2d');
            simpleCanvas.width = 600;
            simpleCanvas.height = 600;
            
            // Set background color to match the t-shirt color
            simpleCtx.fillStyle = color === 'black' ? '#121212' : 
                                 color === 'white' ? '#f8f8f8' : 
                                 color === 'gray' ? '#888888' : 
                                 color === 'navy' ? '#1a2a5a' : 
                                 color === 'red' ? '#c13030' : '#f8f8f8';
            simpleCtx.fillRect(0, 0, simpleCanvas.width, simpleCanvas.height);
            
            // Draw a simple t-shirt outline
            simpleCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            simpleCtx.lineWidth = 2;
            
            // T-shirt neck
            simpleCtx.beginPath();
            simpleCtx.moveTo(250, 150);
            simpleCtx.quadraticCurveTo(300, 100, 350, 150);
            simpleCtx.stroke();
            
            // T-shirt shoulders
            simpleCtx.beginPath();
            simpleCtx.moveTo(250, 150);
            simpleCtx.lineTo(150, 200);
            simpleCtx.moveTo(350, 150);
            simpleCtx.lineTo(450, 200);
            simpleCtx.stroke();
            
            // Add text indicating this is a mockup
            simpleCtx.font = '16px Arial';
            simpleCtx.fillStyle = color === 'black' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
            simpleCtx.textAlign = 'center';
            simpleCtx.fillText(`Custom ${formatStyle(style)} T-shirt (${color.toUpperCase()})`, 300, 500);
            
            // Add text indicating design will be applied
            simpleCtx.font = '14px Arial';
            simpleCtx.fillText('Your design will be applied to this area', 300, 300);
            
            // Draw a placeholder for the design image (small version)
            const placeholderWidth = 100;
            const placeholderHeight = 100;
            simpleCtx.strokeStyle = color === 'black' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
            simpleCtx.strokeRect(300 - placeholderWidth/2, 300 - placeholderHeight/2, placeholderWidth, placeholderHeight);
            
            // Create a data URL for the mockup
            const mockupImageUrl = simpleCanvas.toDataURL('image/png');
            
            // Add the item to cart with both the design image and basic mockup
            cart.push({
                id: cartItemId,
                style: style,
                size: size,
                color: color,
                imageUrl: imageUrl,
                previewImageUrl: mockupImageUrl, // Use our simple mockup
                price: price,
                designPosition: designPosition,
                addedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error creating simple mockup:', error);
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
        }
        
        saveCart();
        updateCartBadge();
        showToast('Added custom T-shirt to cart!');
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

// Show a satisfying animation when item is added to cart
function showAddToCartAnimation(imageUrl) {
    try {
        // Create the animation element
        const animContainer = document.createElement('div');
        animContainer.style.position = 'fixed';
        animContainer.style.zIndex = '10000';
        animContainer.style.pointerEvents = 'none';
        
        // Create the flying image
        const img = document.createElement('img');
        img.src = imageUrl || './assets/default-tshirt.png'; // Fallback image if none provided
        img.style.width = '150px';
        img.style.height = '150px';
        img.style.objectFit = 'contain';
        img.style.position = 'absolute';
        img.style.borderRadius = '10px';
        img.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        img.style.transition = 'all 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
        
        // Handle image loading errors
        img.onerror = function() {
            // If image fails to load, use a colored box instead
            img.style.background = 'linear-gradient(135deg, #4a2c82, #753bbd)';
            img.style.display = 'flex';
            img.style.alignItems = 'center';
            img.style.justifyContent = 'center';
            img.src = ''; // Clear the src to stop loading attempts
            img.alt = 'T-shirt added to cart';
        };
        
        // Add the image to the container
        animContainer.appendChild(img);
        document.body.appendChild(animContainer);
        
        // Get positions for animation
        const startButton = document.getElementById('addCustomToCart');
        const endCart = document.querySelector('.cart-icon') || document.getElementById('viewCartBtn') || document.getElementById('cartIcon');
        
        if (!startButton || !endCart) {
            // Fallback if elements aren't found - still show animation from center of screen
            const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            
            // Set start position at center of screen
            img.style.top = `${viewportHeight/2 - 75}px`;
            img.style.left = `${viewportWidth/2 - 75}px`;
            img.style.transform = 'scale(1) rotate(0deg)';
            img.style.opacity = '1';
            
            // Animate to top right corner
            setTimeout(() => {
                img.style.top = '20px';
                img.style.right = '20px';
                img.style.transform = 'scale(0.2) rotate(10deg)';
                img.style.opacity = '0';
                
                // Clean up and show toast
                setTimeout(() => {
                    if (document.body.contains(animContainer)) {
                        document.body.removeChild(animContainer);
                    }
                    showToast('Added custom T-shirt to cart!', 'success');
                }, 800);
            }, 100);
            
            return;
        }
        
        // Get element positions
        const startRect = startButton.getBoundingClientRect();
        const endRect = endCart.getBoundingClientRect();
        
        // Set start position
        img.style.top = `${startRect.top + startRect.height/2 - 75}px`;
        img.style.left = `${startRect.left + startRect.width/2 - 75}px`;
        img.style.transform = 'scale(1) rotate(0deg)';
        img.style.opacity = '1';
        
        // Trigger animation after a small delay
        setTimeout(() => {
            // Set end position
            img.style.top = `${endRect.top + endRect.height/2 - 20}px`;
            img.style.left = `${endRect.left + endRect.width/2 - 20}px`;
            img.style.transform = 'scale(0.2) rotate(10deg)';
            img.style.opacity = '0';
            
            // Add a bounce effect to the cart
            endCart.style.transition = 'transform 0.3s ease-in-out';
            endCart.style.transform = 'scale(1.2)';
            setTimeout(() => {
                endCart.style.transform = 'scale(1)';
            }, 300);
            
            // Update cart badge immediately to show instant feedback
            updateCartBadge();
            
            // Show success message after animation completes
            setTimeout(() => {
                if (document.body.contains(animContainer)) {
                    document.body.removeChild(animContainer);
                }
                showToast('Added custom T-shirt to cart!', 'success');
            }, 800);
        }, 100);
    } catch (error) {
        console.error('Error in cart animation:', error);
        // Ensure we still show confirmation even if animation fails
        showToast('Added custom T-shirt to cart!', 'success');
    }
}

// Show toast notification with enhanced styling
function showToast(message, type = 'info') {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Create and append new toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    toast.style.backgroundColor = type === 'success' ? 'var(--success)' : type === 'error' ? '#e53935' : 'var(--primary)';
    toast.style.color = 'white';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '1100';
    toast.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    toast.style.fontWeight = '500';
    toast.style.transition = 'all 0.3s ease-out';
    toast.style.opacity = '0';
    toast.style.maxWidth = '80%';
    toast.style.textAlign = 'center';
    
    // Add icon based on type
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
    icon.style.marginRight = '8px';
    
    toast.appendChild(icon);
    toast.appendChild(document.createTextNode(message));
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
            
            // Remove from DOM after fade out
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
    // Find the item index in the cart
    const itemIndex = cart.findIndex(item => item.id === cartItemId);
    
    if (itemIndex !== -1) {
        // Remove the item from the cart
        cart.splice(itemIndex, 1);
        
        saveCart();
        updateCartBadge();
        renderCartItems();
        
        // Show confirmation message
        showToast('Item removed from cart!');
    }
}

// Save cart to local storage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart badge with current count
function updateCartBadge() {
    // Make sure cartBadge exists
    if (!cartBadge) return;
    
    // Update both badges (header and floating)
    cartBadge.textContent = cart.length;
    cartBadge.style.display = cart.length > 0 ? 'flex' : 'none';
    
    // Update header cart badge
    const headerCartBadge = document.getElementById('headerCartBadge');
    if (headerCartBadge) {
        headerCartBadge.textContent = cart.length;
    }
}

// Render cart items in the modal with enhanced visual presentation
function renderCartItems() {
    const cartItemsElement = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cart.length === 0) {
        cartItemsElement.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
                <button class="btn btn-secondary" onclick="document.getElementById('cartModal').style.display='none'">
                    Continue Shopping
                </button>
            </div>
        `;
        cartTotalElement.textContent = '$0.00';
        return;
    }
    
    let totalPrice = 0;
    let cartHtml = '';
    
    // Add a cart header with column labels
    cartHtml += `
        <div class="cart-items-header">
            <span class="item-count">${cart.length} item${cart.length > 1 ? 's' : ''} in your cart</span>
            <div class="cart-header-actions">
                <button class="btn-link" onclick="cart = []; saveCart(); updateCartBadge(); renderCartItems();">
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
        
        cartHtml += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.previewImageUrl || item.imageUrl}" alt="${style} design" 
                         style="width: 100%; height: 100%; object-fit: contain; border-radius: 6px;">
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
    
    // Add a style tag for cart item styling enhancements
    cartHtml = `
        <style>
            .cart-items-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 15px;
                margin-bottom: 15px;
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
                padding: 0;
                font-size: 0.9rem;
                transition: color 0.2s;
            }
            
            .btn-link:hover {
                color: #e53935;
            }
            
            .cart-item {
                display: flex;
                margin-bottom: 1.2rem;
                padding-bottom: 1.2rem;
                border-bottom: 1px solid var(--border);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .cart-item:hover {
                background-color: rgba(0,0,0,0.02);
            }
            
            .cart-item-image {
                width: 90px;
                height: 90px;
                border-radius: 8px;
                overflow: hidden;
                background-color: var(--secondary);
                margin-right: 1rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .cart-item-title {
                font-weight: 600;
                font-size: 1.05rem;
                margin-bottom: 0.5rem;
                color: var(--text);
            }
            
            .cart-item-variant {
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .variant-label {
                color: var(--text-light);
            }
            
            .variant-value {
                font-weight: 500;
                color: var(--text);
            }
            
            .variant-separator {
                color: var(--text-light);
                margin: 0 2px;
            }
            
            .cart-item-customization {
                font-size: 0.85rem;
                margin-bottom: 0.7rem;
                background-color: var(--secondary);
                padding: 0.3rem 0.7rem;
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                color: var(--primary);
                font-weight: 500;
            }
            
            .cart-item-price {
                font-weight: 600;
                color: var(--primary);
                font-size: 1.1rem;
                margin-top: 0.3rem;
            }
            
            .cart-item-remove {
                background: transparent;
                border: none;
                color: var(--text-light);
                cursor: pointer;
                font-size: 0.85rem;
                margin-top: 0.5rem;
                padding: 0.3rem 0;
                display: flex;
                align-items: center;
                transition: color 0.2s;
            }
            
            .cart-item-remove:hover {
                color: #e53935;
            }
            
            .cart-item-remove i {
                margin-right: 0.4rem;
            }
            
            /* Animation for removing items */
            .removing-item {
                transform: translateX(100%);
                opacity: 0;
            }
        </style>
    ` + cartHtml;
    
    // Add a cart summary with enhanced styling
    cartHtml += `
        <div class="cart-summary-details" style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${totalPrice.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>FREE</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span>$${totalPrice.toFixed(2)}</span>
            </div>
        </div>
        
        <style>
            .cart-summary-details {
                margin-bottom: 1rem;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.7rem;
                font-size: 0.95rem;
            }
            
            .summary-row.total {
                font-size: 1.2rem;
                font-weight: 600;
                color: var(--primary);
                margin-top: 0.7rem;
                padding-top: 0.7rem;
                border-top: 1px dashed var(--border);
            }
        </style>
    `;
    
    cartItemsElement.innerHTML = cartHtml;
    cartTotalElement.textContent = `$${totalPrice.toFixed(2)}`;
    
    // Add hover animations
    document.querySelectorAll('.cart-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Remove item from cart with animation
function removeFromCartWithAnimation(cartItemId) {
    // Find the cart item element
    const cartItemElement = document.querySelector(`.cart-item[data-id="${cartItemId}"]`);
    
    if (cartItemElement) {
        // Add the animation class
        cartItemElement.classList.add('removing-item');
        
        // Wait for animation to complete before actually removing
        setTimeout(() => {
            removeFromCart(cartItemId);
        }, 300);
    } else {
        // Fallback if element not found
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
}

// Update the preview in real-time
function updatePreview() {
    const tshirtPreview = document.getElementById('tshirtPreview');
    const tshirtStyle = document.getElementById('tshirtStyle').value;
    const tshirtColor = document.getElementById('tshirtColor').value;
    const tshirtSize = document.getElementById('tshirtSize').value;
    
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
    
    if (tshirtColor === 'white' || tshirtColor === 'gray') {
        // For white/light shirts
        tshirtPreview.style.filter = 'brightness(0.95) contrast(1.1)';
        
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
        
        // Use normal blend mode but with lower opacity for light shirts
        tshirtPreview.style.mixBlendMode = 'normal';
        tshirtPreview.style.opacity = '0.9';
    } else {
        // For black/dark shirts
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
        
        // Screen blending works well on dark backgrounds
        tshirtPreview.style.mixBlendMode = 'screen';
        tshirtPreview.style.opacity = '0.85';
        
        // Basic enhancement for visibility
        tshirtPreview.style.filter = 'brightness(1.05) contrast(1.1)';
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
    
    // Set up GitHub CDN fallback URLs that are guaranteed to work
    const githubUrls = {
        'regular': 'https://raw.githubusercontent.com/codesnippetsio/t-shirt-mockups/main/black-tshirt.png',
        'croptop': 'https://raw.githubusercontent.com/codesnippetsio/t-shirt-mockups/main/black-croptop.png',
        'longsleeve': 'https://raw.githubusercontent.com/codesnippetsio/t-shirt-mockups/main/black-longsleeve.png',
        'vneck': 'https://raw.githubusercontent.com/codesnippetsio/t-shirt-mockups/main/black-vneck.png'
    };
    
    // Use the GitHub URL directly since we're restricting to black shirts
    const fallbackUrl = githubUrls[style] || githubUrls.regular;
    tshirtBase.style.backgroundImage = `url('${fallbackUrl}')`;
    
    // Log which image we're using
    console.log("Using t-shirt style:", style, "with image:", fallbackUrl);
    
    // Adjust design positioning based on style
    const designPosition = getDesignPosition(style);
    tshirtPreview.style.top = designPosition.top;
    tshirtPreview.style.width = designPosition.width;
    
    // Apply current color to update the image
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
    if (tshirtImage) {
        if (color === 'white' || color === 'gray') {
            tshirtImage.style.filter = 'none';
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

// Get hex code for color name
function getColorHex(color) {
    const colorMap = {
        'white': '#ffffff',
        'black': '#000000',
        'gray': '#888888',
        'navy': '#001f3f',
        'purple': '#800080'
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
    if (window.paypal) {
        window.paypal.Buttons({
            createOrder: function(data, actions) {
                // Set up the transaction
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: total.toFixed(2)
                        },
                        description: 'Custom T-shirt from Fantasy Prompt Generator',
                        payee: {
                            email_address: 'unkownrb@hotmail.com'
                        }
                    }]
                });
            },
            onApprove: function(data, actions) {
                // Capture the funds from the transaction
                return actions.order.capture().then(function(details) {
                    console.log('Transaction completed by: ' + details.payer.name.given_name);
                    
                    // Create order object for email
                    const order = {
                        id: data.orderID,
                        date: new Date().toISOString(),
                        customer: {
                            name: details.payer.name.given_name + ' ' + details.payer.name.surname,
                            email: details.payer.email_address,
                            address: details.payer.address ? details.payer.address.address_line_1 : 'Address not provided'
                        },
                        items: cart,
                        total: total,
                        paymentMethod: 'PayPal'
                    };
                    
                    // Send order details to email
                    sendOrderToEmail(order).then(() => {
                        // Hide cart modal
                        document.getElementById('cartModal').style.display = 'none';
                        
                        // Show success message and reset cart
                        showOrderSuccessMessage('PayPal');
                        
                        // Clear the cart
                        cart = [];
                        saveCart();
                        updateCartBadge();
                    });
                });
            },
            onError: function(err) {
                console.error('PayPal error:', err);
                alert('There was an error processing your PayPal payment. Please try again.');
            }
        }).render('#paypalCheckoutButton');
    } else {
        document.getElementById('paypalCheckoutButton').innerHTML = '<div class="error-message">PayPal SDK failed to load. Please try the credit card option instead.</div>';
    }
    
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
function sendOrderToEmail(order) {
    // Create a professional-looking order representation with the design images
    let orderHTML = `
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; border:1px solid #ddd;">
            <thead style="background-color:#f5f5f5;">
                <tr>
                    <th style="padding:10px; border:1px solid #ddd;">Item</th>
                    <th style="padding:10px; border:1px solid #ddd;">Size</th>
                    <th style="padding:10px; border:1px solid #ddd;">Color</th>
                    <th style="padding:10px; border:1px solid #ddd;">Price</th>
                    <th style="padding:10px; border:1px solid #ddd;">Design</th>
                    <th style="padding:10px; border:1px solid #ddd;">Mockup</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add each item to the email with improved styling
    order.items.forEach(item => {
        // Get design position info in a readable format
        const designInfo = item.designPosition ? `Position: ${Math.round(item.designPosition.x)}x${Math.round(item.designPosition.y)}, Scale: ${Math.round(item.designPosition.scale)}%, Rotation: ${Math.round(item.designPosition.rotation)}°` : 'Default position';
        
        orderHTML += `
            <tr>
                <td style="padding:10px; border:1px solid #ddd;"><strong>Custom ${formatStyle(item.style)} T-shirt</strong></td>
                <td style="padding:10px; border:1px solid #ddd;">${item.size}</td>
                <td style="padding:10px; border:1px solid #ddd;">${item.color}</td>
                <td style="padding:10px; border:1px solid #ddd;">$${parseFloat(item.price).toFixed(2)}</td>
                <td style="padding:10px; border:1px solid #ddd; text-align:center;">
                    <div style="margin-bottom:5px;"><strong>Original Design</strong></div>
                    <img src="${item.imageUrl}" width="150" alt="Design" style="border-radius:4px; border:1px solid #eee; display:block; margin:0 auto;">
                    <div style="margin-top:5px; font-size:11px; color:#666;">${designInfo}</div>
                </td>
                <td style="padding:10px; border:1px solid #ddd; text-align:center;">
                    <div style="margin-bottom:5px;"><strong>T-shirt Preview</strong></div>
                    <img src="${item.previewImageUrl}" width="150" alt="T-shirt Mockup" style="border-radius:4px; border:1px solid #eee; display:block; margin:0 auto;">
                </td>
            </tr>
        `;
    });
    
    // Add order total row
    orderHTML += `
            </tbody>
            <tfoot style="background-color:#f9f9f9;">
                <tr>
                    <td colspan="3" style="padding:10px; border:1px solid #ddd; text-align:right;"><strong>Order Total:</strong></td>
                    <td colspan="3" style="padding:10px; border:1px solid #ddd;"><strong>$${order.total.toFixed(2)}</strong></td>
                </tr>
            </tfoot>
        </table>
        <div style="font-size:12px; color:#666; margin-top:10px; margin-bottom:20px;">
            Note: The T-shirt mockup shows an approximation of how your design will appear on the shirt. The actual product may vary slightly.
        </div>
    `;
    
    // Create loading overlay while email is sent
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-overlay fade-in';
        loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Processing your order...</p>
            <span style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-light);">This may take a few moments</span>
        `;
        checkoutModal.appendChild(loadingIndicator);
    }
    
    // Create customer-focused message
    const customerMessage = `
        <p style="margin-bottom: 15px;">Thank you for your order! We've received your payment and are processing your custom merchandise.</p>
        <p style="margin-bottom: 25px;">Your items will be shipped to the address provided. If you have any questions, please contact us at aicardgen_business@outlook.com</p>
    `;
    
    // Create business-focused message
    const businessMessage = `
        <p style="margin-bottom: 15px;">A new order has been received and requires processing.</p>
        <p style="margin-bottom: 25px;">Please review the order details below and prepare for shipping.</p>
    `;
    
    // Prepare parameters for EmailJS - Customer Receipt
    const customerTemplateParams = {
        // Standard EmailJS email parameters
        to_name: order.customer.name,
        email: order.customer.email,
        from_name: 'AI Card Generator',
        from_email: 'no-reply@aicardgen.com',
        reply_to: 'aicardgen_business@outlook.com',
        subject: `Your Order #${order.id} Confirmation`,
        
        // Split content into separate parameters to avoid HTML rendering issues
        greeting_message: "Thank you for your order! We've received your payment and are processing your custom merchandise.",
        shipping_message: "Your items will be shipped to the address provided. If you have any questions, please contact us at aicardgen_business@outlook.com",
        order_items_html: encodeURIComponent(orderHTML), // Encode HTML to prevent rendering issues
        order_id: order.id,
        order_date: new Date(order.date).toLocaleString(),
        customer_name: order.customer.name,
        customer_email: order.customer.email,
        customer_address: order.customer.address,
        payment_method: order.paymentMethod,
        order_total: order.total.toFixed(2)
    };
    
    // Prepare parameters for EmailJS - Business Notification
    const businessTemplateParams = {
        // Standard EmailJS email parameters
        to_name: 'Merchandise Team',
        email: 'aicardgen_business@outlook.com',
        from_name: 'AI Card Generator Shop',
        from_email: 'no-reply@aicardgen.com',
        reply_to: order.customer.email,
        subject: `New Order #${order.id} Received`,
        
        // Split content into separate parameters to avoid HTML rendering issues
        greeting_message: "A new order has been received and requires processing.",
        shipping_message: "Please review the order details below and prepare for shipping.",
        order_items_html: encodeURIComponent(orderHTML), // Encode HTML to prevent rendering issues
        order_id: order.id,
        order_date: new Date(order.date).toLocaleString(),
        customer_name: order.customer.name,
        customer_email: order.customer.email,
        customer_address: order.customer.address,
        payment_method: order.paymentMethod,
        order_total: order.total.toFixed(2)
    };
    
    console.log('Sending customer email with parameters:', customerTemplateParams);
    console.log('Sending business email with parameters:', businessTemplateParams);
    
    // Return a promise that resolves when both emails have been sent
    return new Promise((resolve, reject) => {
        // Send the customer receipt email
        emailjs.send('service_fcsd7gr', 'template_pchevsq', customerTemplateParams)
            .then(function(response) {
                console.log('Customer email successfully sent!', response);
                
                // Then send the business notification email
                emailjs.send('service_fcsd7gr', 'template_pchevsq', businessTemplateParams)
                    .then(function(response) {
                        console.log('Business email successfully sent!', response);
                        if (checkoutModal) {
                            checkoutModal.remove();
                        }
                        resolve(true); // Both emails sent successfully
                    }, function(error) {
                        console.error('Business email sending failed:', error);
                        // Still continue even if business email fails
                        if (checkoutModal) {
                            checkoutModal.remove();
                        }
                        resolve(true);
                    });
                    
            }, function(error) {
                console.error('Customer email sending failed:', error);
                // Log the error but still let order complete
                if (checkoutModal) {
                    checkoutModal.remove();
                }
                showToast('Your order was processed, but there was an issue sending the order confirmation. Our team has been notified.', 'warning');
                resolve(false);
            });
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
    // Create a folder structure for mockups if it doesn't exist already
    const mockupDir = 'assets/tshirt-mockups';
    
    // For each style and color combination, ensure we have a base mockup
    const styles = ['regular', 'croptop', 'longsleeve', 'vneck'];
    const colors = ['black', 'white', 'gray'];
    
    // Check if we need to create any placeholder images
    let mocksExist = false;
    
    // Try to load an image to check if mockups exist
    const testImg = new Image();
    testImg.onload = function() {
        mocksExist = true;
        console.log('Mockup images exist, no need to create placeholders');
    };
    
    testImg.onerror = function() {
        console.log('Creating placeholder mockups for shirts');
        createPlaceholderMockups();
    };
    
    // Try to load a test image
    testImg.src = `${mockupDir}/regular-black.png`;
}

// Create placeholder mockups if real ones aren't available
function createPlaceholderMockups() {
    // Create canvas-based placeholders for t-shirt mockups
    const styles = ['regular', 'croptop', 'longsleeve', 'vneck'];
    const colors = ['black'];  // For now only supporting black shirts
    
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
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();
        
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

// Add a function to test EmailJS at the end of the file
function testEmailJSSetup() {
    console.log("Testing EmailJS setup...");
    
    // Create a realistic test HTML that shows both design and mockup
    const testHTML = `
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; border:1px solid #ddd;">
            <thead style="background-color:#f5f5f5;">
                <tr>
                    <th style="padding:10px; border:1px solid #ddd;">Item</th>
                    <th style="padding:10px; border:1px solid #ddd;">Size</th>
                    <th style="padding:10px; border:1px solid #ddd;">Color</th>
                    <th style="padding:10px; border:1px solid #ddd;">Price</th>
                    <th style="padding:10px; border:1px solid #ddd;">Design</th>
                    <th style="padding:10px; border:1px solid #ddd;">Mockup</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding:10px; border:1px solid #ddd;"><strong>Custom Regular T-shirt</strong></td>
                    <td style="padding:10px; border:1px solid #ddd;">M</td>
                    <td style="padding:10px; border:1px solid #ddd;">Black</td>
                    <td style="padding:10px; border:1px solid #ddd;">$29.99</td>
                    <td style="padding:10px; border:1px solid #ddd; text-align:center;">
                        <div style="margin-bottom:5px;"><strong>Original Design</strong></div>
                        <img src="https://placehold.co/300x300/e0d8f0/4a2c82?text=Test+Design" width="150" alt="Design" style="border-radius:4px; border:1px solid #eee; display:block; margin:0 auto;">
                    </td>
                    <td style="padding:10px; border:1px solid #ddd; text-align:center;">
                        <div style="margin-bottom:5px;"><strong>T-shirt Preview</strong></div>
                        <img src="https://placehold.co/300x300/121212/e0d8f0?text=Mockup" width="150" alt="T-shirt Mockup" style="border-radius:4px; border:1px solid #eee; display:block; margin:0 auto;">
                    </td>
                </tr>
            </tbody>
            <tfoot style="background-color:#f9f9f9;">
                <tr>
                    <td colspan="3" style="padding:10px; border:1px solid #ddd; text-align:right;"><strong>Order Total:</strong></td>
                    <td colspan="3" style="padding:10px; border:1px solid #ddd;"><strong>$29.99</strong></td>
                </tr>
            </tfoot>
        </table>
        <div style="font-size:12px; color:#666; margin-top:10px; margin-bottom:20px;">
            Note: The T-shirt mockup shows an approximation of how your design will appear on the shirt. The actual product may vary slightly.
        </div>
    `;
    
    const testParams = {
        to_name: "Test User",
        email: "aicardgen_business@outlook.com", // Use your business email for testing
        from_name: "AI Card Generator Test",
        from_email: "no-reply@aicardgen.com",
        reply_to: "aicardgen_business@outlook.com",
        subject: "Test Email with HTML Rendering",
        
        // Split content into separate parameters
        greeting_message: "This is a test email to check HTML rendering of T-shirt orders.",
        shipping_message: "Below is a sample of how your order will appear in confirmation emails.",
        order_items_html: encodeURIComponent(testHTML),
        order_id: "TEST-" + Date.now().toString().slice(-6),
        order_date: new Date().toLocaleString(),
        customer_name: "Test Customer",
        customer_email: "test@example.com",
        customer_address: "123 Test St, Test City",
        payment_method: "Test Payment",
        order_total: "29.99"
    };
    
    console.log("Sending test email with parameters:", testParams);
    
    // Add a loading indicator
    const loadingToast = showToast('Sending test email...', 'info', 0);
    
    emailjs.send('service_fcsd7gr', 'template_pchevsq', testParams)
        .then(function(response) {
            console.log('Test email successfully sent!', response);
            // Remove the loading toast
            if (loadingToast) {
                loadingToast.remove();
            }
            showToast('Test email sent successfully. Please check your inbox.', 'success');
        }, function(error) {
            console.error('Test email sending failed:', error);
            // Remove the loading toast
            if (loadingToast) {
                loadingToast.remove();
            }
            showToast('Test email failed to send. Error: ' + (error.text || error.message || 'Unknown error'), 'error');
        });
}

function decodeOrderHTML() {
    // This is a helper function you can add to your EmailJS template
    // Create a script tag with this function in your EmailJS template
    const encoded = document.getElementById('encoded-html').textContent;
    const decoded = decodeURIComponent(encoded);
    document.getElementById('order-table-container').innerHTML = decoded;
}

// Uncomment the line below to run the test when the page loads
// window.addEventListener('load', testEmailJSSetup);

// Add a visible test button when not in production
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '') {
    window.addEventListener('load', function() {
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
        
        // Add hover effect
        testButton.onmouseover = function() {
            this.style.backgroundColor = '#6b42b8';
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
    });
}