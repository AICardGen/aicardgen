// Description Generator Script
document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the elements
    const generateDescriptionBtn = document.getElementById('generateDescriptionBtn');
    const generatedDescription = document.getElementById('generatedDescription');
    const aiHordeTextApiKeyInput = document.getElementById('aiHordeTextApiKeyInput');
    const applyAiHordeTextApiKeyBtn = document.getElementById('applyAiHordeTextApiKeyBtn');
    const aiHordeTextModelSelect = document.getElementById('aiHordeTextModelSelect');
    const currentTextApiInfo = document.getElementById('currentTextApiInfo');
    
    // Check if API key exists in localStorage and populate the input field
    const savedAiHordeTextApiKey = localStorage.getItem('aiHordeTextApiKey');
    if (savedAiHordeTextApiKey) {
        aiHordeTextApiKeyInput.value = savedAiHordeTextApiKey;
        fetchAiHordeTextModels(savedAiHordeTextApiKey);
    }
    
    // Add event listener for applying AI Horde text API key
    applyAiHordeTextApiKeyBtn.addEventListener('click', function() {
        const apiKey = aiHordeTextApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('aiHordeTextApiKey', apiKey);
            alert('AI Horde text API key saved successfully!');
            fetchAiHordeTextModels(apiKey);
        } else {
            alert('Please enter a valid API key.');
        }
    });
    
    // Add event listener for AI Horde text model selection
    aiHordeTextModelSelect.addEventListener('change', function() {
        const selectedModel = aiHordeTextModelSelect.value;
        if (selectedModel) {
            localStorage.setItem('aiHordeTextModel', selectedModel);
            updateTextModelInfo();
        }
    });
    
    // Function to update text model info
    function updateTextModelInfo() {
        const modelName = localStorage.getItem('aiHordeTextModel') || 'Not selected';
        currentTextApiInfo.textContent = `Text model: ${modelName}`;
    }
    
    // Call updateTextModelInfo on page load
    updateTextModelInfo();
    
    // Function to fetch top 5 AI Horde text models
    async function fetchAiHordeTextModels(apiKey) {
        try {
            aiHordeTextModelSelect.disabled = true;
            aiHordeTextModelSelect.innerHTML = '<option value="">Loading text models...</option>';
            
            const response = await fetch('https://aihorde.net/api/v2/status/models?type=text', {
                headers: {
                    'apikey': apiKey || ''
                }
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Filter out models with no workers
            const availableModels = data.filter(model => model.count > 0);
            
            if (availableModels.length === 0) {
                throw new Error('No available text models found with active workers');
            }
            
            // Sort models by worker count (descending)
            const sortedModels = availableModels.sort((a, b) => b.count - a.count);
            
            // Get top 5 models
            const topModels = sortedModels.slice(0, 5);
            
            // Clear and populate the select element
            aiHordeTextModelSelect.innerHTML = '';
            topModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = `${model.name} (${model.count} workers)`;
                aiHordeTextModelSelect.appendChild(option);
            });
            
            // Select previously saved model if exists
            const savedModel = localStorage.getItem('aiHordeTextModel');
            if (savedModel && topModels.some(m => m.name === savedModel)) {
                aiHordeTextModelSelect.value = savedModel;
            } else if (topModels.length > 0) {
                // Otherwise select the first model
                aiHordeTextModelSelect.value = topModels[0].name;
                localStorage.setItem('aiHordeTextModel', topModels[0].name);
            }
            
            aiHordeTextModelSelect.disabled = false;
            updateTextModelInfo();
            
        } catch (error) {
            console.error('Error fetching AI Horde text models:', error);
            aiHordeTextModelSelect.innerHTML = '<option value="">Failed to load models</option>';
            aiHordeTextModelSelect.disabled = true;
            alert(`Failed to load text models: ${error.message}`);
        }
    }
    
    // Add click event listener to the generate description button
    generateDescriptionBtn.addEventListener('click', generateDescription);
    
    // Function to generate a description based on the current prompt
    async function generateDescription() {
        // Check if we have a current prompt
        const textPromptElement = document.getElementById('textPrompt');
        if (!textPromptElement) {
            alert('Text prompt element not found!');
            return;
        }
        
        const textPrompt = textPromptElement.innerText || textPromptElement.textContent;
        
        if (!textPrompt || textPrompt.trim() === '') {
            alert('Please generate prompts first!');
            return;
        }
        
        // Get API key and model from localStorage
        const apiKey = localStorage.getItem('aiHordeTextApiKey');
        const selectedModel = localStorage.getItem('aiHordeTextModel');
        
        if (!apiKey) {
            alert('Please enter and apply your AI Horde API key for text generation first.');
            aiHordeTextApiKeyInput.focus();
            return;
        }
        
        if (!selectedModel) {
            alert('Please select an AI Horde text model first.');
            return;
        }
        
        // Show loading state
        generateDescriptionBtn.disabled = true;
        generateDescriptionBtn.textContent = 'Generating...';
        generatedDescription.innerHTML = '<p>Generating description, please wait...</p>';
        generatedDescription.style.display = 'block';
        
        // Modify the prompt to request 2-3 sentences and a quote
        const enhancedPrompt = `Write only 2 to 3 concise sentences about the following subject, followed by a meaningful quote related to it. Keep it brief and impactful and in a fantasy theme.:\n\n${textPrompt}`;
        
        try {
            // Step 1: Submit the generation request
            const submitResponse = await fetch('https://aihorde.net/api/v2/generate/text/async', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey
                },
                body: JSON.stringify({
                    prompt: enhancedPrompt,
                    params: {
                        max_length: 500,
                        max_context_length: 1024,
                        temperature: 0.7,
                        top_p: 0.9,
                        top_k: 50,
                        repetition_penalty: 1.1
                    },
                    models: [selectedModel]
                })
            });
            
            if (!submitResponse.ok) {
                const errorData = await submitResponse.json().catch(() => ({}));
                throw new Error(`API error: ${submitResponse.status} ${submitResponse.statusText}${errorData.message ? ` - ${errorData.message}` : ''}`);
            }
            
            const submitData = await submitResponse.json();
            const requestId = submitData.id;
            
            if (!requestId) {
                throw new Error('Failed to get request ID from AI Horde');
            }
            
            // Step 2: Poll for the result
            let textResult = null;
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes (5s interval)
            
            while (!textResult && attempts < maxAttempts) {
                attempts++;
                
                // Wait 5 seconds between checks
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                // Check status
                const checkResponse = await fetch(`https://aihorde.net/api/v2/generate/text/status/${requestId}`, {
                    headers: {
                        'apikey': apiKey
                    }
                });
                
                if (!checkResponse.ok) {
                    throw new Error(`API error: ${checkResponse.status} ${checkResponse.statusText}`);
                }
                
                const checkData = await checkResponse.json();
                
                // Update button text with progress
                const progress = checkData.done ? 100 : (checkData.processing ? Math.round(checkData.processing * 100) : 0);
                generateDescriptionBtn.textContent = `Generating... (${progress}%)`;
                
                if (checkData.done) {
                    if (checkData.generations && checkData.generations.length > 0) {
                        textResult = checkData.generations[0].text;
                        break;
                    } else if (checkData.faulted) {
                        throw new Error('Generation faulted: ' + (checkData.message || 'Unknown error'));
                    }
                }
            }
            
            if (!textResult) {
                throw new Error('Timed out waiting for AI Horde text generation');
            }
            
            // Display the generated description
            generatedDescription.innerHTML = '<h3>Generated Description:</h3><p>' + textResult.replace(/\n/g, '<br>') + '</p>';
            
            // Scroll to the description
            generatedDescription.scrollIntoView({ behavior: 'smooth' });
            
            console.log('Description generated successfully with AI Horde');
            
        } catch (error) {
            console.error('Error generating description:', error);
            generatedDescription.innerHTML = '<p>Error generating description: ' + (error.message || 'Unknown error') + '</p>';
            alert('Error generating description: ' + (error.message || 'Unknown error'));
        } finally {
            // Reset button state
            generateDescriptionBtn.disabled = false;
            generateDescriptionBtn.textContent = 'Generate Description';
        }
    }
}); 