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
        
        // Check if NSFW is enabled and modify prompt accordingly
        let finalPrompt = imagePrompt;
        if (nsfwToggle && nsfwToggle.checked) {
            finalPrompt = `NSFW, Nude, Adult, ${imagePrompt}`;
        }
        
        // Show loading state
        generateImageBtn.disabled = true;
        generateImageBtn.textContent = 'Generating...';
        
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
        if (!apiKey) {
            alert('Please enter and apply your Together.ai API key first.');
            togetherApiKeyInput.focus();
            throw new Error('No API key provided');
        }
        
        // Make direct API call to Together.ai
        const response = await fetch('https://api.together.xyz/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "black-forest-labs/FLUX.1-dev",
                prompt: prompt,
                width: 1024,
                height: 712,
                steps: 20,
                n: 1,
                response_format: "b64_json"
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Get the base64 encoded image
        const imageData = data.data[0].b64_json;
        
        // Display the generated image
        imagePreview.src = `data:image/png;base64,${imageData}`;
        imagePreview.style.display = 'block';
        
        // Scroll to the image
        imagePreview.scrollIntoView({ behavior: 'smooth' });
        
        console.log('Image generated successfully with Together.ai');
    }
    
    // Function to generate image with AI Horde
    async function generateWithAiHorde(prompt) {
        // Get API key from localStorage
        const apiKey = localStorage.getItem('aiHordeApiKey');
        if (!apiKey) {
            alert('Please enter and apply your AI Horde API key first.');
            aiHordeApiKeyInput.focus();
            throw new Error('No API key provided');
        }
        
        // Get selected model
        const selectedModel = localStorage.getItem('aiHordeModel');
        if (!selectedModel) {
            alert('Please select an AI Horde model first.');
            throw new Error('No model selected');
        }
        
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
            generateImageBtn.textContent = `Generating... (${checkData.done ? 100 : Math.round(checkData.progress * 100)}%)`;
            
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
        
        // Display the generated image - AI Horde returns a URL, not base64 data
        imagePreview.src = imageUrl;
        imagePreview.style.display = 'block';
        
        // Scroll to the image
        imagePreview.scrollIntoView({ behavior: 'smooth' });
        
        console.log('Image generated successfully with AI Horde');
    }
}); 