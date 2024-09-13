

AFRAME.registerComponent('interaction', {
  connectToSalesforce: async function (){
    try {
      debugger;
      key="3MVG9H_KVs6V9LiM6eVP1IbVJ3d6TF62PiVxV46Rai3x6ba8G9HGWlMs8aREi2XfEpFi6hd0DtiYpeoTvTVmx";
      secret="EC4A23C861BEA5717A41F4255B8E9163ED80107E7D0C4A988269C6C031C96A0B";
  
      const oauth2 = new jsforce.OAuth2({
        loginUrl: 'https://login.salesforce.com',
        clientId: key,
        clientSecret: secret,
        redirectUri: 'https://login.salesforce.com/services/oauth2/success'
        });
        
        const conn = new jsforce.Connection({
          oauth2,
          version: '32'
        });
      
  
        const res = await conn.apex.get('/v1/myws/');
        console.log(res);
    } catch (error) {
      console.log('error: ' + error);
    }
  
  },
  
  init: function () {
    
    // Speech recognition setup
    this.speechRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    this.speechRecognition.lang = 'en-US';
    this.speechRecognition.interimResults = false;
    this.speechRecognition.maxAlternatives = 1;

    // Speech synthesis setup
    this.speechSynthesis = window.speechSynthesis;

    // Event listener for triggering interaction
    this.el.addEventListener('click', this.startConversation.bind(this));

    // Speech recognition result handling
    this.speechRecognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      clearTimeout(this.responseTimeout);  // Clear timeout if user responds

      if (this.isConfirming) {
        this.handleConfirmation(speechResult);  // Handle final confirmation step
      } else {
        this.handleResponse(speechResult);      // Handle regular question responses
      }
    };

    // Speech recognition end event handling (restart if necessary)
    this.speechRecognition.onend = () => {
      if (!this.isConversationComplete && (this.currentQuestionIndex < this.questions.length || this.isConfirming)) {
        this.speechRecognition.start();  // Restart listening for next question/confirmation
      }
    };

    // Dialog elements for displaying responses
    this.dialogPanel = document.querySelector('#dialogPanel');
    this.dialogText = document.querySelector('#dialogText');

    // Set of questions for loan application
    this.questions = [
      "What is your full name?",
      "How much loan amount are you applying for?",
      "What is the purpose of the loan?",
      "What is your annual income?"
    ];

    // Store user's answers
    this.answers = [];
    this.currentQuestionIndex = 0;  // Track which question we are on
    this.responseTimeout = null;  // Timeout handler
    this.isConfirming = false;  // Flag to track if we are in the confirmation step
    this.isConversationComplete = false;  // Flag to stop conversation after confirmation

    // Reset interaction when user clicks "enter"
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.resetInteraction();
      }
    });
  },

  // Start the conversation
  async startConversation() {
    this.connectToSalesforce();

    this.dialogPanel.setAttribute('visible', true);
    this.askNextQuestion();  // Start by asking the first question
  },

  // Ask the next question with a 20-second timeout
  async askNextQuestion() {
    if (this.currentQuestionIndex < this.questions.length) {
      const question = this.questions[this.currentQuestionIndex];
      this.dialogText.setAttribute('value', question);
      this.speak(question);  // Speak the question to the user
      this.speechRecognition.start();  // Start listening for user response

      // Set a timeout to repeat the question if no response after 20 seconds
      this.responseTimeout = setTimeout(() => {
        this.speak("Please respond, " + question);
        this.speechRecognition.start();  // Restart listening
      }, 20000); // 20-second timeout

    } else {
      this.confirmAnswers();  // After all questions are asked
    }
  },

  // Process the user's response and move to the next question
  async handleResponse(speechResult) {
    this.answers.push(speechResult);  // Store the response
    this.currentQuestionIndex++;      // Move to the next question
    this.askNextQuestion();           // Ask the next question
  },

  // Confirm the answers with the user
  async confirmAnswers() {
    // Create a natural confirmation message summarizing the answers
    const summary = `Thank you for your responses. You have applied for a loan with the following details:
      Your full name is ${this.answers[0]}.
      You are applying for a loan of ${this.answers[1]} dollars.
      The purpose of the loan is ${this.answers[2]}.
      Your annual income is ${this.answers[3]} dollars.
      Do you confirm these details are correct? Please say Yes or No.`;

    this.dialogText.setAttribute('value', summary);
    this.speak(summary);  // Speak out the confirmation summary

    this.isConfirming = true;  // Set the flag to indicate we are in the confirmation step
    this.speechRecognition.start();  // Start listening for confirmation (Yes/No)
  },

  // Handle the confirmation step
  async handleConfirmation(speechResult) {
    if (speechResult.includes("yes")) {
      // Call Salesforce API after confirmation
      this.createSalesforceApplication(this.answers);
      this.speechRecognition.stop()

    } else if (speechResult.includes("no")) {
      const retryMessage = "You have chosen to modify the details. Let's start again.";
      this.dialogText.setAttribute('value', retryMessage);
      this.speak(retryMessage);
      this.speechRecognition.stop()
      // Restart the question process
      this.answers = [];
      this.currentQuestionIndex = 0;
      this.isConfirming = false;
      this.askNextQuestion();
    } else {
      // If the user says something other than "yes" or "no", ask again in a more natural way
      const repeatConfirmationMessage = "Thank you";
      this.dialogText.setAttribute('value', repeatConfirmationMessage);
      this.speak(repeatConfirmationMessage);
      this.speechRecognition.stop()
        }
  },

  // Call Salesforce API to create application
  async createSalesforceApplication(answers) {
    // Sample Salesforce endpoint and token (replace with actual values)
    const apiUrl = 'https://your-salesforce-instance.com/services/data/vXX.X/sobjects/Loan_Application__c';
    const token = 'Bearer YOUR_SALESFORCE_ACCESS_TOKEN';  // Replace with the OAuth token

    // Prepare payload for creating a Loan Application
    const payload = {
      Full_Name__c: answers[0],
      Loan_Amount__c: answers[1],
      Loan_Purpose__c: answers[2],
      Annual_Income__c: answers[3]
    };

    // Make the API call to Salesforce
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        const applicationId = result.id;  // Retrieve the application ID from the response

        // Provide confirmation to the user
        const confirmationMessage = `Your loan application has been created successfully. Your application ID is ${applicationId}. Thank you for visiting the branch.`;
        this.dialogText.setAttribute('value', confirmationMessage);
        this.speak(confirmationMessage);

        this.isConversationComplete = true;
        this.speechRecognition.stop();  // Stop recognition
        setTimeout(() => this.resetInteraction(), 5000);  // Wait 5 seconds before resetting interaction
      } else {
        // Handle error response
        const errorMessage = "There was an error creating your loan application. Please try again later.";
        this.dialogText.setAttribute('value', errorMessage);
        this.speak(errorMessage);
        this.speechRecognition.stop();
      }
    } catch (error) {
      // Handle any network or other errors
      const errorMessage = "An error occurred while processing your request. Please try again later.";
      this.dialogText.setAttribute('value', errorMessage);
      this.speak(errorMessage);
      this.speechRecognition.stop();
    }
  },

  // Reset the interaction and restart from the first question
  resetInteraction() {
    this.dialogPanel.setAttribute('visible', false);
    this.answers = [];
    this.currentQuestionIndex = 0;
    this.isConfirming = false;
    this.isConversationComplete = false;  // Reset conversation complete flag

    const thankYouMessage = "Thanks for visiting the branch.";
    this.dialogText.setAttribute('value', thankYouMessage);
    this.speak(thankYouMessage);
  },

  // Function to speak the text using Speech Synthesis API
  speak: function (text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (!this.isConversationComplete && (this.currentQuestionIndex < this.questions.length || this.isConfirming)) {
        this.speechRecognition.start();
      }
    };
    this.speechSynthesis.speak(utterance);
  }
});
