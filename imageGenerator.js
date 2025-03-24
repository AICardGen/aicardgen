// Image Generator Script
document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the elements
    const generateImageBtn = document.getElementById('generateImageBtn');
    const imagePreview = document.getElementById('imagePreview');
    
    // Together.ai elements
    const togetherApiBtn = document.getElementById('togetherApiBtn');
    const aiHordeApiBtn = document.getElementById('aiHordeApiBtn');
    const togetherApiSettings = document.getElementById('togetherApiSettings');
    const aiHordeApiSettings = document.getElementById('aiHordeApiSettings');
    const currentApiInfo = document.getElementById('currentApiInfo');
    
    // API key inputs and buttons
    const togetherApiKeyInput = document.getElementById('togetherApiKeyInput');
    const applyTogetherApiKeyBtn = document.getElementById('applyTogetherApiKeyBtn');
    const aiHordeApiKeyInput = document.getElementById('aiHordeApiKeyInput');
    const applyAiHordeApiKeyBtn = document.getElementById('applyAiHordeApiKeyBtn');
    const aiHordeModelSelect = document.getElementById('aiHordeModelSelect');
    
    // NSFW toggle
    const nsfwToggle = document.getElementById('nsfwToggle');
    
    // Set default API service
    let currentApiService = localStorage.getItem('currentApiService') || 'together';
    updateApiServiceUI();
    
    // Check if we're returning from the merch page
    const preserveState = sessionStorage.getItem('generatorStatePreserved') === 'true';
    
    // Check if NSFW toggle state exists in localStorage
    const nsfwEnabled = localStorage.getItem('nsfwEnabled') === 'true';
    if (nsfwToggle) {
        nsfwToggle.checked = nsfwEnabled;
    }
    
    // Add event listener for NSFW toggle
    if (nsfwToggle) {
        nsfwToggle.addEventListener('change', function() {
            localStorage.setItem('nsfwEnabled', nsfwToggle.checked);
        });
    }
    
    // Check if API keys exist in localStorage and populate the input fields
    const savedTogetherApiKey = localStorage.getItem('togetherApiKey');
    if (savedTogetherApiKey) {
        togetherApiKeyInput.value = savedTogetherApiKey;
    }
    
    const savedAiHordeApiKey = localStorage.getItem('aiHordeApiKey');
    if (savedAiHordeApiKey) {
        aiHordeApiKeyInput.value = savedAiHordeApiKey;
        fetchAiHordeModels(savedAiHordeApiKey);
    }
    
    // Check for preserved image
    if (preserveState) {
        const savedImageUrl = sessionStorage.getItem('currentGeneratedImage');
        if (savedImageUrl) {
            // Create an image element to display the saved image
            const img = document.createElement('img');
            img.src = savedImageUrl;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            
            // Clear existing content and add the image
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
            imagePreview.style.display = 'block';
            
            // Get entity name if available
            let entityName = '';
            const entityNameElement = document.getElementById('entityName');
            if (entityNameElement) {
                entityName = entityNameElement.innerText;
            }
            
            // Make sure image is saved with entity name
            saveGeneratedImageForMerch(savedImageUrl, entityName);
            
            // Add notification about automatic merch save
            const merchNotification = document.createElement('div');
            merchNotification.className = 'merch-notification';
            
            merchNotification.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.1rem; margin-right: 0.8rem;"></i>
                    <span>Image automatically saved to <a href="merch.html" style="color: var(--primary); font-weight: 600; text-decoration: none; transition: all 0.2s ease;">Merchandise</a></span>
                </div>
            `;
            
            // Apply enhanced styling to make it match the rest of the UI
            merchNotification.style.marginTop = '1.25rem';
            merchNotification.style.textAlign = 'center';
            merchNotification.style.padding = '0.85rem 1rem';
            merchNotification.style.backgroundColor = 'var(--card-bg, white)';
            merchNotification.style.color = 'var(--text, #333)';
            merchNotification.style.borderRadius = '8px';
            merchNotification.style.fontSize = '0.95rem';
            merchNotification.style.fontWeight = '500';
            merchNotification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            merchNotification.style.border = '1px solid var(--border, #e0d8f0)';
            merchNotification.style.transition = 'all 0.3s ease';
            
            // Add notification after the image
            imagePreview.appendChild(merchNotification);
        }
        
        // Clear the preserved state flag
        sessionStorage.removeItem('generatorStatePreserved');
    }
    
    // Load saved AI Horde model if exists
    const savedAiHordeModel = localStorage.getItem('aiHordeModel');
    if (savedAiHordeModel) {
        // Will be selected after models are loaded
    }
    
    // Add event listeners for API service toggle
    togetherApiBtn.addEventListener('click', function() {
        currentApiService = 'together';
        localStorage.setItem('currentApiService', currentApiService);
        updateApiServiceUI();
    });
    
    aiHordeApiBtn.addEventListener('click', function() {
        currentApiService = 'aihorde';
        localStorage.setItem('currentApiService', currentApiService);
        updateApiServiceUI();
        
        // Fetch models if we have an API key
        const aiHordeApiKey = localStorage.getItem('aiHordeApiKey');
        if (aiHordeApiKey) {
            fetchAiHordeModels(aiHordeApiKey);
        }
    });
    
    // Add event listener for applying Together.ai API key
    applyTogetherApiKeyBtn.addEventListener('click', function() {
        const apiKey = togetherApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('togetherApiKey', apiKey);
            alert('Together.ai API key saved successfully!');
        } else {
            alert('Please enter a valid API key.');
        }
    });
    
    // Add event listener for applying AI Horde API key
    applyAiHordeApiKeyBtn.addEventListener('click', function() {
        const apiKey = aiHordeApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('aiHordeApiKey', apiKey);
            alert('AI Horde API key saved successfully!');
            fetchAiHordeModels(apiKey);
        } else {
            alert('Please enter a valid API key.');
        }
    });
    
    // Add event listener for AI Horde model selection
    aiHordeModelSelect.addEventListener('change', function() {
        const selectedModel = aiHordeModelSelect.value;
        if (selectedModel) {
            localStorage.setItem('aiHordeModel', selectedModel);
            updateApiServiceUI();
        }
    });
    
    // Add click event listener to the generate image button
    generateImageBtn.addEventListener('click', generateImage);
    
    // Function to update UI based on selected API service
    function updateApiServiceUI() {
        // Update toggle buttons
        togetherApiBtn.classList.toggle('active', currentApiService === 'together');
        aiHordeApiBtn.classList.toggle('active', currentApiService === 'aihorde');
        
        // Show/hide settings
        togetherApiSettings.classList.toggle('active', currentApiService === 'together');
        aiHordeApiSettings.classList.toggle('active', currentApiService === 'aihorde');
        
        // Update current API info
        if (currentApiService === 'together') {
            currentApiInfo.textContent = 'Currently using: Together.ai';
        } else {
            const modelName = localStorage.getItem('aiHordeModel') || 'No model selected';
            currentApiInfo.textContent = `Currently using: AI Horde (${modelName})`;
        }
    }
    
    // Function to fetch top 5 AI Horde models
    async function fetchAiHordeModels(apiKey) {
        try {
            aiHordeModelSelect.disabled = true;
            aiHordeModelSelect.innerHTML = '<option value="">Loading models...</option>';
            
            const response = await fetch('https://aihorde.net/api/v2/status/models?type=image', {
                headers: {
                    'apikey': apiKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Sort models by worker count (descending)
            const sortedModels = data.sort((a, b) => b.count - a.count);
            
            // Get top 5 models
            const topModels = sortedModels.slice(0, 5);
            
            // Clear and populate the select element
            aiHordeModelSelect.innerHTML = '';
            topModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = `${model.name} (${model.count} workers)`;
                aiHordeModelSelect.appendChild(option);
            });
            
            // Select previously saved model if exists
            const savedModel = localStorage.getItem('aiHordeModel');
            if (savedModel && topModels.some(m => m.name === savedModel)) {
                aiHordeModelSelect.value = savedModel;
            } else if (topModels.length > 0) {
                // Otherwise select the first model
                aiHordeModelSelect.value = topModels[0].name;
                localStorage.setItem('aiHordeModel', topModels[0].name);
            }
            
            aiHordeModelSelect.disabled = false;
            updateApiServiceUI();
            
        } catch (error) {
            console.error('Error fetching AI Horde models:', error);
            aiHordeModelSelect.innerHTML = '<option value="">Failed to load models</option>';
            aiHordeModelSelect.disabled = true;
        }
    }
    
    // Function to generate an image based on the current prompt
    async function generateImage() {
        // Check if we have a current prompt
        const imagePrompt = document.getElementById('imagePrompt').innerText;
        
        if (!imagePrompt) {
            alert('Please generate prompts first!');
            return;
        }

        // Check if API keys are set based on the current service
        if (currentApiService === 'together') {
            const apiKey = localStorage.getItem('togetherApiKey');
            if (!apiKey) {
                alert('Please enter and apply your Together.ai API key first.');
                togetherApiKeyInput.focus();
                return;
            }
        } else { // AI Horde
            const apiKey = localStorage.getItem('aiHordeApiKey');
            if (!apiKey) {
                alert('Please enter and apply your AI Horde API key first.');
                aiHordeApiKeyInput.focus();
                return;
            }
            // Also check for model selection
            const selectedModel = localStorage.getItem('aiHordeModel');
            if (!selectedModel) {
                alert('Please select an AI Horde model first.');
                return;
            }
        }
        
        // Check if NSFW is enabled and modify prompt accordingly
        let finalPrompt = imagePrompt;
        if (nsfwToggle && nsfwToggle.checked) {
            finalPrompt = `NSFW, Nude, Adult, ${imagePrompt}`;
        }
        
        // Show loading state
        generateImageBtn.disabled = true;
        generateImageBtn.textContent = 'Generating...';
        
        // Show immediate visual feedback in the image preview area
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            // Clear previous content
            imagePreview.innerHTML = '';
            
            // Create a loading container with prominent styling
            const loadingContainer = document.createElement('div');
            loadingContainer.style.padding = '25px';
            loadingContainer.style.textAlign = 'center';
            loadingContainer.style.backgroundColor = 'var(--secondary, #f9f7ff)';
            loadingContainer.style.borderRadius = '8px';
            loadingContainer.style.marginBottom = '16px';
            loadingContainer.style.border = '1px solid var(--primary, #4a2c82)';
            loadingContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            
            // Create an animated icon and text
            loadingContainer.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <i class="fas fa-cog fa-spin" style="font-size: 2.5rem; color: var(--primary); margin-bottom: 15px;"></i>
                    <div style="font-weight: 600; font-size: 1.2rem; margin: 10px 0;">Generating Image...</div>
                </div>
                <div class="progress-bar-container" style="height: 12px; background-color: rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden; margin: 15px auto; width: 85%;">
                    <div class="progress-bar" style="height: 100%; width: 5%; background-color: var(--primary); border-radius: 6px; transition: width 0.5s ease-in-out;"></div>
                </div>
                <div style="font-size: 1rem; color: var(--text-light); margin-top: 10px;">This may take up to a minute...</div>
            `;
            
            // Make the image preview visible
            imagePreview.style.display = 'block';
            imagePreview.appendChild(loadingContainer);
            
            // Scroll to make the loading indicator visible
            imagePreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        try {
            if (currentApiService === 'together') {
                await generateWithTogether(finalPrompt);
            } else {
                await generateWithAiHorde(finalPrompt);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image: ' + (error.message || 'Unknown error'));
        } finally {
            // Reset button state
            generateImageBtn.disabled = false;
            generateImageBtn.textContent = 'Generate Image';
        }
    }
    
    // Function to generate image with Together.ai
    async function generateWithTogether(prompt) {
        // Get API key from localStorage
        const apiKey = localStorage.getItem('togetherApiKey');
        
        // Update the progress bar to show the request is being initiated
        updateProgressBar(10, 'Generating Image...');
        
        // Build the request
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'stabilityai/stable-diffusion-xl-base-1.0',
                prompt: prompt,
                negative_prompt: 'blurry, low quality, text, watermark, logo',
                height: 1024,
                width: 1024,
                steps: 25
            })
        };
        
        // Update progress to indicate request is being sent
        updateProgressBar(20, 'Generating Image...');
        
        // Create a progress simulation for the Together API (which doesn't provide progress updates)
        const progressInterval = startProgressSimulation();
        
        // Make API call
        try {
            updateProgressBar(30, 'Generating Image...');
            
            const response = await fetch('https://api.together.xyz/inference', requestOptions);
            
            if (!response.ok) {
                clearInterval(progressInterval);
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your Together.ai API key and try again.');
                } else {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
            }
            
            updateProgressBar(80, 'Generating Image...');
            
            const data = await response.json();
            
            if (!data.output || !data.output.data) {
                clearInterval(progressInterval);
                throw new Error('No image data returned from API');
            }
            
            // Set progress to 100% before displaying the image
            updateProgressBar(100, 'Image Complete!');
            
            // Clear the interval once the image is ready
            clearInterval(progressInterval);
            
            // Display the generated image
            setTimeout(() => {
                displayGeneratedImage(data.output.data);
            }, 500); // Short delay to show the completed progress bar
            
            console.log('Image generated successfully with Together.ai');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Error generating image with Together.ai:', error);
            alert('Failed to generate image: ' + error.message);
            throw error;
        }
    }
    
    // Helper function to update the progress bar
    function updateProgressBar(percentage, message = null) {
        const imagePreview = document.getElementById('imagePreview');
        if (!imagePreview) return;
        
        const progressBar = imagePreview.querySelector('.progress-bar');
        if (progressBar) {
            // Ensure we have a valid percentage value
            const safePercentage = isNaN(percentage) ? 0 : percentage;
            progressBar.style.width = `${safePercentage}%`;
            
            // Update the message if provided
            if (message) {
                const loadingText = imagePreview.querySelector('div[style*="font-weight: 600"]');
                if (loadingText) {
                    loadingText.textContent = message;
                }
            }
        }
    }
    
    // Helper function to simulate progress for APIs without progress updates
    function startProgressSimulation() {
        let progress = 30; // Starting progress after initial setup
        
        // Simulate gradual progress increases
        return setInterval(() => {
            // Increment progress by a small random amount
            if (progress < 80) { // Cap at 80% for final processing
                // Slower at the beginning, faster in the middle, slower towards the end
                const increment = progress < 50 ? 
                    Math.random() * 3 : // Slower at start
                    (progress < 70 ? Math.random() * 1.5 : Math.random() * 0.8); // Faster in middle, slower at end
                
                progress += increment;
                
                const messages = [
                    "Generating Image...",
                    "Creating artwork...",
                    "Painting your masterpiece...",
                    "Adding details...",
                    "Processing the image...",
                    "Almost there..."
                ];
                
                // Update progress bar without showing percentage
                updateProgressBar(
                    Math.min(Math.round(progress), 80),
                    messages[Math.floor((progress / 80) * messages.length)]
                );
            }
        }, 800);
    }
    
    // Function to display a generated image safely
    function displayGeneratedImage(imageData) {
        // Make sure imagePreview exists
        const imagePreview = document.getElementById('imagePreview');
        if (!imagePreview) {
            console.error('Image preview element not found');
            return;
        }
        
        // Clear the loading message or previous images
        imagePreview.innerHTML = '';
        
        // Create a new image element
        const img = new Image();
        
        // Set up error handling
        img.onerror = function() {
            console.error('Failed to load image: ', imageData ? (typeof imageData === 'string' ? imageData.substring(0, 30) + '...' : 'binary data') : 'no data');
            imagePreview.innerHTML = '<div class="error-message" style="padding: 20px; background-color: rgba(255,0,0,0.1); color: #d32f2f; border-radius: 8px; text-align: center;"><i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>Failed to load image. Please try again or check console for details.</div>';
        };
        
        // Set up success handling
        img.onload = function() {
            // Clear existing content and any error messages
            imagePreview.innerHTML = '';
            
            // Style the image
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            img.style.display = 'block';
            img.style.margin = '0 auto';
            
            // Add the image to the preview area
            imagePreview.appendChild(img);
            imagePreview.style.display = 'block';
            
            // Save image URL to session storage for persistence
            sessionStorage.setItem('currentGeneratedImage', img.src);
            
            // Get the entity name if available
            let entityName = '';
            const entityNameElement = document.getElementById('entityName');
            if (entityNameElement) {
                entityName = entityNameElement.innerText;
            }
            
            // Save the image to localStorage for merch
            saveGeneratedImageForMerch(img.src, entityName);
            
            // Add notification text about automatic merch save
            const merchNotification = document.createElement('div');
            merchNotification.className = 'merch-notification';
            
            merchNotification.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-check-circle" style="color: var(--success); font-size: 1.1rem; margin-right: 0.8rem;"></i>
                    <span>Image automatically saved to <a href="merch.html" style="color: var(--primary); font-weight: 600; text-decoration: none; transition: all 0.2s ease;">Merchandise</a></span>
                </div>
            `;
            
            // Apply enhanced styling to make it match the rest of the UI
            merchNotification.style.marginTop = '1.25rem';
            merchNotification.style.textAlign = 'center';
            merchNotification.style.padding = '0.85rem 1rem';
            merchNotification.style.backgroundColor = 'var(--card-bg, white)';
            merchNotification.style.color = 'var(--text, #333)';
            merchNotification.style.borderRadius = '8px';
            merchNotification.style.fontSize = '0.95rem';
            merchNotification.style.fontWeight = '500';
            merchNotification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            merchNotification.style.border = '1px solid var(--border, #e0d8f0)';
            merchNotification.style.transition = 'all 0.3s ease';
            
            // Add notification after the image
            imagePreview.appendChild(merchNotification);
            
            // Scroll to the image
            imagePreview.scrollIntoView({ behavior: 'smooth' });
        };
        
        // Log helpful debugging info
        console.log('Setting image source with data length:', 
                    typeof imageData === 'string' ? 
                    (imageData.startsWith('data:') ? 'data:URL' : imageData.substring(0, 30) + '...') : 
                    'unknown format');
        
        // Verify we have valid image data before setting src
        if (!imageData) {
            imagePreview.innerHTML = '<div class="error-message" style="padding: 20px; background-color: rgba(255,0,0,0.1); color: #d32f2f; border-radius: 8px; text-align: center;"><i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>No image data received. Please try again.</div>';
            return;
        }
        
        // Set the image source (after setting up handlers)
        img.src = imageData;
        
        // Add placeholder text while image is loading
        const loadingPlaceholder = document.createElement('div');
        loadingPlaceholder.style.padding = '20px';
        loadingPlaceholder.style.textAlign = 'center';
        loadingPlaceholder.style.backgroundColor = 'var(--secondary, #f9f7ff)';
        loadingPlaceholder.style.borderRadius = '8px';
        loadingPlaceholder.style.marginBottom = '16px';
        
        // Create a more visually appealing loading indicator
        loadingPlaceholder.innerHTML = `
            <div style="margin-bottom: 15px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 1.8rem; color: var(--primary); margin-bottom: 10px;"></i>
                <div style="font-weight: 600; margin: 5px 0;">Generating Image...</div>
            </div>
            <div class="progress-bar-container" style="height: 10px; background-color: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden; margin: 10px auto; width: 80%;">
                <div class="progress-bar" style="height: 100%; width: 0%; background-color: var(--primary); border-radius: 5px; transition: width 0.3s ease-in-out;"></div>
            </div>
            <div style="font-size: 0.9rem; color: var(--text-light);">Please wait...</div>
        `;
        
        imagePreview.appendChild(loadingPlaceholder);
        
        // Start the loading animation
        let loadingProgress = 0;
        const progressBar = loadingPlaceholder.querySelector('.progress-bar');
        
        // Simulate progress until image loads
        const loadingInterval = setInterval(() => {
            // Gradually increase progress but never reach 100% until image loads
            if (loadingProgress < 90) {
                loadingProgress += Math.random() * 5;
                if (loadingProgress > 90) loadingProgress = 90;
                
                // Ensure we don't display NaN
                const safeProgress = isNaN(loadingProgress) ? 0 : loadingProgress;
                progressBar.style.width = `${safeProgress}%`;
            }
        }, 300);
        
        // When image loads, clear the interval and remove loading placeholder
        img.addEventListener('load', () => {
            clearInterval(loadingInterval);
            if (imagePreview.contains(loadingPlaceholder)) {
                imagePreview.removeChild(loadingPlaceholder);
            }
        });
    }
    
    // Function to generate image with AI Horde
    async function generateWithAiHorde(prompt) {
        // Get API key from localStorage
        const apiKey = localStorage.getItem('aiHordeApiKey');
        // Get selected model
        const selectedModel = localStorage.getItem('aiHordeModel');
        // We now check for API key and model existence in the main generateImage function
        
        try {
            // Step 1: Submit the generation request
            const submitResponse = await fetch('https://aihorde.net/api/v2/generate/async', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                },
                body: JSON.stringify({
                    prompt: prompt,
                    params: {
                        width: 512,
                        height: 512,
                        steps: 20,
                        n: 1,
                        sampler_name: "k_euler_a" // Default sampler
                    },
                    models: [selectedModel]
                })
            });
            
            if (!submitResponse.ok) {
                // Enhanced error handling for 403 errors
                if (submitResponse.status === 403) {
                    // Try to get more details from the response
                    let errorMessage = 'Authentication failed. ';
                    try {
                        const errorData = await submitResponse.json();
                        errorMessage += errorData.message || 'Your API key may be invalid or missing required permissions.';
                    } catch (e) {
                        errorMessage += 'Your API key may be invalid or missing required permissions.';
                    }
                    
                    // Provide guidance to the user
                    errorMessage += '\n\nPlease check that:\n1. Your API key is correct\n2. You have sufficient permissions\n3. You are not rate limited';
                    
                    alert(errorMessage);
                    throw new Error(`API authentication error (403): ${errorMessage}`);
                } else {
                    // Handle other error types
                    let errorMessage = `API error: ${submitResponse.status} ${submitResponse.statusText}`;
                    try {
                        const errorData = await submitResponse.json();
                        if (errorData.message) {
                            errorMessage += ` - ${errorData.message}`;
                        }
                    } catch (e) {
                        // Couldn't parse JSON response
                    }
                    throw new Error(errorMessage);
                }
            }
            
            const submitData = await submitResponse.json();
            const requestId = submitData.id;
            
            if (!requestId) {
                throw new Error('Failed to get request ID from AI Horde');
            }
            
            // Step 2: Poll for the result
            let imageUrl = null;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes (5s interval)
            
            while (!imageUrl && attempts < maxAttempts) {
                attempts++;
                
                // Wait 5 seconds between checks
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Check status
                const checkResponse = await fetch(`https://aihorde.net/api/v2/generate/check/${requestId}`, {
                    headers: {
                        'apikey': apiKey
                    }
                });
                
                if (!checkResponse.ok) {
                    throw new Error(`API error: ${checkResponse.status} ${checkResponse.statusText}`);
                }
                
                const checkData = await checkResponse.json();
                
                // Update button text with progress
                const progressValue = checkData.progress || 0;
                const progressPercent = checkData.done ? 100 : Math.round(progressValue * 100);
                
                // Display a professional message even when percentage is unknown
                if (isNaN(progressPercent)) {
                    generateImageBtn.textContent = 'Initializing...';
                } else {
                    generateImageBtn.textContent = 'Generating Image...';
                }
                
                // Update the progress bar in the image preview if it exists
                const loadingPlaceholder = imagePreview.querySelector('.progress-bar-container');
                if (loadingPlaceholder) {
                    const progressBar = loadingPlaceholder.querySelector('.progress-bar');
                    if (progressBar) {
                        progressBar.style.width = `${progressPercent}%`;
                        
                        // Update the loading text to show a simple message without percentage
                        const loadingText = imagePreview.querySelector('div[style*="font-weight: 600"]');
                        if (loadingText) {
                            // Use status message when percentage is unknown
                            if (isNaN(progressPercent)) {
                                loadingText.textContent = 'Initializing...';
                            } else {
                                loadingText.textContent = 'Generating Image...';
                            }
                        }
                        
                        // Add a pulsing effect to make the loading more noticeable
                        if (!progressBar.classList.contains('pulse-effect') && progressPercent < 100) {
                            progressBar.classList.add('pulse-effect');
                            // Add the pulse animation style if it doesn't exist
                            if (!document.getElementById('pulse-animation-style')) {
                                const style = document.createElement('style');
                                style.id = 'pulse-animation-style';
                                style.textContent = `
                                    @keyframes pulse {
                                        0% { opacity: 0.7; }
                                        50% { opacity: 1; }
                                        100% { opacity: 0.7; }
                                    }
                                    .pulse-effect {
                                        animation: pulse 1.5s infinite ease-in-out;
                                    }
                                `;
                                document.head.appendChild(style);
                            }
                        }
                    }
                }
                
                if (checkData.done) {
                    // Get the result
                    const resultResponse = await fetch(`https://aihorde.net/api/v2/generate/status/${requestId}`, {
                        headers: {
                            'apikey': apiKey
                        }
                    });
                    
                    if (!resultResponse.ok) {
                        throw new Error(`API error: ${resultResponse.status} ${resultResponse.statusText}`);
                    }
                    
                    const resultData = await resultResponse.json();
                    
                    if (resultData.generations && resultData.generations.length > 0) {
                        imageUrl = resultData.generations[0].img;
                        break;
                    }
                }
            }
            
            if (!imageUrl) {
                throw new Error('Timed out waiting for AI Horde image generation');
            }
            
            // Display the generated image
            displayGeneratedImage(imageUrl);
            
            console.log('Image generated successfully with AI Horde');
        } catch (error) {
            console.error('Error generating image with AI Horde:', error);
            alert('Failed to generate image: ' + error.message);
            throw error;
        }
    }
    
    // Function to add a "Send to Merch" button under the generated image
    function addSendToMerchButton(imageElement) {
        // Don't add button if it already exists
        if (document.getElementById('sendToMerchBtn')) {
            return;
        }
        
        // Create the Send to Merch button
        const sendToMerchBtn = document.createElement('button');
        sendToMerchBtn.id = 'sendToMerchBtn';
        sendToMerchBtn.className = 'btn btn-secondary';
        sendToMerchBtn.innerHTML = '<i class="fas fa-tshirt"></i> Send to Merch';
        sendToMerchBtn.style.marginTop = '1rem';
        sendToMerchBtn.style.marginRight = '0.5rem';
        
        // Add click event to save the current image and redirect to merch page
        sendToMerchBtn.addEventListener('click', function() {
            // Save current state for when user returns to generator
            sessionStorage.setItem('generatorStatePreserved', 'true');
            
            // Save to generatedImages in localStorage
            saveGeneratedImageForMerch(imageElement.src);
            
            // Navigate to merch page with image URL as parameter
            window.location.href = `merch.html?image=${encodeURIComponent(imageElement.src)}`;
        });
        
        // Insert the button after the image
        if (imageElement.parentNode) {
            imageElement.parentNode.insertBefore(sendToMerchBtn, imageElement.nextSibling);
        }
    }
    
    // Function to save generated image to localStorage for use in merchandise
    function saveGeneratedImageForMerch(imageUrl, entityName = '') {
        // Validate the image URL first
        if (!imageUrl) {
            console.error('Attempted to save an empty or undefined image URL');
            return;
        }
        
        // Make sure the URL is a string
        const urlToSave = String(imageUrl);
        
        // Get existing saved images or create a new array
        let savedImages = JSON.parse(localStorage.getItem('generatedImages')) || [];
        
        // Check if this image is already saved (prevent duplicates)
        const isDuplicate = savedImages.some(image => image.url === urlToSave);
        
        if (!isDuplicate) {
            // If entityName wasn't provided, try to get it from the DOM
            if (!entityName) {
                const entityNameElement = document.getElementById('entityName');
                if (entityNameElement) {
                    entityName = entityNameElement.innerText;
                }
            }
            
            try {
                // Add the new image URL with the entity name
                savedImages.push({
                    url: urlToSave,
                    date: new Date().toISOString(),
                    name: entityName || ''
                });
                
                // Only keep the last 20 images to prevent localStorage from getting too large
                if (savedImages.length > 20) {
                    savedImages = savedImages.slice(savedImages.length - 20);
                }
                
                // Save back to localStorage
                localStorage.setItem('generatedImages', JSON.stringify(savedImages));
                console.log('Image saved successfully to localStorage for merch');
            } catch (error) {
                console.error('Error saving image to localStorage:', error);
                
                // If storage is full, try to free up space by removing older images
                if (error.name === 'QuotaExceededError' || error.toString().includes('storage')) {
                    try {
                        // Keep only the 5 most recent images
                        savedImages = savedImages.slice(-5);
                        localStorage.setItem('generatedImages', JSON.stringify(savedImages));
                        
                        // Try to add the new image again
                        savedImages.push({
                            url: urlToSave,
                            date: new Date().toISOString(),
                            name: entityName || ''
                        });
                        localStorage.setItem('generatedImages', JSON.stringify(savedImages));
                        console.log('Storage recovered and image saved after cleanup');
                    } catch (innerError) {
                        console.error('Failed to save image even after cleanup:', innerError);
                    }
                }
            }
        } else {
            console.log('Image already exists in localStorage, skipping save');
        }
    }
}); 