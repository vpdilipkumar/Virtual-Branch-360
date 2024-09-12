AFRAME.registerComponent('interaction', {
    init: function () {
      // Speech recognition setup
      this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.speechRecognition.lang = 'en-US';
      this.speechRecognition.interimResults = false;
      this.speechRecognition.maxAlternatives = 1;
  
      // Speech synthesis setup
      this.speechSynthesis = window.speechSynthesis;
  
      // Event listener for triggering interaction
      this.el.addEventListener('click', this.startListening.bind(this));
  
      // Speech recognition result handling
      this.speechRecognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript.toLowerCase();
        this.processSpeech(speechResult);  // Call to async function
      };
  
      // Dialog elements for displaying responses
      this.dialogPanel = document.querySelector('#dialogPanel');
      this.dialogText = document.querySelector('#dialogText');
    },
  
    // Async function to handle listening
    async startListening() {
      this.dialogPanel.setAttribute('visible', true);
      this.dialogText.setAttribute('value', 'Listening... Speak now.');
      this.speechRecognition.start();
    },
  
    // Async function to process speech and interact with Azure OpenAI
    async processSpeech(speechResult) {
      let prompt = `User: ${speechResult}`;
      let response = await this.getResponseFromAzureOpenAI(prompt);  // Await API call
  
      if (!response) {
        response = "Sorry, I couldn't understand that. Could you please repeat?";
      }
  
      this.dialogText.setAttribute('value', response);
      this.speak(response);  // Speak out response using speech synthesis
    },
  
    // Function to send a request to Azure OpenAI
    async getResponseFromAzureOpenAI(prompt) {
      const apiKey = 'your_azure_openai_api_key_here';
      const endpoint = 'https://opnai-wus-01.openai.azure.com/openai/deployments/your-deployment-id/completions?api-version=2022-12-01';
  
      const headers = {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      };
  
      const body = JSON.stringify({
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7,
      });
  
      try {
        const response = await fetch(endpoint, {  // Await the fetch call
          method: 'POST',
          headers: headers,
          body: body,
        });
  
        const data = await response.json();
        return data.choices[0].text.trim();  // Return API response
      } catch (error) {
        console.error('Error fetching response:', error);
        return null;
      }
    },
  
    // Function to speak the text using Speech Synthesis API
    speak: function (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      this.speechSynthesis.speak(utterance);
    }
  });
  